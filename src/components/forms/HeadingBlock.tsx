import { cn } from "@/lib/utils";

export interface HeadingBlockProps {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm font-medium text-foreground",
  md: "text-base font-semibold text-foreground",
  lg: "text-lg font-bold text-foreground",
};

export function HeadingBlock({ text, size = "md", className }: HeadingBlockProps) {
  return (
    <div className={cn("py-1", className)}>
      <h4 className={sizeClasses[size]}>{text || "Heading"}</h4>
    </div>
  );
}
