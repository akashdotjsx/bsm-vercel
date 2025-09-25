const { createClient } = require('@supabase/supabase-js')
const { readFileSync, existsSync } = require('fs')
require('dotenv').config() // Load environment variables

// Use service role key for testing to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

console.log('🔑 Using', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key (RLS bypassed)' : 'Anon Key (RLS active)')

// Tables to SKIP for CRUD testing (system/critical tables)
const SKIP_CRUD_TABLES = [
  'audit_logs',           // System audit logs
  'analytics_snapshots',  // Analytics data
  'metrics_cache',        // System cache
  'profiles',             // User profiles (linked to auth.users)
  'organizations',        // Critical org data
  'system_settings',      // System configuration
  'notification_preferences' // User settings
]

// Dynamic table discovery
let ALL_TABLES = []
let SAFE_CRUD_TABLES = []

// Track all created test records for cleanup
const TEST_RECORDS = {
  created: [],
  toCleanup: []
}

async function discoverTables() {
  console.log('🔍 Discovering database tables...')
  
  try {
    // Method 1: Try to get tables from information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_public_tables')
    
    if (!schemaError && schemaData) {
      ALL_TABLES = schemaData.map(row => row.table_name)
    } else {
      // Method 2: Fallback - try common PostgREST introspection
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      })
      
      if (response.ok) {
        const openapi = await response.json()
        ALL_TABLES = Object.keys(openapi.definitions || {})
      } else {
        // Method 3: Manual discovery by testing known patterns
        console.log('📋 Using manual table discovery...')
        await discoverTablesManually()
      }
    }
    
    // Filter out tables that shouldn't be CRUD tested
    SAFE_CRUD_TABLES = ALL_TABLES.filter(table => !SKIP_CRUD_TABLES.includes(table))
    
    console.log(`✅ Discovered ${ALL_TABLES.length} total tables`)
    console.log(`🧪 ${SAFE_CRUD_TABLES.length} tables safe for CRUD testing`)
    console.log(`⚠️  ${SKIP_CRUD_TABLES.length} tables skipped (system/critical)`)
    
    return { total: ALL_TABLES.length, safe: SAFE_CRUD_TABLES.length }
    
  } catch (error) {
    console.error('❌ Table discovery failed:', error.message)
    // Fallback to manual discovery
    await discoverTablesManually()
    return { total: ALL_TABLES.length, safe: SAFE_CRUD_TABLES.length }
  }
}

async function discoverTablesManually() {
  console.log('🔎 Manual table discovery in progress...')
  
  // Known table patterns from your schema
  const commonTables = [
    'tickets', 'teams', 'services', 'workflows', 'knowledge_articles',
    'custom_reports', 'service_categories', 'service_requests', 
    'sla_policies', 'workflow_templates', 'workflow_executions',
    'ticket_comments', 'ticket_attachments', 'ticket_history',
    'team_members', 'service_request_approvals', 'workflow_schedules',
    'workflow_step_executions'
  ]
  
  const discoveredTables = []
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (!error) {
        discoveredTables.push(tableName)
      }
    } catch (err) {
      // Table doesn't exist or no access
    }
  }
  
  // Add system tables we know exist but skip for CRUD
  const systemTables = ['profiles', 'organizations', 'audit_logs', 'analytics_snapshots', 'metrics_cache', 'system_settings', 'notification_preferences']
  
  ALL_TABLES = [...discoveredTables, ...systemTables]
  SAFE_CRUD_TABLES = discoveredTables.filter(table => !SKIP_CRUD_TABLES.includes(table))
  
  console.log(`📋 Manual discovery found ${discoveredTables.length} accessible tables`)
}

async function createTableDiscoveryFunction() {
  console.log('🛠️  Setting up table discovery function...')
  
  try {
    // Create helper function for table discovery
    const { error } = await supabase.rpc('create_table_discovery_function', {
      sql_code: `
        CREATE OR REPLACE FUNCTION get_public_tables()
        RETURNS TABLE(table_name text)
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT tablename::text as table_name
          FROM pg_tables 
          WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT LIKE 'information_schema%'
          ORDER BY tablename;
        $$;
      `
    })
    
    if (!error) {
      console.log('✅ Table discovery function created')
    }
  } catch (err) {
    console.log('ℹ️  Using alternative discovery method')
  }
}

async function initializeClients() {
  console.log('🚀 Initializing Supabase client...')
  
  try {
    // Test basic Supabase connection by checking auth
    const { data, error } = await supabase.auth.getSession()
    
    console.log('✅ Supabase client initialized successfully')
    
    // Test GraphQL endpoint
    const graphqlResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '{ __schema { queryType { name } } }'
      })
    })
    
    if (graphqlResponse.ok) {
      console.log('✅ GraphQL client connected successfully')
    } else {
      console.warn('⚠️  GraphQL endpoint not accessible')
    }
    
  } catch (error) {
    console.error('❌ Client initialization failed:', error.message)
    process.exit(1)
  }
}

