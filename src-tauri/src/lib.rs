mod commands;
mod config;
mod downloader;

use tauri::Manager;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind, TimezoneStrategy};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .rotation_strategy(RotationStrategy::KeepSome(3))
                .max_file_size(5_000_000)
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .level(log::LevelFilter::Debug)
                .level_for("reqwest", log::LevelFilter::Warn)
                .level_for("tao", log::LevelFilter::Warn)
                .level_for("wry", log::LevelFilter::Warn)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            log::info!("TorrentDeck starting");

            for (_, window) in app.webview_windows() {
                window.set_min_size(Some(tauri::LogicalSize::new(860.0, 500.0)))?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::test_connection,
            commands::scan_torrents,
            commands::execute_replace,
            commands::list_trackers,
            commands::load_config,
            commands::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
