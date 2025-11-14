import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/types/shift';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { getUsers } from '@/lib/firebaseService';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try to get user from location state first
        const userFromLocation = location.state?.user as User | undefined;
        
        if (userFromLocation) {
          setCurrentUser(userFromLocation);
          setLoading(false);
          return;
        }

        // If no location state, try to get users from Firebase
        // This helps with page refreshes
        const allUsers = await getUsers();
        
        if (allUsers.length === 0) {
          // No database - redirect to diagnostic
          console.log('No users found in database, redirecting to diagnostic');
          navigate('/diagnostic');
          return;
        }

        // User exists but we lost location state
        // For safety, redirect to auth to re-login
        console.log('User state lost, redirecting to auth');
        navigate('/auth');
        return;
      } catch (error) {
        console.error('Error loading user:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [location, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <LoadingSpinner />;
  }

  if (currentUser.role === 'manager') {
    return <ManagerDashboard user={currentUser} onLogout={() => navigate('/auth')} />;
  }

  return <EmployeeDashboard user={currentUser} onLogout={() => navigate('/auth')} />;
};

export default Dashboard;
