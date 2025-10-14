# Toast System Migration Guide

## Overview

This guide helps you migrate from `sonner` to the new color-coded toast system.

## Quick Migration Steps

### 1. Update Import Statement

**Before:**
```typescript
import { toast } from 'sonner'
```

**After:**
```typescript
import { toast } from '@/lib/toast'
```

### 2. Update Toast Calls

The API remains the same! Just ensure you're using the right method for the operation:

#### Success Operations (Green) ✅
Use for: Create, Update, Save, Complete

**Examples:**
```typescript
// Service created
toast.success('Service created successfully!')

// Request submitted
toast.success('Request submitted', 'Your request is being processed')

// Workflow published
toast.success('Workflow published', 'Your workflow is now active')

// Ticket resolved
toast.success('Ticket resolved successfully!')
```

#### Error Operations (Red) ❌
Use for: Delete, Failure, Validation errors

**Examples:**
```typescript
// Deletion (always use error/red for deletions)
toast.error('Service deleted', 'The service has been removed')

// Failed operation
toast.error('Failed to load data', 'Please try again later')

// Validation error
toast.error('Validation failed', 'Please check all required fields')

// Network error
toast.error('Connection failed', 'Unable to reach the server')
```

#### Warning Operations (Yellow) ⚠️
Use for: Caution, Pending actions

**Examples:**
```typescript
// Approval needed
toast.warning('Approval required', 'This request needs manager approval')

// Draft saved
toast.warning('Draft saved', 'Remember to publish your changes')

// Limit approaching
toast.warning('Storage limit', 'You are approaching your storage limit')
```

#### Info Operations (Blue) ℹ️
Use for: General information, Tips

**Examples:**
```typescript
// New feature
toast.info('New feature available!')

// Comment added
toast.info('Comment added', 'Your comment has been posted')

// Settings updated
toast.info('Settings updated', 'Your preferences have been saved')
```

## Files to Update

Run this command to find all files using toast:

```bash
grep -r "toast\." app/ components/ hooks/ --include="*.tsx" --include="*.ts"
```

### Current Toast Usage

Based on the codebase scan, here are the files that need updating:

1. **Service Pages**
   - `app/(dashboard)/services/page.tsx` ✅ (Updated)
   - `components/services/service-catalog.tsx`
   - `components/services/service-request-details.tsx`
   - `components/services/service-request-drawer.tsx`

2. **Ticket Pages**
   - `app/(dashboard)/tickets/page.tsx`
   - `app/(dashboard)/tickets/[id]/page.tsx`
   - `components/tickets/ticket-drawer.tsx`

3. **Asset Pages**
   - `app/(dashboard)/assets/page.tsx`

4. **Admin Pages**
   - `app/(dashboard)/admin/service-requests/page.tsx`

5. **User Pages**
   - `app/(dashboard)/users/page.tsx`

## Common Patterns to Update

### Pattern 1: Success after creation

**Before:**
```typescript
toast.success('Created successfully')
```

**After:**
```typescript
toast.success('Service created successfully!') // More specific
```

### Pattern 2: Error handling

**Before:**
```typescript
toast.error('Error occurred')
```

**After:**
```typescript
toast.error('Failed to load data', error.message) // Add context
```

### Pattern 3: Delete operations

**Important:** Always use `error` (red) for deletions!

**Before:**
```typescript
toast.success('Deleted successfully')
```

**After:**
```typescript
toast.error('Service deleted', 'The service has been removed')
```

### Pattern 4: Info messages

**Before:**
```typescript
toast('Settings updated') // Generic
```

**After:**
```typescript
toast.info('Settings updated', 'Your preferences have been saved')
```

## Automated Migration Script

Save this as `scripts/migrate-toasts.sh`:

```bash
#!/bin/bash

# Find and replace toast imports
find app components hooks -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/from "sonner"/from "@\/lib\/toast"/g' \
  -e "s/from 'sonner'/from '@\/lib\/toast'/g" \
  {} +

echo "✅ Toast imports updated!"
echo ""
echo "Next steps:"
echo "1. Review each file to ensure correct toast variant usage"
echo "2. Update deletion operations to use toast.error() (red)"
echo "3. Update success operations to use toast.success() (green)"
echo "4. Test in both light and dark modes"
```

Make it executable:
```bash
chmod +x scripts/migrate-toasts.sh
./scripts/migrate-toasts.sh
```

## Testing Checklist

After migration, test each toast variant:

- [ ] Success toast appears in green with proper text
- [ ] Error toast appears in red with proper text
- [ ] Warning toast appears in yellow with proper text
- [ ] Info toast appears in blue with proper text
- [ ] All toasts work in light mode
- [ ] All toasts work in dark mode
- [ ] Toast close button is visible and works
- [ ] Multiple toasts stack properly
- [ ] Toasts auto-dismiss after delay

## Troubleshooting

### Toast not appearing

1. Check the Toaster component is in your layout:
```typescript
// In app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Wrong colors showing

Make sure you're using the correct variant:
- ✅ Success → `toast.success()`
- ❌ Error/Delete → `toast.error()`
- ⚠️ Warning → `toast.warning()`
- ℹ️ Info → `toast.info()`

### TypeScript errors

If you get type errors, ensure you have the latest toast types:
```typescript
// Should be auto-imported from '@/lib/toast'
import { toast } from '@/lib/toast'
```

## Benefits of New System

1. **Consistent UX**: All toasts follow the same color conventions
2. **Better accessibility**: Color-coded toasts help users quickly understand message severity
3. **Dark mode support**: Fully optimized for both light and dark themes
4. **Type safety**: Full TypeScript support with IntelliSense
5. **Centralized control**: Easy to update toast behavior across the entire app

## Support

For questions or issues with the migration, refer to:
- Main documentation: `docs/TOAST_SYSTEM.md`
- Component code: `components/ui/toast.tsx`
- Hook code: `hooks/use-toast.ts`
- Utility code: `lib/toast.ts`
