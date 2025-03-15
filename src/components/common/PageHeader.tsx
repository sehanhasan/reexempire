
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layout/MobileHeader";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  mobileHeaderActions?: ReactNode[];
}

export function PageHeader({ title, description, actions, mobileHeaderActions }: PageHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {description && (
          <div className="px-4 pt-3 pb-2">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
