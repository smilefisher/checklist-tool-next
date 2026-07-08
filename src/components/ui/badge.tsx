import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
    secondary: 'bg-slate-100 text-slate-600',
    destructive: 'bg-red-100 text-red-700',
    outline: 'border border-[var(--border)] text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, type BadgeProps }
