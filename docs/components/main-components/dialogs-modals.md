# Dialog/Modal Component

## Overview
The Dialog component is a modal window implementation built on top of Radix UI primitives. It provides accessible, customizable modal dialogs for displaying important information or collecting user input.

## Location
- **File**: `/packages/ui/src/components/dialog.tsx`
- **Import Path**: `@kroolo/ui/dialog`

## Structure
The dialog system consists of several sub-components:

1. **Core Components**:
   - `Dialog`: Root component that manages the dialog state
   - `DialogTrigger`: Element that opens the dialog
   - `DialogPortal`: Portals the dialog to the document body
   - `DialogClose`: Element that closes the dialog

2. **Visual Components**:
   - `DialogOverlay`: Semi-transparent overlay behind the dialog
   - `DialogContent`: Main dialog content container with close button
   - `DialogTitle`: Title of the dialog
   - `DialogDescription`: Description text for the dialog

3. **Layout Components**:
   - `DialogHeader`: Header section of the dialog
   - `DialogFooter`: Footer section of the dialog

## Features
- Accessible by default with proper ARIA attributes
- Keyboard navigation support (Escape to close)
- Focus trapping within the dialog
- Proper overlay that dims the background
- Animated transitions for opening/closing
- Click outside to close functionality
- Customizable positioning
- Close button with accessibility support
- Portal rendering to prevent z-index issues
- Responsive design considerations

## Styling
- Uses Tailwind CSS for styling
- Custom shadow and border properties
- Rounded corners with `rounded-lg` class
- Fixed positioning at center of screen
- Transform-based centering (translate)
- Custom close button styling
- Proper z-index management (z-[1300])
- Border styling with `--menu-border` variable

## Props
- Standard Radix UI props for each subcomponent
- Custom props for styling and positioning
- className props for additional styling
- Forwarded refs for DOM access
- Support for custom content and behavior

## Implementation Details
- Built with Radix UI primitives for accessibility
- Uses React's forwardRef for DOM access
- Implements proper type safety with TypeScript
- Leverages Tailwind for styling
- Includes animation classes for smooth transitions
- Handles proper portal rendering to prevent clipping
- Implements focus management for accessibility

## Usage Examples
The dialog component can be used for various UI patterns including confirmation dialogs, forms, alerts, informational popups, and any other content that requires user attention. The modular design allows for flexible composition to meet different UI needs.