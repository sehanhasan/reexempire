import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMenuClick();
  };

  return (
    <header className="fixed top-0 left-0 z-50 flex h-12 w-full items-center justify-between px-4 bg-blue-600">
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
      <h1 className="font-semibold text-white">{title}</h1>
      <div className="w-9" />
    </header>
  );
}
