import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, Inbox, Star, Trash2, Search, Plus, ArrowLeft,
  Paperclip, Clock, RefreshCw, Settings2, Link2, Unlink,
  ArrowUpRight, ArrowDownLeft, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useEmailAccounts, useEmails, useSendEmail, useEmailAttachments } from "@/hooks/useEmailSync";
import { SyncedEmail, EmailThread } from "@/lib/email-sync-types";

type Folder = "inbox" | "sent" | "starred" | "all";

export default function EmailPage() {
  const { accounts, loading: accountsLoading, connectAccount, disconnectAccount, syncNow } = useEmailAccounts();
  const activeAccount = accounts.find((a) => a.is_active);
  const { emails, threads, loading: emailsLoading, searchQuery, setSearchQuery, markRead, toggleStar, deleteEmail, refetch } = useEmails(activeAccount?.id);
  const { sendEmail } = useSendEmail();

  const [folder, setFolder] = useState<Folder>("inbox");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<SyncedEmail | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast.success("Email account connected!");
      window.history.replaceState({}, "", "/email");
    }
  }, []);

  const filteredThreads = threads.filter((t) => {
    const lastEmail = t.emails[t.emails.length - 1];
    if (folder === "inbox") return t.emails.some((e) => e.direction === "incoming");
    if (folder === "sent") return t.emails.some((e) => e.direction === "outgoing");
    if (folder === "starred") return t.emails.some((e) => e.is_starred);
    return true;
  });

  const selectedThread = threads.find((t) => t.thread_id === selectedThreadId);

  const handleSend = async () => {
    if (!activeAccount || !to.trim() || !subject.trim()) {
      toast.error("Please fill in To and Subject fields");
      return;
    }
    await sendEmail({
      account_id: activeAccount.id,
      to: to.split(",").map((e) => e.trim()).filter(Boolean),
      cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
      subject,
      body_html: `<div>${body.replace(/\n/g, "<br/>")}</div>`,
      body_text: body,
      thread_id: replyTo?.thread_id || undefined,
    });
    setTo("");
    setCc("");
    setSubject("");
    setBody("");
    setReplyTo(null);
    setComposeOpen(false);
    refetch();
  };

  const handleSync = async () => {
    if (!activeAccount) return;
    setSyncing(true);
    await syncNow(activeAccount.id);
    await refetch();
    setSyncing(false);
  };

  const handleReply = (email: SyncedEmail) => {
    setReplyTo(email);
    setTo(email.direction === "incoming" ? email.from_email : email.to_emails.join(", "));
    setSubject(email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`);
    setBody("");
    setCc("");
    setComposeOpen(true);
  };

  const inboxCount = emails.filter((e) => e.direction === "incoming" && !e.is_read).length;
  const starredCount = emails.filter((e) => e.is_starred).length;

  const folders: { key: Folder; label: string; icon: any; count: number }[] = [
    { key: "inbox", label: "Inbox", icon: Inbox, count: inboxCount },
    { key: "sent", label: "Sent", icon: Send, count: 0 },
    { key: "starred", label: "Starred", icon: Star, count: starredCount },
    { key: "all", label: "All Mail", icon: Mail, count: 0 },
  ];

  // If no account connected, show connection page
  if (!accountsLoading && !activeAccount) {
    return <EmailConnectionPage accounts={accounts} onConnect={connectAccount} />;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-56 border-r border-border bg-card p-3 space-y-1 shrink-0">
        <Dialog open={composeOpen} onOpenChange={(v) => { setComposeOpen(v); if (!v) setReplyTo(null); }}>
          <DialogTrigger asChild>
            <Button className="w-full gradient-brand text-primary-foreground shadow-brand hover:opacity-90 mb-3">
              <Plus className="h-4 w-4 mr-2" /> Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{replyTo ? "Reply" : "New Email"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>To</Label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com" className="mt-1" />
              </div>
              <div>
                <Label>CC</Label>
                <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@email.com" className="mt-1" />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="mt-1" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." className="mt-1 min-h-[150px]" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Send className="h-3 w-3" />
                Sending as {activeAccount?.email_address}
              </div>
              <Button onClick={handleSend} className="w-full gradient-brand text-primary-foreground">
                <Send className="h-4 w-4 mr-2" /> Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {folders.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFolder(f.key); setSelectedThreadId(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              folder === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <f.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{f.label}</span>
            {f.count > 0 && <Badge variant="secondary" className="h-5 min-w-[20px] text-[10px] px-1.5">{f.count}</Badge>}
          </button>
        ))}

        <div className="pt-3 mt-3 border-t border-border space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Sync Now"}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </Button>
        </div>

        {activeAccount && (
          <div className="pt-4 border-t border-border mt-4">
            <div className="px-3 py-2 rounded-lg bg-muted/30">
              <p className="text-xs font-medium text-foreground truncate">{activeAccount.email_address}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{activeAccount.provider} • Connected</p>
              {activeAccount.last_sync_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Synced {formatDistanceToNow(new Date(activeAccount.last_sync_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thread List */}
      <div className={`${selectedThread ? "hidden lg:flex" : "flex"} flex-col flex-1 min-w-0 border-r border-border`}>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {emailsLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-6 w-6 mx-auto text-muted-foreground/40 animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading emails...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="py-16 text-center">
              <Mail className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No emails found</p>
            </div>
          ) : (
            filteredThreads.map((thread, i) => {
              const lastEmail = thread.emails[thread.emails.length - 1];
              const hasUnread = thread.emails.some((e) => !e.is_read);
              const isOutgoing = lastEmail.direction === "outgoing";

              return (
                <motion.button
                  key={thread.thread_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => {
                    setSelectedThreadId(thread.thread_id);
                    thread.emails.forEach((e) => { if (!e.is_read) markRead(e.id); });
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    selectedThreadId === thread.thread_id ? "bg-primary/5" : ""
                  } ${hasUnread ? "bg-primary/[0.03]" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(lastEmail.id); }}
                      className="shrink-0 mt-0.5"
                    >
                      <Star className={`h-4 w-4 ${lastEmail.is_starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${isOutgoing ? "bg-primary/10" : "bg-accent/10"}`}>
                            {isOutgoing ? <ArrowUpRight className="h-2.5 w-2.5 text-primary" /> : <ArrowDownLeft className="h-2.5 w-2.5 text-accent" />}
                          </div>
                          <p className={`text-sm truncate ${hasUnread ? "font-semibold text-foreground" : "text-foreground"}`}>
                            {isOutgoing ? `To: ${lastEmail.to_emails[0] || ""}` : lastEmail.from_email}
                          </p>
                          {thread.emails.length > 1 && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">{thread.emails.length}</Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(lastEmail.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${hasUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{thread.subject}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lastEmail.body_text?.slice(0, 100)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {lastEmail.is_opened && (
                          <span className="flex items-center gap-0.5 text-[9px] text-green-600">
                            <Eye className="h-3 w-3" /> Opened
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Thread Detail / Conversation View */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSelectedThreadId(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-semibold text-foreground flex-1 truncate">{selectedThread.subject}</h3>
            <Badge variant="outline" className="text-[10px]">{selectedThread.emails.length} message{selectedThread.emails.length > 1 ? "s" : ""}</Badge>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleReply(selectedThread.emails[selectedThread.emails.length - 1])}>
              <Send className="h-3.5 w-3.5" /> Reply
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4 max-w-3xl">
              {selectedThread.emails.map((email, idx) => (
                <ThreadEmailItem
                  key={email.id}
                  email={email}
                  isLast={idx === selectedThread.emails.length - 1}
                  onReply={() => handleReply(email)}
                  onDelete={() => { deleteEmail(email.id); if (selectedThread.emails.length <= 1) setSelectedThreadId(null); }}
                  onToggleStar={() => toggleStar(email.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Select a conversation to read</p>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-medium text-foreground">Connected Accounts</h4>
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{acc.email_address}</p>
                  <p className="text-xs text-muted-foreground capitalize">{acc.provider} • {acc.is_active ? "Active" : "Disconnected"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => { disconnectAccount(acc.id); }}
                >
                  <Unlink className="h-4 w-4 mr-1" /> Disconnect
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => connectAccount("gmail")} className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Add Gmail
              </Button>
              <Button variant="outline" size="sm" onClick={() => connectAccount("outlook")} className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Add Outlook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThreadEmailItem({
  email,
  isLast,
  onReply,
  onDelete,
  onToggleStar,
}: {
  email: SyncedEmail;
  isLast: boolean;
  onReply: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
}) {
  const [expanded, setExpanded] = useState(isLast);
  const { attachments } = useEmailAttachments(email.id);
  const isOutgoing = email.direction === "outgoing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${isOutgoing ? "bg-primary/10" : "gradient-brand"}`}>
          <span className="text-xs font-bold text-primary-foreground">
            {(isOutgoing ? email.to_emails[0] : email.from_email)?.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {isOutgoing ? `To: ${email.to_emails.join(", ")}` : email.from_email}
            </p>
            {isOutgoing && <Badge variant="outline" className="text-[10px]">Sent</Badge>}
            {email.is_opened && <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">Opened</Badge>}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {format(new Date(email.sent_at), "MMM d, yyyy h:mm a")}
            {email.cc_emails.length > 0 && <span> • CC: {email.cc_emails.join(", ")}</span>}
          </p>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{email.body_text?.slice(0, 150)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onToggleStar(); }}>
            <Star className={`h-4 w-4 ${email.is_starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-border pt-3">
            {email.body_html ? (
              <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.body_html }} />
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{email.body_text}</p>
            )}

            {attachments.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" /> Attachments ({attachments.length})
                </p>
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-xs">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">{att.file_name}</span>
                    <span className="text-muted-foreground">({(att.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onReply}>
                <Send className="h-3.5 w-3.5" /> Reply
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive gap-1.5" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function EmailConnectionPage({
  accounts,
  onConnect,
}: {
  accounts: any[];
  onConnect: (provider: "gmail" | "outlook") => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto">
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Connect Your Email</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your Gmail or Outlook account to sync emails and send messages directly from the CRM.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => onConnect("gmail")} className="w-full h-12 text-sm gap-2" variant="outline">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Connect Gmail
          </Button>
          <Button onClick={() => onConnect("outlook")} className="w-full h-12 text-sm gap-2" variant="outline">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.582a.793.793 0 0 1-.582.238h-8.572v-12.1h8.572c.23 0 .424.08.582.238.159.159.238.353.238.564zM13.916 6.585v12.1H.82a.793.793 0 0 1-.582-.238A.793.793 0 0 1 0 17.865V7.387c0-.211.08-.405.238-.564A.793.793 0 0 1 .82 6.585h13.096z"/><path fill="#0078D4" d="M13.916 2.8v3.786H7.592V2.036L6.88 2 0 5.59v12.826l.82.45 6.772-3.552V18.7h13.095V6.585L13.916 2.8z" opacity=".5"/></svg>
            Connect Outlook
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your email credentials are securely stored and encrypted. We use OAuth for authentication.
        </p>
      </motion.div>
    </div>
  );
}
