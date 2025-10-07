import * as React from "react"
import { cn } from "@/lib/utils"

export const HEADING_SIZES: Record<1|2|3|4|5|6, string> = {
  1: "text-4xl font-semibold font-inter", // ~32px
  2: "text-3xl font-medium font-inter",   // ~30px
  3: "text-2xl font-inter font-medium",   // ~24px
  4: "text-xl",                           // ~20px
  5: "text-lg",                           // ~18px
  6: "text-base",                         // ~16px (standard: 13px base)
}

type HeadingProps = React.ComponentProps<"h1"> & {
  level?: 1|2|3|4|5|6
  className?: string
}

export function Heading({ level = 3, className, ...props }: HeadingProps) {
  const Comp = (`h${level}` as keyof JSX.IntrinsicElements)
  return <Comp className={cn(HEADING_SIZES[level], className)} {...props} />
}