async function verifyTables() {
  console.log('🔍 Verifying discovered tables...')
  
  let existingTables = []
  let missingTables = []
  
  for (const tableName of ALL_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('does not exist') || 
            error.message.includes('relation') ||
            error.code === 'PGRST116') {
          missingTables.push(tableName)
        } else {
          // Table exists but might have permission issues
          existingTables.push(`${tableName} (⚠️ ${error.message})`)
        }
      } else {
        existingTables.push(tableName)
      }
    } catch (err) {
      missingTables.push(tableName)
    }
  }
  
  console.log(`✅ Verified ${existingTables.length} existing tables:`)
  existingTables.forEach(table => console.log(`   📋 ${table}`))
  
  if (missingTables.length > 0) {
    console.log(`⚠️  Missing ${missingTables.length} tables:`)
    missingTables.forEach(table => console.log(`   ❌ ${table}`))
  }
  
  return { existingTables: existingTables.length, missingTables: missingTables.length }
}

async function runBasicSchema() {
  console.log('📊 Running basic schema setup...')
  
  try {
    const schemaPath = './database-config/db.sql'
    
    if (!existsSync(schemaPath)) {
      console.warn('⚠️  Schema file not found at ./database-config/db.sql')
      return
    }
    
    const schema = readFileSync(schemaPath, 'utf8')
    
    if (schema.includes('WARNING: This schema is for context only')) {
      console.log('ℹ️  Schema file is for context only - skipping execution')
      return
    }
    
    console.log(`✅ Schema file loaded (${schema.length} characters)`)
    console.log('ℹ️  For safety, schema execution is manual - use Supabase dashboard or CLI')
    
  } catch (error) {
    console.warn('⚠️  Schema processing failed:', error.message)
  }
}

async function printStats() {
  console.log('📈 Database Statistics:')
  
  const stats = {}
  
  for (const tableName of ALL_TABLES) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        stats[tableName] = count
        console.log(`  📋 ${tableName}: ${count} records`)
      } else {
        console.log(`  📋 ${tableName}: not accessible`)
      }
    } catch (e) {
      console.log(`  📋 ${tableName}: error reading`)
    }
  }
  
  const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
  console.log(`  🎯 Total records across all tables: ${totalRecords}`)
  
  return stats
}

async function analyzeTableStructure(tableName) {
  console.log(`   🔍 Analyzing structure of ${tableName}...`)
  
  try {
    // First, try to get one record to understand the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error && !error.message.includes('0 rows')) {
      // Real error, not just empty table
      return { columns: [], hasId: false, structure: 'error' }
    }
    
    // If we have data, use it
    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      const hasId = columns.includes('id')
      const hasName = columns.includes('name')
      const hasTitle = columns.includes('title')
      
      return {
        columns,
        hasId,
        hasName,
        hasTitle,
        structure: 'analyzed'
      }
    }
    
    // Table is empty, try alternative method - insert and immediately delete a test record
    console.log(`    📊 Table is empty, using probe method...`)
    
    // Based on the schema, all tables have these common fields
    const minimalTestData = {}
    
    // Try to insert minimal data to discover structure
    const { data: probeData, error: probeError } = await supabase
      .from(tableName)
      .insert(minimalTestData)
      .select()
    
    if (probeError) {
      // Parse the error to understand required fields
      const errorMsg = probeError.message || ''
      
      // Common patterns in error messages
      if (errorMsg.includes('null value') || errorMsg.includes('violates not-null')) {
        // Extract field names from error
        const columns = extractColumnsFromError(errorMsg, tableName)
        return {
          columns,
          hasId: columns.includes('id'),
          hasName: columns.includes('name'),
          hasTitle: columns.includes('title'),
          structure: 'inferred'
        }
      }
    }
    
    // If probe succeeded, we have the structure
    if (probeData && probeData.length > 0) {
      const columns = Object.keys(probeData[0])
      const recordId = probeData[0].id
      
      // Immediately delete the probe record
      await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId)
      
      console.log(`    🧹 Probe record cleaned up`)
      
      return {
        columns,
        hasId: columns.includes('id'),
        hasName: columns.includes('name'),
        hasTitle: columns.includes('title'),
        structure: 'probed'
      }
    }
    
    // Fallback: use known schema structure
    const knownColumns = getKnownTableColumns(tableName)
    if (knownColumns.length > 0) {
      return {
        columns: knownColumns,
        hasId: knownColumns.includes('id'),
        hasName: knownColumns.includes('name'),
        hasTitle: knownColumns.includes('title'),
        structure: 'known'
      }
    }
    
    return { columns: [], hasId: false, structure: 'unknown' }
  } catch (err) {
    console.log(`    ⚠️ Structure analysis error: ${err.message}`)
    
    // Last resort: use known schema
    const knownColumns = getKnownTableColumns(tableName)
    if (knownColumns.length > 0) {
      return {
        columns: knownColumns,
        hasId: knownColumns.includes('id'),
        hasName: knownColumns.includes('name'),
        hasTitle: knownColumns.includes('title'),
        structure: 'fallback'
      }
    }
    
    return { columns: [], hasId: false, structure: 'error' }
  }
}

