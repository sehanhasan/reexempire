
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layout/MobileHeader";

interface PageHeaderProps {
  title: string;
  description?: string;  // Keeping the prop but not displaying it
  actions?: ReactNode;
  mobileHeaderActions?: ReactNode[];
}

export function PageHeader({ title, actions, mobileHeaderActions }: PageHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Mobile header is handled in MainLayout
  }

  // Hide page headers for specific pages on desktop/tablet
  const hiddenPages = ['Customers', 'Quotations', 'Invoices', 'Schedule', 'Staff', 'Categories'];
  if (hiddenPages.includes(title)) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
