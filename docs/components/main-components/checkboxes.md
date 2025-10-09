# Checkbox Component

## Overview
The Checkbox component is an accessible form control built on Radix UI primitives. It provides a consistent, styled checkbox with proper focus management and accessibility features.

## Location
- **File**: `/packages/ui/src/components/checkbox.tsx`
- **Import Path**: `@kroolo/ui/checkbox`

## Structure
The checkbox component includes:

1. **Checkbox Root**: Main checkbox control using Radix UI primitive
2. **Checkbox Indicator**: Visual indicator (checkmark) that appears when checked
3. **Optional Label**: Text label associated with the checkbox
4. **Direction Control**: Option for column or row layout

## Features
- Accessible by default with proper ARIA attributes
- Keyboard navigation support
- Focus states with visual indicators
- Checked state with checkmark icon
- Disabled state handling
- Error state styling
- Label integration
- Direction control (horizontal/vertical layout)
- Custom styling with consistent design

## Props
- Standard Radix UI checkbox props
- `label`: Optional text label for the checkbox
- `directionCol`: Boolean to control layout direction
- `className`: Additional CSS classes
- Forwarded ref for DOM access

## Styling
- Uses Tailwind CSS for consistent styling
- Size of 4 (16px) with square shape
- Rounded corners (rounded-[4px])
- Border styling that changes on checked state
- Background color changes when checked
- Disabled state opacity
- Error state border styling
- Checkmark icon styling with white color

## Implementation Details
- Built with Radix UI primitives for accessibility
- Uses Lucide React for checkmark icon
- Implements proper type safety with TypeScript
- Includes focus management and keyboard support
- Supports label association
- Handles checked/unchecked states properly
- Provides consistent styling across the application

## Usage Examples
Checkboxes are used throughout the application for form inputs, selection lists, agreement confirmations, filter options, and any other scenarios where users need to make binary choices or select multiple items from a list.