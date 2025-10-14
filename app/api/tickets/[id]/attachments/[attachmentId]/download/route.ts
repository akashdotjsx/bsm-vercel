import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
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

    // Get attachment details
    const { data: attachment, error } = await supabase
      .from('ticket_attachments')
      .select(`
        id,
        filename,
        file_size,
        mime_type,
        storage_path,
        is_public,
        ticket:tickets!ticket_attachments_ticket_id_fkey(id, organization_id)
      `)
      .eq('id', params.attachmentId)
      .eq('ticket_id', params.id)
      .single()

    if (error || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Verify user has access to the ticket
    if (attachment.ticket.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ticket-attachments')
      .download(attachment.storage_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Convert blob to buffer
    const buffer = await fileData.arrayBuffer()

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mime_type,
        'Content-Disposition': `attachment; filename="${attachment.filename}"`,
        'Content-Length': attachment.file_size.toString(),
      },
    })
  } catch (error) {
    console.error('Unexpected error in file download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
