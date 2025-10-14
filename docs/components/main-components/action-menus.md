# Action Menus Component

## Overview
The Action Menus component provides various context and action menus throughout the application. These are implemented using Material UI's Menu component with custom styling to match the application's design system.

## Location
- **Primary File**: `/apps/web/src/components/commonComponents/CustomMenus/CustomMenu.jsx`
- **Import Path**: `@/components/commonComponents/CustomMenus/CustomMenu`

## Structure
The action menus system provides three main styled menu components:

1. **CustomMenuList**:
   - Default width of 182px
   - Custom styling with border, shadow and background
   - Proper spacing and padding for menu items
   - Support for icons in menu items
   - Hover effects with custom background color

2. **EditorMenuList**:
   - Similar to CustomMenuList but with additional props
   - Configurable anchor and transform origins
   - Designed for use in editor contexts
   - Maintains consistent styling with other menus

3. **CustomMenuListWithIcon**:
   - Adapts width to content size ("fit-content")
   - Optimized for menus with icons
   - Different height specifications for menu items
   - Preserves icon functionality in menu items

## Features
- Custom styling that matches the application theme
- Support for icons within menu items
- Hover state management
- Proper positioning with anchor and transform origins
- Click propagation stopping to prevent unexpected behavior
- Configurable dimensions
- Accessibility support through Material UI
- Focus and selection management

## Props
- Standard Material UI Menu props
- Custom PaperProps for styling
- rootProps for root element customization
- transformOrigin and anchorOrigin for positioning
- Additional props for styling customization

## Styling
- Uses Material UI's styled function for custom components
- Custom CSS variables for theme consistency
- Border styling with `--datepicker-border-color` and `--menu-border`
- Background color with `--black-1000` variable
- Shadow styling with `--popover-shadow` variable
- Proper padding and spacing for menu items
- Hover effect with `--url-color` variable
- Disabled state styling

## Implementation Details
- Built on top of Material UI's Menu component
- Uses React's styled function for custom styling
- Implements proper event handling with stopPropagation
- Uses component composition for different menu types
- Supports various menu configurations
- Maintains consistent styling across the application

## Usage Contexts
The action menus are used in various parts of the application including:
- Avatar/profile menus
- Context menus for items
- Toolbar dropdowns
- Navigation menus
- Setting options
- Status selection menus
- Custom action triggers

## Integration
- Works with application's theme system
- Integrates with user interaction patterns
- Connects with application state management
- Supports feature flag controls
- Compatible with other UI components