
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-20 h-14 bg-blue-600 text-white flex items-center justify-between px-4",
      isScrolled && "shadow-md"
    )}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onMenuClick}
        className="h-10 w-10 text-white hover:bg-blue-700"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="font-semibold">{title}</h1>
      <div className="w-10"></div> {/* Empty div for balanced spacing */}
    </div>
  );
}
