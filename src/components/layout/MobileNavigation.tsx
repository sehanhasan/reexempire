
import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Calendar,
  User,
  Settings,
  LogOut,
  FolderOpen
} from 'lucide-react';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  onLogout: () => void;
}

export function MobileNavigation({ open, onClose, isAdmin, isStaff, onLogout }: MobileNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', adminOnly: false },
    { icon: Users, label: 'Customers', path: '/customers', adminOnly: true },
    { icon: FileText, label: 'Quotations', path: '/quotations', adminOnly: true },
    { icon: Receipt, label: 'Invoices', path: '/invoices', adminOnly: true },
    { icon: Calendar, label: 'Schedule', path: '/schedule', adminOnly: false },
    { icon: FolderOpen, label: 'Categories', path: '/categories', adminOnly: true },
    { icon: Settings, label: 'Staff', path: '/staff', adminOnly: true },
    { icon: User, label: 'Profile', path: '/profile', adminOnly: false },
  ];

  const visibleItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-2">
              {visibleItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActivePath(item.path) ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600"
              onClick={onLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
