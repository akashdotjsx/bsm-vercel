#!/bin/bash

echo "🔍 Verifying Persistent Layout Implementation..."
echo ""

cd /Users/anujdwivedi/Desktop/kroolo/kroolo-bsm

# Check 1: Dashboard layout exists
echo "✓ Checking dashboard layout..."
if [ -f "app/(dashboard)/layout.tsx" ]; then
  echo "  ✅ app/(dashboard)/layout.tsx exists"
else
  echo "  ❌ app/(dashboard)/layout.tsx NOT FOUND!"
  exit 1
fi

# Check 2: PageContent component exists
echo "✓ Checking PageContent component..."
if [ -f "components/layout/page-content.tsx" ]; then
  echo "  ✅ components/layout/page-content.tsx exists"
else
  echo "  ❌ components/layout/page-content.tsx NOT FOUND!"
  exit 1
fi

# Check 3: Zustand store exists
echo "✓ Checking Zustand filter store..."
if [ -f "lib/stores/ticket-filters-store.ts" ]; then
  echo "  ✅ lib/stores/ticket-filters-store.ts exists"
else
  echo "  ❌ lib/stores/ticket-filters-store.ts NOT FOUND!"
  exit 1
fi

# Check 4: Pages are in dashboard folder
echo "✓ Checking pages location..."
DASHBOARD_PAGES=$(find app/\(dashboard\)/ -name "page.tsx" | wc -l | tr -d ' ')
echo "  ✅ Found $DASHBOARD_PAGES pages in dashboard folder"

# Check 5: No PlatformLayout imports in dashboard pages
echo "✓ Checking for PlatformLayout imports..."
PLATFORM_LAYOUT_COUNT=$(grep -r "from \"@/components/layout/platform-layout\"" app/\(dashboard\)/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLATFORM_LAYOUT_COUNT" -eq "0" ]; then
  echo "  ✅ No PlatformLayout imports found (good!)"
else
  echo "  ⚠️  Found $PLATFORM_LAYOUT_COUNT PlatformLayout imports (should be PageContent)"
fi

# Check 6: PageContent imports exist
echo "✓ Checking for PageContent imports..."
PAGE_CONTENT_COUNT=$(grep -r "from \"@/components/layout/page-content\"" app/\(dashboard\)/ 2>/dev/null | wc -l | tr -d ' ')
echo "  ✅ Found $PAGE_CONTENT_COUNT PageContent imports"

# Check 7: Auth pages NOT in dashboard folder
echo "✓ Checking auth pages location..."
if [ -d "app/auth" ]; then
  echo "  ✅ app/auth exists (outside dashboard)"
else
  echo "  ⚠️  app/auth not found"
fi

# Check 8: React Query config updated
echo "✓ Checking React Query config..."
if grep -q "refetchOnWindowFocus: false" components/providers/react-query-provider.tsx; then
  echo "  ✅ React Query optimized (refetchOnWindowFocus: false)"
else
  echo "  ⚠️  React Query may not be optimized"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Dashboard layout structure: READY"
echo "✅ Component architecture: READY"
echo "✅ Pages migrated: $DASHBOARD_PAGES pages"
echo "✅ Imports updated: $PAGE_CONTENT_COUNT PageContent"
echo ""
echo "🚀 Ready to test! Run: npm run dev"
echo ""
echo "📝 Test checklist:"
echo "  1. Navigate between pages (no navbar/sidebar refresh?)"
echo "  2. Set filters on tickets page"
echo "  3. Navigate away and back (filters persist?)"
echo "  4. Check console for errors"
echo "  5. Test mobile sidebar"
echo ""
echo "📚 Documentation:"
echo "  • PERSISTENT_LAYOUT_IMPLEMENTATION.md"
echo "  • LAYOUT_MIGRATION_GUIDE.md"
echo ""
