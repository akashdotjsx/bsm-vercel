"use client"

import * as React from "react"
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

// Custom Menu List with Kroolo-style design
const CustomMenuList = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content> & {
    rootProps?: React.HTMLAttributes<HTMLDivElement>
  }
>(({ className, rootProps, ...props }, ref) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Content
      ref={ref}
      sideOffset={4}
      className={cn(
        // Base styling
        "z-50 min-w-[182px] overflow-hidden rounded-lg border bg-background p-1 shadow-lg",
        // Custom Kroolo styling  
        "border-border bg-popover shadow-lg",
        // Animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </MenuPrimitive.Portal>
))
CustomMenuList.displayName = "CustomMenuList"

// Editor Menu List with configurable anchor and transform origins
const EditorMenuList = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content> & {
    rootProps?: React.HTMLAttributes<HTMLDivElement>
  }
>(({ className, rootProps, ...props }, ref) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Content
      ref={ref}
      sideOffset={4}
      className={cn(
        // Base styling matching CustomMenuList
        "z-50 min-w-[182px] overflow-hidden rounded-lg border bg-background p-1 shadow-lg",
        // Custom Kroolo styling
        "border-border bg-popover shadow-lg",
        // Animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </MenuPrimitive.Portal>
))
EditorMenuList.displayName = "EditorMenuList"

// Custom Menu List with Icon support - adapts width to content
const CustomMenuListWithIcon = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content> & {
    rootProps?: React.HTMLAttributes<HTMLDivElement>
  }
>(({ className, rootProps, ...props }, ref) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Content
      ref={ref}
      sideOffset={4}
      className={cn(
        // Base styling with fit-content width
        "z-50 w-fit overflow-hidden rounded-lg border bg-background p-1 shadow-lg",
        // Custom Kroolo styling
        "border-border bg-popover shadow-lg",
        // Animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </MenuPrimitive.Portal>
))
CustomMenuListWithIcon.displayName = "CustomMenuListWithIcon"

// Custom Menu Item with Kroolo styling
const CustomMenuItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.Item
    ref={ref}
    className={cn(
      // Base item styling
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
      // Kroolo hover effects
      "hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
CustomMenuItem.displayName = "CustomMenuItem"

// Custom Menu Separator
const CustomMenuSeparator = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px bg-border",
      className
    )}
    {...props}
  />
))
CustomMenuSeparator.displayName = "CustomMenuSeparator"

// Custom Menu Label
const CustomMenuLabel = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-muted-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
CustomMenuLabel.displayName = "CustomMenuLabel"

export {
  CustomMenuList,
  EditorMenuList, 
  CustomMenuListWithIcon,
  CustomMenuItem,
  CustomMenuSeparator,
  CustomMenuLabel,
}