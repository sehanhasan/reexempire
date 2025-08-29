
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Users, FileText, Receipt, UserCircle, Calendar, FolderTree, LogOut, X, DollarSign, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  isAdmin: boolean;
  isStaff: boolean;
  onLogout: () => Promise<void>;
}

export function AppSidebar({
  open,
  setOpen,
  isAdmin,
  isStaff,
  onLogout
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Logo image
  const logoUrl = "https://i.ibb.co/Ltyts5K/reex-empire-logo.png";

  // Navigation items with groups
  const navGroups = [
    {
      items: [{
        title: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: "/",
        adminOnly: false
      }, {
        title: "Customers",
        icon: <Users className="h-5 w-5" />,
        href: "/customers",
        adminOnly: true
      }]
    },
    {
      items: [{
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
        title: "Warranty",
        icon: <Shield className="h-5 w-5" />,
        href: "/warranty",
        adminOnly: true
      }, {
        title: "Categories",
        icon: <FolderTree className="h-5 w-5" />,
        href: "/categories",
        adminOnly: true
      }]
    },
    {
      items: [{
        title: "Schedule",
        icon: <Calendar className="h-5 w-5" />,
        href: "/schedule",
        adminOnly: false
      }, {
        title: "Staff",
        icon: <UserCircle className="h-5 w-5" />,
        href: "/staff",
        adminOnly: true
      }]
    },
    {
      items: [{
        title: "Finance",
        icon: <DollarSign className="h-5 w-5" />,
        href: "/finance",
        adminOnly: true
      }]
    }
  ];

  // Flatten navigation items for filtering
  const allNavItems = navGroups.flatMap(group => group.items);

  // Filter navigation groups based on user role
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (isAdmin) return true;
      if (isStaff && !item.adminOnly) return true;
      return false;
    })
  })).filter(group => group.items.length > 0);

  // Function to check if a nav item is active
  const isActiveRoute = (href: string) => {
    if (href === "/" && location.pathname === "/") {
      return true;
    }
    return location.pathname.startsWith(href) && href !== "/" ? true : false;
  };

  const handleNavItemClick = (href: string) => {
    navigate(href);
    if (isMobile && setOpen) {
      setOpen(false);
    }
  };

  // Handle close button click with better event handling
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (setOpen) {
      setOpen(false);
    }
  };

  return (
    <aside 
      className={cn(
        "h-full bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out",
        isMobile 
          ? cn("fixed w-[280px] overflow-hidden", open ? "translate-x-0" : "-translate-x-full") 
          : "w-64 overflow-hidden"
      )}
    >
      <div className={cn(
        "h-14 flex items-center px-4 border-b justify-center",
        isMobile && "mt-14 justify-between" // Add top margin on mobile to account for header
      )}>
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="Reex Empire Logo" className="h-10" />
        </div>
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCloseClick}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2">
          {filteredNavGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <div className="space-y-1 mb-2">
                {group.items.map(item => (
                  <Button 
                    key={item.href} 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-start text-gray-600 h-10", 
                      isActiveRoute(item.href) && "bg-blue-50 text-blue-600 font-medium"
                    )} 
                    onClick={() => handleNavItemClick(item.href)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Button>
                ))}
              </div>
              {groupIndex < filteredNavGroups.length - 1 && (
                <div className="my-3">
                  <Separator />
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      
      <div className="border-t border-gray-200 p-2">
        <div className="mt-2 p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-600 h-10" 
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
