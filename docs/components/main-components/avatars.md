# Avatar Component

## Overview
The Avatar component is a user profile image display element with fallback support. It provides consistent styling for user profile pictures throughout the application with proper fallback when images are unavailable.

## Location
- **File**: `/packages/ui/src/components/avatar.tsx`
- **Import Path**: `@kroolo/ui/avatar`

## Structure
The avatar system includes three sub-components:

1. **Avatar**: Main container element with circular shape
2. **AvatarImage**: Image element for user profile picture
3. **AvatarFallback**: Fallback element when image fails to load

## Features
- Circular shape with consistent sizing
- Proper image loading with error fallback
- Initials display as fallback
- Consistent styling across the application
- Accessibility support with proper semantic structure
- Responsive design
- Loading state handling

## Props
- Standard HTML div attributes for Avatar
- Standard HTML img attributes for AvatarImage
- Standard HTML div attributes for AvatarFallback
- className for additional styling
- Forwarded ref for DOM access

## Styling
- Uses Tailwind CSS for consistent styling
- Circular shape with rounded-full
- Fixed size (default 40px)
- Overflow hidden for circular cropping
- Fallback background color (#f2f4f7)
- Fallback text color (#ff3465)
- Aspect square for images
- Consistent layout with flexbox

## Implementation Details
- Built with Radix UI primitives for proper structure
- Uses React forwardRef for DOM access
- Implements proper fallback mechanism
- Provides consistent styling across the app
- Handles image loading errors gracefully
- Includes proper accessibility attributes

## Usage Examples
Avatars are used throughout the application for user profiles, team member lists, comment sections, user mentions, navigation menus, and any other place where user identity needs to be visually represented in a consistent manner.