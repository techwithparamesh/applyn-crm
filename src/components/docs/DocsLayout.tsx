import { ReactNode } from "react";
import { DocsSidebar } from "./DocsSidebar";
import { DocsSearch } from "./DocsSearch";
import { cn } from "@/lib/utils";

interface DocsLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DocsLayout({ children, className }: DocsLayoutProps) {
  return (
    <div className={cn("flex h-full w-full", className)}>
      <aside className="w-64 shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border">
          <DocsSearch />
        </div>
        <DocsSidebar />
      </aside>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
