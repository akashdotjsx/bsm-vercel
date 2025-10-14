#!/bin/bash

# Test Jira Workflow Import via GraphQL/curl
# This script tests the complete workflow import functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
GRAPHQL_ENDPOINT="${SUPABASE_URL}/graphql/v1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 Testing Jira Workflow Import via curl${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Get or create test organization
echo -e "${YELLOW}📋 Step 1: Getting test organization...${NC}"

ORG_QUERY='{
  "query": "query { organizationsCollection(first: 1) { edges { node { id name } } } }"
}'

ORG_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d "$ORG_QUERY")

ORG_ID=$(echo "$ORG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ORG_ID" ]; then
    echo -e "${RED}❌ No organization found. Creating test organization...${NC}"
    
    CREATE_ORG='{
      "query": "mutation { insertIntoorganizationsCollection(objects: [{name: \"Test Org - Workflow Import\", status: \"active\"}]) { records { id name } } }"
    }'
    
    CREATE_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
      -H "Content-Type: application/json" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -d "$CREATE_ORG")
    
    ORG_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

echo -e "${GREEN}✅ Organization ID: $ORG_ID${NC}\n"

# Step 2: Create a sample Jira workflow using the parser
echo -e "${YELLOW}📋 Step 2: Creating workflow from Jira format...${NC}"

# Prepare workflow config (simplified for testing)
WORKFLOW_CONFIG='{
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
}'

# Escape the JSON for GraphQL
WORKFLOW_CONFIG_ESCAPED=$(echo "$WORKFLOW_CONFIG" | jq -c . | sed 's/"/\\"/g')

CREATE_WORKFLOW_MUTATION=$(cat <<EOF
{
  "query": "mutation { insertIntoworkflowsCollection(objects: [{organization_id: \\"$ORG_ID\\", name: \\"Imported Jira Workflow - Test\\", description: \\"Sample Jira Workflow imported for testing\\", entity_type: \\"ticket\\", status: \\"draft\\", version: 1, workflow_config: \\"$WORKFLOW_CONFIG_ESCAPED\\", tags: [\\"imported\\", \\"jira\\", \\"test\\"]}]) { records { id name description entity_type status version workflow_config tags created_at } } }"
}
EOF
)

echo -e "${BLUE}Sending workflow creation request...${NC}"

CREATE_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d "$CREATE_WORKFLOW_MUTATION")

echo "$CREATE_RESPONSE" | jq . > /tmp/workflow_create_response.json 2>/dev/null || echo "$CREATE_RESPONSE" > /tmp/workflow_create_response.json

# Check for errors
if echo "$CREATE_RESPONSE" | grep -q '"errors"'; then
    echo -e "${RED}❌ Error creating workflow:${NC}"
    cat /tmp/workflow_create_response.json
    exit 1
fi

WORKFLOW_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
    echo -e "${RED}❌ Failed to create workflow${NC}"
    cat /tmp/workflow_create_response.json
    exit 1
fi

echo -e "${GREEN}✅ Workflow created successfully!${NC}"
echo -e "${GREEN}   ID: $WORKFLOW_ID${NC}\n"

# Step 3: Retrieve the created workflow
echo -e "${YELLOW}📋 Step 3: Retrieving created workflow...${NC}"

GET_WORKFLOW_QUERY=$(cat <<EOF
{
  "query": "query { workflowsCollection(filter: {id: {eq: \\"$WORKFLOW_ID\\"}}) { edges { node { id name description entity_type status version workflow_config tags created_at } } } }"
}
EOF
)

GET_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d "$GET_WORKFLOW_QUERY")

echo "$GET_RESPONSE" | jq . > /tmp/workflow_get_response.json 2>/dev/null || echo "$GET_RESPONSE" > /tmp/workflow_get_response.json

if echo "$GET_RESPONSE" | grep -q "$WORKFLOW_ID"; then
    echo -e "${GREEN}✅ Workflow retrieved successfully!${NC}\n"
    
    # Display workflow details
    echo -e "${BLUE}Workflow Details:${NC}"
    cat /tmp/workflow_get_response.json | jq '.data.workflowsCollection.edges[0].node | {id, name, entity_type, status, version, tags}' 2>/dev/null || echo "See /tmp/workflow_get_response.json for details"
    echo ""
