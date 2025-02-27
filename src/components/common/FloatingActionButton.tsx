
import { ButtonHTMLAttributes } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export function FloatingActionButton({
  icon = <Plus className="h-6 w-6" />,
  className,
  ...props
}: FloatingActionButtonProps) {
  return (
    <button
      className={cn("floating-action-button", className)}
      aria-label="Add new item"
      {...props}
    >
      {icon}
    </button>
  );
}
