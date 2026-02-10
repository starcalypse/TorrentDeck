import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConnectionProvider } from "@/hooks/use-connection";
import { Sidebar, type PageId } from "@/components/layout/Sidebar";
import { ConnectionPanel } from "@/components/layout/ConnectionPanel";
import { TrackerReplace } from "@/pages/TrackerReplace";
import { Dashboard } from "@/pages/Dashboard";
import { CrossTracker } from "@/pages/CrossTracker";
import { Search } from "@/pages/Search";

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "tracker-replace":
      return <TrackerReplace />;
    case "cross-tracker":
      return <CrossTracker />;
    case "search":
      return <Search />;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("tracker-replace");

  return (
    <TooltipProvider>
      <ConnectionProvider>
        <div className="flex h-screen flex-col bg-background text-foreground">
          {/* Title bar / drag region */}
          <div
            data-tauri-drag-region
            className="h-[52px] shrink-0 border-b"
          >
            <div className="h-full pl-[68px]" data-tauri-drag-region />
          </div>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex flex-1 flex-col overflow-hidden">
              <ConnectionPanel />
              <ScrollArea className="flex-1">
                <PageContent page={currentPage} />
              </ScrollArea>
            </main>
          </div>
        </div>
      </ConnectionProvider>
    </TooltipProvider>
  );
}

export default App;
