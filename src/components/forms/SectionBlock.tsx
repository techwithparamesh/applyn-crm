import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionBlockProps {
  id: string;
  title: string;
  description?: string;
  layout: "single" | "two";
  collapsible?: boolean;
  border?: boolean;
  children: React.ReactNode;
  /** Builder mode: show drag handle / highlight */
  builder?: boolean;
  selected?: boolean;
  onClick?: () => void;
  /** Render as collapsed (when collapsible is true) */
  defaultCollapsed?: boolean;
}

export function SectionBlock({
  id,
  title,
  description,
  layout,
  collapsible = false,
  border = true,
  children,
  builder = false,
  selected = false,
  onClick,
  defaultCollapsed = false,
}: SectionBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const content = (
    <div
      className={cn(
        "rounded-lg transition-colors",
        border && "border border-border bg-card/50",
        builder && "cursor-pointer hover:border-primary/40",
        selected && "ring-2 ring-primary/50 border-primary/40"
      )}
    >
      <div
        className={cn(
          "px-4 py-3 flex items-center gap-2",
          (collapsible || builder) && "flex items-center gap-2"
        )}
      >
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        ) : null}
        <div className="flex-1 min-w-0" onClick={builder ? onClick : undefined}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {(!collapsible || !collapsed) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "overflow-hidden",
              layout === "two" ? "grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-4" : "space-y-4 px-4 pb-4 pt-0",
              layout === "single" && "pt-0"
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return content;
}
