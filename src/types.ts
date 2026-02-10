export interface ConnectionConfig {
  downloader_type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  use_https: boolean;
}

export interface Rule {
  old_domain: string;
  new_domain: string;
  enabled: boolean;
}

export interface AppConfig {
  connection: ConnectionConfig;
  rules: Rule[];
}

export interface ScanResult {
  total_torrents: number;
  matched_torrents: number;
  matches: MatchedTorrent[];
}

export interface MatchedTorrent {
  hash: string;
  name: string;
  old_url: string;
  new_url: string;
}

export interface ReplaceResult {
  torrent_name: string;
  old_url: string;
  new_url: string;
  success: boolean;
  error: string | null;
}

export interface TrackerEntry {
  domain: string;
  count: number;
}

export type ConnectionStatus = "idle" | "testing" | "connected" | "error";
