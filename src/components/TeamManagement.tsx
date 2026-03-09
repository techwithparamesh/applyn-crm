import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Trash2, UserPlus, Search, Loader2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTeams, useProfiles } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function TeamManagement() {
  const { teams, loading, createTeam, deleteTeam, addMember, removeMember } = useTeams();
  const { profiles } = useProfiles();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    const team = await createTeam(teamName.trim(), teamDesc.trim());
    if (team) {
      toast({ title: 'Team created', description: `"${teamName}" is ready` });
      setCreateOpen(false);
      setTeamName('');
      setTeamDesc('');
    }
  };

  const handleAddMember = async (teamId: string) => {
    if (!selectedProfileId) return;
    await addMember(teamId, selectedProfileId);
    toast({ title: 'Member added' });
    setAddMemberOpen(null);
    setSelectedProfileId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Create Team</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Team Name</Label><Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Sales Team" /></div>
              <div><Label>Description</Label><Input value={teamDesc} onChange={e => setTeamDesc(e.target.value)} placeholder="Optional description" /></div>
              <Button onClick={handleCreate} disabled={!teamName.trim()} className="w-full gradient-brand text-primary-foreground">Create Team</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : teams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No teams yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      {team.description && <CardDescription className="text-xs">{team.description}</CardDescription>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog open={addMemberOpen === team.id} onOpenChange={(v) => { setAddMemberOpen(v ? team.id : null); setSelectedProfileId(''); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs"><UserPlus className="h-3 w-3 mr-1" />Add</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader><DialogTitle>Add Member to {team.name}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                              <SelectContent>
                                {profiles
                                  .filter(p => !(team.members || []).some(m => m.id === p.id))
                                  .map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button onClick={() => handleAddMember(team.id)} disabled={!selectedProfileId} className="w-full">Add Member</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteTeam(team.id); toast({ title: 'Team deleted' }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 mb-2">
                    <Badge variant="secondary" className="text-[10px]">{(team.members || []).length} members</Badge>
                  </div>
                  {(team.members || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No members yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(team.members || []).map(member => (
                        <div key={member.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{getInitials(member.name || member.email)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-foreground flex-1 truncate">{member.name}</span>
                          <button onClick={() => { removeMember(team.id, member.id); toast({ title: 'Member removed' }); }}
                            className="text-muted-foreground hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
