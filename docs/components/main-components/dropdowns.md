# Dropdown Menu Component

## Overview
The Dropdown Menu component provides a flexible, accessible menu system built on top of Radix UI primitives. It includes various sub-components for building rich dropdown interfaces with different functionality.

## Location
- **File**: `/packages/ui/src/components/dropdown-menu.tsx`
- **Import Path**: `@kroolo/ui/dropdown-menu`

## Structure
The dropdown menu system consists of multiple sub-components:

1. **Core Components**:
   - `DropdownMenu`: Root component that manages the menu state
   - `DropdownMenuTrigger`: Element that opens/closes the menu
   - `DropdownMenuContent`: The visible menu container

2. **Submenu Components**:
   - `DropdownMenuSub`: Container for submenu
   - `DropdownMenuSubTrigger`: Trigger for submenu
   - `DropdownMenuSubContent`: Content of submenu

3. **Item Types**:
   - `DropdownMenuItem`: Standard menu item
   - `DropdownMenuCheckboxItem`: Checkbox menu item
   - `DropdownMenuRadioItem`: Radio menu item
   - `DropdownMenuRadioItemWithoutIndicator`: Radio item without indicator

4. **Supporting Components**:
   - `DropdownMenuLabel`: Label for menu sections
   - `DropdownMenuSeparator`: Visual separator between items
   - `DropdownMenuShortcut`: For displaying keyboard shortcuts
   - `DropdownMenuGroup`: Groups related items
   - `DropdownMenuPortal`: Portals the menu to body
   - `DropdownMenuRadioGroup`: Group for radio items

## Features
- Accessible by default with proper ARIA attributes
- Keyboard navigation support
- Positioning with configurable offset and alignment
- Animated transitions
- Custom styling with CSS classes
- Support for icons and indicators
- Inset options for nested items
- Checkbox and radio functionality
- Portal rendering to prevent clipping

## Styling
- Uses Tailwind CSS for styling
- Custom shadow and border properties
- Rounded corners with `rounded-xl` class
- Custom shadow with CSS variable `--radix-dropdown-menu-content-available-height`
- Focus states with accent colors
- Hover effects with background changes
- Z-index management for proper layering
- Scrollable content with height constraints

## Props
- Standard Radix UI props for each subcomponent
- Custom props for styling and behavior
- Alignment and positioning options
- Inset props for indented items
- Check position for checkbox items

## Implementation Details
- Built with Radix UI primitives for accessibility
- Uses forwardRef for DOM access
- Implements proper type safety with TypeScript
- Leverages Tailwind for styling
- Includes animation classes for smooth transitions
- Supports nested menu structures
- Handles proper portal rendering

## Usage Examples
The dropdown menu component can be used for various UI patterns including simple dropdowns, complex navigation menus, toolbar items, context menus, and more. The modular design allows for flexible composition to meet different UI needs.