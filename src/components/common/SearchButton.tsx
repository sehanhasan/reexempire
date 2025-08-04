
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchButtonProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchButton({ onSearch, placeholder = "Search..." }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    onSearch('');
  };

  if (isOpen) {
    return (
      <div className="flex items-center gap-2 flex-1 mx-2">
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder={placeholder}
            className="h-9"
            autoFocus
          />
        </form>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="p-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsOpen(true)}
      className="p-2"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
