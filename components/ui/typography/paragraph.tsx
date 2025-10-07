import * as React from "react"
import { cn } from "@/lib/utils"

export const PARAGRAPH_SIZES = {
  xs: "text-xs",        // 10px
  sm: "text-sm",        // 12px
  default: "text-base", // 13px
  lg: "text-lg",        // ~18px

  // Special variants
  lead: "font-inter text-[1.125rem] font-medium leading-[1.35rem] tracking-[-0.01em]",
  title: "font-inter text-[0.875rem] font-medium leading-5 tracking-[-0.02em]",
  body: "font-inter text-[0.875rem] font-normal leading-5 tracking-[-0.02em]",
  mono: "font-dmmono text-[0.75rem] font-normal leading-[1.125rem] tracking-[-0.02em]",
  xsmall: "font-inter text-[0.75rem] font-normal leading-[1.0625rem] tracking-[-0.02em]",
} as const

type ParagraphSize = keyof typeof PARAGRAPH_SIZES

type ParagraphProps = React.ComponentProps<"p"> & {
  size?: ParagraphSize
  className?: string
}

export function Paragraph({ size = "default", className, ...props }: ParagraphProps) {
  return <p className={cn(PARAGRAPH_SIZES[size], className)} {...props} />
}