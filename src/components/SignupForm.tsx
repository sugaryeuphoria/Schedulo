import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SignupFormProps {
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  error?: string;
}

export const SignupForm = ({ onSignup, error }: SignupFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!name.trim()) {
      setValidationError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setValidationError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await onSignup(name, email, password);
    } catch (err) {
      // Error will be handled by parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl border-0 backdrop-blur-sm bg-card/95">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">Join Schedulo to manage your shifts</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 rounded-xl border-border/50 focus:border-primary transition-colors"
            />
          </div>

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
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 rounded-xl border-border/50 focus:border-primary transition-colors"
            />
          </div>

          {(validationError || error) && (
            <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
              {validationError || error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/auth')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
