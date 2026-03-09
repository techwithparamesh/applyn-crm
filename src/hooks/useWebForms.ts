import { useState, useCallback } from 'react';
import { WebForm, FormSubmission, WebFormField, FormFieldType } from '@/lib/form-types';
import { mockWebForms, mockFormSubmissions } from '@/lib/mock-forms';

export function useWebForms() {
  const [forms, setForms] = useState<WebForm[]>(mockWebForms);
  const [submissions, setSubmissions] = useState<FormSubmission[]>(mockFormSubmissions);

  const createForm = useCallback((form: Omit<WebForm, 'id' | 'tenantId' | 'createdAt'>) => {
    const newForm: WebForm = {
      ...form,
      id: `wf-${Date.now()}`,
      tenantId: 't1',
      createdAt: new Date().toISOString(),
    };
    setForms((prev) => [...prev, newForm]);
    return newForm;
  }, []);

  const updateForm = useCallback((formId: string, updates: Partial<WebForm>) => {
    setForms((prev) => prev.map((f) => f.id === formId ? { ...f, ...updates } : f));
  }, []);

  const deleteForm = useCallback((formId: string) => {
    setForms((prev) => prev.filter((f) => f.id !== formId));
  }, []);

  const toggleFormActive = useCallback((formId: string) => {
    setForms((prev) => prev.map((f) => f.id === formId ? { ...f, isActive: !f.isActive } : f));
  }, []);

  const submitForm = useCallback((formId: string, data: Record<string, any>) => {
    const submission: FormSubmission = {
      id: `fs-${Date.now()}`,
      tenantId: 't1',
      formId,
      data,
      createdAt: new Date().toISOString(),
    };
    setSubmissions((prev) => [submission, ...prev]);
    return submission;
  }, []);

  const getFormSubmissions = useCallback((formId: string) => {
    return submissions.filter((s) => s.formId === formId);
  }, [submissions]);

  return {
    forms,
    submissions,
    createForm,
    updateForm,
    deleteForm,
    toggleFormActive,
    submitForm,
    getFormSubmissions,
  };
}
