import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
// import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SearchButton } from '@/components/common/SearchButton';
interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode[];
  searchProps?: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
  };
}
export function MobileHeader({
  title,
  onMenuClick,
  actions = [],
  searchProps
}: MobileHeaderProps) {
  return <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      
    </div>;
}