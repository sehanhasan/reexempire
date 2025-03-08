
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Users, FileText, Receipt, UserCircle, Calendar, FolderTree, Settings, LogOut, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  isAdmin: boolean;
  isStaff: boolean;
  isManager: boolean;
  onLogout: () => Promise<void>;
}

export function AppSidebar({
  open,
  setOpen,
  isAdmin,
  isStaff,
  isManager,
  onLogout
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Logo image
  const logoUrl = "https://i.ibb.co/Ltyts5K/reex-empire-logo.png";

  // Navigation items - rearranged order
  const navItems = [{
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/",
    adminOnly: true
  }, {
    title: "Customers",
    icon: <Users className="h-5 w-5" />,
    href: "/customers",
    adminOnly: true
  }, {
    title: "Quotations",
    icon: <FileText className="h-5 w-5" />,
    href: "/quotations",
    adminOnly: true
  }, {
    title: "Invoices",
    icon: <Receipt className="h-5 w-5" />,
    href: "/invoices",
    adminOnly: true
  }, {
    title: "Schedule",
    icon: <Calendar className="h-5 w-5" />,
    href: "/schedule",
    adminOnly: false
  }, {
    title: "Staff",
    icon: <UserCircle className="h-5 w-5" />,
    href: "/staff",
    adminOnly: false,  // Changed to allow managers to access
    managerAccess: true
  }, {
    title: "Categories",
    icon: <FolderTree className="h-5 w-5" />,
    href: "/categories",
    adminOnly: true
  }];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (isAdmin) return true;
    if (isManager && (item.managerAccess || !item.adminOnly)) return true;
    if (isStaff && !item.adminOnly) return true;
    return false;
  });

  // Function to check if a nav item is active
  const isActiveRoute = (href: string) => {
    if (href === "/" && location.pathname === "/") {
      return true;
    }
    return location.pathname.startsWith(href) && href !== "/" ? true : false;
  };

  // Mobile overlay for sidebar
  const mobileOverlay = isMobile && <div className={cn("fixed inset-0 bg-black/50 z-40 transition-opacity", open ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setOpen && setOpen(false)} />;
  
  return <>
      {mobileOverlay}
      
      <aside className={cn("bg-white border-r border-gray-200 h-screen flex flex-col z-50", isMobile ? "fixed transition-transform transform w-72" : "relative w-64", isMobile && !open && "-translate-x-full")}>
        <div className="h-14 flex items-center px-4 border-b justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Reex Empire Logo" className="h-8" />
            
          </div>
          {isMobile && <Button variant="ghost" size="icon" onClick={() => setOpen && setOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>}
        </div>
        
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {filteredNavItems.map(item => <Button key={item.href} variant="ghost" className={cn("w-full justify-start text-gray-600 h-10", isActiveRoute(item.href) && "bg-gray-100 text-gray-900 font-medium")} onClick={() => {
            navigate(item.href);
            if (isMobile) {
              setOpen && setOpen(false);
            }
          }}>
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Button>)}
          </nav>
        </ScrollArea>
        
        <div className="border-t border-gray-200 p-2">
          <div className="mt-2 p-2">
            <Button variant="ghost" className="w-full justify-start text-gray-600 h-10" onClick={() => {
              navigate("/profile");
            }}>
              <Settings className="h-5 w-5" />
              <span className="ml-3">Settings</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-600 h-10" onClick={onLogout}>
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>;
}
