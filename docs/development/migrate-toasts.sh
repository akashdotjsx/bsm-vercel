#!/bin/bash

# Toast Migration Script
# Migrates from 'sonner' to '@/lib/toast'

echo "🔄 Starting toast migration..."
echo ""

# Find and replace toast imports
echo "📝 Updating imports from 'sonner' to '@/lib/toast'..."
find app components hooks -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/from "sonner"/from "@\/lib\/toast"/g' \
  -e "s/from 'sonner'/from '@\/lib\/toast'/g" \
  {} +

echo "✅ Import statements updated!"
echo ""

# Count files that still import sonner
sonner_count=$(grep -r "from ['\"]sonner['\"]" app components hooks --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

if [ "$sonner_count" -eq 0 ]; then
  echo "✅ All sonner imports have been replaced!"
else
  echo "⚠️  Found $sonner_count remaining sonner imports"
  echo "   Run: grep -r \"from ['\\\"]sonner['\\\"]\" app components hooks --include=\"*.tsx\" --include=\"*.ts\""
fi

echo ""
echo "📋 Next steps:"
echo "1. Review each file to ensure correct toast variant usage:"
echo "   - ✅ Success (green): Create, Update, Save operations"
echo "   - ❌ Error (red): Delete, Failure, Validation errors"
echo "   - ⚠️  Warning (yellow): Caution, Pending actions"
echo "   - ℹ️  Info (blue): General information, Tips"
echo ""
echo "2. Update deletion operations to use toast.error() instead of toast.success()"
echo ""
echo "3. Test in both light and dark modes"
echo ""
echo "4. Run: npm run lint to check for any issues"
echo ""
echo "For detailed guidance, see: docs/TOAST_MIGRATION_GUIDE.md"
