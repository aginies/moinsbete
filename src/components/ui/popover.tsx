"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverOverlay({
  className,
  ...props
}: PopoverPrimitive.Backdrop.Props) {
  return (
    <PopoverPrimitive.Backdrop
      data-slot="popover-overlay"
      className={cn(
        "fixed inset-0 isolate z-40 bg-black/20 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function PopoverContent({
  className,
  align = "start",
  children,
  ...props
}: PopoverPrimitive.Popup.Props & { align?: "start" | "center" | "end" }) {
  return (
    <PopoverPortal>
      <PopoverOverlay />
      <PopoverPrimitive.Positioner>
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 w-80 rounded-xl bg-white p-4 text-popover-foreground ring-1 ring-black/10 shadow-xl duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-popover dark:ring-white/10",
            align === "start" && "data-[placement=top]:-translate-x-1 data-[placement=bottom]:-translate-x-1",
            align === "end" && "data-[placement=top]:translate-x-1 data-[placement=bottom]:translate-x-1",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  )
}

export { Popover, PopoverTrigger, PopoverPortal, PopoverOverlay, PopoverContent }
