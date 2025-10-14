# Table Component

## Overview
The Table component is a structured data display system built on HTML table elements but with enhanced styling and accessibility features. It provides consistent table layouts with proper spacing and interaction states.

## Location
- **File**: `/packages/ui/src/components/table.tsx`
- **Import Path**: `@kroolo/ui/table`

## Structure
The table system provides multiple sub-components:

1. **Table**: Main table container with overflow handling
2. **TableHeader**: Header section containing table rows with headings
3. **TableBody**: Body section containing data rows
4. **TableFooter**: Footer section for summary or additional info
5. **TableRow**: Individual row component with hover states
6. **TableHead**: Header cell with proper alignment and styling
7. **TableCell**: Data cell with consistent padding
8. **TableCaption**: Caption for the entire table

## Features
- Responsive design with horizontal scrolling
- Consistent spacing and alignment
- Hover states for rows
- Selected state highlighting
- Proper accessibility attributes
- Border styling between rows
- Custom data-slot attributes for styling
- Overflow handling for wide tables

## Props
- Standard HTML table element attributes for each sub-component
- className for additional styling
- Custom data-slot attributes for styling hooks

## Styling
- Uses Tailwind CSS for consistent styling
- Responsive container with overflow-x handling
- Consistent padding in cells (p-2)
- Hover effects with muted background
- Border styling between rows
- Proper text alignment and wrapping
- Font weights for header vs body content
- Caption styling with muted colors

## Implementation Details
- Built with React functional components
- Uses tailwind-merge for className handling
- Implements proper accessibility with table semantics
- Provides consistent styling across table elements
- Supports selection states
- Handles responsive design with scrollable container

## Usage Examples
Tables are used throughout the application for displaying structured data such as project lists, user information, task details, reports, and any other data that benefits from a tabular format with consistent styling and interaction patterns.