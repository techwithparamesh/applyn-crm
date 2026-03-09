import { useState } from "react";
import { Table2, Kanban, CalendarDays, List, Plus, X, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModuleView, ViewType } from "@/lib/view-types";

const viewIcons: Record<ViewType, typeof Table2> = {
  table: Table2,
  kanban: Kanban,
  calendar: CalendarDays,
  list: List,
};

interface ViewSwitcherProps {
  views: ModuleView[];
  activeViewId: string;
  onSwitch: (viewId: string) => void;
  onCreate: (name: string, viewType: ViewType) => void;
  onDelete: (viewId: string) => void;
}

export function ViewSwitcher({ views, activeViewId, onSwitch, onCreate, onDelete }: ViewSwitcherProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ViewType>("table");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim(), newType);
    setNewName("");
    setNewType("table");
    setCreateOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-1 border-b border-border pb-0 -mb-px overflow-x-auto">
        {views.map((view) => {
          const Icon = viewIcons[view.viewType];
          const isActive = view.id === activeViewId;
          return (
            <div key={view.id} className="relative group flex items-center">
              <button
                onClick={() => onSwitch(view.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {view.name}
              </button>
              {!view.isDefault && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-5 w-5 flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted transition-all -ml-1 mr-1">
                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(view.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete View
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create View</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>View Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Hot Leads, My Deals..." className="mt-1" />
            </div>
            <div>
              <Label>View Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as ViewType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="table"><span className="flex items-center gap-2"><Table2 className="h-3.5 w-3.5" /> Table</span></SelectItem>
                  <SelectItem value="kanban"><span className="flex items-center gap-2"><Kanban className="h-3.5 w-3.5" /> Kanban</span></SelectItem>
                  <SelectItem value="calendar"><span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Calendar</span></SelectItem>
                  <SelectItem value="list"><span className="flex items-center gap-2"><List className="h-3.5 w-3.5" /> List</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full gradient-brand text-primary-foreground" disabled={!newName.trim()}>
              Create View
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
