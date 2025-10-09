# Tooltip Component

## Overview
The Tooltip component is an accessible popup that displays helpful information when users hover over or focus on an element. It's built on Radix UI primitives and provides consistent, styled tooltips.

## Location
- **File**: `/packages/ui/src/components/tooltip.tsx`
- **Import Path**: `@kroolo/ui/tooltip`

## Structure
The tooltip system consists of multiple sub-components:

1. **TooltipProvider**: Context provider for managing tooltip state
2. **Tooltip**: Root component that manages tooltip visibility
3. **TooltipTrigger**: Element that triggers the tooltip
4. **TooltipContent**: Visible tooltip content with arrow

## Features
- Accessible by default with proper ARIA attributes
- Portal rendering to prevent clipping
- Custom positioning with offset control
- Animated transitions
- Arrow indicator for direction
- Focus and hover activation
- Proper z-index management
- Custom styling with shadow and color

## Props
- Standard Radix UI tooltip props for each sub-component
- `sideOffset`: Offset from the trigger element (default: 4)
- `className`: Additional CSS classes for content
- Forwarded ref where applicable

## Styling
- Uses Tailwind CSS for consistent styling
- Rounded corners (rounded) with padding (px-2, py-1)
- Custom shadow with CSS variable values
- Text styling (text-[11px], font-medium)
- Background and text color contrast
- Arrow styling with fill color
- Portal rendering to avoid clipping issues

## Implementation Details
- Built with Radix UI primitives for accessibility
- Uses portal rendering to prevent visual clipping
- Implements proper type safety with TypeScript
- Includes arrow indicator for direction
- Handles positioning automatically
- Provides consistent styling across the application

## Usage Examples
Tooltips are used throughout the application to provide additional context for icons, buttons, navigation items, form fields, and any other elements where additional information would be helpful without cluttering the main interface.