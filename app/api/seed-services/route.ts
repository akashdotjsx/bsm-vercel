import { NextResponse } from 'next/server'
import { createGraphQLClient } from '@/lib/graphql/client'
import { gql } from 'graphql-request'

export async function POST() {
  try {
    const client = await createGraphQLClient()
    
    // Get organization ID
    const orgQuery = gql`
      query GetOrganization {
        organizationsCollection(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    
    const orgData: any = await client.request(orgQuery)
    const orgId = orgData.organizationsCollection?.edges?.[0]?.node?.id
    
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    
    console.log('🗑️  STEP 1: Deleting all existing services and categories...')
    
    // IMPORTANT: Delete services BEFORE categories due to foreign key constraint
    
    // Get all services
    const getServicesQuery = gql`
      query GetAllServices($orgId: UUID!) {
        servicesCollection(filter: { organization_id: { eq: $orgId } }) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    
    const servicesData: any = await client.request(getServicesQuery, { orgId })
    const services = servicesData.servicesCollection?.edges || []
    
    console.log(`📋 Found ${services.length} services to delete`)
    
    // Delete each service with its dependencies
    for (const serviceEdge of services) {
      const serviceId = serviceEdge.node.id
      
      console.log(`🔄 Processing service: ${serviceId}`)
      
      // Get service requests for this service
      const getRequestsQuery = gql`
        query GetServiceRequests($serviceId: UUID!) {
          service_requestsCollection(filter: { service_id: { eq: $serviceId } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `
      
      const requestsData: any = await client.request(getRequestsQuery, { serviceId })
      const requests = requestsData.service_requestsCollection?.edges || []
      
      console.log(`  📋 Found ${requests.length} service requests`)
      
      // Delete service request approvals first
      for (const requestEdge of requests) {
        const requestId = requestEdge.node.id
        
        console.log(`  🔄 Deleting approvals for request: ${requestId}`)
        
        const deleteApprovalsMutation = gql`
          mutation DeleteApprovals($requestId: UUID!) {
            deleteFromservice_request_approvalsCollection(filter: { service_request_id: { eq: $requestId } }) {
              affectedCount
            }
          }
        `
        try {
          await client.request(deleteApprovalsMutation, { requestId })
          console.log(`  ✅ Deleted approvals for request: ${requestId}`)
        } catch (error) {
          console.log(`  ⚠️ No approvals to delete for request: ${requestId}`)
        }
      }
      
      // Delete service requests (CRITICAL: Must delete ALL before deleting service)
      if (requests.length > 0) {
        console.log(`  🔄 Deleting ${requests.length} service requests for service ${serviceId}`)
        
        const deleteRequestsMutation = gql`
          mutation DeleteRequests($serviceId: UUID!) {
            deleteFromservice_requestsCollection(filter: { service_id: { eq: $serviceId } }) {
              affectedCount
            }
          }
        `
        try {
          const result: any = await client.request(deleteRequestsMutation, { serviceId })
          console.log(`  ✅ Deleted ${result.deleteFromservice_requestsCollection.affectedCount} service requests`)
          
          // Verify all service requests are deleted
          const verifyQuery = gql`
            query VerifyServiceRequests($serviceId: UUID!) {
              service_requestsCollection(filter: { service_id: { eq: $serviceId } }) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `
          const verifyData: any = await client.request(verifyQuery, { serviceId })
          const remainingRequests = verifyData.service_requestsCollection?.edges || []
          
          if (remainingRequests.length > 0) {
            console.error(`  ⚠️ WARNING: ${remainingRequests.length} service requests still exist after deletion!`)
            throw new Error(`Failed to delete all service requests for service ${serviceId}`)
          } else {
            console.log(`  ✅ Verified: No service requests remain for service ${serviceId}`)
          }
        } catch (error: any) {
          console.error(`  ❌ Error handling service requests:`, error.message || error)
          throw error
        }
      } else {
        console.log(`  ℹ️ No service requests to delete for service ${serviceId}`)
      }
      
      // Delete service
      console.log(`  🔄 Deleting service: ${serviceId}`)
      
      const deleteServiceMutation = gql`
        mutation DeleteService($serviceId: UUID!) {
          deleteFromservicesCollection(filter: { id: { eq: $serviceId } }) {
            affectedCount
          }
        }
      `
      try {
        const serviceResult: any = await client.request(deleteServiceMutation, { serviceId })
        console.log(`  ✅ Deleted service (${serviceResult.deleteFromservicesCollection.affectedCount} row)`)
      } catch (error: any) {
        console.error(`  ❌ Error deleting service ${serviceId}:`, error.message || error)
        
        // Check if it's a foreign key constraint error
        if (error.message && error.message.includes('foreign key')) {
          console.error(`  ⚠️ Foreign key constraint violation - service is still referenced elsewhere`)
          console.error(`  💡 This service might be referenced by tickets or other tables`)
        }
        
        throw new Error(`Failed to delete service ${serviceId}: ${error.message || 'Unknown error'}`)
      }
    }
    
    console.log('✅ All services deleted')
    
    // NOW delete all categories (after all services are deleted)
    console.log('🔄 Deleting categories...')
    
    const deleteCategoriesMutation = gql`
      mutation DeleteCategories($orgId: UUID!) {
        deleteFromservice_categoriesCollection(filter: { organization_id: { eq: $orgId } }) {
          affectedCount
        }
      }
    `
    
    const catResult: any = await client.request(deleteCategoriesMutation, { orgId })
    console.log(`✅ Deleted ${catResult.deleteFromservice_categoriesCollection.affectedCount} categories`)
    
    console.log('\n🏗️  STEP 2: Creating 10 service categories with multiple services...\n')
    
    const categoriesData = [
      {
        name: 'IT Support',
        description: 'Technical support and IT infrastructure services',
        icon: 'Laptop',
        color: 'bg-blue-500',
        services: [
          { name: 'Password Reset', description: 'Reset forgotten passwords for enterprise accounts', sla: 1, popularity: 5 },
          { name: 'Software Installation', description: 'Install approved software on workstations', sla: 2, popularity: 4 },
          { name: 'Hardware Setup', description: 'Configure new computers and peripherals', sla: 3, popularity: 4 },
          { name: 'VPN Access Request', description: 'Request remote VPN access credentials', sla: 1, popularity: 5 },
          { name: 'Email Account Setup', description: 'Create new corporate email accounts', sla: 1, popularity: 4 },
        ]
      },
      {
        name: 'Human Resources',
        description: 'Employee services and HR support',
        icon: 'Users',
        color: 'bg-green-500',
        services: [
          { name: 'New Employee Onboarding', description: 'Complete onboarding setup for new employees', sla: 5, popularity: 5 },
          { name: 'Time Off Request', description: 'Submit vacation and PTO requests', sla: 2, popularity: 5 },
          { name: 'Benefits Enrollment', description: 'Enroll in health and retirement benefits', sla: 7, popularity: 4 },
          { name: 'Payroll Inquiry', description: 'Questions about payroll and compensation', sla: 3, popularity: 3 },
          { name: 'Employee ID Badge', description: 'Request new or replacement ID badge', sla: 2, popularity: 4 },
        ]
      },
      {
        name: 'Facilities',
        description: 'Office and facility management services',
        icon: 'Building',
        color: 'bg-orange-500',
        services: [
          { name: 'Office Space Request', description: 'Request workspace or desk assignment', sla: 5, popularity: 3 },
          { name: 'Parking Pass', description: 'Request parking permit or pass', sla: 3, popularity: 4 },
          { name: 'Building Access', description: 'Request after-hours building access', sla: 2, popularity: 3 },
          { name: 'Meeting Room Booking', description: 'Reserve conference rooms and meeting spaces', sla: 1, popularity: 5 },
          { name: 'Maintenance Request', description: 'Report facility maintenance issues', sla: 2, popularity: 4 },
        ]
      },
      {
        name: 'Finance',
        description: 'Financial and accounting services',
        icon: 'DollarSign',
        color: 'bg-yellow-500',
        services: [
          { name: 'Expense Reimbursement', description: 'Submit business expense reports', sla: 7, popularity: 5 },
          { name: 'Purchase Order Request', description: 'Create new purchase orders', sla: 5, popularity: 4 },
          { name: 'Budget Inquiry', description: 'Questions about department budgets', sla: 3, popularity: 3 },
          { name: 'Invoice Processing', description: 'Submit vendor invoices for payment', sla: 5, popularity: 4 },
          { name: 'Corporate Card Request', description: 'Request corporate credit card', sla: 10, popularity: 3 },
        ]
      },
      {
        name: 'Security',
        description: 'Security and access control services',
        icon: 'Shield',
        color: 'bg-red-500',
        services: [
          { name: 'Security Incident Report', description: 'Report security incidents or concerns', sla: 1, popularity: 2 },
          { name: 'Access Badge Replacement', description: 'Replace lost or damaged access badges', sla: 2, popularity: 3 },
          { name: 'Security Camera Review', description: 'Request security footage review', sla: 3, popularity: 2 },
          { name: 'Visitor Pass', description: 'Request visitor access passes', sla: 1, popularity: 4 },
          { name: 'Security Training', description: 'Schedule security awareness training', sla: 14, popularity: 3 },
        ]
      },
      {
        name: 'Legal & Compliance',
        description: 'Legal and compliance services',
        icon: 'Scale',
        color: 'bg-purple-500',
        services: [
          { name: 'Contract Review', description: 'Legal review of contracts and agreements', sla: 7, popularity: 3 },
          { name: 'NDA Request', description: 'Request non-disclosure agreements', sla: 3, popularity: 4 },
          { name: 'Compliance Training', description: 'Regulatory compliance training sessions', sla: 14, popularity: 3 },
          { name: 'Legal Consultation', description: 'Schedule consultation with legal team', sla: 5, popularity: 2 },
          { name: 'Policy Review', description: 'Review and update company policies', sla: 10, popularity: 2 },
        ]
      },
      {
        name: 'Marketing',
        description: 'Marketing and communications services',
        icon: 'TrendingUp',
        color: 'bg-pink-500',
        services: [
          { name: 'Marketing Materials', description: 'Request brochures, flyers, and collateral', sla: 10, popularity: 4 },
          { name: 'Logo Design', description: 'Custom logo and branding design', sla: 14, popularity: 3 },
          { name: 'Social Media Content', description: 'Request social media posts and content', sla: 5, popularity: 4 },
          { name: 'Email Campaign', description: 'Setup marketing email campaigns', sla: 7, popularity: 4 },
          { name: 'Event Planning', description: 'Plan corporate events and conferences', sla: 21, popularity: 3 },
        ]
      },
      {
        name: 'Training & Development',
        description: 'Employee training and development programs',
        icon: 'BookOpen',
        color: 'bg-indigo-500',
        services: [
          { name: 'Skills Training', description: 'Professional skills development courses', sla: 30, popularity: 4 },
          { name: 'Leadership Program', description: 'Leadership and management training', sla: 45, popularity: 3 },
          { name: 'Mentorship Request', description: 'Request mentorship or coaching', sla: 7, popularity: 3 },
          { name: 'Certification Support', description: 'Professional certification assistance', sla: 14, popularity: 3 },
          { name: 'Team Building', description: 'Team building activities and workshops', sla: 21, popularity: 4 },
        ]
      },
      {
        name: 'Procurement',
        description: 'Purchasing and vendor management',
        icon: 'Layers',
        color: 'bg-teal-500',
        services: [
          { name: 'Supplier Onboarding', description: 'Add new vendors to approved supplier list', sla: 14, popularity: 3 },
          { name: 'Equipment Purchase', description: 'Request office equipment and supplies', sla: 7, popularity: 4 },
          { name: 'Software License', description: 'Purchase software licenses and subscriptions', sla: 5, popularity: 4 },
          { name: 'Vendor Evaluation', description: 'Evaluate and compare vendors', sla: 10, popularity: 2 },
          { name: 'Contract Negotiation', description: 'Negotiate vendor contracts and pricing', sla: 14, popularity: 3 },
        ]
      },
      {
        name: 'Quality Assurance',
        description: 'Quality control and assurance services',
        icon: 'CheckCircle',
        color: 'bg-cyan-500',
        services: [
          { name: 'Quality Audit', description: 'Schedule quality assurance audits', sla: 14, popularity: 3 },
          { name: 'Process Review', description: 'Review and improve business processes', sla: 10, popularity: 3 },
          { name: 'Bug Report', description: 'Report software bugs and issues', sla: 2, popularity: 4 },
          { name: 'Testing Request', description: 'Request QA testing for new features', sla: 7, popularity: 4 },
          { name: 'Standards Compliance', description: 'Verify standards and compliance', sla: 10, popularity: 2 },
        ]
      },
    ]
    
    const createCategoryMutation = gql`
      mutation CreateCategory($input: service_categoriesInsertInput!) {
        insertIntoservice_categoriesCollection(objects: [$input]) {
          records {
            id
            name
          }
        }
      }
    `
    
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
    
    const results = []
    
    for (const categoryData of categoriesData) {
      // Create category
      const categoryInput = {
        organization_id: orgId,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        is_active: true,
      }
      
      const categoryResult: any = await client.request(createCategoryMutation, { input: categoryInput })
      const category = categoryResult.insertIntoservice_categoriesCollection.records[0]
      
      console.log(`📁 Created category: ${category.name}`)
      
      const services = []
      
      // Create services for this category
      for (const serviceData of categoryData.services) {
        const serviceInput = {
          organization_id: orgId,
          category_id: category.id,
          name: serviceData.name,
          description: serviceData.description,
          estimated_delivery_days: serviceData.sla,
          popularity_score: serviceData.popularity,
          is_requestable: true,
          requires_approval: false,
          status: 'active',
        }
        
        const serviceResult: any = await client.request(createServiceMutation, { input: serviceInput })
        const service = serviceResult.insertIntoservicesCollection.records[0]
        services.push(service.name)
        console.log(`  ✅ ${service.name}`)
      }
      
      results.push({
        category: category.name,
        servicesCreated: services.length,
        services
      })
    }
    
    console.log('\n✅ All categories and services created successfully!\n')
    
    return NextResponse.json({
      success: true,
      message: 'Service catalog seeded successfully',
      categoriesCreated: results.length,
      totalServicesCreated: results.reduce((sum, r) => sum + r.servicesCreated, 0),
      details: results
    })
    
  } catch (error) {
    console.error('❌ Seed error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed services', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

