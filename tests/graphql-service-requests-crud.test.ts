/**
 * Service Requests GraphQL CRUD Tests
 * 
 * Tests all Create, Read, Update, Delete operations for service requests using GraphQL
 * Run with: npx ts-node tests/graphql-service-requests-crud.test.ts
 */

import { createGraphQLClient } from '../lib/graphql/client.ts'
import { gql } from 'graphql-request'

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.yellow}${msg}${colors.reset}\n`),
}

// Test data
let testServiceRequestId: string
let testServiceId: string
let testRequesterId: string
let testOrganizationId: string = '00000000-0000-0000-0000-000000000001'

async function setup() {
  log.section('🚀 SETUP - Preparing test data')
  
  const client = await createGraphQLClient()
  
  // Get a test service
  const servicesQuery = gql`
    query GetServices {
      servicesCollection(first: 1) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `
  
  const servicesData: any = await client.request(servicesQuery)
  if (servicesData.servicesCollection.edges.length > 0) {
    testServiceId = servicesData.servicesCollection.edges[0].node.id
    log.success(`Found test service: ${servicesData.servicesCollection.edges[0].node.name}`)
  } else {
    log.error('No services found - please create at least one service')
    process.exit(1)
  }
  
  // Get a test user/requester
  const usersQuery = gql`
    query GetUsers {
      profilesCollection(first: 1, filter: { is_active: { eq: true } }) {
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
  
  const usersData: any = await client.request(usersQuery)
  if (usersData.profilesCollection.edges.length > 0) {
    testRequesterId = usersData.profilesCollection.edges[0].node.id
    log.success(`Found test requester: ${usersData.profilesCollection.edges[0].node.display_name}`)
  } else {
    log.error('No users found - please create at least one user')
    process.exit(1)
  }
  
  log.success('Setup complete!\n')
}

async function testCreate() {
  log.section('📝 TEST 1: CREATE - Insert new service request')
  
  const client = await createGraphQLClient()
  
  const createMutation = gql`
    mutation CreateServiceRequest($input: service_requestsInsertInput!) {
      insertIntoservice_requestsCollection(objects: [$input]) {
        records {
          id
          request_number
          title
          description
          status
          priority
          urgency
          created_at
          service: services {
            id
            name
          }
          requester: profiles {
            id
            display_name
            email
          }
        }
      }
    }
  `
  
  const input = {
    organization_id: testOrganizationId,
    service_id: testServiceId,
    requester_id: testRequesterId,
    title: 'GraphQL Test Service Request',
    description: 'This is a test service request created via GraphQL mutation',
    business_justification: 'Testing CRUD operations for service requests',
    status: 'pending',
    priority: 'medium',
    urgency: 'normal',
    request_number: `SR-TEST-${Date.now()}`,
  }
  
  try {
    log.test('Creating service request...')
    const result: any = await client.request(createMutation, { input })
    
    if (result.insertIntoservice_requestsCollection.records.length > 0) {
      const record = result.insertIntoservice_requestsCollection.records[0]
      testServiceRequestId = record.id
      
      log.success('Service request created successfully!')
      log.info(`  ID: ${record.id}`)
      log.info(`  Request Number: ${record.request_number}`)
      log.info(`  Title: ${record.title}`)
      log.info(`  Status: ${record.status}`)
      log.info(`  Priority: ${record.priority}`)
      log.info(`  Service: ${record.service?.name}`)
      log.info(`  Requester: ${record.requester?.display_name}`)
      return true
    } else {
      log.error('Failed to create service request - no records returned')
      return false
    }
  } catch (error) {
    log.error(`Create failed: ${error}`)
    return false
  }
}

async function testRead() {
  log.section('📖 TEST 2: READ - Fetch service requests')
  
  const client = await createGraphQLClient()
  
  // Test 2a: Read all service requests
  log.test('Test 2a: Fetching all service requests...')
  const readAllQuery = gql`
    query GetAllServiceRequests($first: Int!) {
      service_requestsCollection(
        first: $first
        orderBy: [{ created_at: DescNullsLast }]
      ) {
        edges {
          node {
            id
            request_number
            title
            status
            priority
            created_at
          }
        }
      }
    }
  `
  
  try {
    const allData: any = await client.request(readAllQuery, { first: 10 })
    const count = allData.service_requestsCollection.edges.length
    log.success(`Fetched ${count} service requests`)
    
    if (count > 0) {
      log.info(`Latest: ${allData.service_requestsCollection.edges[0].node.title}`)
    }
  } catch (error) {
    log.error(`Failed to fetch all requests: ${error}`)
    return false
  }
  
  // Test 2b: Read single service request by ID
  log.test('Test 2b: Fetching single service request by ID...')
  const readByIdQuery = gql`
    query GetServiceRequestById($id: UUID!) {
      service_requestsCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            request_number
            title
            description
            business_justification
            status
            priority
            urgency
            estimated_delivery_date
            cost_center
            form_data
            created_at
            updated_at
            service: services {
              id
              name
              icon
              estimated_delivery_days
            }
            requester: profiles {
              id
              first_name
              last_name
              display_name
              email
              department
            }
            assignee: profiles {
              id
              display_name
              email
            }
            approver: profiles {
              id
              display_name
              email
            }
          }
        }
      }
    }
  `
  
  try {
    const singleData: any = await client.request(readByIdQuery, { id: testServiceRequestId })
    
    if (singleData.service_requestsCollection.edges.length > 0) {
      const record = singleData.service_requestsCollection.edges[0].node
      log.success('Service request fetched successfully!')
      log.info(`  ID: ${record.id}`)
      log.info(`  Title: ${record.title}`)
      log.info(`  Description: ${record.description}`)
      log.info(`  Status: ${record.status}`)
      log.info(`  Priority: ${record.priority}`)
      log.info(`  Service: ${record.service?.name}`)
      log.info(`  Requester: ${record.requester?.display_name} (${record.requester?.email})`)
      return true
    } else {
      log.error('Service request not found')
      return false
    }
  } catch (error) {
    log.error(`Failed to fetch service request: ${error}`)
    return false
  }
}

async function testUpdate() {
  log.section('✏️  TEST 3: UPDATE - Modify service request')
  
  const client = await createGraphQLClient()
  
  const updateMutation = gql`
    mutation UpdateServiceRequest($id: UUID!, $set: service_requestsUpdateInput!) {
      updateservice_requestsCollection(
        filter: { id: { eq: $id } }
        set: $set
      ) {
        records {
          id
          request_number
          title
          description
          status
          priority
          urgency
          updated_at
        }
      }
    }
  `
  
  const updates = {
    status: 'approved',
    priority: 'high',
    urgency: 'urgent',
    description: 'UPDATED: This service request has been modified via GraphQL mutation',
  }
  
  try {
    log.test('Updating service request...')
    const result: any = await client.request(updateMutation, { 
      id: testServiceRequestId, 
      set: updates 
    })
    
    if (result.updateservice_requestsCollection.records.length > 0) {
      const record = result.updateservice_requestsCollection.records[0]
      log.success('Service request updated successfully!')
      log.info(`  ID: ${record.id}`)
      log.info(`  New Status: ${record.status}`)
      log.info(`  New Priority: ${record.priority}`)
      log.info(`  New Urgency: ${record.urgency}`)
      log.info(`  Updated Description: ${record.description}`)
      log.info(`  Updated At: ${new Date(record.updated_at).toLocaleString()}`)
      return true
    } else {
      log.error('Failed to update service request')
      return false
    }
  } catch (error) {
    log.error(`Update failed: ${error}`)
    return false
  }
}

async function testFiltering() {
  log.section('🔍 TEST 4: FILTERING - Query with filters')
  
  const client = await createGraphQLClient()
  
  // Test 4a: Filter by status
  log.test('Test 4a: Filtering by status = "approved"...')
  const filterStatusQuery = gql`
    query GetServiceRequestsByStatus($status: String!) {
      service_requestsCollection(
        filter: { status: { eq: $status } }
        first: 10
      ) {
        edges {
          node {
            id
            request_number
            title
            status
            priority
          }
        }
      }
    }
  `
  
  try {
    const statusData: any = await client.request(filterStatusQuery, { status: 'approved' })
    const count = statusData.service_requestsCollection.edges.length
    log.success(`Found ${count} approved service requests`)
  } catch (error) {
    log.error(`Status filter failed: ${error}`)
  }
  
  // Test 4b: Filter by priority
  log.test('Test 4b: Filtering by priority = "high"...')
  const filterPriorityQuery = gql`
    query GetServiceRequestsByPriority($priority: String!) {
      service_requestsCollection(
        filter: { priority: { eq: $priority } }
        first: 10
      ) {
        edges {
          node {
            id
            request_number
            title
            status
            priority
          }
        }
      }
    }
  `
  
  try {
    const priorityData: any = await client.request(filterPriorityQuery, { priority: 'high' })
    const count = priorityData.service_requestsCollection.edges.length
    log.success(`Found ${count} high priority service requests`)
  } catch (error) {
    log.error(`Priority filter failed: ${error}`)
  }
  
  // Test 4c: Filter by organization
  log.test('Test 4c: Filtering by organization...')
  const filterOrgQuery = gql`
    query GetServiceRequestsByOrg($orgId: UUID!) {
      service_requestsCollection(
        filter: { organization_id: { eq: $orgId } }
        first: 10
      ) {
        edges {
          node {
            id
            request_number
            title
            status
            priority
          }
        }
      }
    }
  `
  
  try {
    const orgData: any = await client.request(filterOrgQuery, { orgId: testOrganizationId })
    const count = orgData.service_requestsCollection.edges.length
    log.success(`Found ${count} service requests for organization`)
    return true
  } catch (error) {
    log.error(`Organization filter failed: ${error}`)
    return false
  }
}

async function testDelete() {
  log.section('🗑️  TEST 5: DELETE - Remove service request')
  
  const client = await createGraphQLClient()
  
  const deleteMutation = gql`
    mutation DeleteServiceRequest($id: UUID!) {
      deleteFromservice_requestsCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  
  try {
    log.test('Deleting service request...')
    const result: any = await client.request(deleteMutation, { id: testServiceRequestId })
    
    if (result.deleteFromservice_requestsCollection.affectedCount > 0) {
      log.success(`Service request deleted successfully! (${result.deleteFromservice_requestsCollection.affectedCount} record removed)`)
      
      // Verify deletion
      log.test('Verifying deletion...')
      const verifyQuery = gql`
        query VerifyDeletion($id: UUID!) {
          service_requestsCollection(filter: { id: { eq: $id } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `
      
      const verifyData: any = await client.request(verifyQuery, { id: testServiceRequestId })
      
      if (verifyData.service_requestsCollection.edges.length === 0) {
        log.success('Deletion verified - record no longer exists')
        return true
      } else {
        log.error('Deletion verification failed - record still exists')
        return false
      }
    } else {
      log.error('Failed to delete service request')
      return false
    }
  } catch (error) {
    log.error(`Delete failed: ${error}`)
    return false
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70))
  console.log('  SERVICE REQUESTS GraphQL CRUD Tests')
  console.log('='.repeat(70))
  
  try {
    await setup()
    
    const results = {
      create: await testCreate(),
      read: await testRead(),
      update: await testUpdate(),
      filtering: await testFiltering(),
      delete: await testDelete(),
    }
    
    // Summary
    log.section('📊 TEST SUMMARY')
    const passed = Object.values(results).filter(r => r).length
    const total = Object.keys(results).length
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`
      console.log(`  ${test.toUpperCase().padEnd(15)} ${status}`)
    })
    
    console.log('\n' + '='.repeat(70))
    console.log(`  ${passed}/${total} tests passed`)
    console.log('='.repeat(70) + '\n')
    
    process.exit(passed === total ? 0 : 1)
  } catch (error) {
    log.error(`Test suite failed: ${error}`)
    process.exit(1)
  }
}

// Run tests
runTests()
