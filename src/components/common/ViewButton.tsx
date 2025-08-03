
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ViewButtonProps {
  type: 'quotation' | 'invoice';
  id: string;
  className?: string;
}

export function ViewButton({ type, id, className = "" }: ViewButtonProps) {
  const navigate = useNavigate();
  
  const handleView = () => {
    const path = type === 'quotation' ? `/quotations/view/${id}` : `/invoices/view/${id}`;
    navigate(path);
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleView}
      className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${className}`}
    >
      <Eye className="h-4 w-4 mr-1" />
      View
    </Button>
  );
}
