# Tabs Component

## Overview
The Tabs component is a navigation system that allows users to switch between different content sections. It's built on Radix UI primitives and provides accessible, styled tab interfaces.

## Location
- **File**: `/packages/ui/src/components/tabs.tsx`
- **Import Path**: `@kroolo/ui/tabs`

## Structure
The tabs system includes multiple sub-components:

1. **Tabs**: Root component that manages the tab state
2. **TabsList**: Container for tab triggers with flex layout
3. **TabsTrigger**: Individual tab button with active state styling
4. **TabsContent**: Content area that corresponds to each tab

## Features
- Accessible by default with proper ARIA attributes
- Keyboard navigation support
- Active state highlighting
- Hover effects for interactivity
- Prefix and suffix icon support
- Focus states with ring indicators
- Disabled state handling
- Smooth transitions between tabs

## Props
- Standard Radix UI tabs props for each sub-component
- `prefix`: Icon or element to display before tab text
- `suffix`: Icon or element to display after tab text
- `className`: Additional CSS classes
- Forwarded ref for DOM access

## Styling
- Uses Tailwind CSS for consistent styling
- Flex layout for tab list container
- Border styling with bottom border that changes on active state
- Active tab with primary color border and text
- Hover states with background changes
- Focus states with ring indicators
- Proper padding and text sizing
- Text overflow handling with ellipsis

## Implementation Details
- Built with Radix UI primitives for accessibility
- Uses React's forwardRef for DOM access
- Implements proper type safety with TypeScript
- Supports icon integration in tab triggers
- Handles active/inactive states properly
- Provides consistent styling across the application

## Usage Examples
Tabs are used throughout the application for organizing content in settings pages, user profiles, dashboard sections, form steps, report views, and any other scenarios where content needs to be organized into distinct sections that users can switch between easily.