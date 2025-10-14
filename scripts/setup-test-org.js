const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function setupTestOrganization() {
  console.log('🏢 Setting up test organization for CRUD testing...\n')
  
  try {
    // Check if test organization already exists
    const { data: existing, error: checkError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'CRUD Test Organization')
      .single()
    
    if (existing) {
      console.log('✅ Test organization already exists:', existing.id)
      console.log('   Name:', existing.name)
      return existing.id
    }
    
    // Create test organization
    console.log('📝 Creating test organization...')
    const { data: org, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: 'CRUD Test Organization',
        domain: 'crud-test.local',
        status: 'active',
        tier: 'basic',
        health_score: 100,
        settings: {
          test_org: true,
          created_for: 'Dynamic CRUD testing'
        }
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create organization:', createError.message)
      console.log('\n💡 Tip: Make sure your database schema is properly set up.')
      console.log('   You might need to run migrations first.')
      return null
    }
    
    console.log('✅ Test organization created successfully!')
    console.log('   ID:', org.id)
    console.log('   Name:', org.name)
    console.log('\n📌 This organization will be used for CRUD testing.')
    console.log('   It\'s safe to delete this organization after testing.\n')
    
    // Store the org ID in an environment variable for the test script
    process.env.TEST_ORG_ID = org.id
    
    return org.id
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
    return null
  }
}

// Run the setup
setupTestOrganization().then(orgId => {
  if (orgId) {
    console.log('🎉 Setup complete! You can now run: npm run test:db')
    console.log(`\n📋 Test Organization ID: ${orgId}`)
  } else {
    console.log('❌ Setup failed. Please check your database configuration.')
    process.exit(1)
  }
})