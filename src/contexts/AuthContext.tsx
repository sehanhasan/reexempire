
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/authService';
import { toast } from '@/components/ui/use-toast';
import { Profile } from '@/types/database';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { full_name: string, role: 'admin' | 'staff', staff_id?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Initial auth check & setting up auth state listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const initialSession = await authService.getCurrentSession();
        setSession(initialSession);
        
        if (initialSession) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          
          // Fetch user profile and role
          const profileData = await authService.getProfile();
          setProfile(profileData);
          
          if (profileData) {
            setIsAdmin(profileData.role === 'admin');
            setIsStaff(profileData.role === 'staff');
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession) {
          // User logged in or token refreshed
          try {
            const profileData = await authService.getProfile();
            setProfile(profileData);
            
            if (profileData) {
              setIsAdmin(profileData.role === 'admin');
              setIsStaff(profileData.role === 'staff');
            }
          } catch (error) {
            console.error('Error fetching profile during auth change:', error);
          }
        } else {
          // User logged out
          setProfile(null);
          setIsAdmin(false);
          setIsStaff(false);
        }

        setIsLoading(false);
      }
    );

    // Clean up subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      await authService.signInWithEmail(email, password);
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: { full_name: string, role: 'admin' | 'staff', staff_id?: string }) => {
    try {
      await authService.signUpWithEmail(email, password, userData);
      toast({
        title: "Account created",
        description: "Please check your email to verify your account"
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      toast({
        title: "Signed out successfully"
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    isAdmin,
    isStaff,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
