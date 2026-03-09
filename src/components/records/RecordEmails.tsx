import { useState } from 'react';
import { format } from 'date-fns';
import { Send, Mail, ArrowUpRight, ArrowDownLeft, Link2, Unlink, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SyncedEmail } from '@/lib/email-sync-types';
import { useToast } from '@/hooks/use-toast';
import { useActiveEmailAccount } from '@/hooks/useRecordEmails';
import { useSendEmail } from '@/hooks/useEmailSync';

interface EmailComposerProps {
  recipientEmail: string;
  onSent: () => void;
}

export function EmailComposer({ recipientEmail, onSent }: EmailComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { account, loading: accountLoading } = useActiveEmailAccount();
  const { sendEmail } = useSendEmail();

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    if (!account) {
      toast({ title: 'No email account', description: 'Please connect an email account first.', variant: 'destructive' });
      return;
    }

    setSending(true);
    const result = await sendEmail({
      account_id: account.id,
      to: to.split(',').map(e => e.trim()).filter(Boolean),
      subject,
      body_html: `<div>${body.replace(/\n/g, '<br/>')}</div>`,
      body_text: body,
    });

    setSending(false);

    if (result) {
      setSubject('');
      setBody('');
      setIsOpen(false);
      onSent();
    }
  };

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)} className="gap-1.5" disabled={accountLoading || !account}>
        <Send className="h-3.5 w-3.5" /> {account ? 'Compose Email' : 'Connect Email First'}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">New Email</h4>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
      <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-sm" />
      <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-sm" />
      <Textarea placeholder="Write your message..." value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[100px] text-sm" />
      {account && (
        <p className="text-[10px] text-muted-foreground">Sending as {account.email_address}</p>
      )}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSend} className="gap-1.5" disabled={sending}>
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}

interface EmailHistoryProps {
  emails: SyncedEmail[];
  loading?: boolean;
  onUnlink?: (emailId: string) => void;
}

export function EmailHistory({ emails, loading, onUnlink }: EmailHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-6">
        <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No emails linked to this record</p>
        <p className="text-xs text-muted-foreground mt-1">Emails will automatically link when synced</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {emails
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
        .map((email) => {
          const isOutgoing = email.direction === 'outgoing';
          const isExpanded = expanded === email.id;
          
          return (
            <div
              key={email.id}
              className="border-b border-border last:border-0 py-3 cursor-pointer hover:bg-muted/30 px-1 rounded-md transition-colors"
              onClick={() => setExpanded(isExpanded ? null : email.id)}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isOutgoing ? 'bg-primary/10' : 'bg-accent/10'}`}>
                  {isOutgoing
                    ? <ArrowUpRight className="h-3 w-3 text-primary" />
                    : <ArrowDownLeft className="h-3 w-3 text-accent" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{email.subject}</span>
                    {!email.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    {email.is_opened && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 text-green-600 border-green-600/30">
                        <Eye className="h-2.5 w-2.5" /> Opened
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span>{isOutgoing ? `To: ${(email.to_emails as string[])?.[0] || ''}` : `From: ${email.from_email}`}</span>
                    <span>·</span>
                    <span>{format(new Date(email.sent_at), 'MMM d, h:mm a')}</span>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      <div 
                        className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: email.body_html || email.body_text || '' }}
                      />
                      {onUnlink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlink(email.id);
                          }}
                        >
                          <Unlink className="h-3 w-3 mr-1" /> Unlink from record
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
