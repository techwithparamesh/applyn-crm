import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Boxes, Users, Contact, Handshake, CheckSquare, Building2, Search, Edit, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useModules } from "@/hooks/useModulesCRUD";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = {
  Users, Contact, Handshake, CheckSquare, Building2, Boxes,
};

export default function ModulesPage() {
  const navigate = useNavigate();
  const { modules, loading, createModule, updateModule, deleteModule } = useModules();
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("Boxes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);

  const filtered = modules.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await createModule({ name: newName, slug, icon: newIcon, description: newDesc });
    setNewName(""); setNewDesc(""); setNewIcon("Boxes");
    setDialogOpen(false);
    toast.success("Module created");
  };

  const handleEdit = (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (!mod) return;
    setNewName(mod.name);
    setNewDesc(mod.description);
    setNewIcon(mod.icon);
    setEditingModule(id);
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!newName.trim() || !editingModule) return;
    await updateModule(editingModule, { name: newName, description: newDesc, icon: newIcon });
    setNewName(""); setNewDesc(""); setNewIcon("Boxes");
    setEditingModule(null);
    setDialogOpen(false);
    toast.success("Module updated");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteModule(id);
    toast.success("Module deleted");
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) { setEditingModule(null); setNewName(""); setNewDesc(""); setNewIcon("Boxes"); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage your CRM modules</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> New Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingModule ? 'Edit Module' : 'Create Module'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Patients, Properties..." className="mt-1" />
                {!editingModule && newName && <p className="text-xs text-muted-foreground mt-1">Slug: {newName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}</p>}
              </div>
              <div>
                <Label>Description</Label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What does this module track?" className="mt-1" />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.keys(iconMap).map(icon => (
                    <Button
                      key={icon}
                      type="button"
                      size="icon"
                      variant={newIcon === icon ? 'default' : 'outline'}
                      className="h-9 w-9"
                      onClick={() => setNewIcon(icon)}
                    >
                      {(() => { const I = iconMap[icon]; return <I className="h-4 w-4" />; })()}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={editingModule ? handleSaveEdit : handleCreate} className="w-full gradient-brand text-primary-foreground">
                {editingModule ? 'Save Changes' : 'Create Module'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search modules..." className="pl-9" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mod, i) => {
            const Icon = iconMap[mod.icon] || Boxes;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/modules/${mod.id}`)}
                className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    {mod.is_system && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">System</span>
                    )}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(mod.id)}>
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDelete(mod.id, e)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-card-foreground mt-3">{mod.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>
              </motion.div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {modules.length === 0 ? 'No modules yet. Create your first module to get started.' : 'No modules match your search.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
