# Custom Text Input Component

## Overview
The Custom Text Input component is a Material UI-based text field with advanced features like labels, helper text, error states, and success indicators. It provides a comprehensive input solution with consistent styling throughout the application.

## Location
- **File**: `/apps/web/src/components/commonComponents/TextInput.jsx`
- **Import Path**: `@/components/commonComponents/TextInput`

## Structure
The text input component consists of:

1. **CustomTextfield**: Styled Material UI TextField with custom styling
2. **TextInput Wrapper**: Main component that handles layout and features
3. **Label Section**: Optional label with proper styling
4. **Mid-text Section**: Optional secondary text below the label
5. **Input Field**: The actual input with various states and features

## Features
- Custom styling with CSS overrides
- Support for labels with styling options
- Helper text display
- Error state with error icon
- Success state with success icon
- Character limit enforcement
- Disabled state handling
- Auto-complete disabling
- Placeholder styling
- Focus and hover states
- Standard input attributes support

## Props
- `label`: Optional label text
- `midText`: Optional secondary text below label
- `maxLength`: Maximum character limit (default 200)
- `errorMessage`: Error message to display when in error state
- `labelStyles`: Additional styles for the label
- `InputProps`: Props for the input component
- `inputProps`: Props for the underlying input element
- `fromSprint`, `fromSprintCreate`: Special layout flags
- Standard TextField props (value, onChange, disabled, error, etc.)

## Styling
- Uses Material UI's styled function for custom styling
- Custom border styling with focus states (var(--btn-color-base))
- Placeholder text styling (#ACB1B9)
- Disabled state styling with different cursor and colors
- Error state with #FDA29B border color
- Scrollbar customization with hidden visibility by default
- Custom padding and font properties (Inter font family)
- Proper spacing and layout with Stack and Grid components

## Implementation Details
- Built with Material UI components
- Uses styled function for custom appearance
- Implements proper error/success state handling
- Supports character count limitation
- Includes accessibility considerations
- Handles disabled states properly
- Provides flexible layout options

## Usage Examples
This text input is used throughout the application for forms, settings, user inputs, search fields, and any other text-based data entry where consistent styling and enhanced features (like error/success states) are needed. The component is particularly useful for forms that require validation feedback, character limits, and clear labeling.