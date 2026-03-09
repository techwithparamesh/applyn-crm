import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  TrendingUp,
  Heart,
  Home,
  GraduationCap,
  Megaphone,
  DollarSign,
  Plus,
  Loader2,
  Search,
  Eye,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { TEMPLATE_DEFINITIONS, TemplateDefinition } from "@/lib/template-definitions";
import { useTemplateInstaller } from "@/hooks/useTemplateInstaller";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Heart,
  Home,
  GraduationCap,
  Megaphone,
  DollarSign,
  Boxes: TrendingUp,
};

export interface DbTemplate {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name?: string | null;
  icon: string | null;
  modules_count: number;
  is_public: number;
  modules?: { id: string; name: string; slug: string }[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string | null;
  order_index: number;
}

type TemplateItem = (TemplateDefinition & { isDb?: false }) | (DbTemplate & { isDb: true });

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([]);
  const [dbCategories, setDbCategories] = useState<TemplateCategory[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCategoryId, setSaveCategoryId] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    installedSlugs,
    installedTemplateIds,
    installing,
    progress,
    loading,
    installTemplate,
    installTemplateById,
    fetchInstalled,
  } = useTemplateInstaller();

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    const [tRes, cRes] = await Promise.all([
      api.get("/api/templates"),
      api.get("/api/template_categories"),
    ]);
    if (tRes.data) setDbTemplates((tRes.data as DbTemplate[]) || []);
    if (cRes.data) setDbCategories((cRes.data as TemplateCategory[]) || []);
    setLoadingTemplates(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const allTemplates: TemplateItem[] = [
    ...dbTemplates.map((t) => ({ ...t, isDb: true as const })),
    ...TEMPLATE_DEFINITIONS.map((t) => ({ ...t, isDb: false as const })),
  ];

  const categoryName = dbCategories.find((c) => c.id === categoryFilter)?.name ?? categoryFilter;
  const filtered = allTemplates.filter((t) => {
    const matchCategory =
      categoryFilter === "all" ||
      (t.isDb ? t.category_id === categoryFilter : (t as TemplateDefinition).category === categoryName);
    const matchSearch =
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleInstall = async (tpl: TemplateItem) => {
    if (tpl.isDb) {
      const result = await installTemplateById(tpl.id);
      if (result.success) {
        toast.success(`${tpl.name} installed!`, {
          description: `${result.modulesCreated} modules created.`,
          action: { label: "Go to Modules", onClick: () => navigate("/modules") },
        });
        navigate("/modules");
      } else {
        toast.error("Installation failed", { description: result.error });
      }
      return;
    }
    const result = await installTemplate(tpl as TemplateDefinition);
    if (result.success) {
      const moduleNames = (tpl as TemplateDefinition).modules.map((m) => m.name).join(", ");
      toast.success(`${tpl.name} installed!`, {
        description: `Modules: ${moduleNames}`,
        action: { label: "Go to Modules", onClick: () => navigate("/modules") },
      });
      navigate("/modules");
    } else {
      toast.error("Installation failed", { description: result.error });
    }
  };

  const isInstalled = (tpl: TemplateItem) =>
    tpl.isDb ? installedTemplateIds.has(tpl.id) : installedSlugs.has((tpl as TemplateDefinition).slug);

  const handleSaveWorkspace = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const { data, error } = await api.post("/api/templates/create-from-workspace", {
      template_name: saveName.trim(),
      category_id: saveCategoryId || null,
      description: saveDescription.trim() || null,
    });
    setSaving(false);
    if (error || !data) {
      toast.error("Failed to save template", { description: (data as any)?.error || "Unknown error" });
      return;
    }
    toast.success("Template saved", { description: `${saveName} is now available in the marketplace.` });
    setSaveDialogOpen(false);
    setSaveName("");
    setSaveCategoryId("");
    setSaveDescription("");
    fetchTemplates();
    fetchInstalled();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Install industry CRM templates or save your workspace as a template
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" /> Save workspace as template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save workspace as template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Template name</Label>
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g. My Sales CRM"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Category (optional)</Label>
                  <Select value={saveCategoryId} onValueChange={setSaveCategoryId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {dbCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="What does this template include?"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSaveWorkspace} disabled={saving || !saveName.trim()} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {dbCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
            {dbCategories.length === 0 && ["Sales", "Healthcare", "Real Estate", "Education", "Marketing", "Finance"].map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingTemplates && dbTemplates.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((tpl, i) => {
          const Icon = iconMap[tpl.icon || "Boxes"] || TrendingUp;
          const idOrSlug = tpl.isDb ? tpl.id : (tpl as TemplateDefinition).slug;
          const moduleCount = tpl.isDb ? tpl.modules_count : (tpl as TemplateDefinition).modules.length;
          const installed = isInstalled(tpl);
          const isInstalling = installing === idOrSlug;

          return (
            <motion.div
              key={tpl.isDb ? tpl.id : (tpl as TemplateDefinition).slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${(tpl as any).color || "#7C3AED"}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: (tpl as any).color || "#7C3AED" }} />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewTemplate(tpl)}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {installed && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> Installed
                    </span>
                  )}
                </div>
              </div>
              <h3 className="text-base font-semibold text-card-foreground mt-3">{tpl.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tpl.description || "—"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {tpl.isDb ? tpl.category_name || "Uncategorized" : (tpl as TemplateDefinition).category}
                </span>
                <span className="text-xs text-muted-foreground">{moduleCount} modules</span>
              </div>
              {isInstalling && progress && (
                <div className="mt-3 space-y-1.5">
                  <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground truncate">{progress.step}</p>
                </div>
              )}
              <Button
                onClick={() => handleInstall(tpl)}
                disabled={installed || isInstalling || loading}
                variant={installed ? "outline" : "default"}
                size="sm"
                className="w-full mt-4"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Installing...
                  </>
                ) : installed ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Installed
                  </>
                ) : (
                  "Install Template"
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !loadingTemplates && (
        <div className="text-center py-12 text-muted-foreground">
          No templates match your search. Try a different category or search term.
        </div>
      )}

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{previewTemplate.description || "—"}</p>
              <p className="text-sm font-medium">
                {previewTemplate.isDb
                  ? previewTemplate.modules_count
                  : (previewTemplate as TemplateDefinition).modules.length}{" "}
                modules
              </p>
              <ul className="text-sm list-disc list-inside">
                {previewTemplate.isDb && previewTemplate.modules?.length
                  ? previewTemplate.modules.map((m) => <li key={m.id}>{m.name}</li>)
                  : !previewTemplate.isDb &&
                    (previewTemplate as TemplateDefinition).modules?.map((m) => (
                      <li key={m.slug}>{m.name}</li>
                    ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
