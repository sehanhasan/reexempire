
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  UserCircle, 
  Calendar, 
  FolderTree, 
  LogOut, 
  X, 
  FilePlus, 
  FileCheck, 
  FileX, 
  CreditCard, 
  FileSearch, 
  Clock
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  
  // Collapsible state for submenu items
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({
    invoices: false,
    quotations: false
  });

  // Toggle collapsible state
  const toggleCollapsible = (name: string) => {
    setOpenCollapsibles(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Logo image
  const logoUrl = "https://i.ibb.co/Ltyts5K/reex-empire-logo.png";

  // Navigation items
  const navItems = [{
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/",
    adminOnly: false
  }, {
    title: "Customers",
    icon: <Users className="h-5 w-5" />,
    href: "/customers",
    adminOnly: true
  }, {
    title: "Quotations",
    icon: <FileText className="h-5 w-5" />,
    href: "/quotations",
    adminOnly: true,
    submenu: [
      {
        title: "All Quotations",
        icon: <FileSearch className="h-4 w-4" />,
        href: "/quotations"
      },
      {
        title: "Create New",
        icon: <FilePlus className="h-4 w-4" />,
        href: "/quotations/create"
      },
      {
        title: "Pending Approval",
        icon: <Clock className="h-4 w-4" />,
        href: "/quotations?status=sent"
      },
      {
        title: "Accepted",
        icon: <FileCheck className="h-4 w-4" />,
        href: "/quotations?status=accepted"
      },
      {
        title: "Rejected",
        icon: <FileX className="h-4 w-4" />,
        href: "/quotations?status=rejected"
      }
    ]
  }, {
    title: "Invoices",
    icon: <Receipt className="h-5 w-5" />,
    href: "/invoices",
    adminOnly: true,
    submenu: [
      {
        title: "All Invoices",
        icon: <FileSearch className="h-4 w-4" />,
        href: "/invoices"
      },
      {
        title: "Create New",
        icon: <FilePlus className="h-4 w-4" />,
        href: "/invoices/create"
      },
      {
        title: "Unpaid",
        icon: <Clock className="h-4 w-4" />,
        href: "/invoices?status=Unpaid"
      },
      {
        title: "Paid",
        icon: <CreditCard className="h-4 w-4" />,
        href: "/invoices?status=Paid"
      },
      {
        title: "Overdue",
        icon: <FileX className="h-4 w-4" />,
        href: "/invoices?status=Overdue"
      }
    ]
  }, {
    title: "Schedule",
    icon: <Calendar className="h-5 w-5" />,
    href: "/schedule",
    adminOnly: false
  }, {
    title: "Staff",
    icon: <UserCircle className="h-5 w-5" />,
    href: "/staff",
    adminOnly: true
  }, {
    title: "Categories",
    icon: <FolderTree className="h-5 w-5" />,
    href: "/categories",
    adminOnly: true
  }];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (isAdmin) return true;
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
        "h-full bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out overflow-hidden",
        isMobile 
          ? cn("fixed w-[280px]", open ? "translate-x-0" : "-translate-x-full") 
          : "w-64"
      )}
    >
      <div className="h-14 flex items-center px-4 border-b justify-between">
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
        <nav className="space-y-1 px-2">
          {filteredNavItems.map(item => {
            if (item.submenu) {
              return (
                <Collapsible 
                  key={item.href}
                  open={openCollapsibles[item.title.toLowerCase()]}
                  onOpenChange={() => toggleCollapsible(item.title.toLowerCase())}
                  className="space-y-1"
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-600 h-10", 
                        (isActiveRoute(item.href) || location.pathname.includes(item.href)) && "bg-gray-100 text-gray-900 font-medium"
                      )}
                    >
                      {item.icon}
                      <span className="ml-3 flex-1 text-left">{item.title}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className={cn("h-4 w-4 transition-transform", 
                          openCollapsibles[item.title.toLowerCase()] ? "transform rotate-180" : ""
                        )}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 space-y-1">
                    {item.submenu.map(subItem => (
                      <Button
                        key={subItem.href}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-gray-600 h-9",
                          isActiveRoute(subItem.href) && "bg-gray-100 text-gray-900 font-medium"
                        )}
                        onClick={() => handleNavItemClick(subItem.href)}
                      >
                        {subItem.icon}
                        <span className="ml-3">{subItem.title}</span>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }
            
            return (
              <Button 
                key={item.href} 
                variant="ghost" 
                className={cn(
                  "w-full justify-start text-gray-600 h-10", 
                  isActiveRoute(item.href) && "bg-gray-100 text-gray-900 font-medium"
                )} 
                onClick={() => handleNavItemClick(item.href)}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Button>
            );
          })}
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