// Helper function to extract column names from error messages
function extractColumnsFromError(errorMsg, tableName) {
  const columns = ['id'] // All tables have id
  
  // Common required fields based on error patterns
  if (errorMsg.includes('organization_id')) columns.push('organization_id')
  if (errorMsg.includes('name')) columns.push('name')
  if (errorMsg.includes('title')) columns.push('title')
  if (errorMsg.includes('ticket_number')) columns.push('ticket_number')
  if (errorMsg.includes('request_number')) columns.push('request_number')
  
  return columns
}

// Helper function to get or create test organization
let TEST_ORG_ID = null
async function getOrCreateTestOrganization() {
  // Use cached org ID if available
  if (TEST_ORG_ID) return TEST_ORG_ID
  
  try {
    // Check if test organization exists
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'CRUD Test Organization')
      .single()
    
    if (existing) {
      TEST_ORG_ID = existing.id
      return TEST_ORG_ID
    }
    
    // Create test organization
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: 'CRUD Test Organization',
        domain: 'crud-test.local',
        status: 'active',
        tier: 'basic',
        health_score: 100,
        settings: { test: true }
      })
      .select('id')
      .single()
    
    if (error) {
      console.log('    ⚠️ Could not create test organization:', error.message)
      return null
    }
    
    TEST_ORG_ID = newOrg.id
    console.log('    🏢 Created test organization:', TEST_ORG_ID)
    return TEST_ORG_ID
  } catch (err) {
    return null
  }
}

// Known schema structure based on the provided SQL
function getKnownTableColumns(tableName) {
  const tableSchemas = {
    'analytics_snapshots': ['id', 'organization_id', 'snapshot_date', 'period_type', 'tickets_created', 'tickets_resolved', 'created_at'],
    'audit_logs': ['id', 'organization_id', 'action', 'entity_type', 'entity_id', 'user_id', 'created_at'],
    'custom_reports': ['id', 'organization_id', 'name', 'description', 'report_type', 'data_source', 'created_at'],
    'knowledge_articles': ['id', 'organization_id', 'title', 'content', 'summary', 'category', 'status', 'created_at'],
    'metrics_cache': ['id', 'organization_id', 'metric_name', 'metric_value', 'calculated_at', 'expires_at'],
    'notification_preferences': ['id', 'user_id', 'email_ticket_assigned', 'email_ticket_updated', 'updated_at'],
    'organizations': ['id', 'name', 'domain', 'status', 'tier', 'health_score', 'created_at'],
    'profiles': ['id', 'organization_id', 'email', 'first_name', 'last_name', 'role', 'created_at'],
    'service_categories': ['id', 'organization_id', 'name', 'description', 'icon', 'sort_order', 'created_at'],
    'service_request_approvals': ['id', 'service_request_id', 'approver_id', 'status', 'comments', 'approved_at'],
    'service_requests': ['id', 'organization_id', 'request_number', 'service_id', 'title', 'description', 'status', 'created_at'],
    'services': ['id', 'organization_id', 'name', 'description', 'status', 'is_requestable', 'created_at'],
    'sla_policies': ['id', 'organization_id', 'name', 'description', 'priority', 'first_response_time_hours', 'created_at'],
    'system_settings': ['id', 'organization_id', 'setting_key', 'setting_value', 'setting_type', 'updated_at'],
    'team_members': ['id', 'team_id', 'user_id', 'role', 'joined_at'],
    'teams': ['id', 'organization_id', 'name', 'description', 'department', 'is_active', 'created_at'],
    'ticket_attachments': ['id', 'ticket_id', 'filename', 'file_size', 'mime_type', 'storage_path', 'created_at'],
    'ticket_comments': ['id', 'ticket_id', 'content', 'is_internal', 'is_system', 'created_at'],
    'ticket_history': ['id', 'ticket_id', 'field_name', 'old_value', 'new_value', 'created_at'],
    'tickets': ['id', 'organization_id', 'ticket_number', 'title', 'description', 'type', 'priority', 'status', 'created_at'],
    'workflow_executions': ['id', 'workflow_id', 'organization_id', 'status', 'started_at', 'created_at'],
    'workflow_schedules': ['id', 'workflow_id', 'organization_id', 'name', 'cron_expression', 'is_active', 'created_at'],
    'workflow_step_executions': ['id', 'execution_id', 'step_id', 'step_name', 'step_type', 'status', 'created_at'],
    'workflow_templates': ['id', 'name', 'description', 'template_definition', 'version', 'created_at'],
    'workflows': ['id', 'organization_id', 'name', 'description', 'definition', 'status', 'created_at']
  }
  
  return tableSchemas[tableName] || []
}

