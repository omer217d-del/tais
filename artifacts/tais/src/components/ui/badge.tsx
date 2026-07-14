import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/20 text-primary border border-primary/50 shadow-[0_0_10px_rgba(0,255,255,0.2)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/20 text-destructive border border-destructive/50 shadow-[0_0_10px_rgba(255,0,0,0.2)]",
        outline: "text-foreground",
        success: "border-transparent bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(0,255,0,0.2)]",
        warning: "border-transparent bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_10px_rgba(255,255,0,0.2)]",
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
