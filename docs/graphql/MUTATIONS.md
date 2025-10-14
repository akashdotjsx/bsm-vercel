# GraphQL Mutations - Complete Reference

## 🎯 Overview
All REST API operations have been converted to GraphQL mutations. This document provides a complete reference for all CREATE, UPDATE, and DELETE operations across the application.

---

## 📋 Tickets

### Create Ticket
```typescript
import { createTicketGQL } from '@/hooks/use-tickets-gql'

const newTicket = await createTicketGQL({
  title: 'System down',
  description: 'The system is not responding',
  type: 'incident',
  category: 'system',
  priority: 'high',
  urgency: 'high',
  impact: 'high',
  status: 'open',
  requester_id: 'user-id',
  assignee_id: 'assignee-id',
  team_id: 'team-id',
  tags: ['urgent', 'system']
})
```

### Update Ticket
```typescript
import { updateTicketGQL } from '@/hooks/use-tickets-gql'

const updated = await updateTicketGQL('ticket-id', {
  status: 'in_progress',
  priority: 'critical',
  assignee_id: 'new-assignee-id'
})
```

### Delete Ticket
```typescript
import { deleteTicketGQL } from '@/hooks/use-tickets-gql'

const success = await deleteTicketGQL('ticket-id')
```

---

## 🛠️ Services

### Create Service
```typescript
import { createServiceGQL } from '@/hooks/use-services-assets-gql'

const newService = await createServiceGQL({
  name: 'Email Account Setup',
  description: 'Create and configure new email account',
  icon: 'mail',
  short_description: 'Quick email setup',
  is_requestable: true,
  requires_approval: false,
  estimated_delivery_days: 1,
  status: 'active',
  category_id: 'it-services',
  form_schema: { /* JSON schema */ }
})
```

### Update Service
```typescript
import { updateServiceGQL } from '@/hooks/use-services-assets-gql'

const updated = await updateServiceGQL('service-id', {
  status: 'inactive',
  estimated_delivery_days: 2
})
```

### Delete Service
```typescript
import { deleteServiceGQL } from '@/hooks/use-services-assets-gql'

const success = await deleteServiceGQL('service-id')
```

---

## 📝 Service Requests

### Create Service Request
```typescript
import { createServiceRequestGQL } from '@/hooks/use-services-assets-gql'

const request = await createServiceRequestGQL({
  service_id: 'service-id',
  requester_id: 'user-id',
  status: 'pending',
  priority: 'medium',
  form_data: {
    email: 'user@example.com',
    department: 'Sales'
  },
  approval_status: 'pending'
})
```

### Update Service Request
```typescript
import { updateServiceRequestGQL } from '@/hooks/use-services-assets-gql'

const updated = await updateServiceRequestGQL('request-id', {
  status: 'approved',
  approval_status: 'approved'
})
```

---

## 💻 Assets

### Create Asset
```typescript
import { createAssetGQL } from '@/hooks/use-services-assets-gql'

const newAsset = await createAssetGQL({
  name: 'MacBook Pro 16"',
  asset_tag: 'LAPTOP-001',
  hostname: 'mbp-001.company.com',
  ip_address: '192.168.1.100',
  status: 'active',
  criticality: 'high',
  asset_type_id: 'laptop-type-id',
  owner_id: 'user-id',
  support_team_id: 'it-team-id',
  location: 'Office - Floor 3',
  purchase_date: '2024-01-15',
  warranty_end_date: '2027-01-15',
  attributes: {
    ram: '32GB',
    storage: '1TB SSD',
    processor: 'M3 Max'
  }
})
```

### Update Asset
```typescript
import { updateAssetGQL } from '@/hooks/use-services-assets-gql'

const updated = await updateAssetGQL('asset-id', {
  status: 'maintenance',
  location: 'IT Department',
  attributes: {
    last_maintenance: '2024-06-01'
  }
})
```

### Delete Asset
```typescript
import { deleteAssetGQL } from '@/hooks/use-services-assets-gql'

const success = await deleteAssetGQL('asset-id')
```

---

## 👤 Users/Profiles

### Create Profile
```typescript
import { createProfileGQL } from '@/hooks/use-users-gql'

const newProfile = await createProfileGQL({
  email: 'newuser@company.com',
  first_name: 'John',
  last_name: 'Doe',
  display_name: 'John Doe',
  phone: '+1234567890',
  department: 'Engineering',
  role: 'agent',
  is_active: true
})
```

### Update Profile
```typescript
import { updateProfileGQL } from '@/hooks/use-users-gql'

const updated = await updateProfileGQL('user-id', {
  department: 'Management',
  role: 'manager',
  phone: '+0987654321'
})
```

### Delete Profile
```typescript
import { deleteProfileGQL } from '@/hooks/use-users-gql'

const success = await deleteProfileGQL('user-id')
```

---

## 👥 Teams

### Create Team
```typescript
import { createTeamGQL } from '@/hooks/use-users-gql'

const newTeam = await createTeamGQL({
  name: 'Support Team',
  description: 'Customer support and helpdesk',
  department: 'Customer Success',
  is_active: true
})
```

### Update Team
```typescript
import { updateTeamGQL } from '@/hooks/use-users-gql'

const updated = await updateTeamGQL('team-id', {
  description: 'Updated description',
  department: 'Operations'
})
```

### Delete Team
```typescript
import { deleteTeamGQL } from '@/hooks/use-users-gql'

const success = await deleteTeamGQL('team-id')
```

---

## 👥 Team Members

### Add Team Member
```typescript
import { addTeamMemberGQL } from '@/hooks/use-users-gql'

const member = await addTeamMemberGQL(
  'team-id',
  'user-id',
  'member' // or 'lead', 'manager'
)
```

### Remove Team Member
```typescript
import { removeTeamMemberGQL } from '@/hooks/use-users-gql'

const success = await removeTeamMemberGQL('team-id', 'user-id')
```

---

## 🔄 Migration Guide: REST to GraphQL

### Before (REST API):
```typescript
import { ticketAPI } from '@/lib/api/tickets'

// Create
const ticket = await ticketAPI.create(ticketData)

// Update
const updated = await ticketAPI.update(ticketId, updates)

// Delete
await ticketAPI.delete(ticketId)
```

### After (GraphQL):
```typescript
import { 
  createTicketGQL, 
  updateTicketGQL, 
  deleteTicketGQL 
} from '@/hooks/use-tickets-gql'

// Create
const ticket = await createTicketGQL(ticketData)

// Update
const updated = await updateTicketGQL(ticketId, updates)

// Delete
const success = await deleteTicketGQL(ticketId)
```

---

## ✅ Benefits of GraphQL Mutations

1. **Type Safety**: Full TypeScript support with proper types
2. **Single Source of Truth**: All mutations in GraphQL hooks
3. **Consistent Error Handling**: Unified error responses
4. **Better Performance**: Direct database access via Supabase GraphQL
5. **Reduced API Routes**: No need for REST API route files
6. **Real-time Updates**: Easy integration with subscriptions
7. **Security**: RLS (Row Level Security) enforced automatically

---

## 🎯 Next Steps

1. ✅ **All mutation functions are ready to use**
2. 🔄 Update page components to use GraphQL mutations instead of REST API
3. 🧪 Test all mutations with real data
4. 📊 Monitor performance improvements
5. 🗑️ Remove old REST API route files once migration is complete

---

## 📚 Related Documentation

- [GraphQL Queries Reference](./GRAPHQL_COMPLETE.md)
- [GraphQL Client Setup](./lib/graphql/client.ts)
- [Migration Quick Start](./MIGRATION_QUICKSTART.md)
