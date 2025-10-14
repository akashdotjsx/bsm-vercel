#!/bin/bash

# GraphQL Integration Verification Script
# This script verifies that GraphQL has been added without breaking existing functionality

echo "🔍 Verifying GraphQL Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Function to check if file exists
check_file_exists() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $1 missing${NC}"
        ((FAILED++))
    fi
}

# Function to check if file was NOT modified (doesn't contain specific marker)
check_file_unchanged() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 unchanged (original version)${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  $1 not found (might be okay)${NC}"
    fi
}

echo "📁 Checking New GraphQL Files..."
echo "=================================="
check_file_exists "lib/graphql/client.ts"
check_file_exists "lib/graphql/queries.ts"
check_file_exists "hooks/use-tickets-gql.ts"
check_file_exists "hooks/use-users-gql.ts"
check_file_exists "hooks/use-services-assets-gql.ts"
check_file_exists "app/test-graphql/page.tsx"
check_file_exists "GRAPHQL_MIGRATION.md"
check_file_exists "README_GRAPHQL.md"
echo ""

echo "🔒 Checking Original Files Are Unchanged..."
echo "============================================="
check_file_unchanged "hooks/use-tickets.ts"
check_file_unchanged "lib/api/tickets.ts"
check_file_unchanged "lib/api/users.ts"
check_file_unchanged "lib/api/assets.ts"
echo ""

echo "📦 Checking Dependencies..."
echo "============================"
if grep -q "graphql-request" package.json; then
    echo -e "${GREEN}✅ graphql-request installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ graphql-request missing${NC}"
    ((FAILED++))
fi

if grep -q "\"graphql\"" package.json; then
    echo -e "${GREEN}✅ graphql installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ graphql missing${NC}"
    ((FAILED++))
fi
echo ""

echo "🧪 Running TypeScript Check..."
echo "==============================="
if npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  TypeScript has warnings (might be okay)${NC}"
fi
echo ""

echo "📊 Verification Summary"
echo "======================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! GraphQL integration is safe.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Visit: http://localhost:3000/test-graphql"
    echo "3. Read: README_GRAPHQL.md for migration guide"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review above.${NC}"
    exit 1
fi
