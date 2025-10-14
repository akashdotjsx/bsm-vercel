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

async function cleanupDuplicates() {
  try {
    console.log('🧹 Starting cleanup of duplicate service categories...')
    
    // Get all categories for the organization
    const { data: categories, error: fetchError } = await supabase
      .from('service_categories')
      .select('*')
      .eq('organization_id', '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      throw new Error(`Failed to fetch categories: ${fetchError.message}`)
    }
    
    console.log(`📋 Found ${categories.length} total categories`)
    
    // Group by name to find duplicates
    const categoryMap = new Map()
    const duplicates = []
    
    categories.forEach(category => {
      const key = category.name
      if (categoryMap.has(key)) {
        duplicates.push(category)
      } else {
        categoryMap.set(key, category)
      }
    })
    
    console.log(`🔍 Found ${duplicates.length} duplicate categories`)
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!')
      return
    }
    
    // First, move services from duplicate categories to the original ones
    for (const duplicate of duplicates) {
      const original = categoryMap.get(duplicate.name)
      
      // Move services from duplicate to original
      const { error: updateError } = await supabase
        .from('services')
        .update({ category_id: original.id })
        .eq('category_id', duplicate.id)
      
      if (updateError) {
        console.warn(`⚠️ Warning: Could not move services from ${duplicate.name}:`, updateError.message)
      } else {
        console.log(`📦 Moved services from duplicate ${duplicate.name} to original`)
      }
    }
    
    // Now delete the duplicate categories
    const duplicateIds = duplicates.map(cat => cat.id)
    
    const { error: deleteError } = await supabase
      .from('service_categories')
      .delete()
      .in('id', duplicateIds)
    
    if (deleteError) {
      throw new Error(`Failed to delete duplicates: ${deleteError.message}`)
    }
    
    console.log(`✅ Deleted ${duplicates.length} duplicate categories`)
    
    // Also clean up any services that might be orphaned
    const { error: orphanError } = await supabase
      .from('services')
      .delete()
      .is('category_id', null)
    
    if (orphanError) {
      console.warn('⚠️ Warning: Could not clean up orphaned services:', orphanError.message)
    } else {
      console.log('✅ Cleaned up orphaned services')
    }
    
    console.log('🎉 Cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    process.exit(1)
  }
}

// Run the cleanup
cleanupDuplicates()
