/**
 * Tickets GraphQL CRUD Test Script
 * 
 * Tests all CRUD operations for tickets using GraphQL
 * Run with: npx tsx tests/test-tickets-graphql-crud.ts
 */

import { createServerGraphQLClient } from '../lib/graphql/client'
import { gql } from 'graphql-request'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.yellow}${'━'.repeat(70)}\n  ${msg}\n${'━'.repeat(70)}${colors.reset}`),
  title: (msg: string) => console.log(`\n${colors.magenta}${'═'.repeat(70)}\n  ${msg}\n${'═'.repeat(70)}${colors.reset}\n`),
}

let testOrganizationId: string
let testRequesterId: string
let testAssigneeId: string
let createdTicketId: string

async function setupTestData() {
  log.section('🔧 SETUP: Preparing test data')
  
  const client = createServerGraphQLClient()
  
  // Get first organization
  log.test('Fetching organization...')
  const orgQuery = gql`
    query GetOrganization {
      organizationsCollection(first: 1) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `
  
  try {
    const orgData: any = await client.request(orgQuery)
    if (orgData.organizationsCollection.edges.length > 0) {
      testOrganizationId = orgData.organizationsCollection.edges[0].node.id
      log.success(`Organization found: ${testOrganizationId}`)
    } else {
      log.error('No organization found - please create one first')
      process.exit(1)
    }
  } catch (error) {
    log.error(`Failed to fetch organization: ${error}`)
    process.exit(1)
  }
  
  // Get active users
  log.test('Fetching user profiles...')
  const profilesQuery = gql`
    query GetProfiles {
      profilesCollection(first: 2, filter: { is_active: { eq: true } }) {
        edges {
          node {
            id
            display_name
            email
          }
        }
      }
    }
  `
  
  try {
    const profilesData: any = await client.request(profilesQuery)
    if (profilesData.profilesCollection.edges.length >= 2) {
      testRequesterId = profilesData.profilesCollection.edges[0].node.id
      testAssigneeId = profilesData.profilesCollection.edges[1].node.id
      log.success(`Requester: ${profilesData.profilesCollection.edges[0].node.display_name}`)
      log.success(`Assignee: ${profilesData.profilesCollection.edges[1].node.display_name}`)
    } else if (profilesData.profilesCollection.edges.length === 1) {
      testRequesterId = profilesData.profilesCollection.edges[0].node.id
      testAssigneeId = testRequesterId
      log.info('Only one user found - using same for requester and assignee')
    } else {
      log.error('No users found - please create profiles first')
      process.exit(1)
    }
  } catch (error) {
    log.error(`Failed to fetch profiles: ${error}`)
    process.exit(1)
  }
  
  log.success('✅ Test data setup complete\n')
}

async function testCreateTicket() {
  log.section('📝 TEST 1: CREATE - Create New Ticket')
  
  const client = createServerGraphQLClient()
  
  const mutation = gql`
    mutation CreateTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
        records {
          id
          ticket_number
          title
          description
          type
          priority
          status
          requester_id
          assignee_id
          created_at
        }
      }
    }
  `
  
  const input = {
    organization_id: testOrganizationId,
    requester_id: testRequesterId,
    assignee_id: testAssigneeId,
    title: `GraphQL CRUD Test Ticket - ${new Date().toISOString()}`,
    description: 'This is a test ticket created via GraphQL to verify CRUD operations',
    type: 'incident',
    priority: 'high',
    status: 'new',
    urgency: 'high',
    impact: 'medium',
    tags: ['test', 'graphql', 'crud'],
    custom_fields: { test: true, automated: true }
  }
  
  try {
    log.test('Creating ticket with GraphQL mutation...')
    const result: any = await client.request(mutation, { input })
    
    // Debug: Log raw response
    log.info(`Raw response: ${JSON.stringify(result, null, 2)}`)
    
    if (!result || !result.insertIntoticketsCollection) {
      log.error('❌ Mutation returned null or unexpected structure')
      log.error(`Response: ${JSON.stringify(result)}`)
      return false
    }
    
    const ticket = result.insertIntoticketsCollection.records[0]
    
    if (!ticket) {
      log.error('❌ No ticket record returned')
      return false
    }
    
    createdTicketId = ticket.id
    
    log.success(`✅ Ticket created successfully!`)
    log.info(`   ID: ${ticket.id}`)
    log.info(`   Number: ${ticket.ticket_number}`)
    log.info(`   Title: ${ticket.title}`)
    log.info(`   Type: ${ticket.type}`)
    log.info(`   Priority: ${ticket.priority}`)
    log.info(`   Status: ${ticket.status}`)
    
    return true
  } catch (error) {
    log.error(`❌ CREATE failed: ${error}`)
    console.error('Full error:', error)
    return false
  }
}

async function testReadTicket() {
  log.section('📖 TEST 2: READ - Fetch Ticket by ID')
  
  const client = createServerGraphQLClient()
  
  const query = gql`
    query GetTicket($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }, first: 1) {
        edges {
          node {
            id
            ticket_number
            title
            description
            type
            category
            subcategory
            priority
            urgency
            impact
            status
            requester_id
            assignee_id
            team_id
            due_date
            created_at
            updated_at
            tags
            custom_fields
          }
        }
      }
    }
  `
  
  try {
    log.test(`Fetching ticket ${createdTicketId}...`)
    const result: any = await client.request(query, { id: createdTicketId })
    
    if (result.ticketsCollection.edges.length === 0) {
      log.error('❌ Ticket not found!')
      return false
    }
    
    const ticket = result.ticketsCollection.edges[0].node
    log.success(`✅ Ticket fetched successfully!`)
    log.info(`   Title: ${ticket.title}`)
    log.info(`   Description: ${ticket.description}`)
    log.info(`   Type: ${ticket.type}`)
    log.info(`   Priority: ${ticket.priority}`)
    log.info(`   Status: ${ticket.status}`)
    log.info(`   Tags: ${ticket.tags.join(', ')}`)
    log.info(`   Custom Fields: ${JSON.stringify(ticket.custom_fields)}`)
    
    return true
  } catch (error) {
    log.error(`❌ READ failed: ${error}`)
    console.error(error)
    return false
  }
}

async function testReadTicketWithRelations() {
  log.section('📖 TEST 3: READ - Fetch Ticket with Relations (Requester & Assignee)')
  
  const client = createServerGraphQLClient()
  
  // Note: This query format depends on your GraphQL schema
  // Adjust if needed based on your actual schema
  const query = gql`
    query GetTicket($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }, first: 1) {
        edges {
          node {
            id
            ticket_number
            title
            priority
            status
            requester_id
            assignee_id
          }
        }
      }
    }
  `
  
  try {
    log.test('Fetching ticket with relations...')
    const result: any = await client.request(query, { id: createdTicketId })
    const ticket = result.ticketsCollection.edges[0].node
    
    // Fetch related profiles separately
    const profilesQuery = gql`
      query GetProfiles($ids: [UUID!]) {
        profilesCollection(filter: { id: { in: $ids } }) {
          edges {
            node {
              id
              display_name
              email
              avatar_url
            }
          }
        }
      }
    `
    
    const profileIds = [ticket.requester_id, ticket.assignee_id].filter(Boolean)
    const profilesResult: any = await client.request(profilesQuery, { ids: profileIds })
    const profiles = profilesResult.profilesCollection.edges.map((e: any) => e.node)
    
    const requester = profiles.find((p: any) => p.id === ticket.requester_id)
    const assignee = profiles.find((p: any) => p.id === ticket.assignee_id)
    
    log.success(`✅ Ticket with relations fetched successfully!`)
    log.info(`   Requester: ${requester?.display_name} (${requester?.email})`)
    log.info(`   Assignee: ${assignee?.display_name} (${assignee?.email})`)
    
    return true
  } catch (error) {
    log.error(`❌ READ with relations failed: ${error}`)
    console.error(error)
    return false
  }
}

async function testUpdateTicket() {
  log.section('✏️  TEST 4: UPDATE - Update Ticket Fields')
  
  const client = createServerGraphQLClient()
  
  const mutation = gql`
    mutation UpdateTicket($id: UUID!, $updates: ticketsUpdateInput!) {
      updateticketsCollection(filter: { id: { eq: $id } }, set: $updates) {
        records {
          id
          ticket_number
          title
          description
          type
          priority
          status
          updated_at
        }
      }
    }
  `
  
  const updates = {
    title: 'UPDATED: GraphQL CRUD Test Ticket',
    description: 'This ticket has been updated via GraphQL mutation',
    priority: 'urgent',
    status: 'in_progress',
    type: 'problem'
  }
  
  try {
    log.test('Updating ticket fields...')
    const result: any = await client.request(mutation, { id: createdTicketId, updates })
    const ticket = result.updateticketsCollection.records[0]
    
    log.success(`✅ Ticket updated successfully!`)
    log.info(`   New Title: ${ticket.title}`)
    log.info(`   New Description: ${ticket.description}`)
    log.info(`   New Priority: ${ticket.priority}`)
    log.info(`   New Status: ${ticket.status}`)
    log.info(`   New Type: ${ticket.type}`)
    log.info(`   Updated At: ${ticket.updated_at}`)
    
    return true
  } catch (error) {
    log.error(`❌ UPDATE failed: ${error}`)
    console.error(error)
    return false
  }
}

async function testListTickets() {
  log.section('📋 TEST 5: LIST - Fetch All Tickets with Pagination')
  
  const client = createServerGraphQLClient()
  
  const query = gql`
    query GetTickets($first: Int!, $offset: Int!) {
      ticketsCollection(first: $first, offset: $offset) {
        edges {
          node {
            id
            ticket_number
            title
            type
            priority
            status
            created_at
          }
        }
      }
    }
  `
  
  try {
    log.test('Fetching tickets list (first 10)...')
    const result: any = await client.request(query, { first: 10, offset: 0 })
    const tickets = result.ticketsCollection.edges.map((e: any) => e.node)
    
    log.success(`✅ Fetched ${tickets.length} tickets`)
    
    tickets.slice(0, 5).forEach((ticket: any, index: number) => {
      log.info(`   ${index + 1}. [${ticket.ticket_number}] ${ticket.title} (${ticket.status})`)
    })
    
    if (tickets.length > 5) {
      log.info(`   ... and ${tickets.length - 5} more`)
    }
    
    return true
  } catch (error) {
    log.error(`❌ LIST failed: ${error}`)
    console.error(error)
    return false
  }
}

async function testFilterTickets() {
  log.section('🔍 TEST 6: FILTER - Query Tickets by Status and Priority')
  
  const client = createServerGraphQLClient()
  
  const query = gql`
    query GetTickets($filter: ticketsFilter) {
      ticketsCollection(filter: $filter, first: 10) {
        edges {
          node {
            id
            ticket_number
            title
            priority
            status
          }
        }
      }
    }
  `
  
  try {
    log.test('Filtering tickets (status: in_progress, priority: high|urgent)...')
    
    // Test multiple filter conditions
    const filters = [
      { status: { eq: 'in_progress' } },
      { priority: { in: ['high', 'urgent'] } },
      { type: { eq: 'incident' } }
    ]
    
    for (const filter of filters) {
      const result: any = await client.request(query, { filter })
      const tickets = result.ticketsCollection.edges.map((e: any) => e.node)
      const filterDesc = JSON.stringify(filter)
      log.success(`✅ Filter ${filterDesc}: Found ${tickets.length} tickets`)
    }
    
    return true
  } catch (error) {
    log.error(`❌ FILTER failed: ${error}`)
    console.error(error)
    return false
  }
}

async function testDeleteTicket() {
  log.section('🗑️  TEST 7: DELETE - Remove Ticket')
  
  const client = createServerGraphQLClient()
  
  const mutation = gql`
    mutation DeleteTicket($id: UUID!) {
      deleteFromticketsCollection(filter: { id: { eq: $id } }) {
        affectedCount
        records {
          id
          ticket_number
        }
      }
    }
  `
  
  try {
    log.test(`Deleting ticket ${createdTicketId}...`)
    const result: any = await client.request(mutation, { id: createdTicketId })
    
    log.success(`✅ Ticket deleted successfully!`)
    log.info(`   Affected count: ${result.deleteFromticketsCollection.affectedCount}`)
    log.info(`   Deleted ticket: ${result.deleteFromticketsCollection.records[0]?.ticket_number}`)
    
    // Verify deletion
    log.test('Verifying deletion...')
    const verifyQuery = gql`
      query VerifyDelete($id: UUID!) {
        ticketsCollection(filter: { id: { eq: $id } }) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    
    const verifyResult: any = await client.request(verifyQuery, { id: createdTicketId })
    
    if (verifyResult.ticketsCollection.edges.length === 0) {
      log.success('✅ Deletion verified - ticket no longer exists')
    } else {
      log.error('❌ Deletion failed - ticket still exists')
      return false
    }
    
    return true
  } catch (error) {
    log.error(`❌ DELETE failed: ${error}`)
    console.error(error)
    return false
  }
}

