#!/bin/bash

# Automated Dark Mode Fix Script
# Fixes all remaining hardcoded colors in top 15 components

echo "🚀 Starting automated dark mode fixes..."

# Define target files
FILES=(
  "app/admin/service-requests/page.tsx"
  "app/security-access/page.tsx"
  "app/approval-workflows/page.tsx"
  "app/(dashboard)/services/my-requests/page.tsx"
  "app/(dashboard)/services/page.tsx"
  "app/sla-management/page.tsx"
  "app/priority-matrix/page.tsx"
  "app/(dashboard)/accounts/[id]/page.tsx"
  "app/(dashboard)/notifications/page.tsx"
  "app/(dashboard)/tickets/page.tsx"
  "app/(dashboard)/analytics/detailed-report/page.tsx"
  "app/(dashboard)/workflows/page.tsx"
  "app/(dashboard)/users/page.tsx"
)

# Color mappings
declare -A replacements=(
  # Backgrounds
  ["bg-white"]="bg-card"
  ["bg-gray-50"]="bg-muted/50"
  ["bg-gray-100"]="bg-muted"
  ["bg-gray-200"]="bg-accent"
  
  # Text colors
  ["text-gray-900"]="text-foreground"
  ["text-gray-800"]="text-foreground"
  ["text-gray-700"]="text-foreground"
  ["text-gray-600"]="text-muted-foreground"
  ["text-gray-500"]="text-muted-foreground"
  ["text-gray-400"]="text-muted-foreground"
  
  # Borders
  ["border-gray-100"]="border-border"
  ["border-gray-200"]="border-border"
  ["border-gray-300"]="border-border"
  
  # Dividers
  ["divide-gray-100"]="divide-border"
  ["divide-gray-200"]="divide-border"
  
  # Hover states
  ["hover:bg-gray-50"]="hover:bg-muted/50"
  ["hover:text-gray-700"]="hover:text-foreground"
  ["hover:border-gray-300"]="hover:border-border"
)

# Counter
total_fixes=0

# Process each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing: $file"
    file_fixes=0
    
    # Apply each replacement
    for old in "${!replacements[@]}"; do
      new="${replacements[$old]}"
      
      # Count occurrences before replacement
      count=$(grep -o "$old" "$file" 2>/dev/null | wc -l | tr -d ' ')
      
      if [ "$count" -gt 0 ]; then
        # Perform replacement (Mac compatible)
        sed -i '' "s/$old/$new/g" "$file"
        file_fixes=$((file_fixes + count))
        echo "   ✓ Replaced $count instances of '$old' → '$new'"
      fi
    done
    
    total_fixes=$((total_fixes + file_fixes))
    echo "   ✅ Fixed $file_fixes issues in this file"
  else
    echo "   ⚠️  File not found: $file"
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Complete! Fixed $total_fixes dark mode issues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
