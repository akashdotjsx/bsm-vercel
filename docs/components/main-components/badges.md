# Badge Component

## Overview
The Badge component is a small status indicator that provides contextual information through color and text. It offers multiple variants for different use cases and styling needs.

## Location
- **File**: `/packages/ui/src/components/badge.tsx`
- **Import Path**: `@kroolo/ui/badge`

## Structure
The badge component features:

1. **Variants**:
   - Default: Primary styling with background and text
   - Secondary: Secondary action styling
   - Destructive: For error or destructive actions
   - Outline: Border-only styling
   - Custom: Special styling with configurable dimensions

2. **Features**:
   - Size variants with consistent text styling
   - Custom color support
   - Custom text color support
   - Forwarded ref for DOM access
   - Slot-based composition

## Props
- `variant`: Badge style variant (default, secondary, destructive, outline, custom)
- `asChild`: To compose the badge as a child element
- `customColor`: Custom background color override
- `customTextColor`: Custom text color override
- `className`: Additional CSS classes
- Standard HTML span attributes

## Styling
- Uses `class-variance-authority` for variant management
- Consistent text size (text-xs) and font weight
- Rounded corners (rounded-lg) for default variants
- Custom variant with specific dimensions (22px height, 90px width)
- Padding variations by variant
- Hover states with brightness adjustments
- Custom color support via inline styles

## Implementation Details
- Built with class-variance-authority for styling variants
- Uses Radix UI's Slot for composition
- Implements proper type safety with TypeScript
- Supports custom color overrides
- Includes accessibility considerations
- Handles hover and focus states

## Usage Examples
Badges are used throughout the application for status indicators, tags, notifications, user roles, project status, priority levels, and any other scenarios where a compact, contextual label is needed to convey information quickly.