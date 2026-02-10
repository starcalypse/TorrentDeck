import { LayoutDashboard } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <LayoutDashboard className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">Dashboard</h2>
        <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
          Overview of your torrent clients, transfer stats, and activity at a glance.
        </p>
      </div>
    </div>
  );
}
