import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Copy,
  Settings2,
  Eye,
  Shield,
  Mail,
  MessageCircle,
  User,
  Zap,
  Globe,
  Code,
  Webhook,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModules, useFields } from "@/hooks/useModulesCRUD";
import {
  FIELD_TYPES,
  FIELD_TYPE_CATEGORIES,
  getFieldTypesByCategory,
  labelToApiName,
  type FieldTypeCategory,
} from "@/lib/field-types";
import { WebFormField, FormFieldType, FormSubmissionBehavior, FormSection } from "@/lib/form-types";
import { useWebForms } from "@/hooks/useWebForms";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SectionBlock } from "@/components/forms/SectionBlock";
import { HeadingBlock } from "@/components/forms/HeadingBlock";
import { DividerBlock } from "@/components/forms/DividerBlock";
import { LayoutGrid, Minus, Type } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
for (const [name, Icon] of Object.entries(LucideIcons)) {
  if (typeof Icon === "function" && name !== "default") iconMap[name] = Icon as React.ComponentType<{ className?: string }>;
}
function getIcon(iconName: string) {
  return iconMap[iconName] || iconMap.Type || (() => null);
}

type LayoutItem = { id: string; type: "section"; section: FormSection } | { id: string; type: "field"; field: WebFormField };

function buildLayoutOrder(sections: FormSection[], fields: WebFormField[]): string[] {
  const order: string[] = [];
  const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const sec of sortedSections) {
    order.push(sec.id);
    const secFields = fields.filter((f) => f.sectionId === sec.id).sort((a, b) => a.orderIndex - b.orderIndex);
    secFields.forEach((f) => order.push(f.id));
  }
  const ungrouped = fields.filter((f) => !f.sectionId).sort((a, b) => a.orderIndex - b.orderIndex);
  ungrouped.forEach((f) => order.push(f.id));
  return order;
}

function syncOrderFromLayoutOrder(
  layoutOrder: string[],
  sections: FormSection[],
  fields: WebFormField[]
): { sections: FormSection[]; fields: WebFormField[] } {
  let sectionIndex = 0;
  const sectionOrderMap = new Map<string, number>();
  const fieldSectionMap = new Map<string, string | null>();
  const fieldOrderInSection = new Map<string, number>();
  let currentSectionId: string | null = null;
  let fieldCountInSection = 0;

  for (const id of layoutOrder) {
    const sec = sections.find((s) => s.id === id);
    if (sec) {
      sectionOrderMap.set(sec.id, sectionIndex++);
      currentSectionId = sec.id;
      fieldCountInSection = 0;
    } else {
      const f = fields.find((x) => x.id === id);
      if (f) {
        fieldSectionMap.set(f.id, currentSectionId);
        fieldOrderInSection.set(f.id, fieldCountInSection++);
      }
    }
  }

  const newSections = sections.map((s) => ({ ...s, orderIndex: sectionOrderMap.get(s.id) ?? s.orderIndex }));
  const newFields = fields.map((f) => ({
    ...f,
    sectionId: fieldSectionMap.get(f.id) ?? f.sectionId,
    orderIndex: fieldOrderInSection.get(f.id) ?? f.orderIndex,
  }));
  return { sections: newSections, fields: newFields };
}

