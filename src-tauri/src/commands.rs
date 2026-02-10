use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use url::Url;

use crate::config::{self, AppConfig, ConnectionConfig};
use crate::downloader::qbittorrent::QBittorrent;
use crate::downloader::transmission::Transmission;
use crate::downloader::{DownloaderKind, ReplaceResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackerEntry {
    pub domain: String,
    pub count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub total_torrents: usize,
    pub matched_torrents: usize,
    pub matches: Vec<MatchedTorrent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchedTorrent {
    pub hash: String,
    pub name: String,
    pub old_url: String,
    pub new_url: String,
}

async fn create_downloader(conn: &ConnectionConfig) -> Result<DownloaderKind, String> {
    log::info!(
        "Connecting to {} at {}:{}",
        conn.downloader_type,
        conn.host,
        conn.port
    );
    match conn.downloader_type.as_str() {
        "qbittorrent" => {
            let qb = QBittorrent::new(
                &conn.host,
                conn.port,
                &conn.username,
                &conn.password,
                conn.use_https,
            )
            .await?;
            Ok(DownloaderKind::QBittorrent(qb))
        }
        "transmission" => {
            let tr = Transmission::new(
                &conn.host,
                conn.port,
                &conn.username,
                &conn.password,
                conn.use_https,
            )
            .await?;
            Ok(DownloaderKind::Transmission(tr))
        }
        other => {
            log::error!("Unknown downloader type: {}", other);
            Err(format!("Unknown downloader type: {}", other))
        }
    }
}

fn apply_rules(tracker_url: &str, rules: &[config::Rule]) -> Option<String> {
    for rule in rules {
        if !rule.enabled {
            continue;
        }
        let old_domain = rule.old_domain.trim();
        if old_domain.is_empty() {
            continue;
        }
        if tracker_url.contains(old_domain) {
            // Domains should not contain whitespace; trim to avoid surprising replacements.
            let new_domain = rule.new_domain.trim();
            return Some(tracker_url.replace(old_domain, new_domain));
        }
    }
    None
}

#[tauri::command]
pub async fn test_connection(connection: ConnectionConfig) -> Result<String, String> {
    log::info!("Testing connection to {}", connection.downloader_type);
    let dl = create_downloader(&connection).await?;
    let result = dl.test_connection().await;
    match &result {
        Ok(msg) => log::info!("Connection test succeeded: {}", msg),
        Err(e) => log::warn!("Connection test failed: {}", e),
    }
    result
}

#[tauri::command]
pub async fn scan_torrents(config: AppConfig) -> Result<ScanResult, String> {
    let active_rules = config.rules.iter().filter(|r| r.enabled).count();
    log::info!("Scanning torrents with {} active rules", active_rules);
    let dl = create_downloader(&config.connection).await?;
    let torrents = dl.list_torrents().await?;

    let mut matches = Vec::new();
    for torrent in &torrents {
        for tracker in &torrent.trackers {
            if let Some(new_url) = apply_rules(&tracker.url, &config.rules) {
                matches.push(MatchedTorrent {
                    hash: torrent.hash.clone(),
                    name: torrent.name.clone(),
                    old_url: tracker.url.clone(),
                    new_url,
                });
            }
        }
    }

    let matched_torrents = matches
        .iter()
        .map(|m| &m.hash)
        .collect::<std::collections::HashSet<_>>()
        .len();

    log::info!(
        "Scan complete: {} total torrents, {} matched, {} replacements",
        torrents.len(),
        matched_torrents,
        matches.len()
    );

    Ok(ScanResult {
        total_torrents: torrents.len(),
        matched_torrents,
        matches,
    })
}

#[tauri::command]
pub async fn execute_replace(config: AppConfig) -> Result<Vec<ReplaceResult>, String> {
    log::info!("Executing tracker replacements");
    let dl = create_downloader(&config.connection).await?;
    let torrents = dl.list_torrents().await?;

    let mut results = Vec::new();
    for torrent in &torrents {
        for tracker in &torrent.trackers {
            if let Some(new_url) = apply_rules(&tracker.url, &config.rules) {
                let result = match dl
                    .replace_tracker(&torrent.hash, &tracker.url, &new_url)
                    .await
                {
                    Ok(()) => ReplaceResult {
                        torrent_name: torrent.name.clone(),
                        old_url: tracker.url.clone(),
                        new_url,
                        success: true,
                        error: None,
                    },
                    Err(e) => {
                        log::error!(
                            "Failed to replace tracker for '{}': {}",
                            torrent.name,
                            e
                        );
                        ReplaceResult {
                            torrent_name: torrent.name.clone(),
                            old_url: tracker.url.clone(),
                            new_url,
                            success: false,
                            error: Some(e),
                        }
                    }
                };
                results.push(result);
            }
        }
    }

    let success_count = results.iter().filter(|r| r.success).count();
    let fail_count = results.len() - success_count;
    log::info!(
        "Replacement complete: {} succeeded, {} failed",
        success_count,
        fail_count
    );

    Ok(results)
}

#[tauri::command]
pub async fn list_trackers(connection: ConnectionConfig) -> Result<Vec<TrackerEntry>, String> {
    log::info!("Listing tracker domains");
    let dl = create_downloader(&connection).await?;
    let torrents = dl.list_torrents().await?;

    let mut domain_counts: HashMap<String, usize> = HashMap::new();
    for torrent in &torrents {
        // Collect unique domains per torrent, then increment counts
        let mut seen_domains = std::collections::HashSet::new();
        for tracker in &torrent.trackers {
            if let Ok(parsed) = Url::parse(&tracker.url) {
                if let Some(host) = parsed.host_str() {
                    seen_domains.insert(host.to_string());
                }
            }
        }
        for domain in seen_domains {
            *domain_counts.entry(domain).or_insert(0) += 1;
        }
    }

    let mut entries: Vec<TrackerEntry> = domain_counts
        .into_iter()
        .map(|(domain, count)| TrackerEntry { domain, count })
        .collect();
    entries.sort_by(|a, b| b.count.cmp(&a.count));

    log::info!("Found {} unique tracker domains", entries.len());

    Ok(entries)
}

#[tauri::command]
pub async fn load_config() -> Result<AppConfig, String> {
    Ok(config::load())
}

#[tauri::command]
pub async fn save_config(config: AppConfig) -> Result<(), String> {
    config::save(&config)
}
