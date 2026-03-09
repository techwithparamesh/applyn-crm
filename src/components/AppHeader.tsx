import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Check, X, UserPlus, GitBranch, Zap, FileText, CheckSquare, ArrowRight, LogOut, HelpCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/lib/notification-types';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

const TYPE_ICONS: Record<NotificationType, any> = {
  task_assigned: CheckSquare,
  record_assigned: UserPlus,
  stage_changed: GitBranch,
  automation_event: Zap,
  form_submitted: FileText,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  task_assigned: 'bg-blue-500/10 text-blue-600',
  record_assigned: 'bg-violet-500/10 text-violet-600',
  stage_changed: 'bg-amber-500/10 text-amber-600',
  automation_event: 'bg-emerald-500/10 text-emerald-600',
  form_submitted: 'bg-rose-500/10 text-rose-600',
};

export function AppHeader() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      {/* Search trigger */}
      <div className="flex-1 max-w-lg">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 h-9 rounded-md bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search records, modules... ⌘K</span>
        </button>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Notifications & User */}
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Help" onClick={() => navigate('/docs')}>
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" />Mark all read
                </button>
              )}
            </div>
            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center"><Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">No notifications</p></div>
              ) : (
                <div>
                  {notifications.map(n => {
                    const Icon = TYPE_ICONS[n.type];
                    const colorClass = TYPE_COLORS[n.type];
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/50 ${!n.isRead ? 'bg-primary/[0.03]' : ''}`}
                        onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); }}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}><Icon className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                          <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted"><X className="h-3 w-3" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {profile && (
          <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[140px]">
            {profile.name || profile.email}
          </span>
        )}

        <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground" title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
