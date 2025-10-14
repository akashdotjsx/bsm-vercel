import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Use environment variables if available, otherwise use MCP-provided values
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uzbozldsdzsfytsteqlb.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Ym96bGRzZHpzZnl0c3RlcWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc1MzIsImV4cCI6MjA3Mzc4MzUzMn0.01VQh8PRqphCIbUCB2gLJjUZPX-AtzAF5ZRjJWyy24g"
  
  // console.log('Creating Supabase client with URL:', supabaseUrl)
  // console.log('Using anon key:', supabaseAnonKey ? 'Yes' : 'No')
  
  return createBrowserClient(
    supabaseUrl, 
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  )
}
