
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between px-4 bg-blue-600 w-full shadow-md">
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
      
      {actions && actions.length > 0 ? (
        <div className="flex items-center">
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      ) : (
        <div className="w-9" />
      )}
    </header>
  );
}
