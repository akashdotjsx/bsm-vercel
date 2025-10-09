# MultiAssigneeAvatars Component

## Overview
A reusable component that displays assignee avatars with support for multiple assignees. Shows up to a configurable number of avatars (default: 3) and displays a "+N" badge for additional assignees.

## Features
- ✅ Displays up to 3 assignees by default (configurable)
- ✅ Shows "+N" badge for remaining assignees
- ✅ Supports avatar images or initials
- ✅ Three size variants: sm, md, lg
- ✅ Overlapping avatar layout with proper z-index
- ✅ Hover tooltips showing assignee names
- ✅ Handles unassigned state with "?" placeholder

## Usage

### Basic Usage
```tsx
import { MultiAssigneeAvatars } from '@/components/tickets/multi-assignee-avatars'

<MultiAssigneeAvatars
  assignees={[
    {
      id: '123',
      name: 'John Doe',
      avatar: 'JD',
      display_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe'
    },
    {
      id: '456',
      name: 'Jane Smith',
      avatar: 'JS',
      display_name: 'Jane Smith'
    }
  ]}
  maxDisplay={3}
  size="sm"
/>
```

### With Avatar Images
```tsx
<MultiAssigneeAvatars
  assignees={[
    {
      id: '123',
      name: 'John Doe',
      avatar: 'JD',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  ]}
/>
```

### Different Sizes
```tsx
// Small (default) - 24px
<MultiAssigneeAvatars assignees={assignees} size="sm" />

// Medium - 32px
<MultiAssigneeAvatars assignees={assignees} size="md" />

// Large - 40px
<MultiAssigneeAvatars assignees={assignees} size="lg" />
```

### Custom Max Display
```tsx
// Show up to 5 assignees before showing +N
<MultiAssigneeAvatars 
  assignees={assignees} 
  maxDisplay={5} 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `assignees` | `Assignee[]` | **required** | Array of assignee objects |
| `maxDisplay` | `number` | `3` | Maximum number of avatars to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Size of the avatars |
| `className` | `string` | `undefined` | Additional CSS classes |

### Assignee Type
```typescript
interface Assignee {
  id: string
  name: string
  avatar: string              // Initials or avatar text
  avatar_url?: string         // Optional image URL
  display_name?: string       // Display name for tooltip
  first_name?: string
  last_name?: string
}
```

## Visual Examples

### Single Assignee
```
[ JD ]
```

### Two Assignees
```
[ JD ][ JS ]
```

### Three Assignees
```
[ JD ][ JS ][ AB ]
```

### More Than Three (shows +N badge)
```
[ JD ][ JS ][ AB ][ +2 ]
```

### Unassigned
```
[ ? ]
```

## Implementation in Tickets

### Main Tickets Page
The component is now used in `/app/(dashboard)/tickets/page.tsx`:

```tsx
<td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
  <div className="flex items-center">
    <MultiAssigneeAvatars
      assignees={ticket.assignees || []}
      maxDisplay={3}
      size="sm"
    />
  </div>
</td>
```

### My Tickets Page
Also integrated in `/app/(dashboard)/tickets/my-tickets/page.tsx`:

```tsx
<MultiAssigneeAvatars
  assignees={ticket.assignee ? [{
    id: ticket.assignee_id || ticket.assignee.id,
    name: ticket.assignee.display_name || ticket.assignee.email,
    avatar: (ticket.assignee.first_name?.[0] || '') + (ticket.assignee.last_name?.[0] || ''),
    display_name: ticket.assignee.display_name,
    first_name: ticket.assignee.first_name,
    last_name: ticket.assignee.last_name,
    avatar_url: ticket.assignee.avatar_url
  }] : []}
  maxDisplay={3}
  size="sm"
/>
```

## Future Enhancements

When the backend adds support for multiple assignees per ticket:

1. **Database Schema Update** (future)
   ```sql
   CREATE TABLE ticket_assignees (
     ticket_id UUID REFERENCES tickets(id),
     user_id UUID REFERENCES profiles(id),
     PRIMARY KEY (ticket_id, user_id)
   );
   ```

2. **GraphQL Query Update** (future)
   ```graphql
   query GetTicket($id: UUID!) {
     ticketsCollection(filter: { id: { eq: $id } }) {
       edges {
         node {
           id
           assignees: ticket_assigneesCollection {
             edges {
               node {
                 user: profiles {
                   id
                   display_name
                   first_name
                   last_name
                   avatar_url
                 }
               }
             }
           }
         }
       }
     }
   }
   ```

3. **Data Transformation** (future)
   ```typescript
   assignees: ticket.assignees?.edges.map(e => ({
     id: e.node.user.id,
     name: e.node.user.display_name,
     avatar: getAvatarInitials(e.node.user.first_name, e.node.user.last_name),
     ...e.node.user
   })) || []
   ```

## Styling

The component uses:
- Tailwind CSS for styling
- Custom colors: `#6E72FF` for assignee avatars
- Muted background for unassigned and +N badge
- Ring borders for proper overlapping effect
- Z-index for proper stacking order

## Accessibility

- All avatars include `title` attributes for tooltips
- Proper color contrast for text on backgrounds
- Semantic HTML structure
