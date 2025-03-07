
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services";
import { Profile } from "@/types/database";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  profile: Profile | null;
  isLoading: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData: { full_name: string; role: 'admin' | 'staff' }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  isStaff: false,
  profile: null,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setUser(data.session.user);
          // Fetch user profile
          const userProfile = await authService.getUserProfile();
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        setUser(session.user);
        // Fetch user profile
        const userProfile = await authService.getUserProfile();
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authService.signIn(email, password);
      setUser(data.user);
      
      // Fetch user profile
      const userProfile = await authService.getUserProfile();
      setProfile(userProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: { full_name: string; role: 'admin' | 'staff' }) => {
    try {
      setIsLoading(true);
      const data = await authService.signUp(email, password, userData);
      setUser(data.user);
      
      // The profile will be created by a trigger function in the database
      // Wait a moment and then fetch the profile
      setTimeout(async () => {
        const userProfile = await authService.getUserProfile();
        setProfile(userProfile);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Determine if user is an admin based on profile role
  const isAdmin = profile?.role === 'admin';
  
  // Determine if user is staff (either admin or staff role)
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isAdmin,
        isStaff,
        profile,
        isLoading,
        user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
