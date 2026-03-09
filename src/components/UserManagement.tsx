import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Trash2, Mail, UserCheck, UserX, UserPlus, Shield,
  MoreHorizontal, Search, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useProfiles, useInvitations, Profile } from '@/hooks/useUserManagement';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/use-toast';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-200',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function UserManagement() {
  const { profiles, loading, updateProfile, deleteProfile } = useProfiles();
  const { invitations, createInvitation, deleteInvitation } = useInvitations();
  const { roles } = useRBAC();
  const { toast } = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [search, setSearch] = useState('');

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingInvites = invitations.filter(i => !i.accepted);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const inv = await createInvitation(inviteEmail.trim(), inviteRoleId || undefined);
    if (inv) {
      toast({ title: 'Invitation sent', description: `Invite sent to ${inviteEmail}` });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRoleId('');
    }
  };

  const handleStatusChange = async (profile: Profile, newStatus: string) => {
    await updateProfile(profile.id, { status: newStatus });
    toast({ title: 'Status updated', description: `${profile.name} is now ${newStatus}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground"><UserPlus className="h-4 w-4 mr-2" />Invite User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Email Address</Label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@company.com" type="email" /></div>
              <div>
                <Label>Role (optional)</Label>
                <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim()} className="w-full gradient-brand text-primary-foreground">
                <Mail className="h-4 w-4 mr-2" />Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users ({profiles.length})</CardTitle>
          <CardDescription>Manage your team members and their access</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="space-y-2">
              {filteredProfiles.map((profile, i) => (
                <motion.div key={profile.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(profile.name || profile.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profile.name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[profile.status] || ''}`}>
                    {profile.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {profile.status !== 'active' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(profile, 'active')}>
                          <UserCheck className="h-4 w-4 mr-2" />Activate
                        </DropdownMenuItem>
                      )}
                      {profile.status !== 'suspended' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(profile, 'suspended')}>
                          <UserX className="h-4 w-4 mr-2" />Suspend
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => { deleteProfile(profile.id); toast({ title: 'User removed' }); }}>
                        <Trash2 className="h-4 w-4 mr-2" />Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invitations ({pendingInvites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700">Pending</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteInvitation(inv.id); toast({ title: 'Invitation cancelled' }); }}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
