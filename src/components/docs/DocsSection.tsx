import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DocsSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Wrapper for a logical section inside a doc (e.g. "Overview", "Step-by-Step Guide"). */
export function DocsSection({ title, children, className }: DocsSectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {title && (
        <h2 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
          {title}
        </h2>
      )}
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
