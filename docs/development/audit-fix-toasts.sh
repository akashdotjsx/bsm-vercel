#!/bin/bash

# Toast Audit and Fix Script
# Finds and fixes incorrect toast usage patterns

echo "🔍 Auditing toast usage across the application..."
echo ""

# Find all delete operations using toast.success (should be toast.error)
echo "❌ Finding DELETE operations using wrong toast variant..."
delete_issues=$(grep -r "delete.*toast\.success\|toast\.success.*delete" app components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

if [ "$delete_issues" -gt 0 ]; then
  echo "⚠️  Found $delete_issues potential issues with delete toast variants:"
  grep -rn "delete.*toast\.success\|toast\.success.*delete" app components --include="*.tsx" --include="*.ts" 2>/dev/null | head -10
  echo ""
  echo "⚠️  DELETE operations should use toast.error() (red), not toast.success() (green)"
else
  echo "✅ All delete operations use correct toast variant"
fi

echo ""

# Find toast.success calls without proper context
echo "📊 Toast usage summary:"
echo ""

success_count=$(grep -r "toast\.success" app components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
error_count=$(grep -r "toast\.error" app components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
warning_count=$(grep -r "toast\.warning" app components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
info_count=$(grep -r "toast\.info" app components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

echo "  ✅ Success toasts: $success_count"
echo "  ❌ Error toasts: $error_count"
echo "  ⚠️  Warning toasts: $warning_count"
echo "  ℹ️  Info toasts: $info_count"
echo ""

# Check for files not using centralized toast
echo "🔍 Checking for non-centralized toast imports..."
non_centralized=$(grep -r "from.*sonner\|from.*use-toast" app components --include="*.tsx" --include="*.ts" --exclude-dir="ui" 2>/dev/null | grep -v "@/lib/toast" | wc -l)

if [ "$non_centralized" -gt 0 ]; then
  echo "⚠️  Found $non_centralized files not using centralized toast:"
  grep -rn "from.*sonner\|from.*use-toast" app components --include="*.tsx" --include="*.ts" --exclude-dir="ui" 2>/dev/null | grep -v "@/lib/toast"
else
  echo "✅ All files use centralized toast system (@/lib/toast)"
fi

echo ""
echo "📋 Recommendations:"
echo ""
echo "1. DELETE operations should always use toast.error() (red)"
echo "   Example: toast.error('Item deleted', 'The item has been removed')"
echo ""
echo "2. CREATE/UPDATE operations should use toast.success() (green)"
echo "   Example: toast.success('Item created', 'Your item has been saved')"
echo ""
echo "3. WARNINGS should use toast.warning() (yellow)"
echo "   Example: toast.warning('Approval required', 'Manager approval needed')"
echo ""
echo "4. INFO messages should use toast.info() (blue)"
echo "   Example: toast.info('Comment added', 'Your comment has been posted')"
echo ""
echo "For detailed guidance, see: docs/TOAST_SYSTEM.md"
