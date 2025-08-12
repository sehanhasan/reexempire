
import { ReactNode, useState, useEffect } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileNavigation } from "./MobileNavigation";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [bottomNavOpen, setBottomNavOpen] = useState(false);
  const [mobileActions, setMobileActions] = useState<ReactNode[]>([]);
  const [mobileSearchProps, setMobileSearchProps] = useState<{
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
  } | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isStaff, isLoading, signOut } = useAuth();
  
  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/login');
    }

    // If user is a staff member, they can only access the schedule page
    if (!isLoading && user && isStaff && !isAdmin) {
      const path = location.pathname;
      if (!path.includes('/schedule') && path !== '/') {
        navigate('/schedule');
      }
    }
  }, [user, isLoading, location.pathname, navigate, isStaff, isAdmin]);
  
  // Get mobile header actions using custom event
  useEffect(() => {
    const handleGetMobileActions = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail)) {
        setMobileActions(event.detail);
      }
    };

    const handleSetupMobileSearch = (event: CustomEvent) => {
      if (event.detail) {
        setMobileSearchProps(event.detail);
      }
    };

    const handleClearMobileSearch = () => {
      setMobileSearchProps(null);
    };

    window.addEventListener('get-mobile-actions', handleGetMobileActions as EventListener);
    window.addEventListener('setup-mobile-search', handleSetupMobileSearch as EventListener);
    window.addEventListener('clear-mobile-search', handleClearMobileSearch as EventListener);
    
    return () => {
      window.removeEventListener('get-mobile-actions', handleGetMobileActions as EventListener);
      window.removeEventListener('setup-mobile-search', handleSetupMobileSearch as EventListener);
      window.removeEventListener('clear-mobile-search', handleClearMobileSearch as EventListener);
    };
  }, []);
  
  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path.includes("/categories")) return "Categories";
    if (path.includes("/customers")) return "Customers";
    if (path.includes("/quotations")) {
      if (path.includes("/create")) return "Create Quotation";
      if (path.includes("/edit")) return "Edit Quotation";
      return "Quotations";
    }
    if (path.includes("/invoices")) {
      if (path.includes("/create")) return "Create Invoice";
      if (path.includes("/edit")) return "Edit Invoice";
      return "Invoices";
    }
    if (path.includes("/staff")) return "Staff";
    if (path.includes("/schedule")) {
      if (path.includes("/add")) return "Add Appointment";
      return "Schedule";
    }
    if (path.includes("/profile")) return "Profile";
    
    return "Reex Empire";
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };
  
  const toggleBottomNav = () => {
    setBottomNavOpen(prevState => !prevState);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileHeader 
        title={getPageTitle()} 
        onMenuClick={toggleBottomNav} 
        actions={mobileActions}
        searchProps={mobileSearchProps}
      />
      
      <main className="flex-1 px-4 pt-4 pb-20">
        {children}
      </main>

      <MobileNavigation 
        open={bottomNavOpen}
        onClose={() => setBottomNavOpen(false)}
        isAdmin={isAdmin}
        isStaff={isStaff}
        onLogout={handleLogout}
      />
    </div>
  );
}
