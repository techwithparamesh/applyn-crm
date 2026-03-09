import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { setApiTokenGetter } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PermissionProvider } from "@/components/PermissionProvider";
import Dashboard from "@/pages/Dashboard";
import ModulesPage from "@/pages/ModulesPage";
import ModuleDetailPage from "@/pages/ModuleDetailPage";
import RecordDetailPage from "@/pages/RecordDetailPage";
import TemplatesPage from "@/pages/TemplatesPage";
import PipelinesPage from "@/pages/PipelinesPage";
import AutomationsPage from "@/pages/AutomationsPage";
import AutomationBuilderPage from "@/pages/AutomationBuilderPage";
import RelationshipsPage from "@/pages/RelationshipsPage";
import FormsPage from "@/pages/FormsPage";
import FormBuilderPage from "@/pages/FormBuilderPage";
import FormPreviewPage from "@/pages/FormPreviewPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import TasksPage from "@/pages/TasksPage";
import EmailPage from "@/pages/EmailPage";
import WhatsAppPage from "@/pages/WhatsAppPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import ReportsPage from "@/pages/ReportsPage";
import ReportDetailPage from "@/pages/ReportDetailPage";
import SettingsPage from "@/pages/SettingsPage";
import DocsPage from "@/pages/DocsPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ApiTokenSetter() {
  useEffect(() => {
    setApiTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ApiTokenSetter />
          <PermissionProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/form/:formId" element={<FormPreviewPage />} />

              {/* Protected routes inside layout */}
              <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
              <Route path="/modules" element={<AppLayout><ModulesPage /></AppLayout>} />
              <Route path="/modules/:moduleId" element={<AppLayout><ModuleDetailPage /></AppLayout>} />
              <Route path="/modules/:moduleId/records/:recordId" element={<AppLayout><RecordDetailPage /></AppLayout>} />
              <Route path="/templates" element={<AppLayout><TemplatesPage /></AppLayout>} />
              <Route path="/pipelines" element={<AppLayout><PipelinesPage /></AppLayout>} />
              <Route path="/automations" element={<AppLayout><AutomationsPage /></AppLayout>} />
              <Route path="/automations/:automationId" element={<AppLayout><AutomationBuilderPage /></AppLayout>} />
              <Route path="/relationships" element={<AppLayout><RelationshipsPage /></AppLayout>} />
              <Route path="/forms" element={<AppLayout><FormsPage /></AppLayout>} />
              <Route path="/forms/:formId" element={<AppLayout><FormBuilderPage /></AppLayout>} />
              <Route path="/forms/:formId/preview" element={<AppLayout><FormPreviewPage /></AppLayout>} />
              <Route path="/tasks" element={<AppLayout><TasksPage /></AppLayout>} />
              <Route path="/email" element={<AppLayout><EmailPage /></AppLayout>} />
              <Route path="/whatsapp" element={<AppLayout><WhatsAppPage /></AppLayout>} />
              <Route path="/integrations" element={<AppLayout><IntegrationsPage /></AppLayout>} />
              <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
              <Route path="/reports/:reportId" element={<AppLayout><ReportDetailPage /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
              <Route path="/docs" element={<AppLayout><DocsPage /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PermissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
