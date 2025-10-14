/**
 * Master GraphQL CRUD Test Runner
 * 
 * Runs all GraphQL CRUD tests with automatic test data setup
 * Run with: npx tsx tests/run-all-graphql-tests.ts
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
  magenta: '\x1b[35m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.yellow}${msg}${colors.reset}\n`),
  title: (msg: string) => console.log(`\n${colors.magenta}${'='.repeat(70)}\n  ${msg}\n${'='.repeat(70)}${colors.reset}\n`),
}

// Test data IDs
let testProfileId: string
let testServiceId: string
let testServiceCategoryId: string
let testServiceRequestId: string
let testOrganizationId = '00000000-0000-0000-0000-000000000001'

async function setupTestData() {
  log.section('🚀 SETUP - Creating test data for all tests')
  
  const client = await createGraphQLClient()
  
  // 1. Create test service category
  log.test('Creating test service category...')
  const createCategoryMutation = gql`
    mutation CreateServiceCategory($input: service_categoriesInsertInput!) {
      insertIntoservice_categoriesCollection(objects: [$input]) {
        records {
          id
          name
        }
      }
    }
  `
  
  try {
    const categoryInput = {
      organization_id: testOrganizationId,
      name: 'GraphQL Test Category',
      description: 'Test category for GraphQL CRUD tests',
      icon: 'test',
      display_order: 999,
      is_active: true,
    }
    
    const categoryResult: any = await client.request(createCategoryMutation, { input: categoryInput })
    testServiceCategoryId = categoryResult.insertIntoservice_categoriesCollection.records[0].id
    log.success(`Service category created: ${testServiceCategoryId}`)
  } catch (error) {
    log.info(`Using existing service category (${error})`)
    // Try to fetch existing category
    const getCategoryQuery = gql`
      query GetCategory {
        service_categoriesCollection(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    const catData: any = await client.request(getCategoryQuery)
    if (catData.service_categoriesCollection.edges.length > 0) {
      testServiceCategoryId = catData.service_categoriesCollection.edges[0].node.id
    }
  }
  
  // 2. Create test service
  log.test('Creating test service...')
  const createServiceMutation = gql`
    mutation CreateService($input: servicesInsertInput!) {
      insertIntoservicesCollection(objects: [$input]) {
        records {
          id
          name
        }
      }
    }
  `
  
  try {
    const serviceInput = {
      organization_id: testOrganizationId,
      category_id: testServiceCategoryId,
      name: 'GraphQL Test Service',
      description: 'Test service for GraphQL CRUD tests',
      short_description: 'Test service',
      is_requestable: true,
      requires_approval: false,
      estimated_delivery_days: 5,
      status: 'active',
    }
    
    const serviceResult: any = await client.request(createServiceMutation, { input: serviceInput })
    testServiceId = serviceResult.insertIntoservicesCollection.records[0].id
    log.success(`Service created: ${testServiceId}`)
  } catch (error) {
    log.info(`Using existing service (${error})`)
    // Try to fetch existing service
    const getServiceQuery = gql`
      query GetService {
        servicesCollection(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    const svcData: any = await client.request(getServiceQuery)
    if (svcData.servicesCollection.edges.length > 0) {
      testServiceId = svcData.servicesCollection.edges[0].node.id
    }
  }
  
  // 3. Create test user profile
  log.test('Creating test user profile...')
  const createProfileMutation = gql`
    mutation CreateProfile($input: profilesInsertInput!) {
      insertIntoprofilesCollection(objects: [$input]) {
        records {
          id
          email
          display_name
        }
      }
    }
  `
  
  const testEmail = `graphql.test.${Date.now()}@example.com`
  
  try {
    const profileInput = {
      organization_id: testOrganizationId,
      email: testEmail,
      first_name: 'GraphQL',
      last_name: 'TestUser',
      display_name: 'GraphQL Test User',
      department: 'Engineering',
      role: 'user',
      is_active: true,
    }
    
    const profileResult: any = await client.request(createProfileMutation, { input: profileInput })
    testProfileId = profileResult.insertIntoprofilesCollection.records[0].id
    log.success(`User profile created: ${testProfileId}`)
  } catch (error) {
    log.info(`Using existing user profile (${error})`)
    // Try to fetch existing profile
    const getProfileQuery = gql`
      query GetProfile {
        profilesCollection(first: 1, filter: { is_active: { eq: true } }) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    const profData: any = await client.request(getProfileQuery)
    if (profData.profilesCollection.edges.length > 0) {
      testProfileId = profData.profilesCollection.edges[0].node.id
    }
  }
  
  log.success('✅ Test data setup complete!\n')
}

async function testUserProfileCRUD() {
  log.title('USER PROFILES - GraphQL CRUD Tests')
  
  const client = await createGraphQLClient()
  let newProfileId: string
  const testEmail = `crud.test.${Date.now()}@example.com`
  
  // CREATE
  log.section('📝 TEST 1: CREATE - User Profile')
  try {
    const createMutation = gql`
      mutation CreateProfile($input: profilesInsertInput!) {
        insertIntoprofilesCollection(objects: [$input]) {
          records {
            id
            email
            display_name
            role
          }
        }
      }
    `
    
    const input = {
      organization_id: testOrganizationId,
      email: testEmail,
      first_name: 'CRUD',
      last_name: 'Test',
      display_name: 'CRUD Test User',
      department: 'QA',
      role: 'user',
      is_active: true,
    }
    
    const result: any = await client.request(createMutation, { input })
    newProfileId = result.insertIntoprofilesCollection.records[0].id
    log.success(`Created profile: ${result.insertIntoprofilesCollection.records[0].display_name} (${newProfileId})`)
  } catch (error) {
    log.error(`CREATE failed: ${error}`)
    return false
  }
  
  // READ
  log.section('📖 TEST 2: READ - User Profile')
  try {
    const readQuery = gql`
      query GetProfile($id: UUID!) {
        profilesCollection(filter: { id: { eq: $id } }) {
          edges {
            node {
              id
              email
              display_name
              department
              role
            }
          }
        }
      }
    `
    
    const result: any = await client.request(readQuery, { id: newProfileId })
    const profile = result.profilesCollection.edges[0].node
    log.success(`Read profile: ${profile.display_name} (${profile.email})`)
  } catch (error) {
    log.error(`READ failed: ${error}`)
    return false
  }
  
  // UPDATE
  log.section('✏️  TEST 3: UPDATE - User Profile')
  try {
    const updateMutation = gql`
      mutation UpdateProfile($id: UUID!, $set: profilesUpdateInput!) {
        updateprofilesCollection(filter: { id: { eq: $id } }, set: $set) {
          records {
            id
            display_name
            department
          }
        }
      }
    `
    
    const result: any = await client.request(updateMutation, { 
      id: newProfileId, 
      set: { display_name: 'UPDATED User', department: 'Engineering' }
    })
    log.success(`Updated profile: ${result.updateprofilesCollection.records[0].display_name}`)
  } catch (error) {
    log.error(`UPDATE failed: ${error}`)
    return false
  }
  
  // DELETE
  log.section('🗑️  TEST 4: DELETE - User Profile')
  try {
    const deleteMutation = gql`
      mutation DeleteProfile($id: UUID!) {
        deleteFromprofilesCollection(filter: { id: { eq: $id } }) {
          affectedCount
        }
      }
    `
    
    const result: any = await client.request(deleteMutation, { id: newProfileId })
    log.success(`Deleted profile (${result.deleteFromprofilesCollection.affectedCount} record)`)
  } catch (error) {
    log.error(`DELETE failed: ${error}`)
    return false
  }
  
  return true
}

async function testServiceRequestCRUD() {
  log.title('SERVICE REQUESTS - GraphQL CRUD Tests')
  
  const client = await createGraphQLClient()
  let newRequestId: string
  
  // CREATE
  log.section('📝 TEST 1: CREATE - Service Request')
  try {
    const createMutation = gql`
      mutation CreateServiceRequest($input: service_requestsInsertInput!) {
        insertIntoservice_requestsCollection(objects: [$input]) {
          records {
            id
            request_number
            title
            status
            priority
          }
        }
      }
    `
    
    const input = {
      organization_id: testOrganizationId,
      service_id: testServiceId,
      requester_id: testProfileId,
      title: 'CRUD Test Service Request',
      description: 'Testing CRUD operations',
      status: 'pending',
      priority: 'medium',
      urgency: 'normal',
      request_number: `SR-CRUD-${Date.now()}`,
    }
    
    const result: any = await client.request(createMutation, { input })
    newRequestId = result.insertIntoservice_requestsCollection.records[0].id
    log.success(`Created request: ${result.insertIntoservice_requestsCollection.records[0].title} (${result.insertIntoservice_requestsCollection.records[0].request_number})`)
  } catch (error) {
    log.error(`CREATE failed: ${error}`)
    return false
  }
  
  // READ
  log.section('📖 TEST 2: READ - Service Request')
  try {
    const readQuery = gql`
      query GetServiceRequest($id: UUID!) {
        service_requestsCollection(filter: { id: { eq: $id } }) {
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
    
    const result: any = await client.request(readQuery, { id: newRequestId })
    const request = result.service_requestsCollection.edges[0].node
    log.success(`Read request: ${request.title} (Status: ${request.status})`)
  } catch (error) {
    log.error(`READ failed: ${error}`)
    return false
  }
  
  // UPDATE
  log.section('✏️  TEST 3: UPDATE - Service Request')
  try {
    const updateMutation = gql`
      mutation UpdateServiceRequest($id: UUID!, $set: service_requestsUpdateInput!) {
        updateservice_requestsCollection(filter: { id: { eq: $id } }, set: $set) {
          records {
            id
            title
            status
            priority
          }
        }
      }
    `
    
    const result: any = await client.request(updateMutation, { 
      id: newRequestId, 
      set: { status: 'approved', priority: 'high' }
    })
    log.success(`Updated request: ${result.updateservice_requestsCollection.records[0].title} (Status: ${result.updateservice_requestsCollection.records[0].status})`)
  } catch (error) {
    log.error(`UPDATE failed: ${error}`)
    return false
  }
  
  // DELETE
  log.section('🗑️  TEST 4: DELETE - Service Request')
  try {
    const deleteMutation = gql`
      mutation DeleteServiceRequest($id: UUID!) {
        deleteFromservice_requestsCollection(filter: { id: { eq: $id } }) {
          affectedCount
        }
      }
    `
    
    const result: any = await client.request(deleteMutation, { id: newRequestId })
    log.success(`Deleted request (${result.deleteFromservice_requestsCollection.affectedCount} record)`)
  } catch (error) {
    log.error(`DELETE failed: ${error}`)
    return false
  }
  
  return true
}

async function cleanup() {
  log.section('🧹 CLEANUP - Removing test data')
  
  const client = await createGraphQLClient()
  
  // Clean up in reverse order of creation
  if (testProfileId) {
    try {
      await client.request(gql`
        mutation DeleteProfile($id: UUID!) {
          deleteFromprofilesCollection(filter: { id: { eq: $id } }) {
            affectedCount
          }
        }
      `, { id: testProfileId })
      log.success('Cleaned up test profile')
    } catch (error) {
      log.info(`Profile cleanup: ${error}`)
    }
  }
  
  if (testServiceId) {
    try {
      await client.request(gql`
        mutation DeleteService($id: UUID!) {
          deleteFromservicesCollection(filter: { id: { eq: $id } }) {
            affectedCount
          }
        }
      `, { id: testServiceId })
      log.success('Cleaned up test service')
    } catch (error) {
      log.info(`Service cleanup: ${error}`)
    }
  }
  
  if (testServiceCategoryId) {
    try {
      await client.request(gql`
        mutation DeleteCategory($id: UUID!) {
          deleteFromservice_categoriesCollection(filter: { id: { eq: $id } }) {
            affectedCount
          }
        }
      `, { id: testServiceCategoryId })
      log.success('Cleaned up test service category')
    } catch (error) {
      log.info(`Category cleanup: ${error}`)
    }
  }
}

async function main() {
  console.log(`\n${colors.magenta}${'='.repeat(70)}`)
  console.log(`  🚀 GraphQL CRUD Tests - Comprehensive Suite`)
  console.log(`${'='.repeat(70)}${colors.reset}\n`)
  
  try {
    // Setup
    await setupTestData()
    
    // Run tests
    const results = {
      userProfiles: await testUserProfileCRUD(),
      serviceRequests: await testServiceRequestCRUD(),
    }
    
    // Cleanup
    await cleanup()
    
    // Summary
    log.title('📊 FINAL TEST SUMMARY')
    const passed = Object.values(results).filter(r => r).length
    const total = Object.keys(results).length
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`
      console.log(`  ${test.toUpperCase().padEnd(20)} ${status}`)
    })
    
    console.log(`\n${'='.repeat(70)}`)
    console.log(`  ${passed}/${total} test suites passed`)
    console.log(`${'='.repeat(70)}\n`)
    
    if (passed === total) {
      console.log(`${colors.green}🎉 All GraphQL CRUD tests passed!${colors.reset}\n`)
    } else {
      console.log(`${colors.red}❌ Some tests failed${colors.reset}\n`)
    }
    
    process.exit(passed === total ? 0 : 1)
  } catch (error) {
    log.error(`Test suite failed: ${error}`)
    console.error(error)
    process.exit(1)
  }
}

main()
