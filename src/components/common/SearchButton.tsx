import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchButtonProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function SearchButton({ searchTerm, onSearchChange, placeholder = "Search..." }: SearchButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (isExpanded && searchTerm) {
      onSearchChange("");
    }
    setIsExpanded(!isExpanded);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex items-center">
      {isExpanded ? (
        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={placeholder}
              className="pl-10 h-9 w-48"
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="p-2"
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}