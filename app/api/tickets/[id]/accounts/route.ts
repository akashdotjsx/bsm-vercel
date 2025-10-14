import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ticket exists and user has access
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get linked accounts (profiles) for this ticket - wrapped with cache
    // Note: This assumes we're using the requester_id and assignee_id as "linked accounts"
    // In a real implementation, you might have a separate ticket_accounts table
    const fetchAccounts = unstable_cache(
      async () => {
        return await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            display_name,
            email,
            avatar_url,
            phone,
            role,
            department,
            is_active,
            created_at
          `)
          .eq('organization_id', profile.organization_id)
          .in('id', [
            // Get requester and assignee as linked accounts
            // You might want to add a proper ticket_accounts junction table
          ])
      },
      [`ticket-accounts-${params.id}`],
      {
        revalidate: 60,
        tags: [CACHE_TAGS.tickets],
      }
    )
    
    const { data: linkedProfiles, error } = await fetchAccounts()

    if (error) {
      console.error('Error fetching linked accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch linked accounts' }, { status: 500 })
    }

    return NextResponse.json({ accounts: linkedProfiles || [] })
  } catch (error) {
    console.error('Unexpected error in accounts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ticket exists and user has access
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const body = await request.json()
    const { account_id } = body

    if (!account_id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Verify account exists and is in the same organization
    const { data: account } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, email')
      .eq('id', account_id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // In a real implementation, you would have a ticket_accounts junction table
    // For now, we'll just create a history entry
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: params.id,
        changed_by: user.id,
        field_name: 'account_linked',
        old_value: null,
        new_value: account.display_name,
        change_reason: `Linked account: ${account.display_name} (${account.email})`
      })

    // Invalidate cache
    revalidateTag(CACHE_TAGS.tickets)

    return NextResponse.json({
      success: true,
      account
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in accounts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
