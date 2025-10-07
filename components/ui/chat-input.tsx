import * as React from "react"
import { cn } from "@/lib/utils"

export function ChatInput({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-input"
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col rounded-xl border border-[var(--card-border)] p-3",
        className,
      )}
      {...props}
    />
  )
}

export function ChatTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="chat-textarea"
      className={cn(
        "w-full resize-none bg-transparent py-0 text-[var(--text-color)] placeholder-[var(--placeholder-text)] outline-none",
        className,
      )}
      {...props}
    />
  )}
