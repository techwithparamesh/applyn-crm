import { useSearchParams } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocsContent } from "@/components/docs/DocsContent";

const DEFAULT_SECTION = "getting-started";

export default function DocsPage() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || DEFAULT_SECTION;

  return (
    <DocsLayout>
      <div className="flex-1 overflow-auto bg-background">
        <DocsContent sectionId={section} />
      </div>
    </DocsLayout>
  );
}