async function main() {
  log.title('🎯 TICKETS GraphQL CRUD - Comprehensive Test Suite')
  
  const results: Record<string, boolean> = {}
  
  try {
    // Setup
    await setupTestData()
    
    // Run all tests
    results['CREATE'] = await testCreateTicket()
    results['READ'] = await testReadTicket()
    results['READ_WITH_RELATIONS'] = await testReadTicketWithRelations()
    results['UPDATE'] = await testUpdateTicket()
    results['LIST'] = await testListTickets()
    results['FILTER'] = await testFilterTickets()
    results['DELETE'] = await testDeleteTicket()
    
    // Summary
    log.title('📊 FINAL TEST RESULTS')
    
    const passed = Object.values(results).filter(r => r).length
    const total = Object.keys(results).length
    
    console.log('')
    Object.entries(results).forEach(([test, success]) => {
      const status = success 
        ? `${colors.green}✓ PASS${colors.reset}` 
        : `${colors.red}✗ FAIL${colors.reset}`
      const label = test.padEnd(25)
      console.log(`  ${label} ${status}`)
    })
    
    console.log(`\n${'═'.repeat(70)}`)
    const percentage = Math.round((passed / total) * 100)
    console.log(`  ${passed}/${total} tests passed (${percentage}%)`)
    console.log(`${'═'.repeat(70)}\n`)
    
    if (passed === total) {
      console.log(`${colors.green}🎉 All tests passed! Tickets GraphQL CRUD is working perfectly!${colors.reset}\n`)
      process.exit(0)
    } else {
      console.log(`${colors.red}❌ ${total - passed} test(s) failed${colors.reset}\n`)
      process.exit(1)
    }
    
  } catch (error) {
    log.error(`\n❌ Test suite crashed: ${error}`)
    console.error(error)
    process.exit(1)
  }
}

// Run tests
main()
