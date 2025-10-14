#!/bin/bash

# Script to migrate pages to use the new persistent dashboard layout
# This moves pages from app/* to app/(dashboard)/* for proper layout nesting

echo "🚀 Starting Dashboard Layout Migration..."

cd /Users/anujdwivedi/Desktop/kroolo/kroolo-bsm

# Create dashboard directory if it doesn't exist
mkdir -p "app/(dashboard)"

# List of pages to migrate (excluding auth pages)
PAGES=(
  "dashboard"
  "tickets"
  "accounts"
  "customers"
  "users"
  "workflows"
  "assets"
  "services"
  "knowledge-base"
  "analytics"
  "notifications"
  "inbox"
  "integrations"
  "admin"
  "live-chat"
  "settings"
)

# Move each page directory
for page in "${PAGES[@]}"; do
  if [ -d "app/$page" ]; then
    echo "📦 Moving $page..."
    mv "app/$page" "app/(dashboard)/"
  else
    echo "⚠️  $page not found, skipping..."
  fi
done

echo "✅ Migration complete!"
echo "
📝 Next steps:
1. Update page components to remove PlatformLayout wrapper
2. Use PageContent component instead
3. Test navigation to ensure navbar/sidebar don't refresh
"
