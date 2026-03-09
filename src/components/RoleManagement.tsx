import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Shield, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRBAC } from '@/hooks/useRBAC';
import { ALL_MODULES, ALL_ACTIONS, MODULE_LABELS, PermissionAction, RoleWithPermissions } from '@/lib/rbac-types';
import { toast } from 'sonner';

// Mock users for assignment
const MOCK_USERS = [
  { id: 'user-1', name: 'John Doe', email: 'john@company.com' },
  { id: 'user-2', name: 'Sarah Chen', email: 'sarah@company.com' },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike@company.com' },
  { id: 'user-4', name: 'Emily Davis', email: 'emily@company.com' },
];

export function RoleManagement() {
  const {
    rolesWithDetails, loading, createRole, updateRole, deleteRole,
    setRolePermissions, assignRole, removeUserRole, getUserRole, userRoles,
  } = useRBAC();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permMatrix, setPermMatrix] = useState<Record<string, Set<PermissionAction>>>({});
  const [view, setView] = useState<'list' | 'edit' | 'users'>('list');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const openCreate = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setPermMatrix({});
    setView('edit');
    setDialogOpen(true);
  };

  const openEdit = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description);
    // Build perm matrix from existing permissions
    const matrix: Record<string, Set<PermissionAction>> = {};
    ALL_MODULES.forEach(mod => { matrix[mod] = new Set(); });
    role.permissions.forEach(p => {
      if (!matrix[p.module_name]) matrix[p.module_name] = new Set();
      matrix[p.module_name].add(p.action);
    });
    setPermMatrix(matrix);
    setView('edit');
    setDialogOpen(true);
  };

  const togglePerm = (module: string, action: PermissionAction) => {
    setPermMatrix(prev => {
      const next = { ...prev };
      if (!next[module]) next[module] = new Set();
      const s = new Set(next[module]);
      s.has(action) ? s.delete(action) : s.add(action);
      next[module] = s;
      return next;
    });
  };

  const toggleAllModule = (module: string) => {
    setPermMatrix(prev => {
      const next = { ...prev };
      const current = next[module] || new Set();
      const allChecked = ALL_ACTIONS.every(a => current.has(a));
      next[module] = allChecked ? new Set() : new Set(ALL_ACTIONS);
      return next;
    });
  };

  const toggleAllAction = (action: PermissionAction) => {
    setPermMatrix(prev => {
      const next = { ...prev };
      const allChecked = ALL_MODULES.every(m => (next[m] || new Set()).has(action));
      ALL_MODULES.forEach(m => {
        if (!next[m]) next[m] = new Set();
        const s = new Set(next[m]);
        allChecked ? s.delete(action) : s.add(action);
        next[m] = s;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      let roleId: string;
      if (editingRole) {
        await updateRole(editingRole.id, name, description);
        roleId = editingRole.id;
      } else {
        const data = await createRole(name, description);
        roleId = (data as any).id;
      }
      // Save permissions
      const perms: { module_name: string; action: PermissionAction }[] = [];
      Object.entries(permMatrix).forEach(([module, actions]) => {
        actions.forEach(action => perms.push({ module_name: module, action }));
      });
      await setRolePermissions(roleId, perms);
      toast.success(editingRole ? 'Role updated' : 'Role created');
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role');
    }
  };

  const handleDelete = async (role: RoleWithPermissions) => {
    if (role.userCount > 0) {
      toast.error(`Cannot delete role with ${role.userCount} assigned user(s)`);
      return;
    }
    try {
      await deleteRole(role.id);
      toast.success('Role deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRoleId) return;
    try {
      await assignRole(selectedUserId, selectedRoleId);
      toast.success('Role assigned');
      setAssignDialogOpen(false);
      setSelectedUserId('');
      setSelectedRoleId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    }
  };

  const totalPerms = Object.values(permMatrix).reduce((sum, s) => sum + s.size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">Manage access control for your team</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Users className="h-4 w-4 mr-2" />Assign Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Role to User</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {MOCK_USERS.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedUserId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current role: {getUserRole(selectedUserId)?.name || 'None'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {rolesWithDetails.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignRole} className="w-full gradient-brand text-primary-foreground" disabled={!selectedUserId || !selectedRoleId}>
                  Assign Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={openCreate} className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />Create Role
          </Button>
        </div>
      </div>

      {/* Roles Table */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading roles...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Permissions</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesWithDetails.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No roles created yet</TableCell></TableRow>
              ) : (
                rolesWithDetails.map((role, i) => (
                  <TableRow key={role.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{role.description}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">{role.permissions.length}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{role.userCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(role)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* User Assignments */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">User Assignments</h3>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USERS.map(user => {
                const role = getUserRole(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>
                      {role ? (
                        <Badge variant="secondary" className="text-xs"><Shield className="h-3 w-3 mr-1" />{role.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No role assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {role && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeUserRole(user.id)}>
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Role Edit Dialog with Permission Matrix */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Manager" className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What can this role do?" className="mt-1" />
              </div>
            </div>

            {/* Permission Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Permission Matrix</Label>
                <span className="text-xs text-muted-foreground">{totalPerms} permissions selected</span>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-40">Module</TableHead>
                      {ALL_ACTIONS.map(action => (
                        <TableHead key={action} className="text-center capitalize w-20">
                          <button onClick={() => toggleAllAction(action)} className="hover:text-primary transition-colors">
                            {action}
                          </button>
                        </TableHead>
                      ))}
                      <TableHead className="text-center w-16">All</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALL_MODULES.map(module => {
                      const modulePerms = permMatrix[module] || new Set();
                      const allChecked = ALL_ACTIONS.every(a => modulePerms.has(a));
                      return (
                        <TableRow key={module}>
                          <TableCell className="font-medium text-foreground">{MODULE_LABELS[module]}</TableCell>
                          {ALL_ACTIONS.map(action => (
                            <TableCell key={action} className="text-center">
                              <Checkbox
                                checked={modulePerms.has(action)}
                                onCheckedChange={() => togglePerm(module, action)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Checkbox
                              checked={allChecked}
                              onCheckedChange={() => toggleAllModule(module)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full gradient-brand text-primary-foreground" disabled={!name.trim()}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
