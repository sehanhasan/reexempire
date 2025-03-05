
import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
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
  
  // Close sidebar when route changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);
  
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
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
