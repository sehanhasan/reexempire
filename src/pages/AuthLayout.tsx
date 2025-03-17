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
  return <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-sky-600">
      <div className="mb-8">
        <img src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" alt="Reex Empire Logo" className="h-16 mx-auto" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>;
}