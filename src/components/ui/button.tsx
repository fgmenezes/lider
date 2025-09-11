import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const baseClasses = "btn-base"
    
    const variantClasses = {
      primary: "text-white",
      secondary: "text-white", 
      danger: "text-white",
      outline: "border border-[var(--color-border)] text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]",
      ghost: "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
      link: "text-[var(--color-primary)] underline-offset-4 hover:underline bg-transparent shadow-none",
    }
    
    const variantStyles = {
      primary: {
        backgroundColor: "var(--color-primary)",
        "&:hover": { backgroundColor: "var(--color-primary-hover)" }
      },
      secondary: {
        backgroundColor: "var(--color-secondary)",
        "&:hover": { backgroundColor: "var(--color-secondary-hover)" }
      },
      danger: {
        backgroundColor: "var(--color-danger)",
        "&:hover": { backgroundColor: "var(--color-danger-hover)" }
      },
      outline: {
        borderColor: "var(--color-neutral)"
      },
      ghost: {},
      link: {}
    }
    
    const sizeClasses = {
      default: "h-10",
      sm: "h-9 px-3 text-sm",
      lg: "h-11 px-8 text-base",
      icon: "h-10 w-10 p-0",
    }
    
    const buttonStyle = {
      ...variantStyles[variant],
      ...(variant === "primary" && {
        backgroundColor: "var(--color-primary)",
      }),
      ...(variant === "secondary" && {
        backgroundColor: "var(--color-secondary)",
      }),
      ...(variant === "danger" && {
        backgroundColor: "var(--color-danger)",
      })
    }
    
    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        style={variant !== "outline" && variant !== "ghost" && variant !== "link" ? buttonStyle : undefined}
        ref={ref}
        {...props}
        onMouseEnter={(e) => {
          if (variant === "primary") {
            e.currentTarget.style.backgroundColor = "var(--color-primary-hover)"
          } else if (variant === "secondary") {
            e.currentTarget.style.backgroundColor = "var(--color-secondary-hover)"
          } else if (variant === "danger") {
            e.currentTarget.style.backgroundColor = "var(--color-danger-hover)"
          }
          props.onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          if (variant === "primary") {
            e.currentTarget.style.backgroundColor = "var(--color-primary)"
          } else if (variant === "secondary") {
            e.currentTarget.style.backgroundColor = "var(--color-secondary)"
          } else if (variant === "danger") {
            e.currentTarget.style.backgroundColor = "var(--color-danger)"
          }
          props.onMouseLeave?.(e)
        }}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }