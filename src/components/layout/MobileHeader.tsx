
import { Button } from "@/components/ui/button";
import { Menu, MoreVertical } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  actions?: ReactNode[];
}

export function MobileHeader({ title, onMenuClick, actions }: MobileHeaderProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMenuClick();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between px-4 bg-blue-600 w-full shadow-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMenuClick}
        className="lg:hidden text-white hover:bg-blue-700 hover:text-white"
        aria-label="Toggle menu"
        type="button"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="font-semibold text-white truncate">{title}</h1>
      
      <div className="flex items-center gap-2">
        <div className="text-white">
          <NotificationBell />
        </div>
        {actions && actions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-blue-700"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions.map((action, index) => (
                <DropdownMenuItem key={index} className="cursor-pointer">
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-9" />
        )}
      </div>
    </header>
  );
}