export default function FormBuilderPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forms, updateForm } = useWebForms();
  const { modules } = useModules();
  const form = forms.find((f) => f.id === formId);
  const mod = form ? modules.find((m) => m.id === form.moduleId) : null;
  const { fields: moduleFieldsRaw } = useFields(form?.moduleId || "");
  const moduleFields = (mod ? moduleFieldsRaw : []).map((f) => ({ id: f.id, label: f.label, fieldKey: f.name }));

  const [formSections, setFormSections] = useState<FormSection[]>(form?.sectionsJSON || []);
  const [formFields, setFormFields] = useState<WebFormField[]>(form?.fieldsJSON || []);
  const [formLayoutOrder, setFormLayoutOrder] = useState<string[]>(() => {
    if (form?.layoutOrder?.length) return form.layoutOrder!;
    return buildLayoutOrder(form?.sectionsJSON || [], form?.fieldsJSON || []);
  });
  const [formName, setFormName] = useState(form?.formName || "");
  const [successMessage, setSuccessMessage] = useState(form?.successMessage || "");
  const [redirectUrl, setRedirectUrl] = useState(form?.redirectUrl || "");
  const [enableRecaptcha, setEnableRecaptcha] = useState(form?.enableRecaptcha ?? false);
  const [publicSlug, setPublicSlug] = useState(form?.publicSlug || "");
  const [webhookUrl, setWebhookUrl] = useState(form?.webhookUrl || "");
  const [submissionBehavior, setSubmissionBehavior] = useState<FormSubmissionBehavior>(
    form?.submissionBehavior ?? { createRecord: true }
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customFieldOpen, setCustomFieldOpen] = useState(false);

  const byCategory = getFieldTypesByCategory();

  const layoutItems: LayoutItem[] = formLayoutOrder
    .map((id) => {
      const sec = formSections.find((s) => s.id === id);
      if (sec) return { id, type: "section" as const, section: sec };
      const field = formFields.find((f) => f.id === id);
      if (field) return { id, type: "field" as const, field };
      return null;
    })
    .filter((x): x is LayoutItem => x !== null);

  const selectedSection = selectedId ? formSections.find((s) => s.id === selectedId) : null;
  const selectedField = selectedId ? formFields.find((f) => f.id === selectedId) : null;

  if (!form) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Form not found.</p>
        <Button variant="link" onClick={() => navigate("/forms")}>
          Back to Forms
        </Button>
      </div>
    );
  }

  const lastSectionIdInOrder = formLayoutOrder.find((id) => formSections.some((s) => s.id === id)) ?? null;

  const addField = (fieldType: FormFieldType, overrides?: Partial<WebFormField>) => {
    const config = FIELD_TYPES.find((f) => f.type === fieldType);
    const label = overrides?.label ?? `New ${config?.label || fieldType}`;
    const sectionId = overrides?.sectionId !== undefined ? overrides.sectionId : lastSectionIdInOrder;
    const fieldsInSection = formFields.filter((f) => f.sectionId === sectionId).length;
    const newField: WebFormField = {
      id: `ff-${Date.now()}`,
      label,
      fieldType,
      apiName: fieldType !== "heading" && fieldType !== "divider" ? (overrides?.apiName ?? labelToApiName(label)) : undefined,
      placeholder: "",
      isRequired: overrides?.isRequired ?? false,
      orderIndex: fieldsInSection,
      sectionId: sectionId ?? undefined,
      ...(overrides?.defaultValue !== undefined && { defaultValue: overrides.defaultValue }),
      ...(config?.supportsOptions && { options: ["Option 1", "Option 2"] }),
      ...overrides,
    };
    setFormFields((prev) => [...prev, newField]);
    setFormLayoutOrder((prev) => [...prev, newField.id]);
    setSelectedId(newField.id);
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: `sec-${Date.now()}`,
      title: "New Section",
      description: "",
      layout: "single",
      orderIndex: formSections.length,
      collapsible: false,
      border: true,
    };
    setFormSections((prev) => [...prev, newSection]);
    setFormLayoutOrder((prev) => [...prev, newSection.id]);
    setSelectedId(newSection.id);
  };

  const addHeading = () => {
    addField("heading", { label: "Heading", sectionId: lastSectionIdInOrder });
  };

  const addDivider = () => {
    addField("divider", { label: "—", sectionId: lastSectionIdInOrder });
  };

  const updateField = (fieldId: string, updates: Partial<WebFormField>) => {
    setFormFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setFormSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
  };

  const removeField = (fieldId: string) => {
    setFormFields((prev) => prev.filter((f) => f.id !== fieldId));
    setFormLayoutOrder((prev) => prev.filter((id) => id !== fieldId));
    if (selectedId === fieldId) setSelectedId(null);
  };

  const removeSection = (sectionId: string) => {
    setFormSections((prev) => prev.filter((s) => s.id !== sectionId));
    setFormLayoutOrder((prev) => prev.filter((id) => id !== sectionId));
    setFormFields((prev) => prev.map((f) => (f.sectionId === sectionId ? { ...f, sectionId: null } : f)));
    if (selectedId === sectionId) setSelectedId(null);
  };

  const duplicateField = (field: WebFormField) => {
    const copy: WebFormField = {
      ...field,
      id: `ff-${Date.now()}`,
      orderIndex: field.orderIndex + 1,
    };
    setFormFields((prev) => [...prev, copy]);
    const idx = formLayoutOrder.indexOf(field.id);
    const newOrder = [...formLayoutOrder];
    newOrder.splice(idx + 1, 0, copy.id);
    setFormLayoutOrder(newOrder);
    setSelectedId(copy.id);
  };

  const setLayoutOrder = (reordered: LayoutItem[]) => {
    const newOrder = reordered.map((i) => i.id);
    setFormLayoutOrder(newOrder);
    const { sections, fields } = syncOrderFromLayoutOrder(newOrder, formSections, formFields);
    setFormSections(sections);
    setFormFields(fields);
  };

  const handleSave = () => {
    updateForm(form.id, {
      formName,
      fieldsJSON: formFields,
      sectionsJSON: formSections,
      layoutOrder: formLayoutOrder,
      successMessage,
      redirectUrl,
      enableRecaptcha,
      publicSlug: publicSlug || undefined,
      webhookUrl: webhookUrl || undefined,
      submissionBehavior,
    });
    toast({ title: "Form saved", description: "Your changes have been saved." });
  };

  const publicUrl = publicSlug
    ? `${window.location.origin}/form/${publicSlug}`
    : `${window.location.origin}/form/${form.id}`;
  const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <div className="p-4 sm:p-6 max-w-[1800px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="text-lg font-bold border-none shadow-none px-0 h-auto max-w-md focus-visible:ring-0"
          placeholder="Form name"
        />
        {mod && <p className="text-xs text-muted-foreground">Module: {mod.name}</p>}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> {showPreview ? "Builder" : "Preview"}
          </Button>
          <Button size="sm" className="gradient-brand text-primary-foreground" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </div>

      {showPreview ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
          <div className="rounded-xl border border-border bg-card shadow-sm p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">{formName || "Form"}</h2>
            <p className="text-sm text-muted-foreground mb-6">Fill out the form below</p>
            <div className="space-y-6">
              {(() => {
                const sortedSections = [...formSections].sort((a, b) => a.orderIndex - b.orderIndex);
                const dataFields = formFields.filter((f) => f.fieldType !== "heading" && f.fieldType !== "divider");
                if (sortedSections.length === 0) {
                  const orderedIds = formLayoutOrder.filter((id) => dataFields.some((f) => f.id === id));
                  return (
                    <>
                      {orderedIds.map((id) => {
                        const field = formFields.find((f) => f.id === id)!;
                        if (!field || field.fieldType === "heading" || field.fieldType === "divider") return null;
                        return (
                        <div key={field.id} className="space-y-1.5">
                          <Label className="text-sm">{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                          {field.fieldType === "textarea" ? <Textarea placeholder={field.placeholder} disabled /> : field.fieldType === "select" || field.fieldType === "radio" ? (
                            <Select disabled><SelectTrigger><SelectValue placeholder={field.placeholder || "Select..."} /></SelectTrigger><SelectContent>{field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select>
                          ) : <Input type={field.fieldType === "email" ? "email" : field.fieldType === "number" ? "number" : "text"} placeholder={field.placeholder} disabled />}
                        </div>
                        );
                      })}
                    </>
                  );
                }
                return sortedSections.map((sec) => {
                  const startIdx = formLayoutOrder.indexOf(sec.id);
                  let endIdx = startIdx + 1;
                  while (endIdx < formLayoutOrder.length && !formSections.some((s) => s.id === formLayoutOrder[endIdx])) endIdx++;
                  const childIds = formLayoutOrder.slice(startIdx + 1, endIdx);
                  const children = childIds.map((id) => {
                    const field = formFields.find((f) => f.id === id)!;
                    if (field.fieldType === "heading") return <HeadingBlock key={field.id} text={field.label} size={field.headingSize} />;
                    if (field.fieldType === "divider") return <DividerBlock key={field.id} />;
                    return (
                      <div key={field.id} className="space-y-1.5">
                        <Label className="text-sm">{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                        {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                        {field.fieldType === "textarea" ? <Textarea placeholder={field.placeholder} disabled /> : field.fieldType === "select" || field.fieldType === "radio" ? (
                          <Select disabled><SelectTrigger><SelectValue placeholder={field.placeholder || "Select..."} /></SelectTrigger><SelectContent>{field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select>
                        ) : <Input type={field.fieldType === "email" ? "email" : field.fieldType === "number" ? "number" : "text"} placeholder={field.placeholder} disabled />}
                      </div>
                    );
                  });
                  return (
                    <SectionBlock key={sec.id} id={sec.id} title={sec.title} description={sec.description} layout={sec.layout} collapsible={sec.collapsible} border={sec.border}>
                      {children}
                    </SectionBlock>
                  );
                }).concat(
                  (() => {
                    const ungroupedIds = formLayoutOrder.filter((id) => {
                      const f = formFields.find((x) => x.id === id);
                      return f && !f.sectionId && f.fieldType !== "heading" && f.fieldType !== "divider";
                    });
                    if (ungroupedIds.length === 0) return [];
                    return [
                      <div key="_ungrouped" className="space-y-4">
                        {ungroupedIds.map((id) => {
                          const field = formFields.find((f) => f.id === id)!;
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <Label className="text-sm">{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                              {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                              {field.fieldType === "textarea" ? <Textarea placeholder={field.placeholder} disabled /> : field.fieldType === "select" || field.fieldType === "radio" ? (
                                <Select disabled><SelectTrigger><SelectValue placeholder={field.placeholder || "Select..."} /></SelectTrigger><SelectContent>{field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select>
                              ) : <Input type={field.fieldType === "email" ? "email" : field.fieldType === "number" ? "number" : "text"} placeholder={field.placeholder} disabled />}
                            </div>
                          );
                        })}
                      </div>,
                    ];
                  })()
                );
              })()}
              {formFields.length === 0 && formSections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Add sections and fields from the left panel</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Add Fields */}
          <div className="lg:col-span-3 space-y-2">
            <div className="rounded-xl border border-border bg-card p-4 sticky top-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Add Fields
              </h3>
              {FIELD_TYPE_CATEGORIES.map((cat) => {
                const items = byCategory[cat.id];
                if (!items.length) return null;
                return (
                  <Collapsible key={cat.id} defaultOpen={cat.id === "basic"} className="group/collapse">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-primary">
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapse:rotate-90" />
                      {cat.label}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-1.5 pl-6 py-2">
                        {items.map((ft) => {
                          const Icon = getIcon(ft.icon);
                          return (
                            <button
                              key={ft.type}
                              type="button"
                              onClick={() => addField(ft.type as FormFieldType, undefined)}
                              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-xs font-medium"
                            >
                              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                              <span className="truncate">{ft.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              <Collapsible defaultOpen className="group/collapse">
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-primary">
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapse:rotate-90" />
                  Sections
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-2 gap-1.5 pl-6 py-2">
                    <button
                      type="button"
                      onClick={addSection}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-xs font-medium"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      Section
                    </button>
                    <button
                      type="button"
                      onClick={addHeading}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-xs font-medium"
                    >
                      <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      Heading
                    </button>
                    <button
                      type="button"
                      onClick={addDivider}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-xs font-medium"
                    >
                      <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      Divider
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="mt-3 pt-3 border-t border-border">
                <Dialog open={customFieldOpen} onOpenChange={setCustomFieldOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2 border-dashed">
                      <Plus className="h-3.5 w-3.5" /> Custom Field
                    </Button>
                  </DialogTrigger>
                  <CustomFieldDialog
                    onAdd={(label, type, apiName, defaultValue, required) => {
                      addField(type as FormFieldType, {
                        label,
                        apiName,
                        defaultValue: defaultValue || undefined,
                        isRequired: required,
                      });
                      setCustomFieldOpen(false);
                    }}
                    onClose={() => setCustomFieldOpen(false)}
                  />
                </Dialog>
              </div>
            </div>
          </div>

          {/* Middle: Form Fields & Sections List */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-card p-4 min-h-[400px]">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Form Structure
              </h3>
              {layoutItems.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <p className="text-sm text-muted-foreground">Drag sections and fields here or add from the left panel</p>
                </div>
              ) : (
                <Reorder.Group axis="y" values={layoutItems} onReorder={setLayoutOrder} className="space-y-2">
                  <AnimatePresence>
                    {layoutItems.map((item) => {
                      if (item.type === "section") {
                        const { section } = item;
                        const isSelected = section.id === selectedId;
                        return (
                          <Reorder.Item
                            key={section.id}
                            value={item}
                            className="flex items-center gap-2 p-3 rounded-lg border-2 border-primary/30 bg-primary/5 cursor-grab active:cursor-grabbing transition-all list-none hover:border-primary/50"
                            style={{
                              borderColor: isSelected ? "hsl(var(--primary))" : undefined,
                              backgroundColor: isSelected ? "hsl(var(--primary) / 0.1)" : undefined,
                            }}
                            onClick={() => setSelectedId(section.id)}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-foreground truncate block uppercase tracking-wide">
                                {section.title}
                              </span>
                              {section.description && (
                                <span className="text-[10px] text-muted-foreground truncate block">{section.description}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                              title="Remove section"
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </Reorder.Item>
                        );
                      }
                      const { field } = item;
                      const config = FIELD_TYPES.find((f) => f.type === field.fieldType);
                      const Icon = config ? getIcon(config.icon) : field.fieldType === "heading" ? Type : field.fieldType === "divider" ? Minus : getIcon("Type");
                      const isSelected = field.id === selectedId;
                      const isBlock = field.fieldType === "heading" || field.fieldType === "divider";
                      return (
                        <Reorder.Item
                          key={field.id}
                          value={item}
                          className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing transition-all list-none hover:border-primary/30 hover:bg-muted/30"
                          style={{
                            borderColor: isSelected ? "hsl(var(--primary))" : undefined,
                            backgroundColor: isSelected ? "hsl(var(--primary) / 0.06)" : undefined,
                          }}
                          onClick={() => setSelectedId(field.id)}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate block">
                              {field.fieldType === "heading" ? field.label || "Heading" : field.fieldType === "divider" ? "Divider" : field.label}
                            </span>
                            {!isBlock && (field.mappedFieldKey || field.apiName) && (
                              <span className="text-[10px] text-muted-foreground">→ {field.mappedFieldKey || field.apiName}</span>
                            )}
                          </div>
                          {!isBlock && (
                            <div className="flex items-center gap-1 shrink-0">
                              {field.isRequired && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">Required</Badge>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicateField(field); }} title="Duplicate">
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeField(field.id); }} title="Delete">
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          )}
                          {isBlock && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); removeField(field.id); }} title="Delete">
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </Reorder.Item>
                      );
                    })}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </div>
          </div>

          {/* Right: Field / Section / Form Settings */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden sticky top-6">
              <Tabs value={selectedSection ? "section" : selectedField ? "field" : "settings"} className="w-full">
                <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-auto p-0">
                  <TabsTrigger value="field" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary" disabled={!selectedField}>
                    Field Settings
                  </TabsTrigger>
                  <TabsTrigger value="section" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary" disabled={!selectedSection}>
                    Section Settings
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1 rounded-none text-xs py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary" onClick={() => setSelectedId(null)}>
                    Form Settings
                  </TabsTrigger>
                </TabsList>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  <TabsContent value="field" className="mt-0 space-y-4">
                    {selectedField && (
                      selectedField.fieldType === "heading" || selectedField.fieldType === "divider" ? (
                        <HeadingDividerSettings field={selectedField} onUpdate={(u) => updateField(selectedField.id, u)} />
                      ) : (
                        <FieldSettingsPanel
                          field={selectedField}
                          allFields={formFields}
                          moduleFields={moduleFields}
                          onUpdate={(updates) => updateField(selectedField.id, updates)}
                        />
                      )
                    )}
                  </TabsContent>
                  <TabsContent value="section" className="mt-0 space-y-4">
                    {selectedSection && (
                      <SectionSettingsPanel
                        section={selectedSection}
                        onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="settings" className="mt-0 space-y-4">
                    <div>
                      <Label className="text-xs">Success message</Label>
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
                        placeholder="https://..."
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

                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Zap className="h-4 w-4" /> Submission behavior
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Create CRM record</Label>
                          <Switch
                            checked={submissionBehavior.createRecord}
                            onCheckedChange={(v) =>
                              setSubmissionBehavior((s) => ({ ...s, createRecord: v }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Send email</Label>
                          <Switch
                            checked={!!submissionBehavior.sendEmail}
                            onCheckedChange={(v) =>
                              setSubmissionBehavior((s) => ({ ...s, sendEmail: v ? true : undefined }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Send WhatsApp</Label>
                          <Switch
                            checked={!!submissionBehavior.sendWhatsApp}
                            onCheckedChange={(v) =>
                              setSubmissionBehavior((s) => ({ ...s, sendWhatsApp: v ? true : undefined }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Assign owner</Label>
                          <Switch
                            checked={!!submissionBehavior.assignOwner}
                            onCheckedChange={(v) =>
                              setSubmissionBehavior((s) => ({ ...s, assignOwner: v ? "" : undefined }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1"><Zap className="h-3 w-3" /> Trigger automation</Label>
                          <Switch
                            checked={!!submissionBehavior.triggerAutomation}
                            onCheckedChange={(v) =>
                              setSubmissionBehavior((s) => ({ ...s, triggerAutomation: v ? "" : undefined }))
                            }
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Globe className="h-4 w-4" /> Form sharing
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 space-y-3">
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Public link</Label>
                          <Input
                            value={publicSlug}
                            onChange={(e) => setPublicSlug(e.target.value)}
                            placeholder="e.g. lead-capture"
                            className="mt-1 font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">/form/{publicSlug || form.id}</p>
                        </div>
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Code className="h-3 w-3" /> Embed (iframe)</Label>
                          <pre className="mt-1 rounded bg-muted p-2 text-[10px] font-mono overflow-x-auto">
                            {iframeCode}
                          </pre>
                        </div>
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Webhook className="h-3 w-3" /> Webhook URL</Label>
                          <Input
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-1 font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">POST submission payload to this URL</p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
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

function SectionSettingsPanel({ section, onUpdate }: { section: FormSection; onUpdate: (u: Partial<FormSection>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Section title</Label>
        <Input value={section.title} onChange={(e) => onUpdate({ title: e.target.value })} className="mt-1" placeholder="e.g. Personal Details" />
      </div>
      <div>
        <Label className="text-xs">Description (optional)</Label>
        <Textarea value={section.description || ""} onChange={(e) => onUpdate({ description: e.target.value })} className="mt-1" rows={2} placeholder="Brief description" />
      </div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={section.layout} onValueChange={(v: "single" | "two") => onUpdate({ layout: v })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single column</SelectItem>
            <SelectItem value="two">Two columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Collapsible</Label>
        <Switch checked={section.collapsible ?? false} onCheckedChange={(v) => onUpdate({ collapsible: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show border</Label>
        <Switch checked={section.border !== false} onCheckedChange={(v) => onUpdate({ border: v })} />
      </div>
    </div>
  );
}

function HeadingDividerSettings({ field, onUpdate }: { field: WebFormField; onUpdate: (u: Partial<WebFormField>) => void }) {
  if (field.fieldType === "divider") return <p className="text-sm text-muted-foreground">Divider has no editable settings.</p>;
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Heading text</Label>
        <Input value={field.label || ""} onChange={(e) => onUpdate({ label: e.target.value })} className="mt-1" placeholder="e.g. Customer Information" />
      </div>
      <div>
        <Label className="text-xs">Size</Label>
        <Select value={field.headingSize || "md"} onValueChange={(v: "sm" | "md" | "lg") => onUpdate({ headingSize: v })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function FieldSettingsPanel({
  field,
  allFields,
  moduleFields,
  onUpdate,
}: {
  field: WebFormField;
  allFields: WebFormField[];
  moduleFields: { id: string; label: string; fieldKey?: string }[];
  onUpdate: (u: Partial<WebFormField>) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const config = FIELD_TYPES.find((f) => f.type === field.fieldType);
  const supportsOptions = config?.supportsOptions;
  const otherFields = allFields.filter((f) => f.id !== field.id);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Label</Label>
        <Input
          value={field.label}
          onChange={(e) => {
            onUpdate({ label: e.target.value });
            if (!field.apiName) onUpdate({ apiName: labelToApiName(e.target.value) });
          }}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">API name</Label>
        <Input
          value={field.apiName || ""}
          onChange={(e) => onUpdate({ apiName: e.target.value })}
          placeholder={labelToApiName(field.label)}
          className="mt-1 font-mono text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">Placeholder</Label>
        <Input
          value={field.placeholder || ""}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Help text</Label>
        <Input
          value={field.helpText || ""}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          placeholder="Shown below the field"
          className="mt-1"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Required</Label>
        <Switch checked={field.isRequired} onCheckedChange={(v) => onUpdate({ isRequired: v })} />
      </div>
      <div>
        <Label className="text-xs">Default value</Label>
        <Input
          value={String(field.defaultValue ?? "")}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          className="mt-1"
        />
      </div>
      {moduleFields.length > 0 && (
        <div>
          <Label className="text-xs">Map to CRM field</Label>
          <Select
            value={field.mappedFieldKey || "none"}
            onValueChange={(v) => onUpdate({ mappedFieldKey: v === "none" ? undefined : v })}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No mapping —</SelectItem>
              {moduleFields.map((mf) => (
                <SelectItem key={mf.id} value={mf.fieldKey || mf.id}>
                  {mf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {supportsOptions && (
        <div>
          <Label className="text-xs">Options (one per line)</Label>
          <Textarea
            value={(field.options || []).join("\n")}
            onChange={(e) => onUpdate({ options: e.target.value.split("\n").filter(Boolean) })}
            className="mt-1 text-xs"
            rows={4}
          />
        </div>
      )}

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings2 className="h-3.5 w-3.5" /> Advanced
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {(config?.supportsMinMax || field.fieldType === "text" || field.fieldType === "textarea") && (
            <>
              <div>
                <Label className="text-xs">Min length</Label>
                <Input
                  type="number"
                  value={field.minLength ?? ""}
                  onChange={(e) => onUpdate({ minLength: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max length</Label>
                <Input
                  type="number"
                  value={field.maxLength ?? ""}
                  onChange={(e) => onUpdate({ maxLength: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  className="mt-1"
                />
              </div>
            </>
          )}
          {(config?.supportsRegex || true) && (
            <>
              <div>
                <Label className="text-xs">Regex validation</Label>
                <Input
                  value={field.regex || ""}
                  onChange={(e) => onUpdate({ regex: e.target.value })}
                  placeholder="e.g. ^[A-Z]+$"
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Regex error message</Label>
                <Input
                  value={field.regexMessage || ""}
                  onChange={(e) => onUpdate({ regexMessage: e.target.value })}
                  className="mt-1"
                />
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Unique value</Label>
            <Switch
              checked={field.isUnique ?? false}
              onCheckedChange={(v) => onUpdate({ isUnique: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Hidden field</Label>
            <Switch
              checked={field.isHidden ?? false}
              onCheckedChange={(v) => onUpdate({ isHidden: v })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div>
        <Label className="text-xs">Conditional logic</Label>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          e.g. Show this field when another field equals a value
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() =>
            onUpdate({
              conditionalRules: [
                ...(field.conditionalRules || []),
                { fieldId: "", operator: "equals", value: "", action: "show" },
              ],
            })
          }
        >
          <Plus className="h-3 w-3 mr-1" /> Add rule
        </Button>
        {field.conditionalRules?.map((rule, i) => (
          <div key={i} className="mt-2 p-2 rounded border border-border bg-muted/30 text-xs space-y-1">
            <span>IF </span>
            <Select
              value={rule.fieldId}
              onValueChange={(v) =>
                onUpdate({
                  conditionalRules: field.conditionalRules!.map((r, j) =>
                    j === i ? { ...r, fieldId: v } : r
                  ),
                })
              }
            >
              <SelectTrigger className="h-7"><SelectValue placeholder="Field" /></SelectTrigger>
              <SelectContent>
                {otherFields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={rule.operator}
              onValueChange={(v) =>
                onUpdate({
                  conditionalRules: field.conditionalRules!.map((r, j) =>
                    j === i ? { ...r, operator: v as any } : r
                  ),
                })
              }
            >
              <SelectTrigger className="h-7 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">equals</SelectItem>
                <SelectItem value="not_equals">not equals</SelectItem>
                <SelectItem value="contains">contains</SelectItem>
                <SelectItem value="empty">is empty</SelectItem>
                <SelectItem value="not_empty">is not empty</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={String(rule.value ?? "")}
              onChange={(e) =>
                onUpdate({
                  conditionalRules: field.conditionalRules!.map((r, j) =>
                    j === i ? { ...r, value: e.target.value } : r
                  ),
                })
              }
              placeholder="Value"
              className="h-7 mt-1"
            />
            <span className="block">THEN show this field</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomFieldDialog({
  onAdd,
  onClose,
}: {
  onAdd: (label: string, type: FormFieldType, apiName: string, defaultValue?: string, required?: boolean) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<FormFieldType>("text");
  const [apiName, setApiName] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [required, setRequired] = useState(false);

  const derivedApiName = apiName || labelToApiName(label);

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Custom Field</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-2">
        <div>
          <Label>Field label</Label>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (!apiName) setApiName(labelToApiName(e.target.value));
            }}
            placeholder="e.g. Loan Amount"
          />
        </div>
        <div>
          <Label>Field type</Label>
          <Select value={fieldType} onValueChange={(v) => setFieldType(v as FormFieldType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((ft) => (
                <SelectItem key={ft.type} value={ft.type}>{ft.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Field API name</Label>
          <Input
            value={derivedApiName}
            onChange={(e) => setApiName(e.target.value)}
            placeholder="e.g. loan_amount"
            className="font-mono"
          />
        </div>
        <div>
          <Label>Default value (optional)</Label>
          <Input value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Required</Label>
          <Switch checked={required} onCheckedChange={setRequired} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 gradient-brand text-primary-foreground"
            onClick={() => {
              if (!label.trim()) return;
              onAdd(label, fieldType, derivedApiName, defaultValue || undefined, required);
            }}
            disabled={!label.trim()}
          >
            Add field
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
