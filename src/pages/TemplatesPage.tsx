import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, TrendingUp, Heart, Home, GraduationCap, Briefcase, Headphones, Megaphone, DollarSign, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { TEMPLATE_DEFINITIONS, TemplateDefinition } from "@/lib/template-definitions";
import { useTemplateInstaller } from "@/hooks/useTemplateInstaller";
import { useNavigate } from "react-router-dom";

const iconMap: Record<string, any> = {
  TrendingUp, Heart, Home, GraduationCap, Briefcase, Headphones, Megaphone, DollarSign,
};

const categories = ['All', 'Sales', 'Healthcare', 'Real Estate', 'Education', 'HR', 'Support', 'Marketing', 'Finance'];

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  isCustom: true;
}

export default function TemplatesPage() {
  const [selected, setSelected] = useState('All');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Sales");
  const navigate = useNavigate();

  const { installedSlugs, installing, progress, loading, installTemplate } = useTemplateInstaller();

  // Merge built-in definitions with custom templates for display
  const allTemplates: (TemplateDefinition | CustomTemplate)[] = [
    ...TEMPLATE_DEFINITIONS,
    ...customTemplates,
  ];

  const filtered = selected === 'All' ? allTemplates : allTemplates.filter((t) => t.category === selected);

  const handleInstall = async (tpl: TemplateDefinition | CustomTemplate) => {
    if ('isCustom' in tpl) {
      toast.info("Custom template installation coming soon");
      return;
    }

    const result = await installTemplate(tpl);

    if (result.success) {
      const moduleNames = tpl.modules.map(m => m.name).join(', ');
      toast.success(`${tpl.name} installed!`, {
        description: `Modules created: ${moduleNames}`,
        action: {
          label: 'Go to Modules',
          onClick: () => navigate('/modules'),
        },
      });
    } else {
      toast.error(`Installation failed`, { description: result.error });
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      setCustomTemplates(prev => prev.map(t => t.id === editingId ? { ...t, name, description: desc, category } : t));
      toast.success("Template updated");
    } else {
      setCustomTemplates(prev => [...prev, {
        id: `custom-${Date.now()}`, name, description: desc, category, icon: 'TrendingUp', color: 'hsl(263, 70%, 58%)', isCustom: true as const,
      }]);
      toast.success("Template created");
    }
    resetDialog();
  };

  const handleEdit = (tpl: CustomTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setName(tpl.name);
    setDesc(tpl.description);
    setCategory(tpl.category);
    setEditingId(tpl.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setName("");
    setDesc("");
    setCategory("Sales");
  };

  const isCustom = (tpl: TemplateDefinition | CustomTemplate): tpl is CustomTemplate => 'isCustom' in tpl;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Install industry-ready CRM templates or create your own</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit Template' : 'Create Template'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this template for?" className="mt-1" /></div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full gradient-brand text-primary-foreground">{editingId ? 'Save Changes' : 'Create Template'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selected === c ? 'gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((tpl, i) => {
          const Icon = iconMap[tpl.icon] || TrendingUp;
          const slug = isCustom(tpl) ? tpl.id : tpl.slug;
          const isInstalled = !isCustom(tpl) && installedSlugs.has(tpl.slug);
          const isInstalling = installing === slug;
          const moduleCount = !isCustom(tpl) ? tpl.modules.length : 0;

          return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tpl.color}15` }}>
                  <Icon className="h-5 w-5" style={{ color: tpl.color }} />
                </div>
                {isCustom(tpl) && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleEdit(tpl, e)}>
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDelete(tpl.id, e)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
                {isInstalled && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" /> Installed
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-card-foreground mt-3">{tpl.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tpl.category}</span>
                {moduleCount > 0 && (
                  <span className="text-xs text-muted-foreground">{moduleCount} modules</span>
                )}
              </div>

              {/* Install progress */}
              {isInstalling && progress && (
                <div className="mt-3 space-y-1.5">
                  <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground truncate">{progress.step}</p>
                </div>
              )}

              <Button
                onClick={() => handleInstall(tpl)}
                disabled={isInstalled || isInstalling || loading}
                variant={isInstalled ? "outline" : "default"}
                size="sm"
                className={`w-full mt-4 ${!isInstalled && !isInstalling ? 'gradient-brand text-primary-foreground shadow-brand hover:opacity-90' : ''}`}
              >
                {isInstalling ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Installing...</>
                ) : isInstalled ? (
                  <><Check className="h-3.5 w-3.5 mr-1.5" /> Installed</>
                ) : (
                  'Install Template'
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
