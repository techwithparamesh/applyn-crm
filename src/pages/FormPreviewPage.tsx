import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWebForms } from "@/hooks/useWebForms";
import { useToast } from "@/hooks/use-toast";
import { WebFormField, FormFieldType, FormSection } from "@/lib/form-types";
import { SectionBlock } from "@/components/forms/SectionBlock";
import { HeadingBlock } from "@/components/forms/HeadingBlock";
import { DividerBlock } from "@/components/forms/DividerBlock";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{10,}$/;

function validateField(field: WebFormField, value: any): string | null {
  if (field.fieldType === "heading" || field.fieldType === "divider") return null;
  const str = value != null ? String(value).trim() : "";
  if (field.isRequired && !str) return `${field.label} is required.`;
  if (!str && !field.isRequired) return null;
  if (field.fieldType === "email" && str && !EMAIL_REGEX.test(str)) return "Enter a valid email.";
  if (field.fieldType === "phone" && str && !PHONE_REGEX.test(str)) return "Enter a valid phone number.";
  if (field.fieldType === "number" || field.fieldType === "currency" || field.fieldType === "percentage" || field.fieldType === "score") {
    const n = Number(value);
    if (str && isNaN(n)) return "Enter a valid number.";
    if (field.minLength != null && n < field.minLength) return `Minimum value is ${field.minLength}.`;
    if (field.maxLength != null && n > field.maxLength) return `Maximum value is ${field.maxLength}.`;
  }
  if ((field.fieldType === "text" || field.fieldType === "textarea") && str) {
    if (field.minLength != null && str.length < field.minLength) return `Min length is ${field.minLength}.`;
    if (field.maxLength != null && str.length > field.maxLength) return `Max length is ${field.maxLength}.`;
  }
  if (field.regex && str) {
    try {
      const re = new RegExp(field.regex);
      if (!re.test(str)) return field.regexMessage || "Invalid format.";
    } catch {
      return "Invalid validation pattern.";
    }
  }
  return null;
}

function getVisibleFields(fields: WebFormField[], values: Record<string, any>): WebFormField[] {
  return fields.filter((field) => {
    if (field.isHidden) return false;
    if (!field.conditionalRules?.length) return true;
    for (const rule of field.conditionalRules) {
      const otherValue = values[rule.fieldId];
      const match =
        rule.operator === "equals"
          ? otherValue == rule.value
          : rule.operator === "not_equals"
            ? otherValue != rule.value
            : rule.operator === "contains"
              ? String(otherValue ?? "").includes(String(rule.value ?? ""))
              : rule.operator === "empty"
                ? otherValue == null || String(otherValue).trim() === ""
                : rule.operator === "not_empty"
                  ? otherValue != null && String(otherValue).trim() !== ""
                  : true;
      if (match && rule.action === "hide") return false;
      if (match && rule.action === "show") return true;
    }
    return true;
  });
}

