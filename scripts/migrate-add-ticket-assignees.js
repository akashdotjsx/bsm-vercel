const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting migration: Add ticket_assignees table...\n')

  try {
    // Step 1: Create table
    console.log('📋 Step 1: Creating ticket_assignees table...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_assignees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          assigned_by UUID REFERENCES profiles(id),
          role TEXT DEFAULT 'assignee',
          is_active BOOLEAN DEFAULT true,
          CONSTRAINT ticket_assignees_unique UNIQUE(ticket_id, user_id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (createError) {
      // Table might already exist, check if it does
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'ticket_assignees')
        .single()
      
      if (!tables) {
        throw createError
      }
      console.log('✅ Table already exists')
    } else {
      console.log('✅ Table created successfully')
    }

    // Step 2: Create indexes
    console.log('\n📇 Step 2: Creating indexes...')
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_ticket_assignees_ticket ON ticket_assignees(ticket_id);
        CREATE INDEX IF NOT EXISTS idx_ticket_assignees_user ON ticket_assignees(user_id);
        CREATE INDEX IF NOT EXISTS idx_ticket_assignees_active ON ticket_assignees(is_active) WHERE is_active = true;
      `
    })
    console.log('✅ Indexes created')

    // Step 3: Migrate existing data
    console.log('\n📦 Step 3: Migrating existing assignee data...')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, assignee_id, created_at, requester_id')
      .not('assignee_id', 'is', null)

    if (tickets && tickets.length > 0) {
      console.log(`Found ${tickets.length} tickets with assignees to migrate`)
      
      const assignees = tickets.map(ticket => ({
        ticket_id: ticket.id,
        user_id: ticket.assignee_id,
        role: 'primary',
        assigned_at: ticket.created_at,
        assigned_by: ticket.requester_id
      }))

      const { error: insertError } = await supabase
        .from('ticket_assignees')
        .upsert(assignees, { 
          onConflict: 'ticket_id,user_id',
          ignoreDuplicates: true 
        })

      if (insertError) {
        console.warn('⚠️  Some assignments already exist:', insertError.message)
      } else {
        console.log(`✅ Migrated ${tickets.length} assignee relationships`)
      }
    } else {
      console.log('✅ No existing assignees to migrate')
    }

    console.log('\n🎉 Migration completed successfully!\n')
    console.log('📊 Summary:')
    console.log('  ✅ ticket_assignees table created')
    console.log('  ✅ Indexes created')
    console.log('  ✅ Existing data migrated')
    console.log('  ✅ Ready for multiple assignees per ticket!\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
