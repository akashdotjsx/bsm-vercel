# Profile Menu Component

## Overview
The Profile Menu component is a user profile dropdown menu that provides access to user-specific actions, settings, and information. It's implemented as an Avatar-based menu that appears when the user clicks on their profile avatar in the navbar.

## Location
- **File**: `/apps/web/src/components/Dashboard/common/AvatarMenuComponent.jsx`
- **Import Path**: `@/components/Dashboard/common/AvatarMenuComponent`

## Structure
The profile menu consists of several key sections:

1. **User Information Section**:
   - User avatar with initials or image
   - User name and email display
   - Visual representation of user profile status

2. **Status Management**:
   - Current status display with color indicator
   - "Set a status" button
   - Status menu with predefined options
   - Custom status editing capability
   - Color selection for custom statuses

3. **Account Information**:
   - Current account/organization name
   - Account ID (for Owner/Admin roles)
   - Demo account indicator
   - Current plan information

4. **Navigation Menu**:
   - My Profile link
   - Change Password link
   - Switch Account option
   - Settings link
   - Log out option

5. **Modals**:
   - Switch Account Modal
   - Logout Modal
   - Calling Component (for voice/video calls)

## Features
- User profile information display
- Status management with preset options
- Custom status setting with text and color
- Account switching capability
- Plan information display
- Current time display (local time)
- Demo account indication
- Role-based menu options
- Image loading with fallback for avatars

## Dependencies
- React hooks (useState, useEffect, useMemo)
- React Router DOM (for navigation links)
- Material UI components (Avatar, IconButton, MenuItem, Tooltip, Typography, etc.)
- Custom hooks (useMenu)
- State management stores (auth, setup, company, settings, multiorg, billing, stripe, workspace)
- Feature flags system
- Custom icons and SVG components
- Utility functions (normalizeImageUrl, stopPropagation)

## Styling
- Uses Material UI components with custom styling
- Custom CSS variables for theme consistency
- Responsive design considerations
- Color-coded status indicators
- Proper spacing and layout with Grid and Box components
- Custom menu styling with shadow and border properties

## Functionality
- Status change handling with API updates
- Custom status editing with keyboard support
- Account switching with modal interface
- Profile image fallback to initials
- Time display in local format
- Plan upgrade options for non-business plans

## Integration
- Integrates with multiple application stores
- Connects to user profile APIs
- Links to settings pages
- Works with authentication system
- Supports multi-org functionality
- Connects to billing information