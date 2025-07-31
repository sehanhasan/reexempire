
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode[];
}

export function MobileHeader({ title, onMenuClick, actions = [] }: MobileHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-base truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
