import * as React from "react"

import { cn } from "src/utils/cn"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "w-full p-3 bg-panel2 text-ink placeholder-ink-faint rounded-xl border border-line focus:border-primary outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
