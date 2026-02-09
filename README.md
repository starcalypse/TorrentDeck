# TrackerRelo

Batch tracker URL replacement tool for qBittorrent and Transmission. A desktop app built with Tauri 2 + React.

批量替换 qBittorrent / Transmission tracker 地址的桌面工具。基于 Tauri 2 + React 构建。

![Preview](docs/Preview.png)

## Features / 功能特性

- **qBittorrent** — WebUI API (`/api/v2/`)
- **Transmission** — RPC API (session-id auth, `trackerReplace`)
- **HTTP / HTTPS** — auto-accepts self-signed certs / 自动接受自签名证书
- **Visual rule editor / 可视化规则编辑器** — old → new domain, per-rule toggle / 旧域名 → 新域名，逐条启用禁用
- **Preview before execute / 执行前预览** — scan matched torrents, one-click replace / 扫描匹配种子，一键替换
- **Execution log / 执行日志** — real-time success/failure indicators / 实时成功失败状态
- **Auto-save config / 自动保存配置** — settings and rules persist across sessions / 跨会话持久化
- **Light / Dark theme / 明暗主题** — follows system preference / 跟随系统设置
- **Cross-platform / 跨平台** — macOS, Windows, Linux

## Note / 注意

> **macOS:** The app is not code-signed. On first launch, right-click the app and select "Open", or run `xattr -cr /path/to/TrackerRelo.app` to bypass Gatekeeper.
>
> **macOS：** 应用未签名。首次打开请右键选择「打开」，或执行 `xattr -cr /path/to/TrackerRelo.app` 解除限制。

## Development

```bash
bun install
bun tauri dev
bun tauri build
```

## Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Backend  | Rust, Tauri 2, reqwest               |
| Frontend | React 18, TypeScript, Tailwind CSS 4 |
| UI       | shadcn/ui                            |
| Build    | Vite, Cargo                          |

## License

MIT
