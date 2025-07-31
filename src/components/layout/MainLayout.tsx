
import React from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/hooks/useAuth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAdmin, isStaff, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar 
          isAdmin={isAdmin}
          isStaff={isStaff}
          onLogout={signOut}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <MobileHeader 
                  title="Dashboard"
                  onMenuClick={() => {}}
                />
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
              </div>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
