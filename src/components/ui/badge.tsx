
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Add new status badge variants
        sent: "border-transparent bg-blue-100 text-blue-800",
        accepted: "border-transparent bg-green-100 text-green-800",
        draft: "border-transparent bg-gray-100 text-gray-800",
        pending: "border-transparent bg-amber-100 text-amber-800",
        rejected: "border-transparent bg-red-100 text-red-800",
        paid: "border-transparent bg-green-100 text-green-800",
        unpaid: "border-transparent bg-amber-100 text-amber-800",
        overdue: "border-transparent bg-red-100 text-red-600",
        completed: "border-transparent bg-green-100 text-green-800",
        scheduled: "border-transparent bg-blue-100 text-blue-800",
        inprogress: "border-transparent bg-yellow-100 text-yellow-800",
        cancelled: "border-transparent bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
