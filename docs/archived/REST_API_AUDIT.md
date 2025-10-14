# REST API Usage Audit

## Current REST fetch() Calls in Application

### ✅ ALLOWED (Auth/Setup Only)
1. **app/setup-admin/page.tsx:18**
   - Purpose: Create initial admin user
   - Method: POST to `/api/create-admin`
   - Status: ✅ ALLOWED (authentication/setup)

### ⚠️  NEEDS REVIEW

2. **app/(dashboard)/services/page.tsx:85**
   - Purpose: Submit new service request
   - Method: POST to `/api/service-requests`
   - Current: Using REST fetch()
   - **Recommendation**: Convert to GraphQL mutation
   - Impact: Medium (write operation, not read)

3. **app/test-graphql/page.tsx:34**
   - Purpose: Test comparison between REST and GraphQL
   - Method: GET to `/api/tickets?limit=10`
   - Status: ✅ ALLOWED (test/demo page only)

### ✅ FALSE POSITIVES (Not actual fetch() calls)

4. **app/(dashboard)/tickets/page.tsx:786** - `refetch()` - GraphQL hook method
5. **app/(dashboard)/admin/service-requests/page.tsx:114** - `refetch()` - GraphQL hook method
6. **app/(dashboard)/assets/page.tsx:106,112,118** - `refetch()` - GraphQL hook method
7. **app/(dashboard)/services/team-requests/page.tsx:89** - `refetch()` - GraphQL hook method

---

## Summary

### Total REST fetch() Calls: 3

| File | Line | Type | Status | Action Needed |
|------|------|------|--------|---------------|
| setup-admin/page.tsx | 18 | Auth | ✅ ALLOWED | None |
| services/page.tsx | 85 | POST | ⚠️  REVIEW | Consider GraphQL mutation |
| test-graphql/page.tsx | 34 | Test | ✅ ALLOWED | None |

---

## Recommendation

### Keep REST for:
1. ✅ **Authentication/Setup** (setup-admin/page.tsx) - Security sensitive
2. ✅ **Test pages** (test-graphql/page.tsx) - For comparison demos

### Convert to GraphQL:
1. ⚠️  **Service Request POST** (services/page.tsx:85)
   - Should use GraphQL mutation for consistency
   - Benefits: Type safety, better error handling, consistent with rest of app

---

## Action Plan

### Option 1: Convert Service Request POST to GraphQL (Recommended)
```typescript
// Create mutation in lib/graphql/queries.ts
export const CREATE_SERVICE_REQUEST_MUTATION = gql`
  mutation CreateServiceRequest($input: service_requestsInsertInput!) {
    insertIntoservice_requestsCollection(objects: [$input]) {
      records {
        id
        request_number
        title
        status
      }
    }
  }
`

// Use in services/page.tsx
import { createGraphQLClient } from '@/lib/graphql/client'
import { CREATE_SERVICE_REQUEST_MUTATION } from '@/lib/graphql/queries'

const handleSubmitRequest = async (formData) => {
  const client = await createGraphQLClient()
  const result = await client.request(CREATE_SERVICE_REQUEST_MUTATION, {
    input: {
      service_id: selectedService.id,
      title: formData.requestName,
      // ... other fields
    }
  })
}
```

### Option 2: Keep REST for POST operations (Current State)
- Keep fetch() for write operations
- Use GraphQL only for reads
- Less consistency but faster to implement

---

## Current State: ACCEPTABLE ✅

**Verdict**: Your application is currently in an acceptable state with:
- ✅ All READ operations using GraphQL
- ✅ Only 1 write operation using REST (service request submission)
- ✅ Auth/setup using REST (correct)
- ✅ No unnecessary REST calls for data fetching

**Production Ready**: YES ✅

The single REST POST for service requests is acceptable. Converting it to GraphQL would be ideal for consistency but not required for production.

---

**Audit Date**: 2025-01-09  
**Status**: ✅ ACCEPTABLE FOR PRODUCTION  
**Critical Issues**: None  
**Recommendations**: Optional GraphQL mutation conversion
