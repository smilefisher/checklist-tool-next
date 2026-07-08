"use client"

import * as React from 'react'

interface CustomSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  children: React.ReactNode
}

function CustomSelect({ value, onValueChange, placeholder, className, children }: CustomSelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const childArray = React.Children.toArray(children) as React.ReactElement<CustomSelectItemProps>[]
  const selectedChild = childArray.find((child: React.ReactElement<CustomSelectItemProps>) => child.props.value === value)

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        onClick={() => setOpen(!open)}
      >
        <span className={selectedChild ? '' : 'text-slate-400'}>
          {selectedChild ? (selectedChild.props as CustomSelectItemProps).children : placeholder || '请选择'}
        </span>
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-auto p-1">
            {childArray.map((child: React.ReactElement<CustomSelectItemProps>) =>
              React.cloneElement(child, {
                key: child.props.value,
                ...{
                  onClick: () => {
                    onValueChange(child.props.value)
                    setOpen(false)
                  },
                  className: `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-slate-100 ${child.props.value === value ? 'bg-blue-50 text-blue-700' : ''}`
                } as any
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface CustomSelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
}

function CustomSelectItem({ children, className, onClick, disabled }: CustomSelectItemProps) {
  return (
    <div
      className={className}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </div>
  )
}

export { CustomSelect, CustomSelectItem }
