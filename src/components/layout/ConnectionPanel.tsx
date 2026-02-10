import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  Lock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useConnection } from "@/hooks/use-connection";
import type { ConnectionStatus } from "@/types";

export function ConnectionPanel() {
  const {
    connection,
    updateConnection,
    connectionStatus,
    connectionMessage,
    handleTestConnection,
  } = useConnection();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card className="gap-0 border-x-0 border-t-0 border-border/60 py-0 shadow-none rounded-none">
      <CardHeader className="px-4 py-2.5">
        <CardTitle
          className="flex cursor-pointer items-center gap-2 text-[13px]"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
          <Plug className="size-3.5 text-muted-foreground" />
          Connection
        </CardTitle>
        <CardAction>
          <ConnectionStatusBadge
            status={connectionStatus}
            message={connectionMessage}
          />
        </CardAction>
      </CardHeader>

      {!collapsed && (
        <>
          <Separator />
          <CardContent className="px-4 py-3">
            <div className="grid grid-cols-[1fr_1.5fr_0.6fr] gap-x-3 gap-y-2.5">
              {/* Row 1 */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Client</Label>
                <Select
                  value={connection.downloader_type}
                  onValueChange={(v) => updateConnection("downloader_type", v)}
                >
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qbittorrent">qBittorrent</SelectItem>
                    <SelectItem value="transmission">Transmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Host</Label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <Lock className="size-2.5 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground">HTTPS</span>
                    <Switch
                      size="sm"
                      checked={connection.use_https}
                      onCheckedChange={(checked) =>
                        updateConnection("use_https", checked === true)
                      }
                    />
                  </label>
                </div>
                <Input
                  className="h-8 font-mono text-xs"
                  value={connection.host}
                  onChange={(e) => updateConnection("host", e.target.value)}
                  placeholder="127.0.0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Port</Label>
                <Input
                  className="h-8 font-mono text-xs"
                  type="number"
                  value={connection.port}
                  onChange={(e) =>
                    updateConnection("port", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              {/* Row 2 */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Username</Label>
                <Input
                  className="h-8 text-xs"
                  value={connection.username}
                  onChange={(e) => updateConnection("username", e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <Input
                  className="h-8 text-xs"
                  type="password"
                  value={connection.password}
                  onChange={(e) => updateConnection("password", e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-full gap-1.5 text-xs"
                  onClick={handleTestConnection}
                  disabled={connectionStatus === "testing"}
                >
                  {connectionStatus === "testing" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Plug className="size-3" />
                  )}
                  Test
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

function ConnectionStatusBadge({
  status,
  message,
}: {
  status: ConnectionStatus;
  message: string;
}) {
  if (status === "idle") return null;

  if (status === "testing") {
    return (
      <Badge variant="secondary" className="gap-1.5 font-mono text-[10px]">
        <Loader2 className="size-2.5 animate-spin" />
        Testing...
      </Badge>
    );
  }

  if (status === "connected") {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 border-emerald-200 bg-emerald-50 font-mono text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
      >
        <CheckCircle2 className="size-2.5" />
        {message || "Connected"}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="max-w-[260px] gap-1.5 truncate border-red-200 bg-red-50 font-mono text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
    >
      <XCircle className="size-2.5 shrink-0" />
      <span className="truncate">{message || "Failed"}</span>
    </Badge>
  );
}
