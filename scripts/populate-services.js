const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Mock services data
const employeeServices = [
  {
    id: "it",
    name: "IT Services",
    description: "Technology support and equipment requests",
    icon: "laptop",
    color: "blue",
    services: [
      { name: "Laptop Request", description: "Request new laptop or replacement", sla: "3-5 days", popularity: 5 },
      { name: "Software Installation", description: "Install approved software", sla: "1-2 days", popularity: 4 },
      { name: "VPN Access", description: "Request VPN access for remote work", sla: "Same day", popularity: 5 },
      { name: "Password Reset", description: "Reset forgotten passwords", sla: "2 hours", popularity: 3 },
      { name: "BYOD Setup", description: "Configure personal device for work", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "hr",
    name: "HR Services",
    description: "Human resources and employee support",
    icon: "users",
    color: "green",
    services: [
      { name: "Employment Letter", description: "Request employment verification letter", sla: "2-3 days", popularity: 4 },
      { name: "Leave Request", description: "Submit vacation or sick leave", sla: "1-2 days", popularity: 5 },
      { name: "Benefits Inquiry", description: "Questions about health, dental, retirement", sla: "Same day", popularity: 3 },
      { name: "Payroll Issue", description: "Report payroll discrepancies", sla: "1-2 days", popularity: 2 },
      { name: "Grievance Filing", description: "File formal complaint or grievance", sla: "5-7 days", popularity: 1 },
    ],
  },
  {
    id: "finance",
    name: "Finance Services",
    description: "Financial and accounting support",
    icon: "dollar-sign",
    color: "yellow",
    services: [
      { name: "Expense Reimbursement", description: "Submit expense reports for reimbursement", sla: "3-5 days", popularity: 4 },
      { name: "Budget Request", description: "Request budget allocation for projects", sla: "1-2 weeks", popularity: 3 },
      { name: "Invoice Processing", description: "Process vendor invoices and payments", sla: "2-3 days", popularity: 2 },
      { name: "Financial Report", description: "Generate financial reports and analytics", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "legal",
    name: "Legal Services",
    description: "Legal compliance and contract support",
    icon: "scale",
    color: "purple",
    services: [
      { name: "Contract Review", description: "Review contracts and legal documents", sla: "3-5 days", popularity: 3 },
      { name: "Compliance Check", description: "Verify regulatory compliance requirements", sla: "1-2 days", popularity: 2 },
      { name: "Legal Consultation", description: "Schedule legal consultation", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "facilities",
    name: "Facilities Services",
    description: "Office space and facility management",
    icon: "building",
    color: "orange",
    services: [
      { name: "Office Space Request", description: "Request office space or meeting rooms", sla: "1-2 days", popularity: 3 },
      { name: "Maintenance Request", description: "Report facility maintenance issues", sla: "Same day", popularity: 4 },
      { name: "Access Card", description: "Request or replace access cards", sla: "1-2 days", popularity: 3 },
      { name: "Parking Permit", description: "Request parking space or permit", sla: "2-3 days", popularity: 2 },
    ],
  },
]

const customerServices = [
  {
    id: "technical-support",
    name: "Technical Support",
    description: "Product technical assistance and troubleshooting",
    icon: "laptop",
    color: "blue",
    services: [
      { name: "Product Setup", description: "Help with initial product configuration", sla: "4 hours", popularity: 5 },
      { name: "Bug Report", description: "Report software bugs or issues", sla: "2 hours", popularity: 4 },
      { name: "Integration Support", description: "Help with third-party integrations", sla: "8 hours", popularity: 3 },
      { name: "Performance Issue", description: "Report performance problems", sla: "4 hours", popularity: 3 },
      { name: "Feature Request", description: "Request new product features", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "account-management",
    name: "Account Management",
    description: "Account and billing support services",
    icon: "users",
    color: "green",
    services: [
      { name: "Billing Inquiry", description: "Questions about invoices and billing", sla: "4 hours", popularity: 4 },
      { name: "Plan Upgrade", description: "Upgrade subscription plan", sla: "2 hours", popularity: 3 },
      { name: "User Management", description: "Add or remove user accounts", sla: "2 hours", popularity: 4 },
      { name: "Contract Review", description: "Review contract terms and conditions", sla: "1-2 days", popularity: 2 },
      { name: "Renewal Discussion", description: "Discuss contract renewal options", sla: "4 hours", popularity: 3 },
    ],
  },
  {
    id: "customer-success",
    name: "Customer Success",
    description: "Customer onboarding and success management",
    icon: "star",
    color: "yellow",
    services: [
      { name: "Onboarding Session", description: "Schedule product onboarding session", sla: "1-2 days", popularity: 4 },
      { name: "Training Request", description: "Request product training for team", sla: "3-5 days", popularity: 3 },
      { name: "Best Practices", description: "Get recommendations for best practices", sla: "1-2 days", popularity: 3 },
      { name: "Webinar Request", description: "Request product webinar", sla: "10-14 days", popularity: 1 },
    ],
  },
]

async function populateServices() {
  try {
    console.log('🚀 Starting to populate services in Supabase...')
    
    // Get the first organization (assuming it exists)
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
    
    if (orgError) {
      throw new Error(`Failed to fetch organization: ${orgError.message}`)
    }
    
    if (!organizations || organizations.length === 0) {
      throw new Error('No organization found. Please create an organization first.')
    }
    
    const organizationId = organizations[0].id
    console.log(`📋 Using organization: ${organizationId}`)
    
    // Combine all services
    const allServices = [...employeeServices, ...customerServices]
    
    // First, create all categories
    console.log('📂 Creating service categories...')
    const categoryInserts = allServices.map(category => ({
      organization_id: organizationId,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      sort_order: allServices.indexOf(category),
      is_active: true
    }))
    
    const { data: categories, error: categoryError } = await supabase
      .from('service_categories')
      .insert(categoryInserts)
      .select()
    
    if (categoryError) {
      throw new Error(`Failed to create categories: ${categoryError.message}`)
    }
    
    console.log(`✅ Created ${categories.length} service categories`)
    
    // Now create all services
    console.log('🔧 Creating individual services...')
    const serviceInserts = []
    
    for (const category of allServices) {
      const dbCategory = categories.find(c => c.name === category.name)
      if (!dbCategory) continue
      
      for (const service of category.services) {
        serviceInserts.push({
          organization_id: organizationId,
          category_id: dbCategory.id,
          name: service.name,
          description: service.description,
          short_description: service.description.substring(0, 100),
          status: 'active',
          is_requestable: true,
          requires_approval: false,
          estimated_delivery_days: parseSlaToDays(service.sla),
          popularity_score: service.popularity,
          total_requests: 0,
          average_rating: 0.0
        })
      }
    }
    
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .insert(serviceInserts)
      .select()
    
    if (serviceError) {
      throw new Error(`Failed to create services: ${serviceError.message}`)
    }
    
    console.log(`✅ Created ${services.length} individual services`)
    
    // Summary
    console.log('\n🎉 Service population completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   📂 Categories: ${categories.length}`)
    console.log(`   🔧 Services: ${services.length}`)
    console.log(`   🏢 Organization: ${organizationId}`)
    
  } catch (error) {
    console.error('❌ Error populating services:', error.message)
    process.exit(1)
  }
}

function parseSlaToDays(sla) {
  if (sla.includes('hours') || sla.includes('hour')) {
    return 1 // Round up to 1 day for hours
  } else if (sla.includes('Same day')) {
    return 1
  } else if (sla.includes('days')) {
    const match = sla.match(/(\d+)-?(\d+)?\s*days?/)
    if (match) {
      return parseInt(match[2] || match[1]) // Use max if range, otherwise the number
    }
  } else if (sla.includes('weeks') || sla.includes('week')) {
    const match = sla.match(/(\d+)-?(\d+)?\s*weeks?/)
    if (match) {
      return (parseInt(match[2] || match[1]) * 7) // Convert weeks to days
    }
  }
  return 3 // Default fallback
}

// Run the script
populateServices()
