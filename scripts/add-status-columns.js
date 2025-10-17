#!/usr/bin/env node

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addStatusColumns() {
  console.log('🚀 Adding status columns to profiles table...')

  try {
    // Add status and status_color columns
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Online',
        ADD COLUMN IF NOT EXISTS status_color VARCHAR DEFAULT '#16a34a';
      `
    })

    if (error) {
      console.error('❌ Error adding columns:', error)
      process.exit(1)
    }

    console.log('✅ Status columns added successfully!')
    
    // Verify the columns exist
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, status, status_color')
      .limit(1)

    if (fetchError) {
      console.error('❌ Error verifying columns:', fetchError)
    } else {
      console.log('✅ Columns verified:', profiles)
    }

  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

addStatusColumns()
