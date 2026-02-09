use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Mutex;

use super::{TorrentInfo, TrackerInfo};

pub struct Transmission {
    url: String,
    client: Client,
    session_id: Mutex<String>,
    auth_header: Option<String>,
}

#[derive(Serialize)]
struct RpcRequest {
    method: String,
    arguments: Value,
}

#[derive(Deserialize)]
struct RpcResponse {
    result: String,
    arguments: Option<Value>,
}

impl Transmission {
    pub async fn new(host: &str, port: u16, username: &str, password: &str, use_https: bool) -> Result<Self, String> {
        let scheme = if use_https { "https" } else { "http" };
        let url = format!("{}://{}:{}/transmission/rpc", scheme, host, port);
        let client = Client::builder()
            .danger_accept_invalid_certs(use_https)
            .timeout(std::time::Duration::from_secs(10))
            .connect_timeout(std::time::Duration::from_secs(5))
            .build()
            .map_err(|e| e.to_string())?;

        let auth_header = if !username.is_empty() {
            use base64::Engine;
            let encoded = base64::engine::general_purpose::STANDARD
                .encode(format!("{}:{}", username, password));
            Some(format!("Basic {}", encoded))
        } else {
            None
        };

        let mut tr = Self {
            url,
            client,
            session_id: Mutex::new(String::new()),
            auth_header,
        };

        tr.refresh_session_id().await?;
        Ok(tr)
    }

    async fn refresh_session_id(&mut self) -> Result<(), String> {
        let mut req = self.client.post(&self.url).header("Content-Type", "application/json");
        if let Some(ref auth) = self.auth_header {
            req = req.header("Authorization", auth);
        }

        let resp = req
            .json(&RpcRequest {
                method: "session-get".to_string(),
                arguments: json!({}),
            })
            .send()
            .await;

        match resp {
            Ok(r) if r.status().as_u16() == 409 => {
                if let Some(sid) = r.headers().get("x-transmission-session-id") {
                    *self.session_id.lock().unwrap() = sid.to_str().unwrap_or("").to_string();
                    Ok(())
                } else {
                    Err("No session ID in 409 response".to_string())
                }
            }
            Ok(r) if r.status().is_success() => {
                if let Some(sid) = r.headers().get("x-transmission-session-id") {
                    *self.session_id.lock().unwrap() = sid.to_str().unwrap_or("").to_string();
                }
                Ok(())
            }
            Ok(r) => Err(format!("Unexpected status: {}", r.status())),
            Err(e) => Err(format!("Connection failed: {}", e)),
        }
    }

    async fn rpc_call(&self, method: &str, arguments: Value) -> Result<Value, String> {
        let sid = self.session_id.lock().unwrap().clone();
        let mut req = self
            .client
            .post(&self.url)
            .header("Content-Type", "application/json")
            .header("X-Transmission-Session-Id", &sid);

        if let Some(ref auth) = self.auth_header {
            req = req.header("Authorization", auth);
        }

        let resp: RpcResponse = req
            .json(&RpcRequest {
                method: method.to_string(),
                arguments,
            })
            .send()
            .await
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;

        if resp.result != "success" {
            return Err(format!("RPC error: {}", resp.result));
        }

        Ok(resp.arguments.unwrap_or(json!({})))
    }
}

impl Transmission {
    pub async fn test_connection(&self) -> Result<String, String> {
        let args = self.rpc_call("session-get", json!({})).await?;
        let version = args.get("version").and_then(|v| v.as_str()).unwrap_or("unknown");
        Ok(format!("Transmission {}", version))
    }

    pub async fn list_torrents(&self) -> Result<Vec<TorrentInfo>, String> {
        let args = self
            .rpc_call(
                "torrent-get",
                json!({
                    "fields": ["hashString", "name", "trackers"]
                }),
            )
            .await?;

        let torrents = args
            .get("torrents")
            .and_then(|t| t.as_array())
            .ok_or("No torrents field")?;

        let mut result = Vec::new();
        for t in torrents {
            let hash = t.get("hashString").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let name = t.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let trackers = t
                .get("trackers")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|tr| {
                            let announce = tr.get("announce")?.as_str()?;
                            Some(TrackerInfo {
                                url: announce.to_string(),
                                status: 0,
                            })
                        })
                        .collect()
                })
                .unwrap_or_default();

            result.push(TorrentInfo {
                hash,
                name,
                trackers,
            });
        }

        Ok(result)
    }

    pub async fn replace_tracker(
        &self,
        hash: &str,
        old_url: &str,
        new_url: &str,
    ) -> Result<(), String> {
        // Get current tracker list for this torrent
        let args = self
            .rpc_call(
                "torrent-get",
                json!({
                    "ids": [hash],
                    "fields": ["trackers"]
                }),
            )
            .await?;

        let torrents = args
            .get("torrents")
            .and_then(|t| t.as_array())
            .ok_or("No torrents")?;

        let torrent = torrents.first().ok_or("Torrent not found")?;
        let trackers = torrent
            .get("trackers")
            .and_then(|v| v.as_array())
            .ok_or("No trackers")?;

        // Find the tracker ID to replace
        let tracker_id = trackers
            .iter()
            .find_map(|tr| {
                let announce = tr.get("announce")?.as_str()?;
                if announce == old_url {
                    tr.get("id")?.as_i64()
                } else {
                    None
                }
            })
            .ok_or("Tracker not found in torrent")?;

        // Transmission 4.x: use trackerReplace
        self.rpc_call(
            "torrent-set",
            json!({
                "ids": [hash],
                "trackerReplace": [tracker_id, new_url]
            }),
        )
        .await?;

        Ok(())
    }
}
