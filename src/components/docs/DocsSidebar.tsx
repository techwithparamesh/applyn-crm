import { ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { DOCS_NAV, type DocNavItem } from "@/docs/structure";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function DocNavLink({ item, depth = 0 }: { item: DocNavItem; depth?: number }) {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "getting-started";
  const isActive = section === item.id;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    const defaultOpen = item.children!.some((c) => c.id === section) || item.id === section;
    return (
      <Collapsible defaultOpen={defaultOpen} className="group/collapse">
        <div className="flex items-center gap-0.5 rounded-lg hover:bg-sidebar-accent" style={{ paddingLeft: 12 + depth * 12 }}>
          <CollapsibleTrigger className="p-1.5 rounded hover:bg-sidebar-accent/80 shrink-0">
            <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapse:rotate-90 text-muted-foreground" />
          </CollapsibleTrigger>
          <Link
            to={`/docs?section=${item.id}`}
            className={cn(
              "flex-1 py-2 pr-3 pl-0.5 text-sm font-medium rounded-lg transition-colors hover:bg-sidebar-accent block",
              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground"
            )}
          >
            {item.title}
          </Link>
        </div>
        <CollapsibleContent>
          <div className="pl-2 py-1 space-y-0.5">
            {item.children!.map((child) => (
              <DocNavLink key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      to={`/docs?section=${item.id}`}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-sidebar-accent block",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground"
      )}
      style={{ paddingLeft: 12 + depth * 12 }}
    >
      {item.title}
    </Link>
  );
}

export function DocsSidebar() {
  return (
    <ScrollArea className="flex-1">
      <nav className="p-2 space-y-0.5">
        {DOCS_NAV.map((item) => (
          <DocNavLink key={item.id} item={item} />
        ))}
      </nav>
    </ScrollArea>
  );
}
