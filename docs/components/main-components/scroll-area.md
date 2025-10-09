# Scroll Area Component

## Overview
The Scroll Area component provides a customizable scrolling container with styled scrollbars. It's built on Radix UI primitives to offer consistent scrolling behavior with custom visual design.

## Location
- **File**: `/packages/ui/src/components/scroll-area.tsx`
- **Import Path**: `@kroolo/ui/scroll-area`

## Structure
The scroll area system includes multiple components:

1. **ScrollArea**: Main container that manages scrolling
2. **ScrollAreaViewport**: The scrolling viewport area
3. **ScrollBar**: Scrollbar element (horizontal or vertical)
4. **ScrollAreaThumb**: The draggable scrollbar thumb element
5. **ScrollAreaCorner**: Corner element where both scrollbars meet

## Features
- Custom styled scrollbars
- Horizontal and vertical scroll support
- Accessible by default with proper ARIA attributes
- Corner handling for both scrollbars
- Touch support for mobile devices
- Smooth scrolling behavior
- Custom styling that matches the application theme
- Performance-optimized scroll handling

## Props
- Standard Radix UI scroll area props for each component
- `orientation`: Scrollbar orientation ('horizontal' or 'vertical', default: 'vertical')
- `className`: Additional CSS classes
- Children for scrollable content
- Forwarded ref where applicable

## Styling
- Uses Tailwind CSS for consistent styling
- Custom scrollbar width (w-2.5) with appropriate border styling
- Vertical scrollbar with left border, horizontal with top border
- Scroll thumb with rounded corners and border color
- Touch handling with touch-none and transition effects
- Select-none to prevent text selection during scroll
- Relative positioning for proper layout

## Implementation Details
- Built with Radix UI primitives for accessibility
- Implements proper type safety with TypeScript
- Supports both horizontal and vertical scrollbars
- Handles corner element where scrollbars meet
- Provides custom styling while maintaining functionality
- Optimizes for touch devices with appropriate classes

## Usage Examples
Scroll areas are used throughout the application for content areas that may exceed their container's boundaries, such as modal content, sidebar navigation content, dropdowns with variable content, chat message containers, and any other scenario where custom-styled scrolling is needed with consistent appearance across the application.