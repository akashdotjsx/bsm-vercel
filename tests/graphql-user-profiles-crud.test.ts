/**
 * User Profiles GraphQL CRUD Tests
 * 
 * Tests all Create, Read, Update, Delete operations for user profiles using GraphQL
 * Run with: npx ts-node tests/graphql-user-profiles-crud.test.ts
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
let testProfileId: string
let testOrganizationId: string = '00000000-0000-0000-0000-000000000001'
const testEmail = `test.user.${Date.now()}@example.com`

async function setup() {
  log.section('🚀 SETUP - Preparing test data')
  
  const client = await createGraphQLClient()
  
  // Verify organization exists
  const orgQuery = gql`
    query GetOrg($id: UUID!) {
      organizationsCollection(filter: { id: { eq: $id } }) {
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
    const orgData: any = await client.request(orgQuery, { id: testOrganizationId })
    if (orgData.organizationsCollection.edges.length > 0) {
      log.success(`Found organization: ${orgData.organizationsCollection.edges[0].node.name}`)
    } else {
      log.error('Organization not found')
      process.exit(1)
    }
  } catch (error) {
    log.error(`Failed to verify organization: ${error}`)
    process.exit(1)
  }
  
  log.success('Setup complete!\n')
}

async function testCreate() {
  log.section('📝 TEST 1: CREATE - Insert new user profile')
  
  const client = await createGraphQLClient()
  
  const createMutation = gql`
    mutation CreateProfile($input: profilesInsertInput!) {
      insertIntoprofilesCollection(objects: [$input]) {
        records {
          id
          email
          first_name
          last_name
          display_name
          phone
          department
          role
          is_active
          created_at
          organization: organizations {
            id
            name
          }
        }
      }
    }
  `
  
  const input = {
    organization_id: testOrganizationId,
    email: testEmail,
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User GraphQL',
    phone: '+1-555-0123',
    department: 'Engineering',
    role: 'user',
    is_active: true,
  }
  
  try {
    log.test('Creating user profile...')
    const result: any = await client.request(createMutation, { input })
    
    if (result.insertIntoprofilesCollection.records.length > 0) {
      const record = result.insertIntoprofilesCollection.records[0]
      testProfileId = record.id
      
      log.success('User profile created successfully!')
      log.info(`  ID: ${record.id}`)
      log.info(`  Email: ${record.email}`)
      log.info(`  Name: ${record.first_name} ${record.last_name}`)
      log.info(`  Display Name: ${record.display_name}`)
      log.info(`  Department: ${record.department}`)
      log.info(`  Role: ${record.role}`)
      log.info(`  Status: ${record.is_active ? 'Active' : 'Inactive'}`)
      log.info(`  Organization: ${record.organization?.name}`)
      return true
    } else {
      log.error('Failed to create user profile - no records returned')
      return false
    }
  } catch (error) {
    log.error(`Create failed: ${error}`)
    return false
  }
}

async function testRead() {
  log.section('📖 TEST 2: READ - Fetch user profiles')
  
  const client = await createGraphQLClient()
  
  // Test 2a: Read all profiles
  log.test('Test 2a: Fetching all user profiles...')
  const readAllQuery = gql`
    query GetAllProfiles($first: Int!) {
      profilesCollection(
        first: $first
        orderBy: [{ created_at: DescNullsLast }]
      ) {
        edges {
          node {
            id
            email
            display_name
            department
            role
            is_active
            created_at
          }
        }
      }
    }
  `
  
  try {
    const allData: any = await client.request(readAllQuery, { first: 10 })
    const count = allData.profilesCollection.edges.length
    log.success(`Fetched ${count} user profiles`)
    
    if (count > 0) {
      log.info(`Latest: ${allData.profilesCollection.edges[0].node.display_name || allData.profilesCollection.edges[0].node.email}`)
    }
  } catch (error) {
    log.error(`Failed to fetch all profiles: ${error}`)
    return false
  }
  
  // Test 2b: Read single profile by ID
  log.test('Test 2b: Fetching single profile by ID...')
  const readByIdQuery = gql`
    query GetProfileById($id: UUID!) {
      profilesCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            organization_id
            email
            first_name
            last_name
            display_name
            avatar_url
            phone
            department
            role
            manager_id
            is_active
            timezone
            language
            notification_preferences
            created_at
            updated_at
            organization: organizations {
              id
              name
              domain
            }
            manager: profiles {
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
    const singleData: any = await client.request(readByIdQuery, { id: testProfileId })
    
    if (singleData.profilesCollection.edges.length > 0) {
      const record = singleData.profilesCollection.edges[0].node
      log.success('User profile fetched successfully!')
      log.info(`  ID: ${record.id}`)
      log.info(`  Email: ${record.email}`)
      log.info(`  Name: ${record.first_name} ${record.last_name}`)
      log.info(`  Display Name: ${record.display_name}`)
      log.info(`  Phone: ${record.phone}`)
      log.info(`  Department: ${record.department}`)
      log.info(`  Role: ${record.role}`)
      log.info(`  Status: ${record.is_active ? 'Active' : 'Inactive'}`)
      log.info(`  Organization: ${record.organization?.name}`)
      if (record.manager) {
        log.info(`  Manager: ${record.manager.display_name}`)
      }
      return true
    } else {
      log.error('User profile not found')
      return false
    }
  } catch (error) {
    log.error(`Failed to fetch user profile: ${error}`)
    return false
  }
}

async function testUpdate() {
  log.section('✏️  TEST 3: UPDATE - Modify user profile')
  
  const client = await createGraphQLClient()
  
  const updateMutation = gql`
    mutation UpdateProfile($id: UUID!, $set: profilesUpdateInput!) {
      updateprofilesCollection(
        filter: { id: { eq: $id } }
        set: $set
      ) {
        records {
          id
          email
          first_name
          last_name
          display_name
          phone
          department
          role
          is_active
          updated_at
        }
      }
    }
  `
  
  const updates = {
    first_name: 'Updated',
    last_name: 'TestUser',
    display_name: 'Updated Test User',
    phone: '+1-555-9999',
    department: 'Product Management',
    role: 'manager',
  }
  
  try {
    log.test('Updating user profile...')
    const result: any = await client.request(updateMutation, { 
      id: testProfileId, 
      set: updates 
    })
    
    if (result.updateprofilesCollection.records.length > 0) {
      const record = result.updateprofilesCollection.records[0]
      log.success('User profile updated successfully!')
      log.info(`  ID: ${record.id}`)
      log.info(`  New Name: ${record.first_name} ${record.last_name}`)
      log.info(`  New Display Name: ${record.display_name}`)
      log.info(`  New Phone: ${record.phone}`)
      log.info(`  New Department: ${record.department}`)
      log.info(`  New Role: ${record.role}`)
      log.info(`  Updated At: ${new Date(record.updated_at).toLocaleString()}`)
      return true
    } else {
      log.error('Failed to update user profile')
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
  
  // Test 4a: Filter by role
  log.test('Test 4a: Filtering by role = "manager"...')
  const filterRoleQuery = gql`
    query GetProfilesByRole($role: String!) {
      profilesCollection(
        filter: { role: { eq: $role } }
        first: 10
      ) {
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
  
  try {
    const roleData: any = await client.request(filterRoleQuery, { role: 'manager' })
    const count = roleData.profilesCollection.edges.length
    log.success(`Found ${count} manager profiles`)
  } catch (error) {
    log.error(`Role filter failed: ${error}`)
  }
  
  // Test 4b: Filter by department
  log.test('Test 4b: Filtering by department = "Product Management"...')
  const filterDeptQuery = gql`
    query GetProfilesByDept($dept: String!) {
      profilesCollection(
        filter: { department: { eq: $dept } }
        first: 10
      ) {
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
  
  try {
    const deptData: any = await client.request(filterDeptQuery, { dept: 'Product Management' })
    const count = deptData.profilesCollection.edges.length
    log.success(`Found ${count} profiles in Product Management`)
  } catch (error) {
    log.error(`Department filter failed: ${error}`)
  }
  
  // Test 4c: Filter by active status
  log.test('Test 4c: Filtering by is_active = true...')
  const filterActiveQuery = gql`
    query GetActiveProfiles($isActive: Boolean!) {
      profilesCollection(
        filter: { is_active: { eq: $isActive } }
        first: 10
      ) {
        edges {
          node {
            id
            email
            display_name
            is_active
          }
        }
      }
    }
  `
  
  try {
    const activeData: any = await client.request(filterActiveQuery, { isActive: true })
    const count = activeData.profilesCollection.edges.length
    log.success(`Found ${count} active profiles`)
  } catch (error) {
    log.error(`Active status filter failed: ${error}`)
  }
  
  // Test 4d: Search by name or email
  log.test('Test 4d: Searching by name/email...')
  const searchQuery = gql`
    query SearchProfiles($searchTerm: String!) {
      profilesCollection(
        filter: {
          or: [
            { display_name: { ilike: $searchTerm } }
            { email: { ilike: $searchTerm } }
            { first_name: { ilike: $searchTerm } }
            { last_name: { ilike: $searchTerm } }
          ]
        }
        first: 10
      ) {
        edges {
          node {
            id
            email
            display_name
            department
          }
        }
      }
    }
  `
  
  try {
    const searchData: any = await client.request(searchQuery, { searchTerm: '%test%' })
    const count = searchData.profilesCollection.edges.length
    log.success(`Found ${count} profiles matching search`)
    return true
  } catch (error) {
    log.error(`Search filter failed: ${error}`)
    return false
  }
}

async function testDelete() {
  log.section('🗑️  TEST 5: DELETE - Remove user profile')
  
  const client = await createGraphQLClient()
  
  const deleteMutation = gql`
    mutation DeleteProfile($id: UUID!) {
      deleteFromprofilesCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  
  try {
    log.test('Deleting user profile...')
    const result: any = await client.request(deleteMutation, { id: testProfileId })
    
    if (result.deleteFromprofilesCollection.affectedCount > 0) {
      log.success(`User profile deleted successfully! (${result.deleteFromprofilesCollection.affectedCount} record removed)`)
      
      // Verify deletion
      log.test('Verifying deletion...')
      const verifyQuery = gql`
        query VerifyDeletion($id: UUID!) {
          profilesCollection(filter: { id: { eq: $id } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `
      
      const verifyData: any = await client.request(verifyQuery, { id: testProfileId })
      
      if (verifyData.profilesCollection.edges.length === 0) {
        log.success('Deletion verified - record no longer exists')
        return true
      } else {
        log.error('Deletion verification failed - record still exists')
        return false
      }
    } else {
      log.error('Failed to delete user profile')
      return false
    }
  } catch (error) {
    log.error(`Delete failed: ${error}`)
    return false
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70))
  console.log('  USER PROFILES GraphQL CRUD Tests')
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
