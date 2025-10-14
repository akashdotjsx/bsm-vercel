const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const testTickets = [
  {
    title: "Inability to Save Changes in Profile Settings",
    description: "I've encountered an issue where changes made to profile settings are not being saved properly. This includes updating personal information, preferences, and notification settings. The changes appear to save initially but revert back to the original values after refreshing the page.",
    type: "incident",
    category: "Technical",
    subcategory: "Profile Management",
    priority: "medium",
    urgency: "medium",
    impact: "medium",
    status: "new",
    tags: ["profile", "settings", "bug"],
    custom_fields: {
      "customer_reported_via": "email",
      "browser": "Chrome",
      "os": "Windows 10"
    }
  },
  {
    title: "Upcoming subscription renewal discussion",
    description: "Hi there, I wanted to discuss our upcoming subscription renewal. Can you help me review the renewal options and pricing? We're considering upgrading to a higher tier plan and would like to understand the benefits and any available discounts.",
    type: "request",
    category: "Billing",
    subcategory: "Subscription",
    priority: "low",
    urgency: "low",
    impact: "low",
    status: "new",
    tags: ["billing", "subscription", "renewal"],
    custom_fields: {
      "customer_contacted_via": "phone",
      "current_plan": "Basic",
      "interested_in": "Premium"
    }
  },
  {
    title: "Dark Mode for the Dashboard",
    description: "Customer suggested implementing a dark mode option for the dashboard interface. This would improve user experience during night hours and reduce eye strain. The feature should include a toggle switch and remember user preference across sessions.",
    type: "request",
    category: "Feature Request",
    subcategory: "UI/UX",
    priority: "medium",
    urgency: "low",
    impact: "medium",
    status: "in_progress",
    tags: ["dark-mode", "ui", "feature-request"],
    custom_fields: {
      "customer_suggested_via": "feedback_form",
      "priority_level": "nice_to_have",
      "estimated_effort": "2-3 weeks"
    }
  },
  {
    title: "Cancellation of Zendesk Subscription",
    description: "Customer requested assistance with canceling their Zendesk subscription. They want to understand the cancellation process, any applicable fees, and how to export their data before the subscription ends.",
    type: "request",
    category: "Billing",
    subcategory: "Cancellation",
    priority: "urgent",
    urgency: "high",
    impact: "high",
    status: "in_progress",
    tags: ["cancellation", "zendesk", "billing"],
    custom_fields: {
      "customer_requested_via": "email",
      "subscription_end_date": "2024-12-31",
      "data_export_required": true
    }
  },
  {
    title: "Email Integration Not Working",
    description: "The email integration feature is not working properly. Emails are not being synced with the ticket system, and notifications are not being sent to customers. This is affecting our customer support workflow significantly.",
    type: "incident",
    category: "Technical",
    subcategory: "Integration",
    priority: "high",
    urgency: "high",
    impact: "high",
    status: "open",
    tags: ["email", "integration", "critical"],
    custom_fields: {
      "affected_services": ["email_sync", "notifications"],
      "first_reported": "2024-01-15T10:30:00Z",
      "workaround_available": false
    }
  },
  {
    title: "Password Reset Functionality",
    description: "Users are unable to reset their passwords using the forgot password feature. The reset emails are not being sent, and the reset links are not working properly. This is blocking user access to the system.",
    type: "incident",
    category: "Security",
    subcategory: "Authentication",
    priority: "critical",
    urgency: "critical",
    impact: "critical",
    status: "open",
    tags: ["password", "security", "authentication"],
    custom_fields: {
      "security_impact": "high",
      "affected_users": "all",
      "immediate_action_required": true
    }
  }
]

async function createTestTickets() {
  try {
    console.log('Creating test tickets...')
    
    // First, get the first organization ID
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
    
    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return
    }
    
    if (!orgs || orgs.length === 0) {
      console.error('No organizations found. Please create an organization first.')
      return
    }
    
    const organizationId = orgs[0].id
    console.log('Using organization ID:', organizationId)
    
    // Get a user ID for requester
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (userError) {
      console.error('Error fetching user:', userError)
      return
    }
    
    const requesterId = users && users.length > 0 ? users[0].id : null
    console.log('Using requester ID:', requesterId)
    
    // Create tickets
    for (let i = 0; i < testTickets.length; i++) {
      const ticket = testTickets[i]
      const ticketNumber = `BSM${String(5075 + i).padStart(4, '0')}`
      
      const ticketData = {
        ...ticket,
        organization_id: organizationId,
        ticket_number: ticketNumber,
        requester_id: requesterId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
      
      if (error) {
        console.error(`Error creating ticket ${ticketNumber}:`, error)
      } else {
        console.log(`✅ Created ticket ${ticketNumber}: ${ticket.title}`)
      }
    }
    
    console.log('Test tickets creation completed!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestTickets()

