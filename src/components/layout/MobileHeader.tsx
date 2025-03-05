
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <h1 className="text-white font-semibold truncate flex-1">{title}</h1>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onMenuClick}
        className="h-9 w-9 text-white hover:bg-blue-600"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}
