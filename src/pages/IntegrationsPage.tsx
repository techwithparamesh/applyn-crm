import { useState } from "react";
import { motion } from "framer-motion";
import { Plug, Mail, MessageCircle, Key, Webhook, Globe, CheckCircle2, Circle, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'communication' | 'api' | 'automation';
  isConnected: boolean;
  color: string;
}

const initialIntegrations: Integration[] = [
  { id: 'email', name: 'Email (SMTP/Gmail/Outlook)', description: 'Send and receive emails directly from the CRM', icon: Mail, category: 'communication', isConnected: true, color: '#EA4335' },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Send WhatsApp messages and templates to contacts', icon: MessageCircle, category: 'communication', isConnected: true, color: '#25D366' },
  { id: 'rest-api', name: 'REST API', description: 'Public API endpoints for external integrations', icon: Globe, category: 'api', isConnected: true, color: '#6366F1' },
  { id: 'api-keys', name: 'API Keys', description: 'Manage API keys for secure access', icon: Key, category: 'api', isConnected: true, color: '#F59E0B' },
  { id: 'webhooks', name: 'Webhooks', description: 'Send real-time event notifications to external services', icon: Webhook, category: 'automation', isConnected: false, color: '#8B5CF6' },
  { id: 'slack', name: 'Slack', description: 'Get CRM notifications and updates in Slack channels', icon: MessageCircle, category: 'communication', isConnected: false, color: '#4A154B' },
];

const CATEGORY_LABELS: Record<string, string> = {
  communication: 'Communication',
  api: 'API & Access',
  automation: 'Automation',
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [filter, setFilter] = useState<'all' | 'communication' | 'api' | 'automation'>('all');

  const filtered = filter === 'all' ? integrations : integrations.filter(i => i.category === filter);
  const grouped = Object.entries(
    filtered.reduce((acc, i) => {
      (acc[i.category] = acc[i.category] || []).push(i);
      return acc;
    }, {} as Record<string, Integration[]>)
  );

  const toggleConnection = (id: string) => {
    setIntegrations(integrations.map(i => {
      if (i.id !== id) return i;
      const next = !i.isConnected;
      toast.success(next ? `${i.name} connected` : `${i.name} disconnected`);
      return { ...i, isConnected: next };
    }));
  };

  const connectedCount = integrations.filter(i => i.isConnected).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{connectedCount} of {integrations.length} integrations active</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'communication', 'api', 'automation'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : CATEGORY_LABELS[f]}
          </button>
        ))}
      </div>

      {grouped.map(([category, items]) => (
        <div key={category}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{CATEGORY_LABELS[category]}</h2>
          <div className="space-y-3">
            {items.map((integration, i) => {
              const Icon = integration.icon;
              return (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${integration.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: integration.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-card-foreground">{integration.name}</p>
                      {integration.isConnected ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          <Circle className="h-3 w-3 mr-1" />Disconnected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={integration.isConnected}
                      onCheckedChange={() => toggleConnection(integration.id)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
