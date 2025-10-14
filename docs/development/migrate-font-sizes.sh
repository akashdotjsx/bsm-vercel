#!/bin/bash

###############################################################################
# Kroolo BSM - Font Size Migration Script
#
# This script replaces all custom font size classes (text-[Npx]) with
# standardized Tailwind classes that respect the theme configuration.
#
# Usage:
#   ./scripts/migrate-font-sizes.sh
#   ./scripts/migrate-font-sizes.sh --dry-run    (preview changes only)
#   ./scripts/migrate-font-sizes.sh --backup     (create backups)
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/anujdwivedi/Desktop/kroolo/kroolo-bsm"
APP_DIR="$PROJECT_ROOT/app"
COMPONENTS_DIR="$PROJECT_ROOT/components"
BACKUP_DIR="$PROJECT_ROOT/.backups/font-migration-$(date +%Y%m%d_%H%M%S)"

# Parse arguments
DRY_RUN=false
CREATE_BACKUP=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --backup)
      CREATE_BACKUP=true
      shift
      ;;
    *)
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Kroolo BSM - Font Size Migration Script          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 Running in DRY-RUN mode (no files will be modified)${NC}"
  echo ""
fi

if [ "$CREATE_BACKUP" = true ]; then
  echo -e "${GREEN}💾 Creating backups in: $BACKUP_DIR${NC}"
  mkdir -p "$BACKUP_DIR"
  cp -R "$APP_DIR" "$BACKUP_DIR/app"
  cp -R "$COMPONENTS_DIR" "$BACKUP_DIR/components"
  echo -e "${GREEN}✓ Backup complete${NC}"
  echo ""
fi

# Migration mapping
declare -A FONT_MIGRATIONS=(
  ["text-\[10px\]"]="text-xs"
  ["text-\[11px\]"]="text-xs"
  ["text-\[12px\]"]="text-sm"
  ["text-\[13px\]"]="text-base"
  ["text-\[14px\]"]="text-md"
  ["text-\[15px\]"]="text-md"
  ["text-\[16px\]"]="text-lg"
  ["text-\[18px\]"]="text-xl"
  ["text-\[20px\]"]="text-xl"
  ["text-\[24px\]"]="text-2xl"
  ["text-\[30px\]"]="text-3xl"
  ["text-\[36px\]"]="text-4xl"
)

# Count files and replacements
total_files=0
total_replacements=0

echo -e "${BLUE}🔍 Scanning for files with custom font sizes...${NC}"
echo ""

# Function to process files
process_files() {
  local dir=$1
  local pattern=$2
  local replacement=$3
  
  # Find all .tsx and .ts files
  while IFS= read -r -d '' file; do
    # Skip node_modules and .next
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".next"* ]]; then
      continue
    fi
    
    # Check if file contains the pattern
    if grep -q "$pattern" "$file"; then
      local count=$(grep -o "$pattern" "$file" | wc -l | tr -d ' ')
      
      if [ "$count" -gt 0 ]; then
        echo -e "  ${YELLOW}•${NC} $file ${GREEN}($count matches)${NC}"
        total_files=$((total_files + 1))
        total_replacements=$((total_replacements + count))
        
        if [ "$DRY_RUN" = false ]; then
          # Perform the replacement
          if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/$pattern/$replacement/g" "$file"
          else
            # Linux
            sed -i "s/$pattern/$replacement/g" "$file"
          fi
        fi
      fi
    fi
  done < <(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -print0)
}

# Process each migration
for pattern in "${!FONT_MIGRATIONS[@]}"; do
  replacement="${FONT_MIGRATIONS[$pattern]}"
  echo -e "${BLUE}Migrating: ${YELLOW}$pattern${NC} → ${GREEN}$replacement${NC}"
  
  process_files "$APP_DIR" "$pattern" "$replacement"
  process_files "$COMPONENTS_DIR" "$pattern" "$replacement"
  
  echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    MIGRATION SUMMARY                   ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Files modified:    ${GREEN}$total_files${NC}"
echo -e "${BLUE}║${NC} Total replacements: ${GREEN}$total_replacements${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${BLUE}║${NC} Mode:              ${YELLOW}DRY-RUN (no changes made)${NC}"
else
  echo -e "${BLUE}║${NC} Mode:              ${GREEN}LIVE (changes applied)${NC}"
fi

if [ "$CREATE_BACKUP" = true ]; then
  echo -e "${BLUE}║${NC} Backup location:   ${GREEN}$BACKUP_DIR${NC}"
fi

echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DRY_RUN" = false ]; then
  echo -e "${GREEN}✓ Migration complete!${NC}"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "  1. Test your application thoroughly"
  echo -e "  2. Review the changes with: ${BLUE}git diff${NC}"
  echo -e "  3. To change font sizes globally, edit: ${BLUE}app/globals.css${NC}"
  echo -e "     (Search for --text-xs, --text-sm, --text-base, etc.)"
else
  echo -e "${YELLOW}This was a dry-run. To apply changes, run:${NC}"
  echo -e "  ${BLUE}./scripts/migrate-font-sizes.sh${NC}"
  echo ""
  echo -e "${YELLOW}To create backups before migrating, run:${NC}"
  echo -e "  ${BLUE}./scripts/migrate-font-sizes.sh --backup${NC}"
fi

echo ""
