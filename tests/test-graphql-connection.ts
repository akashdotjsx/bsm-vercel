/**
 * Simple GraphQL Connection Test
 * Tests basic connectivity and authentication with Supabase GraphQL
 */

import { createGraphQLClient } from '../lib/graphql/client.ts'
import { gql } from 'graphql-request'

async function testConnection() {
  console.log('\n🔍 Testing GraphQL Connection...\n')
  
  try {
    const client = await createGraphQLClient()
    console.log('✓ GraphQL client created')
    
    // Try a simple query
    const query = gql`
      query TestConnection {
        profilesCollection(first: 1) {
          edges {
            node {
              id
              email
              display_name
            }
          }
        }
      }
    `
    
    console.log('→ Executing test query...')
    const result = await client.request(query)
    console.log('✓ Query executed successfully')
    console.log('\nResult:', JSON.stringify(result, null, 2))
    
    if (result && (result as any).profilesCollection) {
      const count = (result as any).profilesCollection.edges.length
      console.log(`\n✅ SUCCESS: Found ${count} profiles`)
      console.log('\n🎉 GraphQL connection is working!\n')
      process.exit(0)
    } else {
      console.log('\n⚠️  Query returned null or unexpected format')
      console.log('Full result:', result)
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testConnection()
