# Progress Component

## Overview
The Progress component is a visual indicator that shows the completion status of a task or process. It's built on Radix UI primitives and provides a consistent progress bar experience.

## Location
- **File**: `/packages/ui/src/components/progress.tsx`
- **Import Path**: `@kroolo/ui/progress`

## Structure
The progress component consists of:

1. **Progress Root**: Main container element with background track
2. **Progress Indicator**: Fill element that shows completion percentage

## Features
- Accessible by default with proper ARIA attributes
- Smooth transition animations
- Customizable value property
- Consistent styling with the primary color
- Responsive design
- Background track with 20% opacity of primary color
- Transform-based indicator movement
- Proper overflow handling

## Props
- `value`: Progress value (0-100) indicating completion percentage
- `className`: Additional CSS classes
- Standard HTML div attributes
- Forwarded ref for DOM access

## Styling
- Uses Tailwind CSS for consistent styling
- Fixed height (h-2) with full width
- Rounded corners (rounded-full) for track and indicator
- Background track with 20% opacity of primary color
- Indicator with primary color fill
- Transform-based position adjustment using translateX
- Smooth transition for movement animations

## Implementation Details
- Built with Radix UI primitives for accessibility
- Uses CSS transforms for performance
- Implements proper type safety with TypeScript
- Calculates position based on value percentage
- Provides smooth transitions for visual feedback
- Maintains consistent styling across the application

## Usage Examples
Progress bars are used throughout the application for file uploads, loading states, task completion, project milestones, user profile completion, and any other scenario where percentage completion needs to be visually indicated to users.