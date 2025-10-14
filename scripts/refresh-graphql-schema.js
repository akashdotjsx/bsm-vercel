const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase GraphQL Schema...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // The schema will auto-refresh, but we can force it by making a query
    console.log('📡 Testing direct access to ticket_assignees...')
    
    const { data, error, count } = await supabase
      .from('ticket_assignees')
      .select('*', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.log('❌ Error:', error.message)
      return
    }
    
    console.log(`✅ Table accessible via REST API (${count} total records)`)
    
    // Check if we can query via the tickets relationship
    console.log('\n📊 Testing relationship query...')
    
    const { data: ticketData } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        ticket_assignees (
          user_id,
          role,
          profiles (
            display_name,
            email
          )
        )
      `)
      .limit(1)
      .single()
    
    if (ticketData) {
      console.log('✅ Relationship query works!')
      console.log('Ticket:', ticketData.ticket_number)
      console.log('Assignees:', ticketData.ticket_assignees?.length || 0)
      
      if (ticketData.ticket_assignees && ticketData.ticket_assignees.length > 0) {
        ticketData.ticket_assignees.forEach((a, i) => {
          console.log(`  ${i + 1}. ${a.profiles?.display_name || a.profiles?.email} (${a.role})`)
        })
      }
    }
    
    console.log('\n💡 Solution:')
    console.log('  GraphQL schema auto-refreshes every few minutes.')
    console.log('  For immediate effect, you can:')
    console.log('  1. Use the REST API approach (shown above) ✅')
    console.log('  2. Wait 5-10 minutes for GraphQL schema to refresh')
    console.log('  3. Or restart your Supabase project (if local)')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

refreshSchema()
