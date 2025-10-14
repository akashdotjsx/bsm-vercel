# Button Component

## Overview
The Button component is a reusable UI element in the Kroolo application. It provides multiple variants and sizes with consistent styling and behavior across the application.

## Location
- **File**: `/packages/ui/src/components/button.tsx`
- **Import Path**: `@kroolo/ui/button`

## Structure
The button component is built with:

1. **Variants**:
   - Primary: Standard button with primary styling
   - Destructive: For destructive actions (e.g., delete)
   - Outline: Outline-style button with border
   - Secondary: Secondary action button
   - Ghost: Minimal styling button
   - Link: Button styled like a link

2. **Sizes**:
   - xs: Extra small (11px text, minimal padding)
   - sm: Small (12px text, 3px 12px padding)
   - md: Medium (13px text, 4px 16px padding) - Default
   - lg: Large (14px text, 8px 20px padding)
   - xl: Extra large (16px text, 10px 24px padding)
   - icon: For icon-only buttons (36px square)

3. **Features**:
   - Forwarded ref for DOM access
   - Slot functionality for composition
   - Prefix and suffix icon support
   - Disabled state handling
   - Size and variant combinations
   - Class name merging utility

## Props
- `variant`: Button style variant (primary, destructive, outline, etc.)
- `size`: Button size (xs, sm, md, lg, xl, icon)
- `asChild`: To compose the button as a child element
- `prefixIcon`: Icon to display before the text
- `suffixIcon`: Icon to display after the text
- `className`: Additional CSS classes
- Standard HTML button attributes

## Styling
- Uses `class-variance-authority` for variant management
- Utilizes `tailwind-merge` for consistent class application
- Custom styling with CSS variables for theme consistency
- Hover effects with brightness adjustments
- Border and text color variations based on variant
- Focus states for accessibility

## Implementation Details
- Built with React's forwardRef for DOM access
- Uses Radix UI's Slot component for composition
- Implements type safety with TypeScript interfaces
- Leverages Tailwind CSS for styling
- Includes accessibility considerations
- Supports icon integration

## Usage Examples
The button component can be used with different variants and sizes to match different UI contexts while maintaining consistent styling and behavior across the application.