# Navbar Component

## Overview
The Navbar component is a top navigation bar implemented in the Kroolo application. It serves as the primary navigation hub, containing the application logo, user profile menu, notifications, and other important UI elements.

## Location
- **File**: `/apps/web/src/components/Navbar/Navbar.jsx`
- **Import Path**: `@/components/Navbar/Navbar`

## Structure
The navbar consists of several key elements:

1. **Logo Section**:
   - Displays light/dark theme variants of the Kroolo logo
   - Links to the main dashboard page
   - Responsive design for different screen sizes

2. **Collapsible Component**:
   - Space for additional collapsible elements
   - Responsive design accommodation

3. **Search Feature**:
   - Universal search button (feature flagged)
   - Search functionality in the center of the navbar

4. **Timer Integration**:
   - Time tracking timer (feature flagged)
   - Running timer display for time tracking functionality

5. **Organization Switcher**:
   - Multi-org account switcher (feature flagged)
   - Allows users to switch between organizations

6. **Theme Toggle**:
   - Dark/light mode toggle
   - Part of the common components

7. **Help Center**:
   - Access to help and support (feature flagged)
   - Support and documentation access

8. **Notifications**:
   - Notification component
   - Displays user notifications

9. **Avatar Menu**:
   - User profile menu accessed via avatar click
   - Contains user profile information and settings

## Features and Functionality
- **Fixed Position**: Positioned fixed at the top of the screen
- **Responsive Design**: Includes responsive navigation elements
- **Feature Flags**: Several components are controlled by feature flags
- **Theme Support**: Adapts to light/dark theme changes
- **Workspace Integration**: Connects to workspace-related functionality

## Dependencies
- React (for component structure)
- React Router DOM (for navigation)
- Material UI (AppBar, Box, styled components)
- Custom stores (theme, company, project, sidebar, setup stores)
- Feature flags system
- Custom components (ColorModeSwitch, AvatarMenuComponent, NotificationComponent, etc.)

## Styling
- Uses Material UI's styled function for custom styling
- Includes custom CSS variables for colors and themes
- Responsive design considerations
- Border styling with `--card-border-color` variable
- Fixed height (NAV_HEIGHT constant)

## Integration
- Integrates with multiple stores for real-time data updates
- Connects to sidebar functionality
- Works with universal search feature
- Supports multi-org functionality