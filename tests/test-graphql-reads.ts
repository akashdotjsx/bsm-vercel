/**
 * GraphQL Read Operations Test
 * Tests all READ queries to verify data fetching works correctly
 */

import { createGraphQLClient } from '../lib/graphql/client.ts'
import { gql } from 'graphql-request'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.yellow}${msg}${colors.reset}\n`),
}

async function testReadProfiles() {
  log.section('📖 TEST 1: Read User Profiles')
  
  const client = await createGraphQLClient()
  
  try {
    log.test('Fetching all profiles...')
    const query = gql`
      query GetProfiles {
        profilesCollection(first: 5) {
          edges {
            node {
              id
              email
              display_name
              department
              role
              is_active
            }
          }
        }
      }
    `
    
    const result: any = await client.request(query)
    const profiles = result.profilesCollection.edges
    
    log.success(`Fetched ${profiles.length} profiles`)
    profiles.forEach((edge: any, i: number) => {
      const p = edge.node
      console.log(`  ${i + 1}. ${p.display_name || p.email} (${p.role})`)
    })
    
    return true
  } catch (error) {
    log.error(`Failed: ${error}`)
    return false
  }
}

async function testReadProfileById() {
  log.section('📖 TEST 2: Read Single Profile by ID')
  
  const client = await createGraphQLClient()
  
  try {
    // First get a profile ID
    log.test('Getting profile ID...')
    const getIdQuery = gql`
      query GetProfileId {
        profilesCollection(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    
    const idResult: any = await client.request(getIdQuery)
    const profileId = idResult.profilesCollection.edges[0].node.id
    
    log.test(`Fetching profile ${profileId}...`)
    const query = gql`
      query GetProfileById($id: UUID!) {
        profilesCollection(filter: { id: { eq: $id } }) {
          edges {
            node {
              id
              email
              first_name
              last_name
              display_name
              phone
              department
              role
              is_active
              organization: organizations {
                id
                name
              }
              manager: profiles {
                id
                display_name
              }
            }
          }
        }
      }
    `
    
    const result: any = await client.request(query, { id: profileId })
    const profile = result.profilesCollection.edges[0].node
    
    log.success('Profile fetched successfully!')
    console.log(`  Name: ${profile.display_name}`)
    console.log(`  Email: ${profile.email}`)
    console.log(`  Role: ${profile.role}`)
    console.log(`  Department: ${profile.department}`)
    console.log(`  Organization: ${profile.organization?.name}`)
    if (profile.manager) {
      console.log(`  Manager: ${profile.manager.display_name}`)
    }
    
    return true
  } catch (error) {
    log.error(`Failed: ${error}`)
    return false
  }
}

async function testReadServiceRequests() {
  log.section('📖 TEST 3: Read Service Requests')
  
  const client = await createGraphQLClient()
  
  try {
    log.test('Fetching service requests...')
    const query = gql`
      query GetServiceRequests {
        service_requestsCollection(first: 5, orderBy: [{ created_at: DescNullsLast }]) {
          edges {
            node {
              id
              request_number
              title
              status
              priority
              created_at
              service: services {
                name
              }
              requester: profiles {
                display_name
                email
              }
            }
          }
        }
      }
    `
    
    const result: any = await client.request(query)
    const requests = result.service_requestsCollection.edges
    
    log.success(`Fetched ${requests.length} service requests`)
    requests.forEach((edge: any, i: number) => {
      const r = edge.node
      console.log(`  ${i + 1}. ${r.request_number} - ${r.title} (${r.status})`)
      console.log(`     By: ${r.requester?.display_name}`)
    })
    
    return true
  } catch (error) {
    log.error(`Failed: ${error}`)
    return false
  }
}

