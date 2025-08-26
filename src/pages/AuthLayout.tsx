import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
interface AuthLayoutProps {
  children: ReactNode;
}
export default function AuthLayout({
  children
}: AuthLayoutProps) {
  const {
    session
  } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);
  return <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-blue-50">
      
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>;
}