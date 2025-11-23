import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { LogIn, User } from 'lucide-react';
import { testCredentials } from '@/data/mockData';

interface AuthFormProps {
  onLogin: (email: string, password: string) => void;
  error?: string;
}

export const AuthForm = ({ onLogin, error }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showQuickLogin, setShowQuickLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleQuickLogin = (credEmail: string, credPassword: string) => {
    setEmail(credEmail);
    setPassword(credPassword);
    onLogin(credEmail, credPassword);
  };

  const handleManagerLogin = () => {
    handleQuickLogin(testCredentials.manager.email, testCredentials.manager.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6 shadow-2xl border-0 backdrop-blur-sm bg-card/95">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Schedulo</h1>
          <p className="text-muted-foreground">Sign in to manage your shifts</p>
        </div>

        {showQuickLogin ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Quick Login - Employees
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {testCredentials.employees.map((emp) => (
                  <Button
                    key={emp.email}
                    variant="outline"
                    className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-primary/10 transition-colors"
                    onClick={() => handleQuickLogin(emp.email, emp.password)}
                  >
                    <span className="font-medium text-sm">{emp.name}</span>
                    <span className="text-xs text-muted-foreground">{emp.email}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-medium hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
                onClick={handleManagerLogin}
              >
                <span className="font-semibold">Manager Login</span>
                <span className="text-xs text-muted-foreground ml-2">(Alex Manager)</span>
              </Button>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowQuickLogin(false)}
              >
                Manual Login
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Don't have an account?
                </p>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => window.location.href = '/signup'}
                >
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-border/50 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-border/50 focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Sign In
            </Button>

            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowQuickLogin(true)}
            >
              Back to Quick Login
            </Button>

            <div className="border-t border-border/50 pt-4">
              <p className="text-center text-sm text-muted-foreground mb-2">
                Don't have an account?
              </p>
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => window.location.href = '/signup'}
              >
                Create Account
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
