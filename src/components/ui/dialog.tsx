import { type ComponentProps } from "preact"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ComponentProps<"div">["children"]
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80" 
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  )
}

export function DialogContent({ 
  className, 
  children, 
  ...props 
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ 
  className, 
  children, 
  ...props 
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogFooter({ 
  className, 
  children, 
  ...props 
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogTitle({ 
  className, 
  children, 
  ...props 
}: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({ 
  className, 
  children, 
  ...props 
}: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function DialogTrigger({ 
  children, 
  onClick 
}: { 
  children: ComponentProps<"button">["children"]
  onClick?: () => void 
}) {
  return (
    <div onClick={onClick}>
      {children}
    </div>
  )
}