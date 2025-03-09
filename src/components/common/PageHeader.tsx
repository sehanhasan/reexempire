
import { ReactNode } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  description?: string;
}

export function PageHeader({
  title,
  actions,
  description
}: PageHeaderProps) {
  const isMobile = useIsMobile();
  
  // On mobile, don't show the header at all as per requirement
  if (isMobile) {
    return null;
  }
  
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-600">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
