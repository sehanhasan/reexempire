
import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isStaff, isManager, isLoading, signOut } = useAuth();
  
  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/login');
    }

    // Apply route access restrictions based on user role
    if (!isLoading && user) {
      const path = location.pathname;
      
      // Staff restriction - only access to schedule
      if (isStaff && !isAdmin && !isManager) {
        if (!path.includes('/schedule') && path !== '/') {
          navigate('/schedule');
        }
      }
      
      // Manager restriction - only access to schedule and staff
      if (isManager && !isAdmin) {
        if (!path.includes('/schedule') && !path.includes('/staff') && path !== '/') {
          navigate('/schedule');
        }
      }
      
      // Redirect from dashboard if staff or manager (not admin)
      if ((isStaff || isManager) && !isAdmin && (path === '/' || path === '/dashboard')) {
        navigate('/schedule');
      }
    }
  }, [user, isLoading, location.pathname, navigate, isStaff, isAdmin, isManager]);
  
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
    
    return "Reex Empire";
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };
  
  // Close sidebar when route changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location, isMobile, sidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 h-screen flex-shrink-0">
        <AppSidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
          isAdmin={isAdmin}
          isStaff={isStaff}
          isManager={isManager}
          onLogout={handleLogout}
        />
      </div>
      
      <div className="flex-1 overflow-auto">
        {isMobile && (
          <MobileHeader 
            title={getPageTitle()} 
            onMenuClick={() => setSidebarOpen(true)} 
          />
        )}
        
        <main className={`p-6 md:px-8 lg:px-10 ${isMobile ? 'mt-14 px-3' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
