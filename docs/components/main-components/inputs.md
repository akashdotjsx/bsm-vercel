# Input Component

## Overview
The Input component is a customizable text input field with support for prefixes, suffixes, and various sizes. It provides consistent styling and functionality across the application.

## Location
- **File**: `/packages/ui/src/components/input.tsx`
- **Import Path**: `@kroolo/ui/input`

## Structure
The input component features:

1. **Size Variants**:
   - xs: Extra small (11px text, minimal padding)
   - sm: Small (12px text, 3px 12px padding)
   - md: Medium (13px text, 6px 12px padding) - Default
   - lg: Large (14px text, 8px 16px padding)

2. **Features**:
   - Prefix icon support
   - Secondary prefix support
   - Suffix icon support
   - Forwarded ref for DOM access
   - Disabled state handling
   - Focus states with ring
   - Border styling

## Props
- `size`: Input size variant (xs, sm, md, lg)
- `prefix`: Icon or element to display before input
- `prefix2`: Secondary prefix element
- `suffix`: Icon or element to display after input
- `className`: Additional CSS classes
- Standard HTML input attributes

## Styling
- Uses `class-variance-authority` for size variants
- Custom border styling with focus states
- Padding and text size variations by size
- Disabled state opacity
- Flex layout for icons and input
- Transparent background with focus outline

## Implementation Details
- Built with React's forwardRef for DOM access
- Uses class-variance-authority for styling variants
- Implements proper accessibility attributes
- Supports icon integration
- Handles disabled states properly
- Includes TypeScript type safety

## Usage Examples
The input component is used throughout the application for forms, search fields, and other data entry scenarios where consistent styling and behavior are required.