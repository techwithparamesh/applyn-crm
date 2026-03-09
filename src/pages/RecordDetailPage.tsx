import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Building2, User, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModules, useFields, toField } from "@/hooks/useModulesCRUD";
import { useRecords, useRecordActivities } from "@/hooks/useRecords";
import { useNotes } from "@/hooks/useNotes";
import { useFiles } from "@/hooks/useFiles";
import { useLeadScores } from "@/hooks/useLeadScores";
import { useRecordEmails } from "@/hooks/useRecordEmails";
import { InlineEditField } from "@/components/records/InlineEditField";
import { ActivityTimeline } from "@/components/records/ActivityTimeline";
import { RecordNotes } from "@/components/records/RecordNotes";
import { RecordFiles } from "@/components/records/RecordFiles";
import { EmailComposer, EmailHistory } from "@/components/records/RecordEmails";
import { RelatedRecordsPanel } from "@/components/records/RelatedRecordsPanel";
import { RecordDeleteDialog } from "@/components/records/RecordDeleteDialog";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import { RecordTagsManager } from "@/components/records/RecordTags";
import { AuditLogTimeline } from "@/components/records/AuditLogTimeline";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/components/PermissionProvider";
import { Skeleton } from "@/components/ui/skeleton";

const stageColors: Record<string, string> = {
  New: 'bg-primary/10 text-primary border-primary/20',
  Contacted: 'bg-secondary/50 text-secondary-foreground border-secondary',
  Proposal: 'bg-accent/10 text-accent-foreground border-accent/20',
  Negotiation: 'bg-accent/10 text-accent-foreground border-accent/20',
  'Closed Won': 'bg-accent/10 text-accent-foreground border-accent/20',
  Qualified: 'bg-accent/10 text-accent-foreground border-accent/20',
  Discovery: 'bg-primary/10 text-primary border-primary/20',
};

