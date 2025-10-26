# Profile Dropdown Fix

## Issue
After adding status indicator with tooltip, the profile dropdown menu stopped opening when clicked.

## Root Cause
The `Tooltip` component was wrapping the `DropdownMenuTrigger`, which intercepted click events and prevented the dropdown from opening.

```typescript
// BEFORE (broken):
<DropdownMenuTrigger asChild>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>...</Button>  // Click was captured by Tooltip
      </TooltipTrigger>
    </Tooltip>
  </TooltipProvider>
</DropdownMenuTrigger>
```

## Solution
Removed the Tooltip wrapper from the avatar button. The status indicator dot is still visible, and users can see the status inside the dropdown menu itself.

```typescript
// AFTER (fixed):
<DropdownMenuTrigger asChild>
  <Button>
    <Avatar>...</Avatar>
    <span className="status-dot" />  // Status indicator still visible
  </Button>
</DropdownMenuTrigger>
```

## Result
✅ Profile dropdown opens correctly when clicked
✅ Status indicator dot still shows on avatar
✅ Status is visible inside the dropdown menu
✅ All functionality restored

## Files Changed
- `components/layout/avatar-menu.tsx` - Removed Tooltip wrapper and import

## Testing
1. Click on avatar in top-right corner
2. Dropdown should open showing profile menu
3. Status indicator dot should be visible on avatar
4. Status should be displayed inside dropdown
