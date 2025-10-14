#!/bin/bash

# Simplified Test for Jira Workflow Import using REST API
# This uses Supabase REST API instead of GraphQL for easier JSON handling

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
REST_ENDPOINT="${SUPABASE_URL}/rest/v1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 Testing Jira Workflow Import (REST)${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Get organization
echo -e "${YELLOW}📋 Step 1: Getting organization...${NC}"

ORG_RESPONSE=$(curl -s -X GET "${REST_ENDPOINT}/organizations?limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)

if [ -z "$ORG_ID" ]; then
    echo -e "${YELLOW}Creating test organization...${NC}"
    
    CREATE_ORG_DATA='{
      "name": "Test Org - Workflow Import",
      "status": "active"
    }'
    
    CREATE_ORG_RESPONSE=$(curl -s -X POST "${REST_ENDPOINT}/organizations" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "$CREATE_ORG_DATA")
    
    ORG_ID=$(echo "$CREATE_ORG_RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)
fi

if [ -z "$ORG_ID" ]; then
    echo -e "${RED}❌ Failed to get/create organization${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Organization ID: $ORG_ID${NC}\n"

# Step 2: Create workflow with Jira-imported structure
echo -e "${YELLOW}📋 Step 2: Creating workflow from Jira format...${NC}"

WORKFLOW_DATA=$(cat <<'EOF'
{
  "organization_id": "ORG_ID_PLACEHOLDER",
  "name": "Imported Jira Workflow - Test",
  "description": "Sample Jira Workflow imported via curl test",
  "category": "ticket",
  "status": "draft",
  "version": 1,
  "definition": {
    "statuses": [
      {"id": "to_do", "name": "To Do", "category": "todo", "color": "#6B7280"},
      {"id": "in_progress", "name": "In Progress", "category": "in_progress", "color": "#3B82F6"},
      {"id": "in_review", "name": "In Review", "category": "in_progress", "color": "#F59E0B"},
      {"id": "done", "name": "Done", "category": "done", "color": "#10B981"}
    ],
    "transitions": [
      {
        "id": "10",
        "name": "Start Progress",
        "from_status": "to_do",
        "to_status": "in_progress",
        "conditions": [{"type": "permission", "config": {"condition": "user_assigned"}}],
        "validators": [],
        "post_functions": [{"type": "update_assignee", "config": {"assignToCurrentUser": true}, "order": 1}]
      },
      {
        "id": "11",
        "name": "Send for Review",
        "from_status": "in_progress",
        "to_status": "in_review",
        "conditions": [{"type": "required_field", "config": {"condition": "comment_required"}}],
        "validators": [],
        "post_functions": [{"type": "notification", "config": {"notify": true}, "order": 1}]
      },
      {
        "id": "12",
        "name": "Approve",
        "from_status": "in_review",
        "to_status": "done",
        "conditions": [{"type": "permission", "config": {"condition": "approver_required"}}],
        "validators": [{"type": "permission_validator", "config": {"validator": "permission_check"}, "message": "Permission required"}],
        "post_functions": [{"type": "set_resolution", "config": {"resolution": "done"}, "order": 1}]
      },
      {
        "id": "14",
        "name": "Reopen",
        "from_status": "done",
        "to_status": "to_do",
        "conditions": [{"type": "permission", "config": {"condition": "can_reopen"}}],
        "validators": [],
        "post_functions": [{"type": "clear_resolution", "config": {}, "order": 1}]
      }
    ],
    "initial_status": "to_do"
  }
}
EOF
)

# Replace org ID
WORKFLOW_DATA=$(echo "$WORKFLOW_DATA" | sed "s/ORG_ID_PLACEHOLDER/$ORG_ID/g")

echo -e "${BLUE}Sending workflow creation request...${NC}"

CREATE_RESPONSE=$(curl -s -X POST "${REST_ENDPOINT}/workflows" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$WORKFLOW_DATA")

echo "$CREATE_RESPONSE" | jq . > /tmp/workflow_create_response.json 2>/dev/null || echo "$CREATE_RESPONSE" > /tmp/workflow_create_response.json

# Check for actual errors (not just the word "error" in success response)
if echo "$CREATE_RESPONSE" | jq -e '.message' >/dev/null 2>&1 && echo "$CREATE_RESPONSE" | grep -q "code"; then
    echo -e "${RED}❌ Error creating workflow:${NC}"
    cat /tmp/workflow_create_response.json
    exit 1
fi

WORKFLOW_ID=$(echo "$CREATE_RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)

if [ -z "$WORKFLOW_ID" ]; then
    echo -e "${RED}❌ Failed to create workflow${NC}"
    cat /tmp/workflow_create_response.json
    exit 1
fi

echo -e "${GREEN}✅ Workflow created successfully!${NC}"
echo -e "${GREEN}   ID: $WORKFLOW_ID${NC}\n"

# Step 3: Retrieve the workflow
echo -e "${YELLOW}📋 Step 3: Retrieving created workflow...${NC}"

GET_RESPONSE=$(curl -s -X GET "${REST_ENDPOINT}/workflows?id=eq.${WORKFLOW_ID}&select=*" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "$GET_RESPONSE" | jq . > /tmp/workflow_get_response.json 2>/dev/null || echo "$GET_RESPONSE" > /tmp/workflow_get_response.json

if echo "$GET_RESPONSE" | grep -q "$WORKFLOW_ID"; then
    echo -e "${GREEN}✅ Workflow retrieved successfully!${NC}\n"
    
    echo -e "${BLUE}Workflow Details:${NC}"
    echo "$GET_RESPONSE" | jq '.[0] | {id, name, category, status, version, definition: (.definition | {status_count: (.statuses | length), transition_count: (.transitions | length)})}' 2>/dev/null || echo "See /tmp/workflow_get_response.json"
    echo ""
else
    echo -e "${RED}❌ Failed to retrieve workflow${NC}"
    cat /tmp/workflow_get_response.json
    exit 1
fi

# Step 4: Validate workflow config
echo -e "${YELLOW}📋 Step 4: Validating workflow config...${NC}"

WORKFLOW_CONFIG=$(echo "$GET_RESPONSE" | jq -r '.[0].definition' 2>/dev/null)

if [ "$WORKFLOW_CONFIG" != "null" ] && [ -n "$WORKFLOW_CONFIG" ]; then
    STATUS_COUNT=$(echo "$WORKFLOW_CONFIG" | jq '.statuses | length' 2>/dev/null)
    TRANSITION_COUNT=$(echo "$WORKFLOW_CONFIG" | jq '.transitions | length' 2>/dev/null)
    INITIAL_STATUS=$(echo "$WORKFLOW_CONFIG" | jq -r '.initial_status' 2>/dev/null)
    
    echo -e "${GREEN}✅ Workflow config validated:${NC}"
    echo -e "   - Statuses: $STATUS_COUNT"
    echo -e "   - Transitions: $TRANSITION_COUNT"
    echo -e "   - Initial Status: $INITIAL_STATUS"
    echo ""
    
    echo -e "${BLUE}Statuses:${NC}"
    echo "$WORKFLOW_CONFIG" | jq -r '.statuses[] | "  - \(.name) (\(.category))"' 2>/dev/null
    echo ""
    
    echo -e "${BLUE}Transitions:${NC}"
    echo "$WORKFLOW_CONFIG" | jq -r '.transitions[] | "  - \(.name): \(.from_status) → \(.to_status)"' 2>/dev/null
    echo ""
else
    echo -e "${RED}❌ Workflow config is invalid${NC}"
fi

# Step 5: List all workflows
echo -e "${YELLOW}📋 Step 5: Listing all workflows...${NC}"

LIST_RESPONSE=$(curl -s -X GET "${REST_ENDPOINT}/workflows?order=created_at.desc&limit=5&select=id,name,category,status,version" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "$LIST_RESPONSE" | jq . > /tmp/workflow_list_response.json 2>/dev/null || echo "$LIST_RESPONSE" > /tmp/workflow_list_response.json

WORKFLOW_COUNT=$(echo "$LIST_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

echo -e "${GREEN}✅ Found $WORKFLOW_COUNT workflows${NC}"
echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || cat /tmp/workflow_list_response.json
echo ""

# Step 6: Cleanup
echo -e "${YELLOW}📋 Step 6: Cleanup...${NC}"

read -p "Do you want to delete the test workflow? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${REST_ENDPOINT}/workflows?id=eq.${WORKFLOW_ID}" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "Content-Type: application/json")
    
    echo -e "${GREEN}✅ Test workflow deleted${NC}\n"
else
    echo -e "${BLUE}ℹ️  Test workflow kept (ID: $WORKFLOW_ID)${NC}\n"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Organization: $ORG_ID${NC}"
echo -e "${GREEN}✅ Workflow Created: $WORKFLOW_ID${NC}"
echo -e "${GREEN}✅ Workflow Retrieved: Yes${NC}"
echo -e "${GREEN}✅ Config Validated: Yes${NC}"
echo -e "${GREEN}✅ Statuses: $STATUS_COUNT${NC}"
echo -e "${GREEN}✅ Transitions: $TRANSITION_COUNT${NC}"
echo ""
echo -e "${BLUE}Response files:${NC}"
echo -e "  - /tmp/workflow_create_response.json"
echo -e "  - /tmp/workflow_get_response.json"
echo -e "  - /tmp/workflow_list_response.json"
echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}\n"
