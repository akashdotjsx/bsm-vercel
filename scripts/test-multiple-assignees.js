const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testMultipleAssignees() {
  console.log('🧪 Testing Multiple Assignees Feature\n')

  try {
    // Get first ticket
    console.log('📋 Step 1: Finding a ticket to test...')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title')
      .limit(1)
      .single()

    if (!tickets) {
      console.log('❌ No tickets found to test with')
      return
    }

    console.log(`✅ Found ticket: #${tickets.ticket_number} - ${tickets.title}`)
    console.log(`   Ticket ID: ${tickets.id}\n`)

    // Get some users to assign
    console.log('👥 Step 2: Finding users to assign...')
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .limit(5)

    if (!users || users.length < 2) {
      console.log('❌ Need at least 2 users in the system')
      return
    }

    console.log(`✅ Found ${users.length} users:\n`)
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.display_name || user.email} (${user.id.substring(0, 8)}...)`)
    })
    console.log()

    // Assign multiple users to the ticket
    console.log('➕ Step 3: Assigning multiple users to ticket...')
    
    const assignments = users.slice(0, Math.min(5, users.length)).map((user, index) => ({
      ticket_id: tickets.id,
      user_id: user.id,
      role: index === 0 ? 'primary' : (index === 1 ? 'secondary' : 'assignee')
    }))

    const { error: assignError } = await supabase
      .from('ticket_assignees')
      .upsert(assignments, {
        onConflict: 'ticket_id,user_id'
      })

    if (assignError) {
      console.log('❌ Error assigning users:', assignError.message)
      return
    }

    console.log(`✅ Assigned ${assignments.length} users to the ticket!\n`)

    // Verify the assignments
    console.log('🔍 Step 4: Verifying assignments...')
    const { data: ticketAssignees } = await supabase
      .from('ticket_assignees')
      .select(`
        id,
        role,
        assigned_at,
        user:profiles(display_name, email)
      `)
      .eq('ticket_id', tickets.id)
      .order('role', { ascending: true })

    if (ticketAssignees) {
      console.log(`✅ Ticket now has ${ticketAssignees.length} assignees:\n`)
      ticketAssignees.forEach((assignment, i) => {
        const userName = assignment.user?.display_name || assignment.user?.email
        console.log(`   ${i + 1}. ${userName} (${assignment.role})`)
      })
    }

    console.log('\n🎉 Test completed successfully!')
    console.log('\n📱 UI will now show:')
    if (assignments.length <= 3) {
      console.log(`   ${assignments.map(() => '[ 👤 ]').join('')}`)
    } else {
      console.log(`   [ 👤 ][ 👤 ][ 👤 ][ +${assignments.length - 3} ]`)
    }
    console.log('\n💡 Refresh your tickets page to see the multiple assignees!\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

testMultipleAssignees()
