import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-white/70 uppercase tracking-widest pl-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={cn(
              'flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/30 disabled:cursor-not-allowed disabled:opacity-50 hover:border-white/20',
              error && 'border-red-500/50 focus-visible:ring-red-500/30 focus-visible:border-red-500/50',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-medium text-red-400 pl-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
