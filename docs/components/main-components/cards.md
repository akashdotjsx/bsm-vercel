# Card Component

## Overview
The Card component is a versatile container for grouping related content. It provides a consistent UI pattern for displaying information with header, content, and footer sections.

## Location
- **File**: `/packages/ui/src/components/card.tsx`
- **Import Path**: `@kroolo/ui/card`

## Structure
The card system consists of multiple sub-components:

1. **Card**: Main container with border, background, and shadow
2. **CardHeader**: Header section with space for title and description
3. **CardTitle**: Title element within the card header
4. **CardDescription**: Description text for the card
5. **CardContent**: Main content area of the card
6. **CardFooter**: Footer section for actions or additional info

## Features
- Consistent styling with borders and shadows
- Flexible layout structure
- Proper spacing and typography
- Accessible markup structure
- Component composition design
- Customizable styling via className

## Props
- `className`: Additional CSS classes to apply
- Standard HTML div attributes for all sub-components

## Styling
- Uses Tailwind CSS for consistent styling
- Rounded corners (rounded-xl)
- Border styling with shadow
- Background using CSS variable `--popover`
- Proper padding in header and content sections
- Typography styling with specific font sizes and weights

## Implementation Details
- Built with React functional components
- Uses tailwind-merge for className handling
- Implements proper type safety with TypeScript
- Supports composition of card elements
- Maintains consistent design language
- Handles accessibility properly

## Usage Examples
Cards are used in the application for displaying information panels, user profiles, feature highlights, dashboard widgets, and other content groupings that require a distinct container with optional header and footer sections.