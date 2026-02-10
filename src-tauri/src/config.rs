use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub connection: ConnectionConfig,
    pub rules: Vec<Rule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub downloader_type: String, // "qbittorrent" or "transmission"
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    #[serde(default)]
    pub use_https: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub old_domain: String,
    pub new_domain: String,
    pub enabled: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            connection: ConnectionConfig {
                downloader_type: "qbittorrent".to_string(),
                host: "127.0.0.1".to_string(),
                port: 8080,
                username: "admin".to_string(),
                password: String::new(),
                use_https: false,
            },
            rules: Vec::new(),
        }
    }
}

fn config_path() -> PathBuf {
    let dir = dirs::config_dir()
        .unwrap_or_else(|| {
            log::warn!("Could not determine config directory, falling back to current dir");
            PathBuf::from(".")
        })
        .join("TorrentDeck");
    std::fs::create_dir_all(&dir).ok();
    let path = dir.join("config.json");
    log::debug!("Config path: {}", path.display());
    path
}

pub fn load() -> AppConfig {
    let path = config_path();
    if path.exists() {
        let data = match std::fs::read_to_string(&path) {
            Ok(d) => d,
            Err(e) => {
                log::error!("Failed to read config file: {}", e);
                return AppConfig::default();
            }
        };
        match serde_json::from_str(&data) {
            Ok(cfg) => {
                log::info!("Config loaded from {}", path.display());
                cfg
            }
            Err(e) => {
                log::error!("Failed to parse config: {}", e);
                AppConfig::default()
            }
        }
    } else {
        log::info!("No config file found, using defaults");
        AppConfig::default()
    }
}

pub fn save(config: &AppConfig) -> Result<(), String> {
    let path = config_path();
    let data = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    match std::fs::write(&path, data) {
        Ok(()) => {
            log::debug!("Config saved to {}", path.display());
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to save config: {}", e);
            Err(e.to_string())
        }
    }
}
