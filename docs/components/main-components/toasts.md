# Toast Notifications Component

## Overview
The Toast Notifications component provides user feedback through various types of notifications. It implements a comprehensive notification system with different visual styles for success, error, warning, and info messages.

## Location
- **File**: `/apps/web/src/components/toast.jsx`
- **Import Path**: `@/components/toast`

## Structure
The toast component exports four main notification functions:

1. **Success Toast** (`toastSuccess`):
   - Visual indicator with success icon
   - Success message display
   - Optional metadata
   - Configurable icon support

2. **Error Toast** (`toastError`):
   - Visual indicator with error icon
   - Error message display
   - Optional metadata
   - Configurable icon support

3. **Warning Toast** (`toastWarning`):
   - Visual indicator with warning icon
   - Warning message display
   - Optional metadata
   - Configurable icon support

4. **Info Toast** (`toastInfo`):
   - Visual indicator with info icon
   - Informational message display
   - Optional metadata
   - Configurable icon support

## Features
- Multiple notification types (success, error, warning, info)
- Customizable icons for each notification type
- Support for metadata in messages
- Configurable message reversal (metadata vs message order)
- Custom styling with CSS classes
- Proper error handling for non-string messages
- Integration with react-toastify library

## Props and Parameters
Each toast function accepts:
- `type`: The type or heading of the notification
- `message`: The main message content
- `metadata`: Additional information to display
- `reverse`: Boolean to reverse message and metadata order
- `icon`: Custom icon component (optional, defaults to type-specific icons)

## Styling
- Uses react-toastify for core functionality
- Custom CSS classes for different notification types
- Styled div containers for message structure
- Custom icons for each notification type
- Proper alignment and text styling
- Consistent visual design with the application theme

## Icons Used
- `Toastifysuccess`: For success notifications
- `InfoIcon`: For error notifications (yellow)
- `ArchiveIcon`: For info notifications
- `ErrorIcon`: For warning notifications

## Implementation Details
- Built on top of react-toastify library
- Uses React functional components
- Implements proper error handling
- Supports dynamic icon swapping
- Includes type checking for message parameters
- Provides consistent notification interface across the application

## Usage Examples
The toast functions are used throughout the application to provide user feedback for various actions such as form submissions, API responses, error states, and informational messages. The functions ensure consistent user experience across different parts of the application.