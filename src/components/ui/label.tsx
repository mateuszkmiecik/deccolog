import { type ComponentProps } from "preact"
import { cn } from "@/lib/utils"

export interface LabelProps extends ComponentProps<"label"> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}