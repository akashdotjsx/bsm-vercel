import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-[var(--placeholder-text)] selection:bg-primary selection:text-primary-foreground dark:bg-[var(--input)] border-[var(--border)] flex h-8 w-full min-w-0 rounded-[8px] border bg-[var(--input)] px-2.5 py-[5px] text-[12px] shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[12px] file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
