import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Boxes,
  Users,
  Contact,
  Handshake,
  CheckSquare,
  Building2,
  Search,
  Edit,
  Trash2,
  Settings2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useModules } from "@/hooks/useModulesCRUD";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ICON_OPTIONS = [
  { value: "Users", icon: Users, label: "Users" },
  { value: "Contact", icon: Contact, label: "Contact" },
  { value: "Handshake", icon: Handshake, label: "Handshake" },
  { value: "CheckSquare", icon: CheckSquare, label: "Tasks" },
  { value: "Building2", icon: Building2, label: "Building" },
  { value: "Boxes", icon: Boxes, label: "Boxes" },
  { value: "LayoutGrid", icon: LayoutGrid, label: "Grid" },
];

const COLOR_OPTIONS = [
  "#7C3AED",
  "#6366f1",
  "#3B82F6",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
ICON_OPTIONS.forEach(({ value, icon }) => { iconMap[value] = icon; });

export default function ModuleBuilderPage() {
  const navigate = useNavigate();
  const { modules, loading, createModule, updateModule, deleteModule } = useModules();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Boxes");
  const [color, setColor] = useState("#7C3AED");

  const filtered = modules.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const slugFromName = (n: string) =>
    n
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("Boxes");
    setColor("#7C3AED");
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const mod = modules.find((m) => m.id === id);
    if (!mod) return;
    setEditingId(id);
    setName(mod.name);
    setDescription(mod.description || "");
    setIcon(mod.icon || "Boxes");
    setColor(mod.color || "#7C3AED");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const slug = slugFromName(name);
    if (editingId) {
      await updateModule(editingId, { name: name.trim(), slug, description: description.trim(), icon, color });
      toast.success("Module updated");
    } else {
      await createModule({ name: name.trim(), slug, description: description.trim(), icon, color });
      toast.success("Module created");
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteModule(id);
    toast.success("Module deleted");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Module Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage CRM modules. Each module defines a record type (e.g. Leads, Deals, Patients).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> CRM Structure
          </CardTitle>
          <CardDescription>
            Add modules for your industry: loans, properties, patients, deals, etc. Then add fields and build forms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="pl-9"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-brand text-primary-foreground" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> New Module
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Module" : "Create Module"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Loan Applications, Properties, Patients"
                      className="mt-1"
                    />
                    {name && (
                      <p className="text-xs text-muted-foreground mt-1">Slug: {slugFromName(name) || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does this module track?"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {ICON_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            size="icon"
                            variant={icon === opt.value ? "default" : "outline"}
                            className="h-9 w-9"
                            onClick={() => setIcon(opt.value)}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                          }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full gradient-brand text-primary-foreground" disabled={!name.trim()}>
                    {editingId ? "Save Changes" : "Create Module"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <Boxes className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {modules.length === 0 ? "No modules yet. Create one to define your CRM structure." : "No modules match your search."}
              </p>
              {modules.length === 0 && (
                <Button variant="outline" className="mt-3" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Create first module
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((mod, i) => {
                const Icon = iconMap[mod.icon] || Boxes;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div
                      className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${mod.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: mod.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{mod.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{mod.description || mod.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/modules/${mod.id}`)}>
                        Open
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(mod.id)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(mod.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Open a module to add fields, build forms, and manage records. Use the main <strong>Modules</strong> menu to
        access record views (table, kanban, calendar).
      </p>
    </div>
  );
}
