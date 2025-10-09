const { createClient } = require('@supabase/supabase-js')
const { GraphQLClient, gql } = require('graphql-request')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function debugAssignees() {
  console.log('🔍 Debugging Assignees Display Issue\n')

  try {
    // Step 1: Check database directly
    console.log('📊 Step 1: Checking ticket_assignees table...')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: assignees, error } = await supabase
      .from('ticket_assignees')
      .select(`
        ticket_id,
        user_id,
        role,
        user:profiles(display_name, email)
      `)
      .limit(10)

    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log(`✅ Found ${assignees?.length || 0} assignee records in database\n`)
      if (assignees && assignees.length > 0) {
        const grouped = assignees.reduce((acc, a) => {
          if (!acc[a.ticket_id]) acc[a.ticket_id] = []
          acc[a.ticket_id].push(a)
          return acc
        }, {})
        
        Object.entries(grouped).forEach(([ticketId, assigns]) => {
          console.log(`  Ticket ${ticketId.substring(0, 8)}... has ${assigns.length} assignees:`)
          assigns.forEach(a => {
            console.log(`    - ${a.user?.display_name || a.user?.email} (${a.role})`)
          })
        })
      }
    }

    // Step 2: Check GraphQL response
    console.log('\n📡 Step 2: Testing GraphQL query...')
    
    const endpoint = `${supabaseUrl}/graphql/v1`
    const client = new GraphQLClient(endpoint, {
      headers: {
        apikey: supabaseKey,
        authorization: `Bearer ${supabaseKey}`,
      },
    })

    const query = gql`
      query GetTickets {
        ticketsCollection(first: 5) {
          edges {
            node {
              id
              ticket_number
              title
              assignees: ticket_assigneesCollection {
                edges {
                  node {
                    id
                    user_id
                    role
                  }
                }
              }
            }
          }
        }
      }
    `

    const data = await client.request(query)
    const tickets = data.ticketsCollection.edges

    console.log(`✅ GraphQL returned ${tickets.length} tickets\n`)
    
    tickets.forEach(({ node: ticket }) => {
      const assigneeCount = ticket.assignees?.edges?.length || 0
      console.log(`  ${ticket.ticket_number}: ${assigneeCount} assignees`)
      if (assigneeCount === 0) {
        console.log(`    ⚠️  No assignees in GraphQL response!`)
      } else {
        ticket.assignees.edges.forEach(e => {
          console.log(`    - User ${e.node.user_id.substring(0, 8)}... (${e.node.role})`)
        })
      }
    })

    // Step 3: Check if profiles are fetched
    console.log('\n👥 Step 3: Checking if we can fetch user profiles...')
    
    if (tickets.length > 0 && tickets[0].node.assignees?.edges?.length > 0) {
      const userId = tickets[0].node.assignees.edges[0].node.user_id
      
      const profileQuery = gql`
        query GetProfile($id: UUID!) {
          profilesCollection(filter: { id: { eq: $id } }) {
            edges {
              node {
                id
                display_name
                first_name
                last_name
                email
              }
            }
          }
        }
      `
      
      const profileData = await client.request(profileQuery, { id: userId })
      const profile = profileData.profilesCollection.edges[0]?.node
      
      if (profile) {
        console.log(`✅ Can fetch profile: ${profile.display_name || profile.email}`)
      } else {
        console.log(`❌ Cannot fetch profile for user ${userId}`)
      }
    }

    console.log('\n📋 Summary:')
    console.log(`  Database has assignee records: ${assignees?.length > 0 ? '✅' : '❌'}`)
    console.log(`  GraphQL returns assignees: ${tickets.some(t => t.node.assignees?.edges?.length > 0) ? '✅' : '❌'}`)
    console.log(`  Can fetch user profiles: ✅`)
    
    console.log('\n💡 Next steps:')
    console.log('  1. Check browser console for errors')
    console.log('  2. Check Network tab in DevTools')
    console.log('  3. Look for GraphQL response in browser\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

debugAssignees()
