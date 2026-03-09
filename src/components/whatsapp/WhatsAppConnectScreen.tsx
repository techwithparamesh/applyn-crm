import { useState } from 'react';
import { MessageCircle, Plug, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface WhatsAppConnectScreenProps {
  onConnect: (phoneNumberId: string, businessAccountId: string, accessToken: string, displayPhoneNumber: string) => Promise<any>;
}

export function WhatsAppConnectScreen({ onConnect }: WhatsAppConnectScreenProps) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumberId || !businessAccountId || !accessToken || !displayPhone) return;
    setConnecting(true);
    await onConnect(phoneNumberId, businessAccountId, accessToken, displayPhone);
    setConnecting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-background p-6">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Connect WhatsApp Business</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Connect your WhatsApp Business account to start messaging customers directly from your CRM.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: 'Instant messaging' },
            { icon: ShieldCheck, label: 'Secure & encrypted' },
            { icon: Plug, label: 'CRM integration' },
          ].map(({ icon: Icon, label }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-3 text-center">
                <Icon className="h-5 w-5 mx-auto text-emerald-600 mb-1.5" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayPhone" className="text-sm">Display Phone Number</Label>
              <Input id="displayPhone" value={displayPhone} onChange={e => setDisplayPhone(e.target.value)} placeholder="+1 555-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumberId" className="text-sm">Phone Number ID</Label>
              <Input id="phoneNumberId" value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="From Meta Developer Console" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessAccountId" className="text-sm">Business Account ID</Label>
              <Input id="businessAccountId" value={businessAccountId} onChange={e => setBusinessAccountId(e.target.value)} placeholder="WhatsApp Business Account ID" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessToken" className="text-sm">Access Token</Label>
              <Input id="accessToken" type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Permanent access token" />
            </div>
            <Button onClick={handleSubmit} disabled={connecting || !phoneNumberId || !businessAccountId || !accessToken || !displayPhone} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {connecting ? 'Connecting...' : 'Connect WhatsApp'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          You'll need a Meta Business account and WhatsApp Business API access.{' '}
          <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
            Learn more →
          </a>
        </p>
      </div>
    </div>
  );
}
