import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[12px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:bg-[var(--primary)]/90',
        destructive:
          'bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-xs hover:bg-[var(--destructive)]/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-[var(--card-border)] bg-background shadow-xs hover:bg-[var(--menu-hover)] hover:text-accent-foreground dark:bg-input/30 dark:border-[var(--menu-border)] dark:hover:bg-[var(--menu-hover)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-xs hover:bg-[var(--secondary)]/80',
        ghost:
          'hover:bg-[var(--menu-hover)] hover:text-accent-foreground dark:hover:bg-[var(--menu-hover)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline dark:text-[var(--primary)]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-[8px] gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-[10px] px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
