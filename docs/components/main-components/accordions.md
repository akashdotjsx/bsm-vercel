# Accordion Component

## Overview
The Accordion component is a vertically collapsing container that allows users to toggle the visibility of content sections. It's built on Radix UI primitives and provides accessible, animated expansion and collapse functionality.

## Location
- **File**: `/packages/ui/src/components/accordion.tsx`
- **Import Path**: `@kroolo/ui/accordion`

## Structure
The accordion system includes multiple components:

1. **Accordion**: Root component that manages the accordion state
2. **AccordionItem**: Individual item within the accordion
3. **AccordionTrigger**: Clickable header that controls the expansion
4. **AccordionContent**: Collapsible content section

## Features
- Accessible by default with proper ARIA attributes
- Animated expansion and collapse
- Customizable icons
- Keyboard navigation support
- Focus management
- Disabled state handling
- Smooth transitions
- Consistent styling with chevron indicators

## Props
- Standard Radix UI accordion props for each component
- `icon`: Custom Lucide icon (defaults to ChevronRight)
- `className`: Additional CSS classes
- Children for content
- Forwarded ref where applicable

## Styling
- Uses Tailwind CSS for consistent styling
- Chevron icon rotation on open state (rotate-90)
- Flex layout for trigger alignment
- Padding and spacing for content areas
- Smooth transition with duration-300
- Disabled state opacity reduction
- Proper border and background styling

## Implementation Details
- Built with Radix UI primitives for accessibility
- Implements proper type safety with TypeScript
- Supports custom icons with fallback
- Handles open/closed states with data attributes
- Provides smooth animations with CSS transitions
- Maintains consistent styling across the application

## Usage Examples
Accordions are used throughout the application for FAQ sections, settings categories, detailed information panels, step-by-step instructions, help documentation, and any other scenario where content needs to be organized in expandable/collapsible sections to save space.