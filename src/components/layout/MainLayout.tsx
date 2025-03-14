
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
  
  // Toggle sidebar function - simplified but reliable
  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)} 
      />
      
      {/* Fixed sidebar wrapper to prevent scrolling */}
      <div className="h-screen sticky top-0 z-50 flex-shrink-0">
        <AppSidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
          isAdmin={isAdmin}
          isStaff={isStaff}
          onLogout={handleLogout}
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-auto relative">
        {isMobile && (
          <div className="sticky top-0 z-40 w-full">
            <MobileHeader 
              title={getPageTitle()} 
              onMenuClick={toggleSidebar} 
              actions={
                // Check if we're on edit pages to handle the actions appropriately
                location.pathname.includes("/edit") ? 
                  window.dispatchEvent(new CustomEvent('get-mobile-actions')) ||
                  [] : 
                  []
              }
            />
          </div>
        )}
        
        <main className={`${isMobile ? 'px-0 pt-2 pb-16' : 'p-6 md:px-8 lg:px-10'} flex-1`}>
          {children}
        </main>
      </div>
    </div>
  );
}
