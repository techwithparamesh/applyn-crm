import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRBAC } from '@/hooks/useRBAC';
import { ALL_MODULES, ALL_ACTIONS, MODULE_LABELS } from '@/lib/rbac-types';
import { ArrowLeft, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPermissionsPage() {
  const navigate = useNavigate();
  const { rolesWithDetails, rolePermissions, loading } = useRBAC();

  const permissionGrid = useMemo(() => {
    const grid: { module: string; action: string; name: string; roleIds: Set<string> }[] = [];
    ALL_MODULES.forEach((module) => {
      ALL_ACTIONS.forEach((action) => {
        const roleIds = new Set(
          rolePermissions.filter((rp) => rp.module_name === module && rp.action === action).map((rp) => rp.role_id)
        );
        grid.push({
          module,
          action,
          name: `${MODULE_LABELS[module] || module} : ${action}`,
          roleIds,
        });
      });
    });
    return grid;
  }, [rolePermissions]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View which roles have which permissions. Edit permissions under Settings → Roles.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Permission matrix
          </CardTitle>
          <CardDescription>Each row is a permission (module:action). Columns show roles that have that permission.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Permission</TableHead>
                    {rolesWithDetails.map((r) => (
                      <TableHead key={r.id}>{r.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionGrid.map((p) => (
                    <TableRow key={`${p.module}:${p.action}`}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      {rolesWithDetails.map((role) => (
                        <TableCell key={role.id}>
                          {p.roleIds.has(role.id) ? (
                            <Badge variant="secondary" className="gap-1">
                              <Check className="h-3 w-3" /> Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
