import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const progressVariants = cva("h-full w-full flex-1 bg-[var(--primary)] transition-all", {
  variants: {
    variant: {
      default: "bg-[var(--primary)]",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

interface ProgressProps extends VariantProps<typeof progressVariants> {
  value: number
  className?: string
}

function Progress({ value, variant, className }: ProgressProps) {
  const pct = Math.min(Math.max(value, 0), 100)

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn(progressVariants({ variant }))}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress, type ProgressProps }
