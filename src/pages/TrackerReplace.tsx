import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error as logError } from "@tauri-apps/plugin-log";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Replace,
  Search,
  Play,
  ChevronDown,
  ChevronRight,
  List,
} from "lucide-react";
import { useConnection } from "@/hooks/use-connection";
import type { ScanResult, ReplaceResult, TrackerEntry } from "@/types";

export function TrackerReplace() {
  const {
    connection,
    connectionStatus,
    rules,
    setRules,
    buildConfig,
  } = useConnection();

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const [existingTrackers, setExistingTrackers] = useState<TrackerEntry[]>([]);
  const [isFetchingTrackers, setIsFetchingTrackers] = useState(false);
  const [trackerPopoverOpen, setTrackerPopoverOpen] = useState(false);

  const isConnected = connectionStatus === "connected";
  const isBusy = isScanning || isExecuting;
  const activeRuleCount = rules.filter(
    (r) => r.enabled && r.old_domain.trim() !== "",
  ).length;

  const updateRule = <K extends keyof (typeof rules)[0]>(
    index: number,
    key: K,
    value: (typeof rules)[0][K],
  ) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { old_domain: "", new_domain: "", enabled: true },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const handleFetchTrackers = async () => {
    setIsFetchingTrackers(true);
    try {
      const entries = await invoke<TrackerEntry[]>("list_trackers", {
        connection,
      });
      setExistingTrackers(entries);
      setTrackerPopoverOpen(true);
    } catch (err) {
      logError(`Failed to fetch trackers: ${err}`);
    } finally {
      setIsFetchingTrackers(false);
    }
  };

  const addRuleFromTracker = (domain: string) => {
    const emptyIdx = rules.findIndex(
      (r) => r.old_domain.trim() === "" && r.new_domain.trim() === "",
    );
    if (emptyIdx !== -1) {
      updateRule(emptyIdx, "old_domain", domain);
    } else {
      setRules((prev) => [
        ...prev,
        { old_domain: domain, new_domain: "", enabled: true },
      ]);
    }
    setTrackerPopoverOpen(false);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setShowMatches(false);
    try {
      const result = await invoke<ScanResult>("scan_torrents", {
        config: buildConfig(),
      });
      setScanResult(result);
    } catch (err) {
      logError(`Scan failed: ${err}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await invoke<ReplaceResult[]>("execute_replace", {
        config: buildConfig(),
      });
      setScanResult(null);
    } catch (err) {
      logError(`Execute failed: ${err}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Replacement Rules */}
      <Card className="gap-0 border-border/60 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Replace className="size-3.5 text-muted-foreground" />
            Replacement Rules
          </CardTitle>
          <CardAction className="flex items-center gap-1.5">
            {activeRuleCount > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                {activeRuleCount} active
              </Badge>
            )}
            <Popover
              open={trackerPopoverOpen}
              onOpenChange={setTrackerPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleFetchTrackers}
                  disabled={isFetchingTrackers}
                >
                  {isFetchingTrackers ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <List className="size-3" />
                  )}
                  Browse
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 overflow-hidden p-0">
                <div className="border-b px-3 py-2">
                  <p className="text-xs font-medium">Existing Trackers</p>
                  <p className="text-[10px] text-muted-foreground">
                    Select a tracker to create a rule
                  </p>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {existingTrackers.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                      No trackers found
                    </div>
                  ) : (
                    <div className="py-1">
                      {existingTrackers.map((t) => {
                        const alreadyUsed = rules.some(
                          (r) => r.old_domain === t.domain,
                        );
                        return (
                          <button
                            key={t.domain}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                            onClick={() => addRuleFromTracker(t.domain)}
                            disabled={alreadyUsed}
                          >
                            <span className="truncate font-mono">
                              {t.domain}
                            </span>
                            <Badge
                              variant="secondary"
                              className="shrink-0 font-mono text-[10px]"
                            >
                              {t.count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </CardAction>
        </CardHeader>
        <Separator />
        <CardContent className="px-4 py-3">
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[32px_1fr_24px_1fr_32px] items-center gap-2 px-0.5">
              <span />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Old domain
              </span>
              <span />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                New domain
              </span>
              <span />
            </div>

            {/* Rule rows */}
            {rules.map((rule, i) => (
              <div
                key={i}
                className="group grid grid-cols-[32px_1fr_24px_1fr_32px] items-center gap-2"
              >
                <div className="flex justify-center">
                  <Switch
                    size="sm"
                    checked={rule.enabled}
                    onCheckedChange={(checked) =>
                      updateRule(i, "enabled", checked === true)
                    }
                  />
                </div>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="old.tracker.com"
                  value={rule.old_domain}
                  onChange={(e) => updateRule(i, "old_domain", e.target.value)}
                />
                <div className="flex justify-center">
                  <ArrowRight className="size-3.5 text-muted-foreground/50" />
                </div>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="new.tracker.com"
                  value={rule.new_domain}
                  onChange={(e) => updateRule(i, "new_domain", e.target.value)}
                />
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={() => removeRule(i)}
                    disabled={rules.length <= 1}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add rule button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={addRule}
            >
              <Plus className="size-3" />
              Add rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview & Execute */}
      <Card className="gap-0 border-border/60 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Search className="size-3.5 text-muted-foreground" />
            Preview
          </CardTitle>
          <CardAction className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleScan}
              disabled={isBusy || !isConnected || activeRuleCount === 0}
            >
              {isScanning ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Search className="size-3" />
              )}
              Scan
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1.5 bg-blue-600 text-xs text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              onClick={handleExecute}
              disabled={
                isBusy ||
                !isConnected ||
                !scanResult ||
                scanResult.matched_torrents === 0
              }
            >
              {isExecuting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Play className="size-3" />
              )}
              Execute
            </Button>
          </CardAction>
        </CardHeader>
        <Separator />
        <CardContent className="px-4 py-3">
          {!scanResult ? (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              Run a scan to preview matched torrents
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Stats bar */}
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold tabular-nums leading-none">
                    {scanResult.matched_torrents}
                  </span>
                  <span className="text-xs text-muted-foreground">matched</span>
                </div>
                <span className="text-xs text-muted-foreground/40">/</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-lg tabular-nums leading-none text-muted-foreground">
                    {scanResult.total_torrents}
                  </span>
                  <span className="text-xs text-muted-foreground">total</span>
                </div>
                {scanResult.matched_torrents > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-auto font-mono text-[10px]"
                  >
                    {Math.round(
                      (scanResult.matched_torrents /
                        scanResult.total_torrents) *
                        100,
                    )}
                    %
                  </Badge>
                )}
              </div>

              {/* Expandable match list */}
              {scanResult.matches.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowMatches(!showMatches)}
                    className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showMatches ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                    {scanResult.matches.length} tracker{" "}
                    {scanResult.matches.length === 1
                      ? "replacement"
                      : "replacements"}
                  </button>

                  {showMatches && (
                    <div className="mt-1.5 max-h-[180px] overflow-y-auto">
                      <div className="space-y-px">
                        {scanResult.matches.map((m, i) => (
                          <div
                            key={`${m.hash}-${i}`}
                            className="rounded-md bg-muted/50 px-3 py-2"
                          >
                            <div className="mb-1 truncate text-xs font-medium">
                              {m.name}
                            </div>
                            <div className="min-w-0 space-y-0.5 font-mono text-[11px]">
                              <div className="truncate text-muted-foreground">
                                {m.old_url}
                              </div>
                              <div className="flex items-center gap-1 text-foreground">
                                <ArrowRight className="size-2.5 shrink-0 text-muted-foreground/40" />
                                <span className="truncate">{m.new_url}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
