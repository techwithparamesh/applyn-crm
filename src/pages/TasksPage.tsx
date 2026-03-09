import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, CheckSquare, Circle, CheckCircle2, Clock, Trash2, Edit, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_ICONS: Record<string, any> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

export default function TasksPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState("");

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editingId) {
      await updateTask(editingId, { title, description, priority, dueDate });
      toast.success("Task updated");
    } else {
      await createTask({ title, description, priority, dueDate });
      toast.success("Task created");
    }
    resetDialog();
  };

  const handleEdit = (task: typeof tasks[0]) => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setEditingId(task.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    toast.success("Task deleted");
  };

  const toggleStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    updateTask(id, { status: next });
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPriority('medium');
    setDueDate("");
  };

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  if (loading) {
    return <div className="p-6 max-w-5xl mx-auto space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage tasks and to-dos across your CRM</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit Task' : 'Create Task'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task details..." className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full gradient-brand text-primary-foreground">{editingId ? 'Save Changes' : 'Create Task'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : f === 'in_progress' ? 'In Progress' : 'Done'}
            <span className="ml-1.5 text-xs opacity-70">{statusCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CheckSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No tasks found</p>
          </div>
        )}
        {filtered.map((task, i) => {
          const StatusIcon = STATUS_ICONS[task.status];
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-card hover:shadow-card-hover transition-all group ${
                task.status === 'done' ? 'opacity-60' : ''
              }`}
            >
              <button onClick={() => toggleStatus(task.id)} className="shrink-0">
                <StatusIcon className={`h-5 w-5 ${task.status === 'done' ? 'text-emerald-500' : task.status === 'in_progress' ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                  {task.dueDate && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{task.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(task)}>
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(task.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
