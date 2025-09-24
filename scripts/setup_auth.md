# BSM Authentication Setup Guide

## Current Situation
- Database schema is complete with RLS policies
- No users exist in the system
- RLS policies prevent direct profile creation without proper auth context

## Recommended Authentication Setup Strategy

### 1. **Use Supabase Dashboard to Create First Admin**
Since direct SQL insertion is being blocked by RLS policies, use Supabase Dashboard:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Create user with:
   - Email: `admin@kroolo.com`
   - Password: `KrooloAdmin123!`
   - Confirm password
   - Auto-confirm email: YES

### 2. **Create Profile After Auth User**
Once the auth user exists, create profile via SQL in Dashboard:

```sql
-- This should work once auth.users exists
INSERT INTO profiles (
  id,
  organization_id,
  email,
  first_name,
  last_name,
  display_name,
  role,
  department,
  is_active
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@kroolo.com'),
  (SELECT id FROM organizations WHERE name = 'Kroolo Demo Organization' LIMIT 1),
  'admin@kroolo.com',
  'System',
  'Administrator',
  'System Administrator',
  'admin'::user_role,
  'IT',
  true
);
```

### 3. **Alternative: Fix RLS Policy for Bootstrap**
Temporarily add a bootstrap policy:

```sql
-- Add temporary bootstrap policy
CREATE POLICY "Bootstrap admin creation" ON profiles
FOR INSERT WITH CHECK (
  email = 'admin@kroolo.com' AND 
  NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
);

-- Remove after first admin is created
DROP POLICY "Bootstrap admin creation" ON profiles;
```

### 4. **Recommended User Creation Flow**

#### For Admin Users:
1. Admin logs into system
2. Uses "User Management" interface
3. Invites users via email invitation
4. System creates auth user and sends invite email
5. User accepts invite and completes profile

#### For Demo/Testing:
Use the signup page with these test accounts:
- `admin@kroolo.com` / `KrooloAdmin123!`
- `manager@kroolo.com` / `ManagerDemo123!`
- `agent@kroolo.com` / `AgentDemo123!`
- `user@kroolo.com` / `UserDemo123!`

## Implementation Priority

1. **Immediate**: Create admin user via Supabase Dashboard
2. **Short-term**: Replace demo login bypass with real auth
3. **Medium-term**: Build user invitation system
4. **Long-term**: Add SSO integration if needed

## Security Considerations

1. **RLS is properly configured** - This is why inserts are failing
2. **Multi-tenant isolation** works via organization_id
3. **Role-based permissions** are implemented
4. **Profile-auth user linking** is working

The system is actually **well-secured** - the insert failures indicate the security is working correctly!