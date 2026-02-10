import { GitCompareArrows } from "lucide-react";

export function CrossTracker() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <GitCompareArrows className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">Cross-Tracker Analysis</h2>
        <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
          Compare tracker coverage, find missing trackers, and analyze overlap across your torrents.
        </p>
      </div>
    </div>
  );
}
