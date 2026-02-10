import {
  LayoutDashboard,
  Replace,
  GitCompareArrows,
  Search,
  Loader2,
  ArrowDownToLine,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConnection } from "@/hooks/use-connection";

export type PageId = "dashboard" | "tracker-replace" | "cross-tracker" | "search";

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tracker-replace", label: "Tracker Replace", icon: Replace },
  { id: "cross-tracker", label: "Cross-Tracker", icon: GitCompareArrows },
  { id: "search", label: "Search", icon: Search },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const {
    connection,
    connectionStatus,
    appVersion,
    updateAvailable,
    isUpdating,
    handleUpdate,
  } = useConnection();

  const isConnected = connectionStatus === "connected";

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Branding */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-blue-600 text-white">
          <Replace className="size-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">TorrentDeck</span>
          <div className="flex items-center gap-1.5">
            {appVersion && (
              <span className="text-[10px] text-muted-foreground">v{appVersion}</span>
            )}
            {updateAvailable && (
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center gap-0.5 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-px text-[9px] font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
              >
                {isUpdating ? (
                  <Loader2 className="size-2 animate-spin" />
                ) : (
                  <ArrowDownToLine className="size-2" />
                )}
                {isUpdating ? "..." : `v${updateAvailable.version}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Connection status footer */}
      <Separator />
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div
          className={`size-2 shrink-0 rounded-full ${
            isConnected
              ? "bg-emerald-500"
              : connectionStatus === "testing"
                ? "animate-pulse bg-amber-500"
                : "bg-muted-foreground/30"
          }`}
        />
        <span className="truncate text-[11px] text-muted-foreground">
          {connection.downloader_type === "qbittorrent"
            ? "qBittorrent"
            : "Transmission"}
          {isConnected ? "" : " · disconnected"}
        </span>
      </div>
    </aside>
  );
}
