import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "warning" | "neutral" | "primary" | "secondary"
  size?: "sm" | "md" | "lg"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", size = "md", children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded-full transition-default"
    
    const variantClasses = {
      success: "text-green-800",
      danger: "text-red-800", 
      warning: "text-yellow-800",
      neutral: "text-gray-800",
      primary: "text-blue-800",
      secondary: "text-gray-800"
    }
    
    const sizeClasses = {
      sm: "text-xs px-2 py-1",
      md: "text-sm px-3 py-1",
      lg: "text-base px-4 py-2"
    }
    
    const badgeStyle = {
      backgroundColor: 
        variant === "success" ? "var(--color-success-light)" :
        variant === "danger" ? "var(--color-danger-light)" :
        variant === "warning" ? "var(--color-warning-light)" :
        variant === "primary" ? "var(--color-primary-light)" :
        variant === "secondary" ? "var(--color-secondary-light)" :
        "var(--color-neutral-light)"
    }
    
    return (
      <span
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        style={badgeStyle}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }