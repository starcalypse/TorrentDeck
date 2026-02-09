# TrackerRelo

Batch tracker URL replacement tool for qBittorrent and Transmission.

Built with Rust + Tauri 2 + React + TypeScript + Tailwind CSS + shadcn/ui.

## Features

- **qBittorrent** — connects via WebUI API (`/api/v2/`)
- **Transmission** — connects via RPC API (session-id auth, `trackerReplace`)
- **HTTP / HTTPS** — supports both, auto-accepts self-signed certs in HTTPS mode
- **Visual rule editor** — old domain → new domain, per-rule enable/disable toggle
- **Preview before execute** — scan to see matched torrents, then one-click replace
- **Execution log** — real-time results with success/failure indicators
- **Auto-save config** — connection settings and rules persist across sessions
- **Light / Dark theme** — follows system preference
- **Cross-platform** — macOS, Windows, Linux

## Screenshots

<!-- TODO -->

## Development

```bash
# Install dependencies
bun install

# Run in dev mode (hot reload)
bun tauri dev

# Build for production
bun tauri build
```

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Backend  | Rust, Tauri 2, reqwest              |
| Frontend | React 18, TypeScript, Tailwind CSS 4 |
| UI       | shadcn/ui (new-york style)          |
| Build    | Vite, Cargo                         |

## License

MIT
