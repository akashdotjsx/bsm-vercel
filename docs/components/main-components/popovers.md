# Popover Component

## Overview
The Popover component is a floating panel that displays content relative to a trigger element. It's built on Radix UI primitives and provides accessible, animated popovers with positioning options.

## Location
- **File**: `/packages/ui/src/components/popover.tsx`
- **Import Path**: `@kroolo/ui/popover`

## Structure
The popover system consists of multiple components:

1. **Popover**: Root component that manages the popover state
2. **PopoverTrigger**: Element that opens/closes the popover
3. **PopoverContent**: Visible content of the popover
4. **PopoverAnchor**: Optional positioning anchor

## Features
- Accessible by default with proper ARIA attributes
- Portal rendering to prevent clipping
- Animated transitions (fade, zoom, slide)
- Configurable positioning with offset
- Multiple alignment options
- Focus management
- Proper z-index layering
- Shadow and border styling

## Props
- Standard Radix UI popover props for each component
- `align`: Alignment option (default: "center")
- `sideOffset`: Offset from trigger element (default: 4)
- `className`: Additional CSS classes
- Children for content
- Forwarded ref where applicable

## Styling
- Uses Tailwind CSS for consistent styling
- Custom shadow with CSS variable values
- Rounded corners (rounded-xl) with border styling
- Background using CSS variable for card background
- Proper z-index (z-1300) for layering
- Animation classes for entrance/exit transitions
- Border styling with menu border variable

## Implementation Details
- Built with Radix UI primitives for accessibility
- Implements proper type safety with TypeScript
- Uses portal rendering to avoid clipping
- Handles positioning with alignment and offset
- Provides smooth animations with CSS transitions
- Maintains consistent styling across the application

## Usage Examples
Popovers are used throughout the application for contextual information, settings panels, user actions, help content, notifications, and any other scenario where temporary content needs to appear near a specific element while maintaining the underlying page structure.