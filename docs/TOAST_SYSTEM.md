# Toast Notification System

## Overview

The toast notification system provides consistent, color-coded notifications across the application with full light/dark mode support.

## Color Coding

| Color | Variant | Use Case | Example Operations |
|-------|---------|----------|-------------------|
| 🟢 Green | `success` | Successful operations | Create, Update, Save, Complete |
| 🔴 Red | `error` | Failed operations | Delete, Error, Validation failure |
| 🟡 Yellow | `warning` | Cautionary messages | Pending approval, Important notice |
| 🔵 Blue | `info` | Informational messages | Tips, General info, Updates |
| ⚪ Gray | `default` | Neutral messages | Generic notifications |

## Usage

### Import

```typescript
import { toast } from '@/lib/toast'
```

### Success (Green)

Use for successful operations like creating, updating, or completing tasks.

```typescript
// Simple success message
toast.success('Service created successfully!')

// With description
toast.success(
  'Service created',
  'Your service request has been submitted and is pending approval.'
)
```

### Error (Red)

Use for errors, failures, deletions, and critical issues.

```typescript
// Simple error message
toast.error('Failed to delete service')

// With description
toast.error(
  'Deletion failed',
  'Unable to delete the service. Please try again later.'
)
```

### Warning (Yellow)

Use for cautionary messages and important notices.

```typescript
// Simple warning message
toast.warning('Service requires approval')

// With description
toast.warning(
  'Pending approval',
  'This service request needs manager approval before processing.'
)
```

### Info (Blue)

Use for general information, tips, and updates.

```typescript
// Simple info message
toast.info('New feature available!')

// With description
toast.info(
  'Workflow updated',
  'The workflow has been updated with new automation rules.'
)
```

### Default (Theme colors)

Use for neutral, generic messages.

```typescript
// Simple default message
toast.default('Settings updated')

// With description
toast.default(
  'Settings updated',
  'Your preferences have been saved.'
)
```

## Real-World Examples

### Service Management

```typescript
// Creating a service
const handleCreate = async (data) => {
  try {
    await createService(data)
    toast.success('Service created', 'Your service is now available in the catalog')
  } catch (error) {
    toast.error('Failed to create service', error.message)
  }
}

// Updating a service
const handleUpdate = async (id, data) => {
  try {
    await updateService(id, data)
    toast.success('Service updated successfully!')
  } catch (error) {
    toast.error('Update failed', 'Unable to update the service')
  }
}

// Deleting a service
const handleDelete = async (id) => {
  try {
    await deleteService(id)
    toast.error('Service deleted', 'The service has been removed from the catalog')
  } catch (error) {
    toast.error('Deletion failed', 'Unable to delete the service')
  }
}
```

### Workflow Management

```typescript
// Import workflow
const handleImport = async (file) => {
  try {
    const result = await importWorkflow(file)
    toast.success('Workflow imported', `Successfully imported ${result.name}`)
  } catch (error) {
    toast.error('Import failed', error.message)
  }
}

// Publish workflow
const handlePublish = async (id) => {
  try {
    await publishWorkflow(id)
    toast.success('Workflow published', 'Your workflow is now active')
  } catch (error) {
    toast.error('Publishing failed', 'Unable to publish the workflow')
  }
}

// Draft workflow (warning example)
const handleSaveDraft = async (id, data) => {
  try {
    await saveDraft(id, data)
    toast.warning('Draft saved', 'Remember to publish your workflow to make it active')
  } catch (error) {
    toast.error('Save failed', 'Unable to save the draft')
  }
}
```

### Ticket Management

```typescript
// Assign ticket
const handleAssign = async (ticketId, userId) => {
  try {
    await assignTicket(ticketId, userId)
    toast.success('Ticket assigned', 'The assignee has been notified')
  } catch (error) {
    toast.error('Assignment failed', 'Unable to assign the ticket')
  }
}

// Close ticket
const handleClose = async (ticketId) => {
  try {
    await closeTicket(ticketId)
    toast.success('Ticket closed successfully!')
  } catch (error) {
    toast.error('Failed to close ticket', error.message)
  }
}

// Info notification
const handleComment = async (ticketId, comment) => {
  try {
    await addComment(ticketId, comment)
    toast.info('Comment added', 'Your comment has been posted')
  } catch (error) {
    toast.error('Failed to add comment', error.message)
  }
}
```

## Migration from Sonner

If your code currently uses `sonner`:

### Before
```typescript
import { toast } from 'sonner'

toast.success('Service created')
toast.error('Failed to delete')
```

### After
```typescript
import { toast } from '@/lib/toast'

toast.success('Service created')
toast.error('Failed to delete')
```

The API is identical! Just change the import path.

## Dark Mode Support

All toast variants automatically adapt to light and dark modes:

- **Light Mode**: Light backgrounds with dark text
- **Dark Mode**: Dark backgrounds with light text

The borders remain vibrant in both modes for clear visual distinction.

## Best Practices

1. **Use appropriate colors**: Match the toast variant to the operation type
2. **Be concise**: Keep titles short and descriptive
3. **Provide context**: Use descriptions for important details
4. **Consistent language**: Use active voice and clear terminology
5. **Error details**: Include helpful error messages when operations fail

### ✅ Good Examples

```typescript
toast.success('Service created successfully!')
toast.error('Failed to delete service', 'The service is currently in use')
toast.warning('Approval required', 'This request needs manager approval')
toast.info('New workflow available')
```

### ❌ Bad Examples

```typescript
toast.default('Service created') // Should be success (green)
toast.success('Service deleted') // Should be error (red) for deletions
toast.error('Service created successfully') // Wrong variant for success
toast.warning('Error occurred') // Should be error (red) for errors
```

## Technical Details

### Components

- **Toast Provider**: `/components/ui/toast.tsx`
- **Toast Hook**: `/hooks/use-toast.ts`
- **Toast Utility**: `/lib/toast.ts`
- **Toaster Component**: `/components/ui/toaster.tsx`

### Variants

All variants are defined in `toast.tsx` using `class-variance-authority`:

```typescript
variant: {
  default: "border border-border bg-background text-foreground",
  success: "border-2 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-50",
  error: "border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-50",
  warning: "border-2 border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-50",
  info: "border-2 border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-50",
}
```

### Positioning

Toasts appear in the **top-right corner** on desktop and **top of screen** on mobile.

### Duration

Default duration is set in `use-toast.ts`:
- `TOAST_REMOVE_DELAY = 1000000` (approximately 16 minutes)

You can customize this by modifying the constant.

## Troubleshooting

### Toast not appearing

1. Ensure `<Toaster />` is included in your layout
2. Check that you're importing from the correct path
3. Verify the toast provider is wrapping your app

### Colors not showing correctly

1. Check your Tailwind config includes the necessary color classes
2. Ensure dark mode is properly configured in your theme
3. Verify the variant is spelled correctly

### TypeScript errors

Make sure you have the latest type definitions:

```typescript
// In use-toast.ts
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}
```

## Future Enhancements

- [ ] Add custom duration per toast
- [ ] Add action buttons to toasts
- [ ] Add dismiss callbacks
- [ ] Add toast positioning options
- [ ] Add sound notifications
- [ ] Add undo functionality for delete operations