async function testReadServicesWithCategory() {
  log.section('📖 TEST 4: Read Services with Category')
  
  const client = await createGraphQLClient()
  
  try {
    log.test('Fetching services...')
    const query = gql`
      query GetServices {
        servicesCollection(first: 5) {
          edges {
            node {
              id
              name
              description
              is_requestable
              status
              category: service_categories {
                name
              }
            }
          }
        }
      }
    `
    
    const result: any = await client.request(query)
    const services = result.servicesCollection.edges
    
    log.success(`Fetched ${services.length} services`)
    services.forEach((edge: any, i: number) => {
      const s = edge.node
      console.log(`  ${i + 1}. ${s.name} (${s.status})`)
      if (s.category) {
        console.log(`     Category: ${s.category.name}`)
      }
    })
    
    return true
  } catch (error) {
    log.error(`Failed: ${error}`)
    return false
  }
}

async function testReadAssets() {
  log.section('📖 TEST 5: Read Assets')
  
  const client = await createGraphQLClient()
  
  try {
    log.test('Fetching assets...')
    const query = gql`
      query GetAssets {
        assetsCollection(first: 5) {
          edges {
            node {
              id
              name
              asset_tag
              status
              criticality
              asset_type: asset_types {
                name
                icon
              }
            }
          }
        }
      }
    `
    
    const result: any = await client.request(query)
    const assets = result.assetsCollection.edges
    
    log.success(`Fetched ${assets.length} assets`)
    assets.forEach((edge: any, i: number) => {
      const a = edge.node
      console.log(`  ${i + 1}. ${a.name} (${a.asset_tag})`)
      console.log(`     Type: ${a.asset_type?.name} | Status: ${a.status}`)
    })
    
    return true
  } catch (error) {
    log.error(`Failed: ${error}`)
    return false
  }
}

async function testFilteringAndSearch() {
  log.section('📖 TEST 6: Filtering & Search')
  
  const client = await createGraphQLClient()
  
  try {
    // Test 6a: Filter by role
    log.test('Filtering users by role = "admin"...')
    const filterQuery = gql`
      query FilterByRole {
        profilesCollection(filter: { role: { eq: "admin" } }, first: 5) {
          edges {
            node {
              id
              display_name
              role
            }
          }
        }
      }
    `
    
    const filterResult: any = await client.request(filterQuery)
    const admins = filterResult.profilesCollection.edges
    log.success(`Found ${admins.length} admin users`)
    
    // Test 6b: Search by status
    log.test('Filtering service requests by status = "pending"...')
    const statusQuery = gql`
      query FilterByStatus {
        service_requestsCollection(filter: { status: { eq: "pending" } }, first: 5) {
          edges {
            node {
              id
              request_number
              title
              status
            }
          }
        }
      }
    `
    
    const statusResult: any = await client.request(statusQuery)
    const pending = statusResult.service_requestsCollection.edges
    log.success(`Found ${pending.length} pending requests`)
    
    return true
  } catch (error) {
    log.error(`Failed: ${error}`)
    return false
  }
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('  📚 GraphQL READ Operations Test Suite')
  console.log('='.repeat(70))
  
  const results = {
    profiles: await testReadProfiles(),
    profileById: await testReadProfileById(),
    serviceRequests: await testReadServiceRequests(),
    services: await testReadServicesWithCategory(),
    assets: await testReadAssets(),
    filtering: await testFilteringAndSearch(),
  }
  
  // Summary
  log.section('📊 TEST SUMMARY')
  const passed = Object.values(results).filter(r => r).length
  const total = Object.keys(results).length
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`
    console.log(`  ${test.toUpperCase().padEnd(20)} ${status}`)
  })
  
  console.log('\n' + '='.repeat(70))
  console.log(`  ${passed}/${total} tests passed`)
  console.log('='.repeat(70))
  
  if (passed === total) {
    console.log(`\n${colors.green}🎉 All GraphQL READ operations working perfectly!${colors.reset}\n`)
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}\n`)
  }
  
  process.exit(passed === total ? 0 : 1)
}

main()
