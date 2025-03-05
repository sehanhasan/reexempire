
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, FileText, Receipt,
// Replacing FileInvoice 
Users, HardHat,
// Replacing UserHardHat
Calendar, FolderTree, UserCircle, Menu, X } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
}
const navItems: NavItem[] = [{
  title: "Dashboard",
  path: "/",
  icon: Home
}, {
  title: "Quotations",
  path: "/quotations",
  icon: FileText
}, {
  title: "Invoices",
  path: "/invoices",
  icon: Receipt
}, {
  title: "Customers",
  path: "/customers",
  icon: Users
}, {
  title: "Staff",
  path: "/staff",
  icon: HardHat
}, {
  title: "Schedule",
  path: "/schedule",
  icon: Calendar
}, {
  title: "Categories",
  path: "/categories",
  icon: FolderTree
}, {
  title: "Profile",
  path: "/profile",
  icon: UserCircle
}];
export function AppSidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  return <>
      {/* Mobile Overlay */}
      {isMobile && expanded && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity" onClick={() => setExpanded(false)} />}

      {/* Mobile toggle button */}
      <button onClick={toggleSidebar} className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white" aria-label="Toggle sidebar">
        {expanded ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out 
                    ${expanded ? "translate-x-0" : "-translate-x-full"} 
                    md:translate-x-0 md:static md:flex flex-col flex-shrink-0 w-64 bg-sidebar border-r border-sidebar-border overflow-hidden`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border bg-white">
            <div className="flex items-center">
              <img src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" alt="Reex Empire Logo" className="h-10 mr-2" />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
              <Menu size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 bg-white">
            <nav className="space-y-1 px-2">
              {navItems.map(item => <NavLink key={item.path} to={item.path} className={({
              isActive
            }) => `flex items-center px-4 py-3 text-sm rounded-md transition-colors
                    ${isActive ? "bg-blue-100 text-blue-800 font-medium" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`} onClick={() => isMobile && setExpanded(false)}>
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>)}
            </nav>
          </div>
          
          <div className="p-4 border-t border-sidebar-border bg-white">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <UserCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Admin User</p>
                <p className="text-xs text-slate-500">admin@renovateprox.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>;
}
