import { useState, useEffect } from 'react';
import { User } from '@/types/shift';
import { testCredentials } from '@/data/mockData';
import { getUsers } from '@/lib/firebaseService';
import { AuthForm } from '@/components/AuthForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [authError, setAuthError] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
        setInitialLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setInitialLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    // Check manager credentials
    if (
      email === testCredentials.manager.email &&
      password === testCredentials.manager.password
    ) {
      const manager = users.find(u => u.role === 'manager');
      if (manager) {
        // Navigate to dashboard with user data
        navigate('/dashboard', { state: { user: manager } });
        return;
      }
    }

    // Check employee credentials
    // First check test credentials (legacy/dev)
    const employeeCredential = testCredentials.employees.find(
      cred => cred.email === email && cred.password === password
    );

    if (employeeCredential) {
      const employee = users.find(u => u.email === email);
      if (employee) {
        // Navigate to dashboard with user data
        navigate('/dashboard', { state: { user: employee } });
        return;
      }
    }

    // Check if user exists in Firestore with matching password (for new signups)
    const dbUser = users.find(u => u.email === email && u.password === password);
    if (dbUser) {
      navigate('/dashboard', { state: { user: dbUser } });
      return;
    }

    setAuthError('Invalid email or password. Ensure database is initialized first.');
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return <AuthForm onLogin={handleLogin} error={authError} />;
};

export default Auth;
