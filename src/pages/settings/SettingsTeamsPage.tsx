import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamManagement } from '@/components/TeamManagement';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsTeamsPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create teams and assign users (with optional role per team)</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teams</CardTitle>
          <CardDescription>Create teams, add members, and manage membership.</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamManagement />
        </CardContent>
      </Card>
    </div>
  );
}
