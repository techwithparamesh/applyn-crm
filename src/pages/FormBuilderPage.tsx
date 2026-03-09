import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, Reorder } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save,
  Type, Mail, Phone, Hash, AlignLeft, ListFilter,
  Settings2, Eye, Columns, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { mockModules, mockFields } from "@/lib/mock-data";
import { WebFormField, FormFieldType } from "@/lib/form-types";
import { useWebForms } from "@/hooks/useWebForms";
import { useToast } from "@/hooks/use-toast";

const fieldTypeIcons: Record<FormFieldType, typeof Type> = {
  text: Type,
  email: Mail,
  phone: Phone,
  number: Hash,
  textarea: AlignLeft,
  select: ListFilter,
};

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  number: 'Number',
  textarea: 'Text Area',
  select: 'Dropdown',
};

export default function FormBuilderPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forms, updateForm } = useWebForms();

  const form = forms.find((f) => f.id === formId);
  const mod = form ? mockModules.find((m) => m.id === form.moduleId) : null;
  const moduleFields = form ? (mockFields[form.moduleId] || []) : [];

  const [formFields, setFormFields] = useState<WebFormField[]>(form?.fieldsJSON || []);
  const [formName, setFormName] = useState(form?.formName || '');
  const [successMessage, setSuccessMessage] = useState(form?.successMessage || '');
  const [redirectUrl, setRedirectUrl] = useState(form?.redirectUrl || '');
  const [enableRecaptcha, setEnableRecaptcha] = useState(form?.enableRecaptcha || false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!form || !mod) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Form not found.</p>
        <Button variant="link" onClick={() => navigate('/forms')}>Back to Forms</Button>
      </div>
    );
  }

  const addField = (fieldType: FormFieldType) => {
    const newField: WebFormField = {
      id: `ff-${Date.now()}`,
      label: `New ${fieldTypeLabels[fieldType]} Field`,
      fieldType,
      placeholder: '',
      isRequired: false,
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : undefined,
      orderIndex: formFields.length,
    };
    setFormFields([...formFields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<WebFormField>) => {
    setFormFields((prev) => prev.map((f) => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const removeField = (fieldId: string) => {
    setFormFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleSave = () => {
    updateForm(form.id, {
      formName,
      fieldsJSON: formFields,
      successMessage,
      redirectUrl,
      enableRecaptcha,
    });
    toast({ title: "Form saved", description: "Your changes have been saved." });
  };

  const selectedField = formFields.find((f) => f.id === selectedFieldId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="text-lg font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
          />
          <p className="text-xs text-muted-foreground">Module: {mod.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> {showPreview ? 'Builder' : 'Preview'}
          </Button>
          <Button size="sm" className="gradient-brand text-primary-foreground shadow-brand" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
          <div className="rounded-xl border border-border bg-card shadow-card p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">{formName}</h2>
            <p className="text-sm text-muted-foreground mb-6">Fill out the form below</p>
            <div className="space-y-4">
              {formFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label className="text-sm">
                    {field.label}
                    {field.isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.fieldType === 'textarea' ? (
                    <Textarea placeholder={field.placeholder} disabled />
                  ) : field.fieldType === 'select' ? (
                    <Select disabled>
                      <SelectTrigger><SelectValue placeholder={field.placeholder || `Select...`} /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input type={field.fieldType} placeholder={field.placeholder} disabled />
                  )}
                </div>
              ))}
              {formFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Add fields to your form</p>
              )}
              {enableRecaptcha && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Protected by reCAPTCHA</span>
                </div>
              )}
              <Button className="w-full gradient-brand text-primary-foreground" disabled>Submit</Button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Builder Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Field Palette */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card shadow-card p-4 sticky top-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(fieldTypeLabels) as FormFieldType[]).map((type) => {
                  const Icon = fieldTypeIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => addField(type)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-center group"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{fieldTypeLabels[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Canvas */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-card shadow-card p-5 min-h-[400px]">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Form Fields</h3>
              {formFields.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <Columns className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Add fields from the sidebar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formFields.map((field, i) => {
                    const Icon = fieldTypeIcons[field.fieldType];
                    const isSelected = field.id === selectedFieldId;
                    return (
                      <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 bg-background'
                        }`}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-grab" />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{field.label}</span>
                          {field.mappedFieldKey && (
                            <span className="text-[10px] text-muted-foreground">→ {field.mappedFieldKey}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {field.isRequired && <Badge variant="secondary" className="text-[9px] px-1 py-0">Required</Badge>}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Field Settings / Form Settings */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden sticky top-6">
              <Tabs defaultValue={selectedField ? "field" : "settings"} value={selectedField ? "field" : "settings"}>
                <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-auto p-0">
                  <TabsTrigger value="field" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary" disabled={!selectedField}>
                    Field Settings
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary" onClick={() => setSelectedFieldId(null)}>
                    Form Settings
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <TabsContent value="field" className="mt-0 space-y-4">
                    {selectedField && (
                      <>
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={selectedField.label}
                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={selectedField.placeholder || ''}
                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Required</Label>
                          <Switch
                            checked={selectedField.isRequired}
                            onCheckedChange={(v) => updateField(selectedField.id, { isRequired: v })}
                          />
                        </div>
                        {/* Field Mapping */}
                        <div>
                          <Label className="text-xs">Map to CRM Field</Label>
                          <Select
                            value={selectedField.mappedFieldKey || 'none'}
                            onValueChange={(v) => updateField(selectedField.id, { mappedFieldKey: v === 'none' ? undefined : v })}
                          >
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— No mapping —</SelectItem>
                              {moduleFields.map((mf) => (
                                <SelectItem key={mf.id} value={mf.fieldKey}>
                                  {mf.label} ({mf.fieldKey})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground mt-1">Maps form input to a {mod.name} field</p>
                        </div>
                        {/* Options for select */}
                        {selectedField.fieldType === 'select' && (
                          <div>
                            <Label className="text-xs">Options (one per line)</Label>
                            <Textarea
                              value={(selectedField.options || []).join('\n')}
                              onChange={(e) => updateField(selectedField.id, { options: e.target.value.split('\n').filter(Boolean) })}
                              className="mt-1 text-xs"
                              rows={4}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0 space-y-4">
                    <div>
                      <Label className="text-xs">Success Message</Label>
                      <Textarea
                        value={successMessage}
                        onChange={(e) => setSuccessMessage(e.target.value)}
                        className="mt-1 text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Redirect URL (optional)</Label>
                      <Input
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://yoursite.com/thank-you"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs">reCAPTCHA</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Protect against spam</p>
                      </div>
                      <Switch checked={enableRecaptcha} onCheckedChange={setEnableRecaptcha} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
