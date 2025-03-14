
import React, { ReactNode } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

  // Filter out back buttons on mobile
  const filterBackButtons = (actionNodes: ReactNode): ReactNode => {
    if (!actionNodes || !isMobile) return actionNodes;

    // If actions is a single element
    if (React.isValidElement(actionNodes)) {
      // Check if it's a back button (contains ArrowLeft icon)
      if (actionNodes.props && typeof actionNodes.props === 'object' && 'children' in actionNodes.props) {
        const children = actionNodes.props.children;
        if (Array.isArray(children) && children.some(child => React.isValidElement(child) && child.type === ArrowLeft)) {
          return null;
        }
        // If children is a single element, check if it's an ArrowLeft
        if (React.isValidElement(children) && children.type === ArrowLeft) {
          return null;
        }
      }
      return actionNodes;
    }

    // If actions is an array or fragment
    if (Array.isArray(actionNodes)) {
      return actionNodes.filter(action => {
        if (!React.isValidElement(action)) return true;

        // Check for ArrowLeft icon in children
        if (action.props && typeof action.props === 'object' && 'children' in action.props) {
          const children = action.props.children;
          if (Array.isArray(children)) {
            return !children.some(child => React.isValidElement(child) && child.type === ArrowLeft);
          }
          // If children is a single element, check if it's an ArrowLeft
          if (React.isValidElement(children)) {
            return children.type !== ArrowLeft;
          }
        }
        return true;
      });
    }
    return actionNodes;
  };
  const filteredActions = filterBackButtons(actions);

  // On mobile, show minimal header
  if (isMobile) {
    return filteredActions ? <div className="flex justify-end mb-2">{filteredActions}</div> : null;
  }
  return <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-700">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>;
}
