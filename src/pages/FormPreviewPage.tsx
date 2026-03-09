import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebForms } from "@/hooks/useWebForms";
import { useToast } from "@/hooks/use-toast";

export default function FormPreviewPage() {
  const { formId } = useParams();
  const { toast } = useToast();
  const { forms, submitForm } = useWebForms();
  const form = forms.find((f) => f.id === formId);

  const [values, setValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!form) {
    return <div className="p-6 text-center text-muted-foreground">Form not found.</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    for (const field of form.fieldsJSON) {
      if (field.isRequired && !values[field.id]) {
        toast({ title: "Required field", description: `${field.label} is required.`, variant: "destructive" });
        return;
      }
    }
    submitForm(form.id, values);
    setSubmitted(true);
    toast({ title: "Form submitted", description: "Your submission has been recorded." });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <div className="rounded-xl border border-border bg-card shadow-card p-8">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Submitted!</h2>
            <p className="text-sm text-muted-foreground">{form.successMessage}</p>
            {form.redirectUrl && (
              <Button variant="link" className="mt-4" onClick={() => window.open(form.redirectUrl, '_blank')}>
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
        <div className="rounded-xl border border-border bg-card shadow-card p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">{form.formName}</h2>
          <p className="text-sm text-muted-foreground mb-6">Please fill out the form below</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.fieldsJSON.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-sm">
                  {field.label}
                  {field.isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.fieldType === 'textarea' ? (
                  <Textarea
                    value={values[field.id] || ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                ) : field.fieldType === 'select' ? (
                  <Select value={values[field.id] || ''} onValueChange={(v) => setValues({ ...values, [field.id]: v })}>
                    <SelectTrigger><SelectValue placeholder={field.placeholder || 'Select...'} /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.fieldType}
                    value={values[field.id] || ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

            {form.enableRecaptcha && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Protected by reCAPTCHA</span>
              </div>
            )}

            <Button type="submit" className="w-full gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
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
