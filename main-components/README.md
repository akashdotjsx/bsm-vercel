# Kroolo Frontend Main Components Analysis

## Overview
This repository contains the frontend code for Kroolo, a project management and productivity platform built as a monorepo using pnpm and Turborepo. The application is built with React, TypeScript, and various UI libraries.

## Technology Stack
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS, Material UI, styled-components
- **UI Components**: Radix UI primitives, Material UI components, Custom UI components
- **State Management**: Zustand stores
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Monorepo**: pnpm workspaces + Turborepo

## Main Components Identified

### UI Components (from packages/ui)
1. **Navbar Component**
   - **Location**: `/apps/web/src/components/Navbar/Navbar.jsx`
   - **Purpose**: Top navigation bar with logo, profile menu, notifications, and other UI elements

2. **Button Component**
   - **Location**: `/packages/ui/src/components/button.tsx`
   - **Purpose**: Reusable button component with multiple variants and sizes

3. **Dropdown Menu Component**
   - **Location**: `/packages/ui/src/components/dropdown-menu.tsx`
   - **Purpose**: Accessible dropdown menu system

4. **Input Component**
   - **Location**: `/packages/ui/src/components/input.tsx`
   - **Purpose**: Customizable text input field with support for prefixes and suffixes

5. **Card Component**
   - **Location**: `/packages/ui/src/components/card.tsx`
   - **Purpose**: Versatile container for grouping related content

6. **Table Component**
   - **Location**: `/packages/ui/src/components/table.tsx`
   - **Purpose**: Structured data display system

7. **Checkbox Component**
   - **Location**: `/packages/ui/src/components/checkbox.tsx`
   - **Purpose**: Accessible form control with proper focus management

8. **Avatar Component**
   - **Location**: `/packages/ui/src/components/avatar.tsx`
   - **Purpose**: User profile image display element with fallback support

9. **Badge Component**
   - **Location**: `/packages/ui/src/components/badge.tsx`
   - **Purpose**: Small status indicator with contextual information

10. **Tabs Component**
    - **Location**: `/packages/ui/src/components/tabs.tsx`
    - **Purpose**: Navigation system for switching between content sections

11. **Switch Component**
    - **Location**: `/packages/ui/src/components/switch.tsx`
    - **Purpose**: Toggle control for on/off state selection

12. **Tooltip Component**
    - **Location**: `/packages/ui/src/components/tooltip.tsx`
    - **Purpose**: Popup that displays helpful information on hover/focus

13. **Progress Component**
    - **Location**: `/packages/ui/src/components/progress.tsx`
    - **Purpose**: Visual indicator showing completion status

14. **Scroll Area Component**
    - **Location**: `/packages/ui/src/components/scroll-area.tsx`
    - **Purpose**: Customizable scrolling container with styled scrollbars

15. **Accordion Component**
    - **Location**: `/packages/ui/src/components/accordion.tsx`
    - **Purpose**: Collapsing container for expandable content sections

16. **Popover Component**
    - **Location**: `/packages/ui/src/components/popover.tsx`
    - **Purpose**: Floating panel that displays content relative to a trigger

17. **Dialog/Modal Component**
    - **Location**: `/packages/ui/src/components/dialog.tsx`
    - **Purpose**: Modal windows for user interactions

18. **Action Menus Component**
    - **Location**: `/apps/web/src/components/commonComponents/CustomMenus/CustomMenu.jsx`
    - **Purpose**: Context and action menus throughout the application

### Application-Specific Components (from apps/web)
19. **Profile Menu Component**
    - **Location**: `/apps/web/src/components/Dashboard/common/AvatarMenuComponent.jsx`
    - **Purpose**: User profile dropdown with account information and settings

20. **Toast Notifications Component**
    - **Location**: `/apps/web/src/components/toast.jsx`
    - **Purpose**: User feedback notifications

21. **Custom Text Input Component**
    - **Location**: `/apps/web/src/components/commonComponents/TextInput.jsx`
    - **Purpose**: Material UI-based text field with advanced features

## Component Architecture
The application follows a modular component architecture with:
- Shared UI components in the `packages/ui` directory
- Application-specific components in the `apps/web/src/components` directory
- Custom styling that integrates with Material UI
- Consistent theming using CSS variables
- Feature flag-based component visibility
- State management through multiple specialized stores

## Key UI Libraries and Dependencies
- **Radix UI**: For accessible component primitives
- **Material UI**: For comprehensive component library
- **Tailwind CSS**: For utility-first styling
- **React Icons**: For icon components
- **Lucide React**: For additional icon set
- **Styled Components**: For custom component styling

## Component Reusability
The architecture promotes reusability with:
- A shared UI package (`@kroolo/ui`) containing reusable components
- Consistent API design across components
- Theme integration using CSS variables
- TypeScript interfaces for type safety
- Component composition patterns

## Design System Principles
- Consistent spacing and typography
- Accessible by default
- Theme support (light/dark modes)
- Responsive design
- Proper interaction states (hover, focus, active, disabled)
- Custom styling that matches brand identity