"use client"

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
}

export default function ConfirmDialog({
  open, onOpenChange, title = '确认操作', description = '确定要执行此操作吗？',
  onConfirm, onCancel, confirmText = '确定', cancelText = '取消',
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onCancel?.(); onOpenChange(false) }}>{cancelText}</Button>
          <Button
            variant={variant}
            onClick={() => { onConfirm(); onOpenChange(false) }}
          >{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
