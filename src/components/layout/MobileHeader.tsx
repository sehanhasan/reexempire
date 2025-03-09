
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Toggle menu"
        type="button"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="font-semibold">{title}</h1>
      <div className="w-9" />
    </header>
  );
}
