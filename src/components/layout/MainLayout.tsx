import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { isAdmin, isStaff, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
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
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);
  
  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 h-screen flex-shrink-0">
        <AppSidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
          isAdmin={isAdmin}
          isStaff={isStaff}
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
