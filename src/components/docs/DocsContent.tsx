import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface DocsContentProps {
  sectionId: string;
  className?: string;
}

const DOC_BASE = "/docs";

export function DocsContent({ sectionId, className }: DocsContentProps) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sectionId) {
      setMarkdown(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(`${DOC_BASE}/${sectionId}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.text();
      })
      .then(setMarkdown)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sectionId]);

  if (loading) {
    return (
      <div className={cn("p-8 flex items-center justify-center", className)}>
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !markdown) {
    return (
      <div className={cn("p-8", className)}>
        <p className="text-muted-foreground">Documentation for this section is not available.</p>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "docs-content prose prose-slate dark:prose-invert max-w-none px-8 py-6",
        "prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-p:text-muted-foreground prose-li:text-muted-foreground",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
