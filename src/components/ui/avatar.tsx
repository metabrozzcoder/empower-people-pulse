import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "",
        ring: "ring-2 ring-primary ring-offset-2 ring-offset-background",
        gradient:
          "p-[2px] bg-gradient-ring [&>*]:rounded-full [&>span]:bg-background",
        soft: "ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
      },
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-14 w-14",
        xl: "h-20 w-20",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  status?: "online" | "offline" | "busy" | "away"
}

const statusColors: Record<NonNullable<AvatarProps["status"]>, string> = {
  online: "bg-emerald-500",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
  away: "bg-amber-500",
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, variant, size, status, children, ...props }, ref) => (
  <div className="relative inline-flex">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ variant, size }), className)}
      {...props}
    >
      {variant === "gradient" ? (
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-background">
          <div className="relative h-full w-full overflow-hidden rounded-full">
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </AvatarPrimitive.Root>
    {status && (
      <span
        className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
          statusColors[status],
          size === "sm" && "h-2 w-2",
          (!size || size === "default") && "h-2.5 w-2.5",
          size === "lg" && "h-3.5 w-3.5",
          size === "xl" && "h-4 w-4"
        )}
      />
    )}
  </div>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-medium text-foreground",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Avatar group with overlap
const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { max?: number }
>(({ className, children, max, ...props }, ref) => {
  const items = React.Children.toArray(children)
  const shown = max ? items.slice(0, max) : items
  const overflow = max ? items.length - max : 0
  return (
    <div ref={ref} className={cn("flex -space-x-2", className)} {...props}>
      {shown.map((child, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div className="ring-2 ring-background rounded-full flex h-10 w-10 items-center justify-center bg-muted text-xs font-medium">
          +{overflow}
        </div>
      )}
    </div>
  )
})
AvatarGroup.displayName = "AvatarGroup"

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants }
