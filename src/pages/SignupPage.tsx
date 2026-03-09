import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getApiBase } from '@/lib/api';

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim() || undefined,
          admin_name: adminName.trim() || undefined,
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast({ title: 'Signup failed', description: data.error || res.statusText, variant: 'destructive' });
        return;
      }
      signIn(data.token, data.user, data.tenant);
    } catch (err) {
      setLoading(false);
      toast({ title: 'Signup failed', description: 'Network error', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>Each company gets its own isolated CRM. Sign up to create your tenant.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company name</Label>
              <Input
                id="company_name"
                placeholder="ABC Financial"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="pl-9"
              />
              <p className="text-xs text-muted-foreground">Your workspace name. Subdomain will be derived from this.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_name">Your name (admin)</Label>
              <Input id="admin_name" placeholder="John Doe" value={adminName} onChange={e => setAdminName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create workspace
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
