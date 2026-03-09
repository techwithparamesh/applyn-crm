import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleManagement } from '@/components/RoleManagement';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsRolesPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create roles and assign permissions (module + action)</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roles & permissions</CardTitle>
          <CardDescription>Create roles, set permissions per module (view, create, edit, delete, export, import), and assign users to roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleManagement />
        </CardContent>
      </Card>
    </div>
  );
}
