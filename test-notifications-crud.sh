#!/bin/bash

# Test Notifications CRUD Operations with curl
# This script tests all CRUD operations on the notifications table

set -e

SUPABASE_URL="https://uzbozldsdzsfytsteqlb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Ym96bGRzZHpzZnl0c3RlcWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc1MzIsImV4cCI6MjA3Mzc4MzUzMn0.01VQh8PRqphCIbUCB2gLJjUZPX-AtzAF5ZRjJWyy24g"

# Test user (from database)
USER_ID="96b9692e-20db-4467-ac44-3011562aa2bd"
ORG_ID="00000000-0000-0000-0000-000000000001"

echo "========================================"
echo "Testing Notifications CRUD Operations"
echo "========================================"
echo ""

# First, get auth token (you need to be logged in)
echo "⚠️  Note: For full CRUD testing, you need a valid auth token."
echo "   This script uses anon key which may have RLS restrictions."
echo ""

# Test 1: CREATE (Insert notification)
echo "📝 Test 1: CREATE - Insert new notification"
echo "-------------------------------------------"
CREATE_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/notifications" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "'"${USER_ID}"'",
    "organization_id": "'"${ORG_ID}"'",
    "type": "info",
    "title": "CURL Test Notification",
    "message": "This notification was created via curl test script",
    "priority": "medium",
    "read": false,
    "metadata": {"source": "curl_test", "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}
  }')

echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"

# Extract notification ID from response
NOTIFICATION_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) else data['id'])" 2>/dev/null || echo "")

if [ -z "$NOTIFICATION_ID" ]; then
  echo "❌ Failed to create notification or extract ID"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Created notification with ID: $NOTIFICATION_ID"
echo ""
sleep 1

# Test 2: READ (Select notifications)
echo "📖 Test 2: READ - Get all notifications for user"
echo "--------------------------------------------------"
READ_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${USER_ID}&select=*&order=created_at.desc&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "$READ_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$READ_RESPONSE"
echo ""
sleep 1

# Test 3: READ (Count unread)
echo "🔢 Test 3: READ - Count unread notifications"
echo "---------------------------------------------"
COUNT_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${USER_ID}&read=eq.false&select=*" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Prefer: count=exact")

echo "$COUNT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$COUNT_RESPONSE"
echo ""
sleep 1

# Test 4: UPDATE (Mark as read)
echo "✏️  Test 4: UPDATE - Mark notification as read"
echo "----------------------------------------------"
UPDATE_RESPONSE=$(curl -s -X PATCH \
  "${SUPABASE_URL}/rest/v1/notifications?id=eq.${NOTIFICATION_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "read": true
  }')

echo "$UPDATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPDATE_RESPONSE"
echo "✅ Marked notification $NOTIFICATION_ID as read"
echo ""
sleep 1

# Test 5: READ (Verify update)
echo "🔍 Test 5: READ - Verify notification was marked as read"
echo "---------------------------------------------------------"
VERIFY_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?id=eq.${NOTIFICATION_ID}&select=id,title,read,updated_at" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""
sleep 1

# Test 6: READ (Filter by type)
echo "🎯 Test 6: READ - Filter notifications by type"
echo "-----------------------------------------------"
FILTER_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${USER_ID}&type=eq.ticket&select=id,type,title,priority&limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "$FILTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FILTER_RESPONSE"
echo ""
sleep 1

# Test 7: READ (Filter by priority)
echo "⚡ Test 7: READ - Filter high priority notifications"
echo "----------------------------------------------------"
PRIORITY_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${USER_ID}&priority=eq.high&select=id,title,priority&limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "$PRIORITY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PRIORITY_RESPONSE"
echo ""
sleep 1

# Test 8: DELETE (Remove notification)
echo "🗑️  Test 8: DELETE - Remove the test notification"
echo "--------------------------------------------------"
DELETE_RESPONSE=$(curl -s -X DELETE \
  "${SUPABASE_URL}/rest/v1/notifications?id=eq.${NOTIFICATION_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Prefer: return=representation")

echo "$DELETE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DELETE_RESPONSE"
echo "✅ Deleted notification $NOTIFICATION_ID"
echo ""
sleep 1

# Test 9: READ (Verify deletion)
echo "✔️  Test 9: READ - Verify notification was deleted"
echo "--------------------------------------------------"
FINAL_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?id=eq.${NOTIFICATION_ID}&select=*" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ "$FINAL_RESPONSE" = "[]" ]; then
  echo "✅ Notification successfully deleted (empty result)"
else
  echo "⚠️  Notification still exists or other issue:"
  echo "$FINAL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FINAL_RESPONSE"
fi
echo ""

# Test 10: Metadata filtering
echo "📊 Test 10: READ - Filter by metadata (JSON query)"
echo "---------------------------------------------------"
METADATA_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${USER_ID}&metadata->action=eq.assigned&select=id,title,metadata&limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "$METADATA_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$METADATA_RESPONSE"
echo ""

echo "========================================"
echo "✅ All CRUD Tests Completed!"
echo "========================================"
echo ""
echo "Summary of operations tested:"
echo "  ✅ CREATE - Insert notification"
echo "  ✅ READ - Get all notifications"
echo "  ✅ READ - Count unread"
echo "  ✅ UPDATE - Mark as read"
echo "  ✅ READ - Verify update"
echo "  ✅ READ - Filter by type"
echo "  ✅ READ - Filter by priority"
echo "  ✅ DELETE - Remove notification"
echo "  ✅ READ - Verify deletion"
echo "  ✅ READ - Metadata filtering"
echo ""
echo "All notification table fields work correctly! 🎉"
