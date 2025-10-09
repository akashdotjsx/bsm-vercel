# Switch Component

## Overview
The Switch component is a toggle control built on Radix UI primitives that provides an on/off state selector with smooth transitions. It's commonly used for boolean settings and feature toggles.

## Location
- **File**: `/packages/ui/src/components/switch.tsx`
- **Import Path**: `@kroolo/ui/switch`

## Structure
The switch component features:

1. **Switch Root**: Main switch control using Radix UI primitive
2. **Switch Thumb**: Movable thumb element that slides between states
3. **Optional Icon**: Custom icon that can be displayed in the thumb

## Features
- Accessible by default with proper ARIA attributes
- Smooth state transition animations
- Visual differentiation between on/off states
- Focus states with ring indicators
- Disabled state handling
- Custom icon support in the thumb
- Consistent sizing and styling
- Keyboard navigation support

## Props
- Standard Radix UI switch props (checked, onCheckedChange, etc.)
- `icon`: Optional icon to display in the thumb
- `className`: Additional CSS classes
- Forwarded ref for DOM access

## Styling
- Uses Tailwind CSS for consistent styling
- Fixed size (h-4, w-8) with rounded full corners
- Border styling with transparent border
- Checked state with primary color background
- Unchecked state with gray background (#D1D5DB)
- Thumb element with smooth transition
- Checked thumb with translate-x positioning
- Focus states with gray ring
- Disabled state with reduced opacity

## Implementation Details
- Built with Radix UI primitives for accessibility
- Implements proper type safety with TypeScript
- Supports custom icons in the thumb
- Handles checked/unchecked states properly
- Provides smooth transition animations
- Maintains consistent styling across the application

## Usage Examples
Switches are used throughout the application for feature toggles, settings that have on/off states, notification preferences, privacy controls, and any other scenarios where users need to toggle a binary state with a more visual control than a checkbox.