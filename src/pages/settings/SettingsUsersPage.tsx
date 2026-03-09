import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from '@/components/UserManagement';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsUsersPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Invite users, manage profiles, and assign roles</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace users</CardTitle>
          <CardDescription>Invite by email (Name, Email, Role, Team). Pending invitations and member list below.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagement />
        </CardContent>
      </Card>
    </div>
  );
}