export default function RecordDetailPage() {
  const { moduleId, recordId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { modules, loading: modulesLoading } = useModules();
  const mod = modules.find((m) => m.id === moduleId);
  const moduleSlug = mod?.slug || '';
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(moduleSlug, 'edit');
  const canDelete = hasPermission(moduleSlug, 'delete');
  const { fields: dbFields, loading: fieldsLoading } = useFields(moduleId || '');
  const fields = useMemo(() => dbFields.map(toField), [dbFields]);

  const { allRecords, getRecord, updateRecord, deleteRecord, loading: recordsLoading } = useRecords({ moduleId: moduleId || '' });
  const record = getRecord(recordId || '');

  const { activities, addActivity } = useRecordActivities(recordId || '');
  const { notes, addNote, deleteNote } = useNotes(recordId || '');
  const { files, uploading, uploadFile, deleteFile } = useFiles(recordId || '');
  const { emails: recordEmails, loading: emailsLoading, refetch: refetchEmails, unlinkEmail } = useRecordEmails(recordId || '');

  const [values, setValues] = useState<Record<string, any>>({});
  useEffect(() => {
    if (record) setValues(record.values);
  }, [record]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { logChange, getEntityLogs } = useAuditLogs();
  const auditLogs = getEntityLogs(recordId || '');

  const scores = useLeadScores(allRecords);
  const leadScore = record ? scores.get(record.id) : undefined;

  if (modulesLoading || fieldsLoading || recordsLoading) {
    return <div className="p-6 max-w-7xl mx-auto"><Skeleton className="h-48 w-full" /></div>;
  }

  if (!mod || !record) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Record not found.</p>
        <Button variant="link" onClick={() => navigate(`/modules/${moduleId}`)}>Back to {mod?.name || 'module'}</Button>
      </div>
    );
  }

  const nameField = fields[0];
  const recordName = values[nameField?.fieldKey] || 'Untitled';
  const email = values['email'] || '';
  const phone = values['phone'] || '';
  const company = values['company'] || '';
  const stage = record.stage || values['status'] || values['stage'] || '';

  const handleFieldSave = (fieldKey: string, newValue: any) => {
    const oldValue = values[fieldKey];
    setValues((prev) => ({ ...prev, [fieldKey]: newValue }));
    updateRecord(record.id, { [fieldKey]: newValue });
    const field = fields.find((f) => f.fieldKey === fieldKey);
    addActivity('field_updated', `${field?.label || fieldKey} changed from "${oldValue || 'empty'}" to "${newValue}"`);
    logChange('record', recordId || '', 'update', {
      oldValue: String(oldValue || ''),
      newValue: String(newValue),
      fieldLabel: field?.label || fieldKey,
    });
    toast({ title: "Field updated", description: `${field?.label} has been saved.` });
  };

  const handleDelete = () => {
    deleteRecord(record.id);
    toast({ title: "Record deleted", description: `"${recordName}" has been deleted.` });
    navigate(`/modules/${moduleId}`);
  };

  const handleFileUpload = async (file: File) => {
    try {
      await uploadFile(file);
      toast({ title: "File uploaded", description: `${file.name} has been attached.` });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload file.", variant: "destructive" });
    }
  };

  const contactFields = fields.filter((f) => ['email', 'phone', 'company'].includes(f.fieldKey));
  const otherFields = fields.filter((f) => !['email', 'phone', 'company'].includes(f.fieldKey) && f.orderIndex !== 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/modules/${moduleId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {mod.name}
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card shadow-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl gradient-brand flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary-foreground">
                {recordName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{recordName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                {company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {company}</span>}
                {email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {email}</span>}
                {phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {phone}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {stage && <Badge variant="outline" className={`text-xs ${stageColors[stage] || 'bg-muted text-muted-foreground'}`}>{stage}</Badge>}
                {leadScore && <LeadScoreBadge score={leadScore.score} category={leadScore.category} size="md" />}
                <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {record.createdBy}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(record.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2"><RecordTagsManager recordId={recordId || ''} /></div>
            </div>
          </div>
          {canDelete && (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {contactFields.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {contactFields.map((f) => (
                  <div key={f.id} className="py-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{f.label}</label>
                    <InlineEditField field={f} value={values[f.fieldKey]} onSave={handleFieldSave} disabled={!canEdit} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {otherFields.map((f) => (
                <div key={f.id} className={`py-1 ${f.fieldType === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{f.label}</label>
                  <InlineEditField field={f} value={values[f.fieldKey]} onSave={handleFieldSave} disabled={!canEdit} />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Related Records</h3>
            <RelatedRecordsPanel recordId={recordId || ''} moduleId={moduleId || ''} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-0">
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-auto p-0 flex-wrap">
                <TabsTrigger value="activity" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Activity</TabsTrigger>
                <TabsTrigger value="emails" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Emails {recordEmails.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{recordEmails.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Notes</TabsTrigger>
                <TabsTrigger value="files" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Files</TabsTrigger>
                <TabsTrigger value="history" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">History</TabsTrigger>
              </TabsList>
              <div className="p-4">
                <TabsContent value="activity" className="mt-0">
                  <ActivityTimeline activities={activities} emails={recordEmails} whatsAppMessages={[]} notes={notes} />
                </TabsContent>
                <TabsContent value="emails" className="mt-0">
                  <div className="space-y-4">
                    <EmailComposer recipientEmail={email} onSent={refetchEmails} />
                    <EmailHistory emails={recordEmails} loading={emailsLoading} onUnlink={unlinkEmail} />
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  <RecordNotes notes={notes} onAdd={addNote} onDelete={deleteNote} />
                </TabsContent>
                <TabsContent value="files" className="mt-0">
                  <RecordFiles files={files} uploading={uploading} onUpload={handleFileUpload} onDelete={deleteFile} />
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                  <AuditLogTimeline logs={auditLogs} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </div>

      <RecordDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} recordName={recordName} onConfirm={handleDelete} />
    </div>
  );
}