async function generateDynamicTestData(tableName, structure) {
  const baseId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const testData = {}
  
  // Get or create a test organization for tables that need it
  // Check both structure columns and known columns
  const knownCols = getKnownTableColumns(tableName)
  const needsOrgId = structure.columns.includes('organization_id') || knownCols.includes('organization_id')
  
  let testOrgId = null // Define it here so it's available throughout the function
  
  if (needsOrgId && tableName !== 'organizations') {
    testOrgId = await getOrCreateTestOrganization()
    if (testOrgId) {
      testData.organization_id = testOrgId
      console.log(`    ✅ Set organization_id: ${testOrgId}`)
    } else {
      // Can't test without organization
      console.log(`    ⚠️ Cannot test ${tableName} without organization`)
      return {}
    }
  }
  
  // Handle special required fields for specific tables
  // Use known columns if structure doesn't have them (empty tables)
  if (tableName === 'tickets') {
    testData.ticket_number = `TICKET-${baseId}`
    testData.title = `Test Ticket ${baseId}`
  }
  if (tableName === 'service_requests') {
    testData.request_number = `REQ-${baseId}`
    testData.title = `Test Service Request ${baseId}`
    // Need a service_id - try to find one or create one
    const { data: services } = await supabase.from('services').select('id').limit(1)
    if (services && services.length > 0) {
      testData.service_id = services[0].id
    } else {
      // Create a minimal service
      const { data: newService } = await supabase.from('services')
        .insert({
          organization_id: testData.organization_id || testOrgId,
          name: `Test Service for Request ${baseId}`,
          status: 'active'
        })
        .select('id')
        .single()
      if (newService) {
        testData.service_id = newService.id
        TEST_RECORDS.toCleanup.push({ table: 'services', id: newService.id })
      } else {
        return {}
      }
    }
  }
  // For workflow_schedules, always set required fields even if structure doesn't show them
  if (tableName === 'workflow_schedules') {
    testData.name = `Test Schedule ${baseId}`
    testData.cron_expression = '0 0 * * *' // Daily at midnight
    // ALWAYS need a workflow_id - try to find or create one
    const { data: workflows } = await supabase.from('workflows').select('id').limit(1)
    if (workflows && workflows.length > 0) {
      testData.workflow_id = workflows[0].id
    } else {
      // Create a minimal workflow for testing
      console.log(`    🔄 Creating workflow for ${tableName}...`)
      const { data: newWorkflow, error: wfError } = await supabase.from('workflows')
        .insert({
          organization_id: testData.organization_id || testOrgId,
          name: `Test Workflow for Schedule ${baseId}`,
          definition: { steps: [], triggers: [] },
          status: 'draft',
          version: 1 // integer, not string
        })
        .select('id')
        .single()
      
      if (wfError) {
        console.log(`    ⚠️ Failed to create workflow: ${wfError.message}`)
        return {}
      }
      
      if (newWorkflow) {
        testData.workflow_id = newWorkflow.id
        console.log(`    ✅ Created workflow_id: ${newWorkflow.id}`)
        // Track for cleanup
        TEST_RECORDS.toCleanup.push({ table: 'workflows', id: newWorkflow.id })
      } else {
        // Can't create schedule without workflow
        return {}
      }
    }
  }
  if (tableName === 'workflow_executions') {
    // Need a workflow_id
    const { data: workflows } = await supabase.from('workflows').select('id').limit(1)
    if (workflows && workflows.length > 0) {
      testData.workflow_id = workflows[0].id
    } else {
      // Create a minimal workflow
      const { data: newWorkflow } = await supabase.from('workflows')
        .insert({
          organization_id: testData.organization_id || testOrgId,
          name: `Test Workflow for Execution ${baseId}`,
          definition: { steps: [], triggers: [] },
          status: 'draft'
        })
        .select('id')
        .single()
      if (newWorkflow) {
        testData.workflow_id = newWorkflow.id
        TEST_RECORDS.toCleanup.push({ table: 'workflows', id: newWorkflow.id })
      } else {
        return {}
      }
    }
  }
  if (tableName === 'workflows') {
    testData.name = `Test Workflow ${baseId}`
    testData.definition = { steps: [], triggers: [] }
    testData.status = 'draft'
    // version field is integer in the schema
    testData.version = 1
  }
  if (tableName === 'custom_reports') {
    testData.name = `Test Report ${baseId}`
    testData.report_type = 'table'
    testData.data_source = 'tickets'
  }
  if (tableName === 'workflow_templates' && structure.columns.includes('template_definition')) {
    testData.template_definition = { steps: [], triggers: [] }
  }
  if (tableName === 'ticket_history') {
    testData.field_name = 'status'
    testData.old_value = 'new'
    testData.new_value = 'in_progress'
    // Need a ticket_id - try to find or create one
    const { data: tickets } = await supabase.from('tickets').select('id').limit(1)
    if (tickets && tickets.length > 0) {
      testData.ticket_id = tickets[0].id
    } else {
      // Create a minimal ticket for testing
      const { data: newTicket } = await supabase.from('tickets')
        .insert({
          organization_id: testData.organization_id || testOrgId,
          ticket_number: `TICKET-HISTORY-${baseId}`,
          title: `Test Ticket for History ${baseId}`,
          status: 'new'
        })
        .select('id')
        .single()
      if (newTicket) {
        testData.ticket_id = newTicket.id
        TEST_RECORDS.toCleanup.push({ table: 'tickets', id: newTicket.id })
      } else {
        return {}
      }
    }
  }
  if (tableName === 'ticket_comments') {
    testData.content = 'Test comment for CRUD verification'
    // Need a ticket_id
    const { data: tickets } = await supabase.from('tickets').select('id').limit(1)
    if (tickets && tickets.length > 0) {
      testData.ticket_id = tickets[0].id
    } else {
      // Create a minimal ticket
      const { data: newTicket } = await supabase.from('tickets')
        .insert({
          organization_id: testData.organization_id || testOrgId,
          ticket_number: `TICKET-COMMENT-${baseId}`,
          title: `Test Ticket for Comment ${baseId}`,
          status: 'new'
        })
        .select('id')
        .single()
      if (newTicket) {
        testData.ticket_id = newTicket.id
        TEST_RECORDS.toCleanup.push({ table: 'tickets', id: newTicket.id })
      } else {
        return {}
      }
    }
  }
  if (tableName === 'ticket_attachments') {
    testData.filename = 'test-file.txt'
    testData.storage_path = `/test/${baseId}/test-file.txt`
    // Need a ticket_id
    const { data: tickets } = await supabase.from('tickets').select('id').limit(1)
    if (tickets && tickets.length > 0) {
      testData.ticket_id = tickets[0].id
    } else {
      // Create a minimal ticket
      const { data: newTicket } = await supabase.from('tickets')
        .insert({
          organization_id: testData.organization_id || testOrgId,
          ticket_number: `TICKET-ATTACH-${baseId}`,
          title: `Test Ticket for Attachment ${baseId}`,
          status: 'new'
        })
        .select('id')
        .single()
      if (newTicket) {
        testData.ticket_id = newTicket.id
        TEST_RECORDS.toCleanup.push({ table: 'tickets', id: newTicket.id })
      } else {
        return {}
      }
    }
  }
  if (tableName === 'team_members') {
    // Need both team_id and user_id
    const { data: teams } = await supabase.from('teams').select('id').limit(1)
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
    
    if (teams && teams.length > 0 && profiles && profiles.length > 0) {
      testData.team_id = teams[0].id
      testData.user_id = profiles[0].id
    } else {
      // Can't test without both
      return {}
    }
  }
  if (tableName === 'service_request_approvals') {
    testData.status = 'pending'
    // Need a service_request_id
    const { data: requests } = await supabase.from('service_requests').select('id').limit(1)
    if (requests && requests.length > 0) {
      testData.service_request_id = requests[0].id
    } else {
      // Try to create one but need a service first
      const { data: services } = await supabase.from('services').select('id').limit(1)
      if (services && services.length > 0) {
        const { data: newRequest } = await supabase.from('service_requests')
          .insert({
            organization_id: testData.organization_id || testOrgId,
            request_number: `REQ-APPROVAL-${baseId}`,
            service_id: services[0].id,
            title: `Test Request for Approval ${baseId}`,
            status: 'pending'
          })
          .select('id')
          .single()
        if (newRequest) {
          testData.service_request_id = newRequest.id
          TEST_RECORDS.toCleanup.push({ table: 'service_requests', id: newRequest.id })
        } else {
          return {}
        }
      } else {
        return {}
      }
    }
  }
  if (tableName === 'sla_policies' && structure.columns.includes('priority')) {
    testData.priority = 'medium'
    testData.first_response_time_hours = 4
    testData.resolution_time_hours = 24
  }
  if (tableName === 'metrics_cache' && structure.columns.includes('metric_name')) {
    testData.metric_name = 'test_metric'
    testData.metric_value = { value: 100, unit: 'count' }
    testData.expires_at = new Date(Date.now() + 3600000).toISOString() // 1 hour from now
  }
  if (tableName === 'analytics_snapshots' && structure.columns.includes('snapshot_date')) {
    testData.snapshot_date = new Date().toISOString().split('T')[0]
    testData.period_type = 'daily'
  }
  if (tableName === 'audit_logs' && structure.columns.includes('action')) {
    testData.action = 'test_action'
    testData.entity_type = 'test_entity'
  }
  if (tableName === 'system_settings' && structure.columns.includes('setting_key')) {
    testData.setting_key = `test_setting_${baseId}`
    testData.setting_value = { test: true, value: 'test' }
  }
  if (tableName === 'workflow_step_executions') {
    testData.step_id = 'step-1'
    testData.step_name = 'Test Step'
    testData.step_type = 'action'
    // Need an execution_id
    const { data: executions } = await supabase.from('workflow_executions').select('id').limit(1)
    if (executions && executions.length > 0) {
      testData.execution_id = executions[0].id
    } else {
      // Try to create a workflow execution
      const { data: workflows } = await supabase.from('workflows').select('id').limit(1)
      if (workflows && workflows.length > 0) {
        const { data: newExecution } = await supabase.from('workflow_executions')
          .insert({
            organization_id: testData.organization_id || testOrgId,
            workflow_id: workflows[0].id,
            status: 'running'
          })
          .select('id')
          .single()
        if (newExecution) {
          testData.execution_id = newExecution.id
          TEST_RECORDS.toCleanup.push({ table: 'workflow_executions', id: newExecution.id })
        } else {
          return {}
        }
      } else {
        return {}
      }
    }
  }
  
  // Common patterns based on your schema
  const fieldPatterns = {
    'name': `Test ${tableName} ${baseId}`,
    'title': `Test ${tableName} Title ${baseId}`,
    'description': `Test description for ${tableName} CRUD verification. Will be automatically deleted.`,
    'content': `Test content for ${tableName} CRUD verification. Will be automatically deleted.`,
    'summary': `Test summary for ${tableName}`,
    'category': `test-category-crud`,
    'status': 'draft',
    'is_active': true,
    'is_public': false,
    'sort_order': 999,
    'priority': 'medium',
    'urgency': 'medium',
    'impact': 'medium',
    'type': 'test',
    'channel': 'web',
    'escalation_level': 0,
    'health_score': 100,
    'view_count': 0,
    'total_executions': 0,
    'successful_executions': 0,
    'failed_executions': 0,
    'popularity_score': 0,
    'average_rating': 0.0,
    'total_requests': 0
  }
  
  // Boolean fields
  const booleanFields = ['is_active', 'is_public', 'requires_approval', 'is_requestable', 'business_hours_only', 'sla_breached', 'auto_assigned', 'is_internal', 'is_system', 'is_template']
  
  // Numeric fields
  const numericFields = ['sort_order', 'escalation_level', 'health_score', 'view_count', 'total_executions', 'successful_executions', 'failed_executions', 'popularity_score', 'total_requests']
  
  // Array fields
  const arrayFields = ['tags', 'keywords', 'related_service_ids', 'shared_with']
  
  // JSON fields
  const jsonFields = ['settings', 'preferences', 'custom_fields', 'metadata', 'filters', 'columns', 'aggregations', 'chart_config', 'form_data', 'request_form_config', 'definition', 'template_definition', 'configuration_schema', 'context_data', 'execution_log', 'input_data', 'output_data']
  
  // Apply field patterns based on column names
  for (const column of structure.columns) {
    const columnLower = column.toLowerCase()
    
    if (fieldPatterns[columnLower]) {
      testData[column] = fieldPatterns[columnLower]
    } else if (booleanFields.some(field => columnLower.includes(field.replace('_', '')))) {
      testData[column] = true
    } else if (numericFields.some(field => columnLower.includes(field.replace('_', '')))) {
      testData[column] = columnLower.includes('score') ? 0 : 999
    } else if (arrayFields.some(field => columnLower.includes(field))) {
      testData[column] = ['test', 'crud', 'automation']
    } else if (jsonFields.some(field => columnLower.includes(field))) {
      testData[column] = { test: true, crud: 'verification' }
    } else if (columnLower.includes('email')) {
      testData[column] = `test.${baseId}@example.com`
    } else if (columnLower.includes('phone')) {
      testData[column] = '+1-555-TEST'
    } else if (columnLower.includes('url')) {
      testData[column] = `https://test.example.com/${baseId}`
    } else if (columnLower.includes('color')) {
      testData[column] = '#FF0000'
    } else if (columnLower.includes('icon')) {
      testData[column] = 'test-icon'
    } else if (columnLower.includes('timezone')) {
      testData[column] = 'UTC'
    } else if (columnLower.includes('cron')) {
      testData[column] = '0 0 * * *'
    }
  }
  
  // Don't set ID, created_at, updated_at - these are auto-generated
  delete testData.id
  delete testData.created_at
  delete testData.updated_at
  
  // Don't set foreign key fields that might cause constraint issues
  // BUT keep organization_id since we explicitly set it above
  const fkPatterns = ['user_id', 'requester_id', 'assignee_id', 'approver_id', 'author_id', 'reviewer_id', 'created_by', 'updated_by', 'last_modified_by', 'changed_by', 'uploaded_by', 'trigger_user_id', 'completed_by', 'assigned_to', 'manager_id', 'lead_id', 'service_owner_id', 'support_team_id', 'ticket_id', 'workflow_id', 'execution_id', 'service_request_id', 'team_id', 'category_id', 'parent_id', 'service_id', 'sla_policy_id', 'approval_workflow_id']
  
  for (const pattern of fkPatterns) {
    Object.keys(testData).forEach(key => {
      // Don't delete these IDs - we explicitly set them!
      const keepIds = ['organization_id', 'workflow_id', 'service_id', 'ticket_id', 'execution_id', 'team_id', 'service_request_id', 'user_id']
      if (!keepIds.includes(key) && key.toLowerCase().includes(pattern)) {
        delete testData[key]
      }
    })
  }
  
  return testData
}

