# Services Navigation Debug Guide

## Issue
When clicking "Request Service" filter item in the sidebar, sometimes it redirects to the "All Tickets" page instead of staying on `/services`.

## Investigation Results

After thorough code analysis, **NO redirect logic was found** that would cause `/services` → `/tickets` navigation. The issue is **non-reproducible**, suggesting it's a race condition or caching issue.

## Root Cause Analysis

### What we checked:
✅ `sidebar-navigation.tsx` - Navigation links are correct (`/services`)
✅ `services/page.tsx` - No redirect logic
✅ `middleware.ts` - No services-related redirects
✅ `layout.tsx` - No navigation interference
✅ Global search component - No unwanted redirects

### Likely Causes:
1. **Next.js Router Cache** - Prefetched `/tickets` page might be served incorrectly
2. **Browser Back/Forward Cache** - BF Cache might serve stale pages
3. **React Query Cache** - Old query data might show tickets instead of services
4. **Race Condition** - Fast navigation might cause wrong component to mount
5. **Service Worker** - If you have a service worker, it might cache wrong routes

## Debugging Steps

### Step 1: Open Browser DevTools
```bash
# Open your browser console
# Navigate to Console tab
```

### Step 2: Click "Request Service"
Watch the console for these log messages:

**Expected Output (Correct):**
```
🔍 Sidebar Navigation Click: {name: "Request Service", href: "/services", currentPath: "/..."}
✅ ServicesPage mounted
📍 URL: /services
📍 Title: Services | Kroolo BSM
```

**If Bug Occurs:**
```
🔍 Sidebar Navigation Click: {name: "Request Service", href: "/services", currentPath: "/..."}
🎫 TicketsPage mounted  <-- WRONG PAGE!
📍 URL: /tickets  <-- URL CHANGED!
🚨 WRONG PAGE! Expected /services but got: /tickets
```

### Step 3: Check for URL Changes
The code now monitors the URL every second. If it changes unexpectedly:
```
🚨 URL CHANGED UNEXPECTEDLY to: /tickets
```

## Solutions

### Solution 1: Clear Next.js Cache
```bash
# Delete .next cache
rm -rf .next

# Restart dev server
npm run dev
```

### Solution 2: Clear Browser Cache
1. Open DevTools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Solution 3: Add Router Cache Prevention
If the issue persists, add this to `sidebar-navigation.tsx`:

```typescript
<Link
  href={subItem.href}
  prefetch={false}  // <-- Disable prefetching
  onClick={(e) => {
    e.preventDefault()
    router.push(subItem.href)
    router.refresh()  // Force refresh
  }}
>
```

### Solution 4: Check for Service Workers
```bash
# In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    console.log('Service Worker:', registration)
    registration.unregister()  // Remove if causing issues
  })
})
```

### Solution 5: Disable React Strict Mode (Temporary)
In `next.config.js`, temporarily disable strict mode to see if double-mounting is the issue:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Temporarily disable
  // ...rest of config
}
```

## How to Reproduce

Since this is **non-reproducible**, try these scenarios:

1. **Fast Navigation**: Rapidly click between pages, then click "Request Service"
2. **Browser Back Button**: Navigate to tickets → back → click "Request Service"
3. **Tab Switching**: Switch browser tabs, come back, click "Request Service"
4. **Slow Network**: Throttle network in DevTools, then navigate
5. **Multiple Clicks**: Double-click "Request Service" quickly

## Expected Behavior

When clicking "Request Service":
1. URL should be `/services`
2. Page title should be "Services | Kroolo BSM"
3. ServicesPage component should mount
4. No TicketsPage mounting should occur
5. No redirects should happen

## Files Modified

### Added Debugging:
- ✅ `components/dashboard/sidebar-navigation.tsx` - onClick logging
- ✅ `app/(dashboard)/services/page.tsx` - Mount/unmount & URL monitoring
- ✅ `app/(dashboard)/tickets/page.tsx` - Mount/unmount tracking

### Next Steps:
1. Reproduce the issue with DevTools open
2. Check console logs for the bug signature
3. Apply appropriate solution based on findings
4. Remove debug logging once issue is fixed

## Cleanup After Fix

Once the issue is resolved, remove the debug logging:

```typescript
// Remove from services/page.tsx
useEffect(() => {
  console.log('✅ ServicesPage mounted')  // DELETE THIS
  // ...
}, [])

// Remove from sidebar-navigation.tsx  
onClick={() => {
  console.log('🔍 Sidebar Navigation Click:', {...})  // DELETE THIS
}}
```

## Contact

If the issue persists after trying all solutions, please provide:
1. Console logs from DevTools
2. Network tab showing the navigation
3. Steps to reproduce (if found)
4. Browser and version
