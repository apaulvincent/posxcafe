import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center justify-center size-5 shrink-0", className)}>
        <input
          type="checkbox"
          className="peer absolute inset-0 opacity-0 cursor-pointer z-10 m-0"
          ref={ref}
          {...props}
        />
        <div
          className="pointer-events-none flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-muted-foreground/30 bg-background transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-primary/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"
        >
          <CheckIcon className="size-3.5 stroke-[4] opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