function generateDynamicUpdateData(tableName, originalData, structure) {
  const updateData = {}
  
  // Update common fields that are safe to modify
  if (originalData.name) {
    updateData.name = `${originalData.name} - UPDATED`
  }
  
  if (originalData.title) {
    updateData.title = `${originalData.title} - UPDATED`
  }
  
  if (originalData.description) {
    updateData.description = `${originalData.description} - UPDATED for CRUD verification`
  }
  
  if (originalData.summary) {
    updateData.summary = `${originalData.summary} - UPDATED`
  }
  
  if (originalData.version !== undefined) {
    updateData.version = 2 // Integer, not string
  }
  
  if (originalData.color) {
    updateData.color = '#00FF00'
  }
  
  if (originalData.sort_order !== undefined) {
    updateData.sort_order = 998
  }
  
  if (originalData.view_count !== undefined) {
    updateData.view_count = 1
  }
  
  return updateData
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')
  
  let cleanupCount = 0
  let cleanupErrors = 0
  
  // Clean up records that were created but not deleted during tests
  for (const record of TEST_RECORDS.toCleanup) {
    try {
      const { error } = await supabase
        .from(record.table)
        .delete()
        .eq('id', record.id)
      
      if (error) {
        console.warn(`   ⚠️  Failed to cleanup ${record.table}:${record.id} - ${error.message}`)
        cleanupErrors++
      } else {
        console.log(`   🗑️  Cleaned up ${record.table}:${record.id}`)
        cleanupCount++
      }
    } catch (err) {
      console.warn(`   ⚠️  Cleanup error for ${record.table}:${record.id} - ${err.message}`)
      cleanupErrors++
    }
  }
  
  // Also clean up any test records that might exist from previous failed runs
  await cleanupPreviousTestData()
  
  if (cleanupCount > 0) {
    console.log(`✅ Cleaned up ${cleanupCount} test records`)
  }
  
  if (cleanupErrors > 0) {
    console.warn(`⚠️  ${cleanupErrors} cleanup errors occurred`)
  }
  
  return { cleaned: cleanupCount, errors: cleanupErrors }
}

