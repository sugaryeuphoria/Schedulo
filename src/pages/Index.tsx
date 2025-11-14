import { useState, useEffect } from 'react';
import { User } from '@/types/shift';
import { testCredentials } from '@/data/mockData';
import { getUsers } from '@/lib/firebaseService';
import { seedFirebaseData } from '@/lib/seedFirebase';
import { AuthForm } from '@/components/AuthForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { DiagnosticsPage } from './DiagnosticsPage';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wrench } from 'lucide-react';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
        // Always show welcome screen initially unless already logged in
        setShowWelcome(true);
        setInitialLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setShowWelcome(true);
        setInitialLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await seedFirebaseData();
      const allUsers = await getUsers();
      setUsers(allUsers);
      setAuthError('');
      setShowWelcome(false);
    } catch (error) {
      console.error('Error seeding database:', error);
      setAuthError('Failed to initialize database. Please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    // Check manager credentials
    if (
      email === testCredentials.manager.email &&
      password === testCredentials.manager.password
    ) {
      const manager = users.find(u => u.role === 'manager');
      if (manager) {
        setCurrentUser(manager);
        setAuthError('');
        return;
      }
    }

    // Check employee credentials
    const employeeCredential = testCredentials.employees.find(
      cred => cred.email === email && cred.password === password
    );

    if (employeeCredential) {
      const employee = users.find(u => u.email === email);
      if (employee) {
        setCurrentUser(employee);
        setAuthError('');
        return;
      }
    }

    setAuthError('Invalid email or password. Try seeding the database first.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (showDiagnostics) {
    return <DiagnosticsPage onBack={() => setShowDiagnostics(false)} />;
  }

  if (showWelcome && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <RefreshCw className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Initialize Schedulo</h1>
            <p className="text-muted-foreground mb-6">
              Click the button below to set up your Firebase database with sample data.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full h-12"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Initializing Database...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Initialize Database
              </>
            )}
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setShowDiagnostics(true)}
            className="w-full"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Database Diagnostics
          </Button>
          {authError && (
            <p className="text-sm text-destructive">{authError}</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} error={authError} />;
  }

  if (currentUser.role === 'manager') {
    return <ManagerDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <EmployeeDashboard user={currentUser} onLogout={handleLogout} />;
};

export default Index;
