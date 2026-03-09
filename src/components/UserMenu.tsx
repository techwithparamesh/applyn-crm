import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Settings,
  Users,
  UsersRound,
  Key,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useEffect } from 'react';

export function UserMenu() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, updateStatus } = useProfile();

  // Set online status on mount, offline on unmount
  useEffect(() => {
    if (profile) {
      updateStatus('online');

      const handleBeforeUnload = () => {
        // Use sendBeacon or sync update for offline
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`,
          JSON.stringify({ status: 'offline' })
        );
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [profile?.id]);

  const handleSignOut = async () => {
    if (profile) await updateStatus('offline');
    await signOut();
  };

  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full mx-1 mt-3 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted/80 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatar_url}
              status={profile.status}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start" side="top" sideOffset={8}>
        {/* Header */}
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatar_url}
              status={profile.status}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Member</Badge>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2.5 cursor-pointer">
            <User className="h-4 w-4 text-muted-foreground" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2.5 cursor-pointer">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Workspace Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings?tab=users')} className="gap-2.5 cursor-pointer">
            <Users className="h-4 w-4 text-muted-foreground" />
            Users
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings?tab=teams')} className="gap-2.5 cursor-pointer">
            <UsersRound className="h-4 w-4 text-muted-foreground" />
            Teams
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings?tab=api')} className="gap-2.5 cursor-pointer">
            <Key className="h-4 w-4 text-muted-foreground" />
            API Keys
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings?tab=billing')} className="gap-2.5 cursor-pointer">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem className="gap-2.5 cursor-pointer">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Help Center
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="gap-2.5 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