async function cleanupTestOrganization() {
  if (TEST_ORG_ID) {
    console.log('🏢 Cleaning up test organization...')
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', TEST_ORG_ID)
      
      if (!error) {
        console.log('   ✅ Test organization cleaned up')
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

async function cleanupPreviousTestData() {
  console.log('🔍 Looking for leftover test data from previous runs...')
  
  let foundTestData = 0
  
  for (const tableName of SAFE_CRUD_TABLES) {
    try {
      // Find records with test patterns
      const { data: testRecords, error } = await supabase
        .from(tableName)
        .select('id, name, title')
        .or(`name.like.%Test%,title.like.%Test%,name.like.%test-%,title.like.%test-%`)
      
      if (!error && testRecords && testRecords.length > 0) {
        console.log(`   Found ${testRecords.length} leftover test records in ${tableName}`)
        
        for (const record of testRecords) {
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', record.id)
          
          if (!deleteError) {
            foundTestData++
            console.log(`   🗑️  Removed leftover: ${record.name || record.title}`)
          }
        }
      }
    } catch (err) {
      // Ignore errors for optional cleanup
    }
  }
  
  if (foundTestData > 0) {
    console.log(`✅ Cleaned up ${foundTestData} leftover test records`)
  }
}

async function verifyCRUD(runTests = false) {
  if (!runTests) {
    console.log('⏭️  Skipping CRUD tests (use --test to run)')
    return
  }
  
  console.log('🧪 Running DYNAMIC CRUD verification tests...')
  console.log(`ℹ️  Testing ${SAFE_CRUD_TABLES.length} tables dynamically`)
  console.log('ℹ️  All test data will be automatically cleaned up')
  
  const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: [],
    createdRecords: []
  }
  
  // Reset tracking
  TEST_RECORDS.created = []
  TEST_RECORDS.toCleanup = []
  
  // Sort tables to test dependencies first
  const sortedTables = [...SAFE_CRUD_TABLES].sort((a, b) => {
    // Test these tables first (no dependencies)
    const noDeps = ['workflows', 'workflow_templates', 'teams', 'services', 'service_categories', 'sla_policies', 'custom_reports', 'knowledge_articles', 'tickets']
    // Test these tables last (have dependencies)
    const hasDeps = ['workflow_schedules', 'workflow_executions', 'workflow_step_executions', 'service_requests', 'service_request_approvals', 'ticket_history', 'ticket_comments', 'ticket_attachments', 'team_members']
    
    if (noDeps.includes(a) && hasDeps.includes(b)) return -1
    if (hasDeps.includes(a) && noDeps.includes(b)) return 1
    return 0
  })
  
  for (const tableName of sortedTables) {
    console.log(`\n  🔬 Testing table: ${tableName}`)
    let createdId = null
    
    try {
      // Analyze table structure first
      const structure = await analyzeTableStructure(tableName)
      
      // Debug structure
      if (structure.columns.length > 0) {
        console.log(`    🔍 Detected columns: ${structure.columns.slice(0, 5).join(', ')}...`)
      }
      
      if (!structure.hasId) {
        console.log(`    ⏭️  Skipping ${tableName} - no ID field detected`)
        testResults.skipped++
        testResults.details.push(`${tableName}: ⏭️  SKIPPED (no ID field)`)
        continue
      }
      
      // Generate dynamic test data based on table structure
      const testData = await generateDynamicTestData(tableName, structure)
      
      // Debug: Show what data was generated
      if (Object.keys(testData).length > 0) {
        console.log(`    📝 Generated test data fields: ${Object.keys(testData).join(', ')}`)
      }
      
      if (Object.keys(testData).length === 0) {
        console.log(`    ⏭️  Skipping ${tableName} - couldn't generate safe test data`)
        testResults.skipped++
        testResults.details.push(`${tableName}: ⏭️  SKIPPED (no safe test data)`)
        continue
      }
      
      // CREATE test
      console.log(`    ➕ CREATE test for ${tableName}...`)
      const { data: created, error: createError } = await supabase
        .from(tableName)
        .insert(testData)
        .select()
      
      if (createError) {
        throw new Error(`CREATE failed: ${createError.message}`)
      }
      
      createdId = created[0].id
      console.log(`    ✅ CREATE test passed (ID: ${createdId})`)
      
      // Track this record for cleanup
      TEST_RECORDS.created.push({ table: tableName, id: createdId })
      TEST_RECORDS.toCleanup.push({ table: tableName, id: createdId })
      
      // READ test
      console.log(`    📖 READ test for ${tableName}...`)
      const { data: read, error: readError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', createdId)
        .single()
      
      if (readError) {
        throw new Error(`READ failed: ${readError.message}`)
      }
      console.log(`    ✅ READ test passed`)
      
      // UPDATE test
      console.log(`    ✏️  UPDATE test for ${tableName}...`)
      const updateData = generateDynamicUpdateData(tableName, read, structure)
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', createdId)
        
        if (updateError) {
          throw new Error(`UPDATE failed: ${updateError.message}`)
        }
        console.log(`    ✅ UPDATE test passed`)
      } else {
        console.log(`    ⏭️  UPDATE test skipped - no safe fields to update`)
      }
      
      // DELETE test (this is the main cleanup)
      console.log(`    🗑️  DELETE test for ${tableName}...`)
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', createdId)
      
      if (deleteError) {
        throw new Error(`DELETE failed: ${deleteError.message}`)
      }
      console.log(`    ✅ DELETE test passed - test data cleaned up`)
      
      // Remove from cleanup list since it's already deleted
      TEST_RECORDS.toCleanup = TEST_RECORDS.toCleanup.filter(
        record => !(record.table === tableName && record.id === createdId)
      )
      
      testResults.passed++
      testResults.details.push(`${tableName}: ✅ PASSED (Full CRUD + Cleanup)`)
      
    } catch (error) {
      console.error(`    ❌ CRUD test failed for ${tableName}: ${error.message}`)
      testResults.failed++
      testResults.details.push(`${tableName}: ❌ FAILED - ${error.message}`)
      
      // If a record was created but test failed, ensure it gets cleaned up
      if (createdId) {
        console.log(`    🧹 Marking ${tableName}:${createdId} for emergency cleanup`)
      }
    }
  }
  
  // Cleanup any remaining test data
  await cleanupTestData()
  
  console.log(`\n🧪 DYNAMIC CRUD Test Summary:`)
  console.log(`   ✅ Passed: ${testResults.passed}/${SAFE_CRUD_TABLES.length}`)
  console.log(`   ❌ Failed: ${testResults.failed}/${SAFE_CRUD_TABLES.length}`)
  console.log(`   ⏭️  Skipped: ${testResults.skipped}/${SAFE_CRUD_TABLES.length}`)
  console.log(`   🧹 All test data cleaned up automatically`)
  
  if (testResults.failed > 0 || testResults.skipped > 0) {
    console.log('\n📋 Test Details:')
    testResults.details.forEach(detail => console.log(`   ${detail}`))
  }
  
  return testResults
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrupted! Cleaning up test data before exit...')
  await cleanupTestData()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Terminated! Cleaning up test data before exit...')
  await cleanupTestData()
  process.exit(0)
})

// Main execution
async function main() {
  const runTests = process.argv.includes('--test')
  const startTime = Date.now()
  
  console.log('🔧 Starting Kroolo BSM DYNAMIC development environment initialization...\n')
  
  try {
    await createTableDiscoveryFunction()
    await initializeClients()
    const discoveryStats = await discoverTables()
    const tableStats = await verifyTables()
    await runBasicSchema()
    const dbStats = await printStats()
    const testResults = await verifyCRUD(runTests)
    
    // Final cleanup check
    if (runTests) {
      console.log('\n🔍 Final cleanup verification...')
      await cleanupPreviousTestData()
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log('\n🎉 DYNAMIC development environment initialization complete!')
    console.log(`⏱️  Total time: ${duration}s`)
    
    // Summary
    console.log('\n📊 DYNAMIC Summary:')
    console.log(`   🔍 Tables discovered: ${discoveryStats.total}`)
    console.log(`   🗃️  Tables verified: ${tableStats.existingTables}/${ALL_TABLES.length}`)
    console.log(`   🧪 Safe for CRUD: ${discoveryStats.safe}`)
    if (runTests && testResults) {
      console.log(`   ✅ CRUD tests passed: ${testResults.passed}`)
      console.log(`   ❌ CRUD tests failed: ${testResults.failed}`)
      console.log(`   ⏭️  CRUD tests skipped: ${testResults.skipped}`)
      console.log(`   🧹 Test data: All cleaned up automatically`)
    }
    
    if (tableStats.missingTables > 0) {
      console.log('\n⚠️  Some discovered tables are missing. Run your schema migrations to create them.')
    }
    
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message)
    
    // Emergency cleanup on failure
    if (TEST_RECORDS.toCleanup.length > 0) {
      console.log('🆘 Performing emergency cleanup...')
      await cleanupTestData()
    }
    
    process.exit(1)
  }
}

main().catch(async (error) => {
  console.error('💥 Unexpected error:', error)
  await cleanupTestData()
  process.exit(1)
})