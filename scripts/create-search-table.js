const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createSearchSuggestionsTable() {
  console.log('🔨 Creating search_suggestions table...')
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.search_suggestions (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL,
        user_id uuid NOT NULL,
        query text NOT NULL,
        search_type character varying DEFAULT 'all',
        result_count integer DEFAULT 0,
        clicked_result_id uuid,
        clicked_result_type character varying,
        ip_address inet,
        user_agent text,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT search_suggestions_pkey PRIMARY KEY (id),
        CONSTRAINT search_suggestions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
        CONSTRAINT search_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
        CONSTRAINT valid_search_type CHECK (search_type IN ('all', 'tickets', 'users', 'knowledge', 'services', 'assets')),
        CONSTRAINT valid_clicked_result_type CHECK (clicked_result_type IN ('ticket', 'user', 'knowledge', 'service', 'asset'))
      );
      
      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_search_suggestions_org_query ON public.search_suggestions(organization_id, query);
      CREATE INDEX IF NOT EXISTS idx_search_suggestions_user_recent ON public.search_suggestions(user_id, created_at DESC);
    `
  })
  
  if (error) {
    console.error('❌ Error creating table:', error)
    process.exit(1)
  }
  
  console.log('✅ search_suggestions table created successfully!')
}

createSearchSuggestionsTable()