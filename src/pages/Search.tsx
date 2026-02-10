import { Search as SearchIcon } from "lucide-react";

export function Search() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <SearchIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">Search</h2>
        <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
          Search across all your torrents by name, tracker, hash, or other metadata.
        </p>
      </div>
    </div>
  );
}
