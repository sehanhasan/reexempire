
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ViewButtonProps {
  id: string;
  type: 'quotation' | 'invoice';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function ViewButton({ id, type, variant = 'outline', size = 'sm' }: ViewButtonProps) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/${type}s/view/${id}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleView}
      className="flex items-center gap-1"
    >
      <Eye className="h-4 w-4" />
      View
    </Button>
  );
}