export default function FormPreviewPage() {
  const { formId } = useParams();
  const { toast } = useToast();
  const { forms, submitForm } = useWebForms();
  const form = useMemo(
    () => forms.find((f) => f.id === formId || f.publicSlug === formId),
    [forms, formId]
  );

  const [values, setValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-muted-foreground">
        Form not found.
      </div>
    );
  }

  const dataFields = form.fieldsJSON.filter((f) => f.fieldType !== "heading" && f.fieldType !== "divider");
  const visibleFields = getVisibleFields(dataFields, values);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const field of visibleFields) {
      const val = values[field.id];
      const err = validateField(field, val);
      if (err) {
        toast({ title: "Validation", description: err, variant: "destructive" });
        return;
      }
    }
    const payload: Record<string, any> = {};
    for (const field of dataFields) {
      const key = field.mappedFieldKey || field.apiName || field.id;
      if (values[field.id] !== undefined) payload[key] = values[field.id];
    }
    submitForm(form.id, payload);
    setSubmitted(true);
    toast({ title: "Form submitted", description: "Your submission has been recorded." });
  };

  const setValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="rounded-xl border border-border bg-card shadow-sm p-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Submitted!</h2>
            <p className="text-sm text-muted-foreground">{form.successMessage}</p>
            {form.redirectUrl && (
              <Button variant="link" className="mt-4" onClick={() => window.open(form.redirectUrl, "_blank")}>
                Continue →
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
        <div className="rounded-xl border border-border bg-card shadow-sm p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">{form.formName}</h2>
          <p className="text-sm text-muted-foreground mb-6">Please fill out the form below</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(() => {
              const sections = (form.sectionsJSON || []).slice().sort((a: FormSection, b: FormSection) => a.orderIndex - b.orderIndex);
              const layoutOrder = form.layoutOrder || form.fieldsJSON.map((f) => f.id);
              if (sections.length === 0) {
                return visibleFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-sm">{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                    {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                    <FormFieldInput field={field} value={values[field.id]} onChange={(v) => setValue(field.id, v)} />
                  </div>
                ));
              }
              const result: React.ReactNode[] = [];
              for (const sec of sections) {
                const startIdx = layoutOrder.indexOf(sec.id);
                let endIdx = startIdx + 1;
                while (endIdx < layoutOrder.length && !sections.some((s: FormSection) => s.id === layoutOrder[endIdx])) endIdx++;
                const childIds = layoutOrder.slice(startIdx + 1, endIdx);
                const children = childIds.map((id) => {
                  const field = form.fieldsJSON.find((f) => f.id === id);
                  if (!field) return null;
                  if (field.fieldType === "heading") return <HeadingBlock key={field.id} text={field.label} size={field.headingSize} />;
                  if (field.fieldType === "divider") return <DividerBlock key={field.id} />;
                  if (!visibleFields.some((v) => v.id === field.id)) return null;
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <Label className="text-sm">{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                      <FormFieldInput field={field} value={values[field.id]} onChange={(v) => setValue(field.id, v)} />
                    </div>
                  );
                }).filter(Boolean);
                result.push(
                  <SectionBlock key={sec.id} id={sec.id} title={sec.title} description={sec.description} layout={sec.layout} collapsible={sec.collapsible} border={sec.border}>
                    {children}
                  </SectionBlock>
                );
              }
              const ungroupedIds = layoutOrder.filter((id) => {
                const f = form.fieldsJSON.find((x) => x.id === id);
                return f && !f.sectionId && f.fieldType !== "heading" && f.fieldType !== "divider";
              });
              ungroupedIds.forEach((id) => {
                const field = form.fieldsJSON.find((f) => f.id === id)!;
                if (!visibleFields.some((v) => v.id === field.id)) return;
                result.push(
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-sm">{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                    {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                    <FormFieldInput field={field} value={values[field.id]} onChange={(v) => setValue(field.id, v)} />
                  </div>
                );
              });
              return result;
            })()}

            {form.enableRecaptcha && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Protected by reCAPTCHA</span>
              </div>
            )}

            <Button type="submit" className="w-full gradient-brand text-primary-foreground shadow-sm hover:opacity-90">
              Submit
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <span className="text-[10px] text-muted-foreground">Powered by Applyn CRM</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FormFieldInput({
  field,
  value,
  onChange,
}: {
  field: WebFormField;
  value: any;
  onChange: (v: any) => void;
}) {
  const type = field.fieldType;

  if (type === "textarea" || type === "richtext") {
    return (
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength ?? undefined}
      />
    );
  }

  if (type === "select") {
    return (
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "multiselect") {
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    const toggle = (opt: string) => {
      const next = arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt];
      onChange(next);
    };
    return (
      <div className="space-y-2">
        {field.options?.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <Checkbox
              id={`${field.id}-${opt}`}
              checked={arr.includes(opt)}
              onCheckedChange={() => toggle(opt)}
            />
            <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  if (type === "radio") {
    return (
      <RadioGroup value={value ?? ""} onValueChange={onChange} className="space-y-2">
        {field.options?.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
            <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.id}
          checked={!!value}
          onCheckedChange={(c) => onChange(!!c)}
        />
        <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
          {field.placeholder || "Yes"}
        </Label>
      </div>
    );
  }

  if (type === "date") {
    return (
      <Input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (type === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (type === "time") {
    return (
      <Input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (type === "number" || type === "currency" || type === "percentage" || type === "score" || type === "rating") {
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        placeholder={field.placeholder}
        min={field.minLength}
        max={field.maxLength}
      />
    );
  }

  if (type === "url") {
    return (
      <Input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (type === "password") {
    return (
      <Input
        type="password"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (type === "file" || type === "image") {
    return (
      <Input
        type="file"
        accept={type === "image" ? "image/*" : undefined}
        onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
      />
    );
  }

  // text, email, phone, address, location, user, lookup, autonumber, created_at, updated_at
  const inputType = type === "email" ? "email" : type === "phone" ? "tel" : "text";
  return (
    <Input
      type={inputType}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      maxLength={field.maxLength ?? undefined}
    />
  );
}
