import { cn } from "@/lib/utils";

export interface DividerBlockProps {
  className?: string;
}

export function DividerBlock({ className }: DividerBlockProps) {
  return <hr className={cn("border-t border-border my-4", className)} />;
}
