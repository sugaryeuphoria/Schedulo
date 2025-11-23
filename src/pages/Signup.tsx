import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm } from '@/components/SignupForm';
import { addUser, getUsers } from '@/lib/firebaseService';
import { testCredentials } from '@/data/mockData';
import { toast } from 'sonner';

const Signup = () => {
    const [signupError, setSignupError] = useState<string>('');
    const navigate = useNavigate();

    const handleSignup = async (name: string, email: string, password: string) => {
        try {
            setSignupError('');

            // Check if user already exists
            const existingUsers = await getUsers();
            const userExists = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (userExists) {
                setSignupError('Email already registered. Please login instead.');
                return;
            }

            // Generate short ID from name (first name, lowercase)
            const shortId = name.split(' ')[0].toLowerCase();

            // Create new user in Firebase
            await addUser({
                email,
                name,
                role: 'employee', // Default role for new signups
            });

            // Add to test credentials for development (so they can login)
            testCredentials.employees.push({
                email,
                name,
                password,
            });

            // Show success message
            toast.success('Account created successfully!', {
                description: 'You can now login with your credentials.',
            });

            // Redirect to login page
            setTimeout(() => {
                navigate('/auth');
            }, 1500);

        } catch (error) {
            console.error('Error creating account:', error);
            setSignupError('Failed to create account. Please try again.');
        }
    };

    return <SignupForm onSignup={handleSignup} error={signupError} />;
};

export default Signup;
