import { type ComponentProps, forwardRef } from "preact/compat"
import { cn } from "@/lib/utils"

export interface InputProps extends ComponentProps<"input"> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full bg-gray-100 rounded-md border border-input transition-colors active:bg-white focus:bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
      ref={ref}
    />
  )
)

Input.displayName = "Input"