# Toast System Quick Reference

## 🚀 Quick Start

### Import
```typescript
import { toast } from '@/lib/toast'
```

### Usage Examples

#### ✅ Success (Green) - Create/Update Operations
```typescript
toast.success('Ticket created successfully!')
toast.success('Asset updated', 'Your changes have been saved')
```

#### ❌ Error (Red) - Delete/Failure Operations
```typescript
toast.error('Ticket deleted', 'The ticket has been removed')
toast.error('Failed to load data', 'Please try again')
```

#### ⚠️ Warning (Yellow) - Caution Messages
```typescript
toast.warning('Approval required', 'Manager approval needed')
toast.warning('Draft saved', 'Remember to publish')
```

#### ℹ️ Info (Blue) - General Information
```typescript
toast.info('Comment added', 'Your comment has been posted')
toast.info('New feature available!')
```

## 📋 When to Use Which Color

| Action | Color | Method | Example |
|--------|-------|--------|---------|
| Create | 🟢 Green | `toast.success()` | `toast.success('Service created')` |
| Update | 🟢 Green | `toast.success()` | `toast.success('Ticket updated')` |
| **Delete** | 🔴 **Red** | `toast.error()` | `toast.error('Item deleted')` |
| Failure | 🔴 Red | `toast.error()` | `toast.error('Operation failed')` |
| Warning | 🟡 Yellow | `toast.warning()` | `toast.warning('Action required')` |
| Info | 🔵 Blue | `toast.info()` | `toast.info('Tip: Use shortcuts')` |

## ⚡ Common Patterns

### CRUD Operations
```typescript
// Create
await create(data)
toast.success('Item created successfully!')

// Read (no toast usually)
const data = await fetch()

// Update
await update(id, data)
toast.success('Item updated successfully!')

// Delete - ALWAYS USE ERROR (RED)!
await delete(id)
toast.error('Item deleted', 'The item has been removed')
```

### Error Handling
```typescript
try {
  await operation()
  toast.success('Operation completed!')
} catch (error) {
  toast.error('Operation failed', error.message)
}
```

### With Descriptions
```typescript
toast.success(
  'Title here',
  'Description with more details here'
)
```

## 🌓 Dark Mode

All toast colors automatically adapt to light/dark mode:
- ✅ Fully tested and working
- ✅ High contrast in both modes
- ✅ Consistent brand colors

## ❌ Common Mistakes

### DON'T use success for deletions
```typescript
// ❌ WRONG
toast.success('Ticket deleted')

// ✅ CORRECT
toast.error('Ticket deleted', 'The ticket has been removed')
```

### DON'T use generic messages
```typescript
// ❌ WRONG
toast.error('Error occurred')

// ✅ CORRECT
toast.error('Failed to create ticket', 'Invalid data provided')
```

### DON'T import from wrong source
```typescript
// ❌ WRONG
import { toast } from 'sonner'
import { useToast } from '@/hooks/use-toast'

// ✅ CORRECT
import { toast } from '@/lib/toast'
```

## 📦 Single Source of Truth

**Always import from**: `@/lib/toast`

This ensures:
- ✅ Consistent styling
- ✅ Color-coded notifications
- ✅ Dark mode support
- ✅ Centralized updates

## 🔍 Need More Help?

- Full documentation: `docs/TOAST_SYSTEM.md`
- Migration guide: `docs/TOAST_MIGRATION_GUIDE.md`
- Implementation summary: `docs/TOAST_IMPLEMENTATION_SUMMARY.md`
- Audit script: `scripts/audit-fix-toasts.sh`
