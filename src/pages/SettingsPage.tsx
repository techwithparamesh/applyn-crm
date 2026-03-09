import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Building2, Palette, Globe, CreditCard, Users, Check, Crown,
  Sparkles, Shield, Upload, Key, Plus, Copy, Trash2, Eye, EyeOff, UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useApiKeys } from '@/hooks/useApiKeys';
import { RoleManagement } from '@/components/RoleManagement';
import { UserManagement } from '@/components/UserManagement';
import { TeamManagement } from '@/components/TeamManagement';
import { PLANS, TIMEZONES, CURRENCIES, DATE_FORMATS, PlanTier } from '@/lib/workspace-types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PLAN_ICONS: Record<PlanTier, any> = { free: Sparkles, pro: Crown, enterprise: Shield };
const PLAN_COLORS: Record<PlanTier, string> = {
  free: 'border-border',
  pro: 'border-primary ring-1 ring-primary/20',
  enterprise: 'border-amber-500 ring-1 ring-amber-500/20',
};

export default function SettingsPage() {
  const { settings, subscription, updateSettings, changePlan } = useWorkspace();
  const { keys, loading: keysLoading, createKey, toggleKey, deleteKey } = useApiKeys();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const handleSave = () => toast({ title: 'Settings saved', description: 'Workspace settings updated successfully.' });

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    const key = await createKey(newKeyName.trim());
    if (key) {
      setNewKeyName('');
      setRevealedKeys((prev) => new Set([...prev, key.id]));
      toast({ title: 'API key created', description: 'Copy your key now — it won\'t be shown in full again.' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'API key copied to clipboard.' });
  };

  const maskKey = (key: string) => key.slice(0, 6) + '•'.repeat(20) + key.slice(-4);

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-records`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace, billing, and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />General</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
          <TabsTrigger value="teams" className="gap-1.5"><UsersRound className="h-3.5 w-3.5" />Teams</TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Roles</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5"><Key className="h-3.5 w-3.5" />API</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Billing</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace Info</CardTitle>
              <CardDescription>Basic details about your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Workspace Name</Label><Input value={settings.name} onChange={e => updateSettings({ name: e.target.value })} /></div>
                <div><Label>Subdomain</Label><div className="flex"><Input value={settings.subdomain} onChange={e => updateSettings({ subdomain: e.target.value })} className="rounded-r-none" /><span className="inline-flex items-center px-3 bg-muted border border-l-0 border-input rounded-r-lg text-xs text-muted-foreground">.applyn.app</span></div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regional Settings</CardTitle>
              <CardDescription>Configure timezone, currency, and date format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={v => updateSettings({ timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={settings.currency} onValueChange={v => updateSettings({ currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={v => updateSettings({ dateFormat: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DATE_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end"><Button onClick={handleSave} className="gradient-brand text-primary-foreground">Save Changes</Button></div>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo & Branding</CardTitle>
              <CardDescription>Customize your workspace appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Workspace Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl gradient-brand flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">{settings.name.charAt(0)}</span>
                  </div>
                  <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1.5" />Upload Logo</Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label>Brand Color</Label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="color" value="#7C3AED" className="h-10 w-10 rounded-lg border border-border cursor-pointer" onChange={() => {}} />
                  <Input value={settings.brandColor} onChange={e => updateSettings({ brandColor: e.target.value })} className="max-w-[200px]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end"><Button onClick={handleSave} className="gradient-brand text-primary-foreground">Save Changes</Button></div>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>Manage API keys for external integrations. Keys authenticate requests to the REST API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Zapier, Website)"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                />
                <Button onClick={handleCreateKey} disabled={!newKeyName.trim()} className="gradient-brand text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1.5" /> Create Key
                </Button>
              </div>

              <Separator />

              {keysLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading keys...</p>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys yet. Create one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {keys.map((k) => {
                    const revealed = revealedKeys.has(k.id);
                    return (
                      <div key={k.id} className="rounded-lg border border-border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{k.key_name}</span>
                            <Badge variant={k.is_active ? 'default' : 'secondary'} className="text-[10px]">
                              {k.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch checked={k.is_active} onCheckedChange={(v) => toggleKey(k.id, v)} />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteKey(k.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted px-3 py-1.5 rounded-md font-mono text-foreground">
                            {revealed ? k.api_key : maskKey(k.api_key)}
                          </code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevealedKeys((prev) => {
                            const next = new Set(prev);
                            revealed ? next.delete(k.id) : next.add(k.id);
                            return next;
                          })}>
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(k.api_key)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex gap-4 text-[10px] text-muted-foreground">
                          <span>Created: {format(new Date(k.created_at), 'MMM d, yyyy')}</span>
                          {k.last_used_at && <span>Last used: {format(new Date(k.last_used_at), 'MMM d, h:mm a')}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Documentation</CardTitle>
              <CardDescription>Use these endpoints to integrate with external systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-accent text-accent-foreground text-[10px]">GET</Badge>
                    <code className="text-xs font-mono text-foreground">/api-records</code>
                  </div>
                  <p className="text-xs text-muted-foreground">List records. Query params: <code>module_id</code>, <code>limit</code>, <code>offset</code></p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-blue text-primary-foreground text-[10px]">POST</Badge>
                    <code className="text-xs font-mono text-foreground">/api-records</code>
                  </div>
                  <p className="text-xs text-muted-foreground">Create record. Body: <code>{`{ "module_id": "1", "values": {...} }`}</code></p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-purple text-primary-foreground text-[10px]">PUT</Badge>
                    <code className="text-xs font-mono text-foreground">/api-records/:id</code>
                  </div>
                  <p className="text-xs text-muted-foreground">Update record. Body: <code>{`{ "values": {...} }`}</code></p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[10px]">DELETE</Badge>
                    <code className="text-xs font-mono text-foreground">/api-records/:id</code>
                  </div>
                  <p className="text-xs text-muted-foreground">Delete a record by ID</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold">Base URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono text-foreground break-all">{baseUrl}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(baseUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Authentication</Label>
                <p className="text-xs text-muted-foreground mt-1">Include your API key in the <code>X-API-Key</code> header with every request.</p>
                <div className="mt-2 rounded-lg bg-muted/50 p-3">
                  <code className="text-xs font-mono text-foreground whitespace-pre">{`curl ${baseUrl} \\
  -H "X-API-Key: your_api_key_here"`}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>
                You're on the <span className="font-semibold text-foreground">{PLANS.find(p => p.id === subscription.planId)?.name}</span> plan
                <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'} className="ml-2 text-[10px]">{subscription.status}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} – {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const Icon = PLAN_ICONS[plan.id];
              const isCurrent = subscription.planId === plan.id;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`relative overflow-hidden transition-all ${PLAN_COLORS[plan.id]} ${isCurrent ? 'bg-primary/[0.02]' : ''}`}>
                    {plan.id === 'pro' && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">Popular</div>}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${plan.id === 'enterprise' ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                          <Icon className={`h-4.5 w-4.5 ${plan.id === 'enterprise' ? 'text-amber-600' : 'text-primary'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          <p className="text-lg font-bold text-foreground">${plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-accent shrink-0" />{f}</li>
                        ))}
                      </ul>
                      <Button
                        variant={isCurrent ? 'outline' : plan.id === 'pro' ? 'default' : 'outline'}
                        className={`w-full ${!isCurrent && plan.id === 'pro' ? 'gradient-brand text-primary-foreground' : ''}`}
                        disabled={isCurrent}
                        onClick={() => { changePlan(plan.id); toast({ title: `Switched to ${plan.name}`, description: 'Your plan has been updated.' }); }}
                      >
                        {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* TEAMS */}
        <TabsContent value="teams">
          <TeamManagement />
        </TabsContent>

        {/* ROLES & PERMISSIONS */}
        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
