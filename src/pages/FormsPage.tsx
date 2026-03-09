import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, MoreHorizontal, Eye, Pencil, Trash2, Copy, ToggleLeft, ToggleRight, ExternalLink, Code, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockModules } from "@/lib/mock-data";
import { useWebForms } from "@/hooks/useWebForms";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function FormsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forms, createForm, deleteForm, toggleFormActive, getFormSubmissions } = useWebForms();
  const [createOpen, setCreateOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newModule, setNewModule] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !newModule) return;
    const form = createForm({
      moduleId: newModule,
      formName: newName.trim(),
      fieldsJSON: [],
      successMessage: 'Thank you for your submission!',
      redirectUrl: '',
      isActive: false,
      enableRecaptcha: false,
    });
    setNewName("");
    setNewModule("");
    setCreateOpen(false);
    navigate(`/forms/${form.id}`);
  };

  const embedForm = forms.find((f) => f.id === embedOpen);
  const publicUrl = embedOpen ? `${window.location.origin}/form/${embedOpen}` : '';
  const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  const jsCode = `<div id="applyn-form-${embedOpen}"></div>\n<script src="${window.location.origin}/embed.js" data-form-id="${embedOpen}"></script>`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build lead capture forms for your website</p>
        </div>
        <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map((form, i) => {
          const mod = mockModules.find((m) => m.id === form.moduleId);
          const subs = getFormSubmissions(form.id);
          return (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{form.formName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mod?.name || 'Unknown'} · {form.fieldsJSON.length} fields · {subs.length} submissions
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/preview`)}>
                      <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEmbedOpen(form.id)}>
                      <Code className="h-3.5 w-3.5 mr-2" /> Embed Code
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      toggleFormActive(form.id);
                      toast({ title: form.isActive ? "Form deactivated" : "Form activated" });
                    }}>
                      {form.isActive ? <ToggleRight className="h-3.5 w-3.5 mr-2" /> : <ToggleLeft className="h-3.5 w-3.5 mr-2" />}
                      {form.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => {
                      deleteForm(form.id);
                      toast({ title: "Form deleted" });
                    }}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Badge variant={form.isActive ? 'default' : 'secondary'} className={`text-[10px] ${form.isActive ? 'bg-accent text-accent-foreground' : ''}`}>
                  {form.isActive ? 'Active' : 'Draft'}
                </Badge>
                {form.enableRecaptcha && (
                  <Badge variant="outline" className="text-[10px]">reCAPTCHA</Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {format(new Date(form.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </motion.div>
          );
        })}

        {forms.length === 0 && (
          <div className="col-span-2 rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No forms created yet</p>
            <Button variant="link" className="mt-1" onClick={() => setCreateOpen(true)}>Create your first form</Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Form</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Form Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Lead Capture, Contact Us..." className="mt-1" />
            </div>
            <div>
              <Label>Target Module</Label>
              <Select value={newModule} onValueChange={setNewModule}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select module..." /></SelectTrigger>
                <SelectContent>
                  {mockModules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Submissions will create records in this module</p>
            </div>
            <Button onClick={handleCreate} className="w-full gradient-brand text-primary-foreground" disabled={!newName.trim() || !newModule}>
              Create Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed Dialog */}
      <Dialog open={!!embedOpen} onOpenChange={() => setEmbedOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Embed "{embedForm?.formName}"</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Public URL */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2"><Globe className="h-3.5 w-3.5" /> Public URL</Label>
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="text-xs font-mono" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Copied!" }); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* iframe */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2"><Code className="h-3.5 w-3.5" /> iframe Embed</Label>
              <div className="relative">
                <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto text-foreground">{iframeCode}</pre>
                <Button size="sm" variant="ghost" className="absolute top-1.5 right-1.5 h-7" onClick={() => { navigator.clipboard.writeText(iframeCode); toast({ title: "Copied!" }); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* JS Embed */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2"><ExternalLink className="h-3.5 w-3.5" /> JavaScript Embed</Label>
              <div className="relative">
                <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto text-foreground">{jsCode}</pre>
                <Button size="sm" variant="ghost" className="absolute top-1.5 right-1.5 h-7" onClick={() => { navigator.clipboard.writeText(jsCode); toast({ title: "Copied!" }); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
