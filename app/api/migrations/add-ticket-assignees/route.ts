import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const migrationSQL = `
      -- Create ticket_assignees junction table
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_ticket_assignees_ticket ON ticket_assignees(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_assignees_user ON ticket_assignees(user_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_assignees_active ON ticket_assignees(is_active) WHERE is_active = true;

      -- Enable RLS
      ALTER TABLE ticket_assignees ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view ticket assignees" ON ticket_assignees;
      DROP POLICY IF EXISTS "Users can assign to tickets" ON ticket_assignees;
      DROP POLICY IF EXISTS "Users can remove assignees" ON ticket_assignees;

      -- RLS Policies
      CREATE POLICY "Users can view ticket assignees" ON ticket_assignees
        FOR SELECT
        USING (true);

      CREATE POLICY "Users can assign to tickets" ON ticket_assignees
        FOR INSERT
        WITH CHECK (true);

      CREATE POLICY "Users can remove assignees" ON ticket_assignees
        FOR DELETE
        USING (true);

      -- Trigger function
      CREATE OR REPLACE FUNCTION update_ticket_assignees_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Drop trigger if exists
      DROP TRIGGER IF EXISTS ticket_assignees_updated_at ON ticket_assignees;

      -- Create trigger
      CREATE TRIGGER ticket_assignees_updated_at
        BEFORE UPDATE ON ticket_assignees
        FOR EACH ROW
        EXECUTE FUNCTION update_ticket_assignees_updated_at();

      -- Migrate existing data
      INSERT INTO ticket_assignees (ticket_id, user_id, role, assigned_at, assigned_by)
      SELECT 
        id as ticket_id,
        assignee_id as user_id,
        'primary' as role,
        created_at as assigned_at,
        requester_id as assigned_by
      FROM tickets
      WHERE assignee_id IS NOT NULL
      ON CONFLICT (ticket_id, user_id) DO NOTHING;
    `

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'ticket_assignees table created successfully' 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
