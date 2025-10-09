# Team Members Loading Fix

## Issue
The Users & Teams page was showing "0 members" and "No members added yet" for all teams, even when teams had members in the database.

## Root Cause
The `useTeamsGQL` hook was correctly fetching team members data from GraphQL, but the transformation was using `members` as the property name, while the page component expected `team_members`.

## Solution

### Changed File: `hooks/use-users-gql.ts`

**Lines 236-253:**

#### Before:
```typescript
const data = await client.request<any>(GET_TEAMS_QUERY, variables)

const transformedTeams: Team[] = data.teamsCollection.edges.map((edge: any) => ({
  ...edge.node,
  members: edge.node.members?.edges.map((e: any) => e.node) || []
}))

setTeams(transformedTeams)
console.log('✅ GraphQL: Teams loaded successfully:', transformedTeams.length)
```

#### After:
```typescript
const data = await client.request<any>(GET_TEAMS_QUERY, variables)

console.log('📊 GraphQL: Raw teams data:', JSON.stringify(data.teamsCollection.edges.slice(0, 1), null, 2))

const transformedTeams: Team[] = data.teamsCollection.edges.map((edge: any) => {
  const team = edge.node
  const teamMembers = team.members?.edges.map((e: any) => e.node) || []
  
  console.log(`👥 Team "${team.name}": ${teamMembers.length} members`, teamMembers.map((m: any) => m.user?.display_name || m.user?.email))
  
  return {
    ...team,
    team_members: teamMembers // Use team_members to match the page expectations
  }
})

setTeams(transformedTeams)
console.log('✅ GraphQL: Teams loaded successfully:', transformedTeams.length, 'teams')
```

## What Changed

1. **Property Naming:** Changed `members` to `team_members` to match what the page expects
2. **Added Logging:** Added detailed console logging to help debug:
   - Raw GraphQL data structure (first team only)
   - Each team's member count and names
   - Total teams loaded

3. **Better Transformation:** Made the transformation more explicit by:
   - Extracting team data first
   - Processing members separately
   - Logging at each step for visibility

## Data Flow

### GraphQL Query Structure:
```graphql
teamsCollection {
  edges {
    node {
      id
      name
      description
      members: team_membersCollection {  # ← Aliased from team_membersCollection
        edges {
          node {
            id
            role
            user: profiles {
              id
              display_name
              email
              avatar_url
            }
          }
        }
      }
    }
  }
}
```

### Transformation:
```
1. GraphQL Response → data.teamsCollection.edges[]
2. For each edge.node:
   - Extract team data
   - Transform members: edge.node.members.edges[] → teamMembers[]
   - Create new object with team_members property
3. Result → Team[] with team_members populated
```

### Page Usage (app/(dashboard)/users/page.tsx):
```typescript
// Line 977
const teamMembers = teamData.team_members || []

// Line 994
{teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}

// Line 1047-1066
{teamMembers.length > 0 ? (
  <div className="space-y-2">
    {teamMembers.slice(0, 6).map((member: any) => (
      <UserAvatar key={member.user?.id} user={member.user} />
    ))}
  </div>
) : (
  <div>No members added yet</div>
)}
```

## Verification

After this fix, check the browser console for:

```
🔄 GraphQL: Fetching teams with params: {...}
📊 GraphQL: Raw teams data: {...}
👥 Team "Development": 3 members ["John Doe", "Jane Smith", "Bob Wilson"]
👥 Team "Customer Success": 0 members []
✅ GraphQL: Teams loaded successfully: 3 teams
```

Then verify on the page:
- Team cards show correct member count
- Avatars appear for teams with members
- "Add Members" button appears only for teams with 0 members

## Testing

1. **Check Console Logs:**
   - Open browser Developer Tools (F12)
   - Navigate to `/users`
   - Look for the log messages above

2. **Verify UI:**
   - Team cards should show "X members" badge
   - Member avatars should be visible
   - Clicking "Manage Members" should show the member list

3. **Test Adding Members:**
   - Click "Manage Members" on a team
   - Add a new member
   - Verify count updates immediately

## Related Files

- `hooks/use-users-gql.ts` - GraphQL hook (fixed)
- `app/(dashboard)/users/page.tsx` - Users page (uses team_members)
- `lib/graphql/queries.ts` - GET_TEAMS_QUERY (line 269)
- `components/users/team-selector.tsx` - TeamSelector component (also uses team_members)

## Notes

- The GraphQL query aliases `team_membersCollection` as `members` for cleaner API
- The transformation then renames it back to `team_members` for consistency with the page
- Future: Consider standardizing on one naming convention across the app