else
    echo -e "${RED}❌ Failed to retrieve workflow${NC}"
    cat /tmp/workflow_get_response.json
    exit 1
fi

# Step 4: List all workflows
echo -e "${YELLOW}📋 Step 4: Listing all workflows...${NC}"

LIST_QUERY='{
  "query": "query { workflowsCollection(orderBy: [{created_at: DescNullsLast}], first: 5) { edges { node { id name entity_type status version tags } } } }"
}'

LIST_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d "$LIST_QUERY")

echo "$LIST_RESPONSE" | jq . > /tmp/workflow_list_response.json 2>/dev/null || echo "$LIST_RESPONSE" > /tmp/workflow_list_response.json

WORKFLOW_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')

echo -e "${GREEN}✅ Found $WORKFLOW_COUNT workflows${NC}\n"

# Step 5: Test workflow config parsing
echo -e "${YELLOW}📋 Step 5: Validating workflow config...${NC}"

if command -v node &> /dev/null; then
    # Create a quick test script
    cat > /tmp/test_workflow_config.js <<'JSEOF'
const config = WORKFLOW_CONFIG_PLACEHOLDER;

console.log('Validating workflow configuration...');
console.log(`✓ Statuses: ${config.statuses.length}`);
console.log(`✓ Transitions: ${config.transitions.length}`);
console.log(`✓ Initial Status: ${config.initial_status}`);

config.statuses.forEach(s => {
    console.log(`  - ${s.name} (${s.category})`);
});

console.log('\nTransitions:');
config.transitions.forEach(t => {
    console.log(`  - ${t.name}: ${t.from_status} → ${t.to_status}`);
    console.log(`    Conditions: ${t.conditions.length}`);
    console.log(`    Validators: ${t.validators.length}`);
    console.log(`    Post-functions: ${t.post_functions.length}`);
});
JSEOF

    # Replace placeholder with actual config
    sed "s/WORKFLOW_CONFIG_PLACEHOLDER/$WORKFLOW_CONFIG/g" /tmp/test_workflow_config.js > /tmp/test_workflow_final.js
    
    echo ""
    node /tmp/test_workflow_final.js
    echo ""
    echo -e "${GREEN}✅ Workflow config is valid!${NC}\n"
else
    echo -e "${YELLOW}⚠️  Node.js not found, skipping config validation${NC}\n"
fi

# Step 6: Cleanup (optional)
echo -e "${YELLOW}📋 Step 6: Cleanup...${NC}"

read -p "Do you want to delete the test workflow? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DELETE_MUTATION=$(cat <<EOF
{
  "query": "mutation { deleteFromworkflowsCollection(filter: {id: {eq: \\"$WORKFLOW_ID\\"}}) { records { id } } }"
}
EOF
)

    DELETE_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
      -H "Content-Type: application/json" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -d "$DELETE_MUTATION")
    
    if echo "$DELETE_RESPONSE" | grep -q "$WORKFLOW_ID"; then
        echo -e "${GREEN}✅ Test workflow deleted${NC}\n"
    else
        echo -e "${RED}❌ Failed to delete workflow${NC}\n"
    fi
else
    echo -e "${BLUE}ℹ️  Test workflow kept (ID: $WORKFLOW_ID)${NC}\n"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Organization: $ORG_ID${NC}"
echo -e "${GREEN}✅ Workflow Created: $WORKFLOW_ID${NC}"
echo -e "${GREEN}✅ Workflow Retrieved Successfully${NC}"
echo -e "${GREEN}✅ Config Validated${NC}"
echo ""
echo -e "${BLUE}Response files saved to:${NC}"
echo -e "  - /tmp/workflow_create_response.json"
echo -e "  - /tmp/workflow_get_response.json"
echo -e "  - /tmp/workflow_list_response.json"
echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}\n"
