# Quick Caching Reference - Copy & Paste Ready

## ✅ Status: Imports Added to 20 Routes

All imports are now in place! Just need to wrap the queries.

---

## 🚀 Copy-Paste Template

For each GET route, wrap your main query like this:

```typescript
// BEFORE:
const { data, error } = await supabase.from('table').select('*')

// AFTER:
const fetchData = unstable_cache(
  async () => {
    return await supabase.from('table').select('*')
  },
  ['cache-key-name'],
  {
    revalidate: 60, // See duration guide below
    tags: [CACHE_TAGS.tagName],
  }
)
const { data, error } = await fetchData()
```

---

## ⏱️ Cache Duration Guide

```typescript
// 30 seconds - Realtime data
revalidate: 30

// 1 minute - Frequently changing
revalidate: 60

// 5 minutes - Moderate changes
revalidate: 300

// 1 hour - Static/rarely changing
revalidate: 3600
```

---

## 🏷️ Cache Tags by Route

| Route Pattern | Tag | Duration |
|--------------|-----|----------|
| `/api/tickets/*` | `CACHE_TAGS.tickets` | 60s |
| `/api/service-requests/*` | `CACHE_TAGS.serviceRequests` | 60s |
| `/api/assets/*` | `CACHE_TAGS.assets` | 300s |
| `/api/users/*` | `CACHE_TAGS.users` | 300s |
| `/api/profiles/*` | `CACHE_TAGS.users` | 300s |
| `/api/dashboard/*` | `CACHE_TAGS.dashboard` | 300s |
| `/api/analytics/*` | `CACHE_TAGS.analytics` | 300s |
| `/api/notifications/*` | `CACHE_TAGS.notifications` | 60s |
| `/api/teams/*` | `CACHE_TAGS.teams` | 300s |
| `/api/accounts/*` | `CACHE_TAGS.accounts` | 300s |
| `/api/knowledge/*` | `CACHE_TAGS.knowledgeBase` | 3600s |
| `/api/search/*` | `CACHE_TAGS` (related) | 60s |
| `/api/service-categories/*` | `CACHE_TAGS.services` | 3600s |
| `/api/asset-types/*` | `CACHE_TAGS.assets` | 3600s |

---

## 📝 Routes Ready for Caching (20 total)

### ✅ Imports Added - Ready to Wrap:

1. `app/api/service-categories/route.ts` - Tag: services, 3600s
2. `app/api/service-requests/route.ts` - Tag: serviceRequests, 60s
3. `app/api/asset-types/route.ts` - Tag: assets, 3600s
4. `app/api/profiles/route.ts` - Tag: users, 300s
5. `app/api/assets/route.ts` - Tag: assets, 300s
6. `app/api/tickets/[id]/route.ts` - Tag: tickets, 60s
7. `app/api/tickets/[id]/comments/route.ts` - Tag: tickets, 60s
8. `app/api/tickets/[id]/accounts/route.ts` - Tag: tickets, 60s
9. `app/api/tickets/[id]/attachments/route.ts` - Tag: tickets, 60s
10. `app/api/tickets/[id]/checklist/route.ts` - Tag: tickets, 60s
11. `app/api/search/tickets/route.ts` - Tag: tickets, 60s
12. `app/api/search/users/route.ts` - Tag: users, 60s
13. `app/api/search/suggestions/route.ts` - Tag: general, 60s
14. `app/api/search/assets/route.ts` - Tag: assets, 60s
15. `app/api/search/services/route.ts` - Tag: services, 60s
16. `app/api/service-requests/[id]/route.ts` - Tag: serviceRequests, 60s
17. `app/api/users/[id]/route.ts` - Tag: users, 300s
18. `app/api/services/requestable/route.ts` - Tag: services, 300s
19. `app/api/check-config/route.ts` - Tag: general, 3600s
20. `app/api/tickets/[id]/attachments/[attachmentId]/download/route.ts` - Tag: tickets, 300s

---

## 💡 Example: service-requests/route.ts

```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  // Build your query
  let query = supabase
    .from('service_requests')
    .select('*')
  
  if (status) query = query.eq('status', status)
  
  // ✅ ADD THIS WRAPPER:
  const fetchRequests = unstable_cache(
    async () => {
      return await query
    },
    [`service-requests-${status || 'all'}`],
    {
      revalidate: 60,
      tags: [CACHE_TAGS.serviceRequests],
    }
  )
  
  const { data, error } = await fetchRequests()
  
  return NextResponse.json({ data, error })
}
```

---

## 🔄 Cache Invalidation (POST/PUT/DELETE)

Add to mutation endpoints:

```typescript
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  // ... your mutation logic ...
  
  const { data, error } = await supabase.from('tickets').insert(body)
  
  if (!error) {
    // ✅ Invalidate cache
    revalidateTag(CACHE_TAGS.tickets)
  }
  
  return NextResponse.json({ data, error })
}
```

---

## 🎯 Quick Checklist

For each route:
- [ ] Imports added (✅ Done for 20 routes)
- [ ] Wrap main query with `unstable_cache`
- [ ] Use appropriate cache duration
- [ ] Use correct cache tag
- [ ] Add `revalidateTag` to mutations
- [ ] Test the endpoint

---

## 🚀 Apply to All 20 Routes

Estimated time: **30-45 minutes**

Just open each file and wrap the main query using the template above!
