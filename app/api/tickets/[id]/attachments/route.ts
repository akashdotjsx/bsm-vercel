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
    const supabase = await createClient()
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

    // Get attachments - wrapped with cache
    const fetchAttachments = unstable_cache(
      async () => {
        return await supabase
          .from('ticket_attachments')
          .select(`
            id,
            filename,
            file_size,
            mime_type,
            storage_path,
            is_public,
            created_at,
            uploaded_by:profiles!ticket_attachments_uploaded_by_fkey(id, first_name, last_name, display_name, email)
          `)
          .eq('ticket_id', params.id)
          .order('created_at', { ascending: false })
      },
      [`ticket-attachments-${params.id}`],
      {
        revalidate: 60,
        tags: [CACHE_TAGS.tickets],
      }
    )
    
    const { data: attachments, error } = await fetchAttachments()

    if (error) {
      console.error('Error fetching attachments:', error)
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    return NextResponse.json({ attachments: attachments || [] })
  } catch (error) {
    console.error('Unexpected error in attachments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const isPublic = formData.get('is_public') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed. Allowed types: PDF, Excel, Word, PowerPoint, PNG, JPG' 
      }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 10MB' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `tickets/${params.id}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Create attachment record
    const { data: attachment, error } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: params.id,
        uploaded_by: user.id,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        is_public: isPublic
      })
      .select(`
        id,
        filename,
        file_size,
        mime_type,
        storage_path,
        is_public,
        created_at,
        uploaded_by:profiles!ticket_attachments_uploaded_by_fkey(id, first_name, last_name, display_name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating attachment record:', error)
      return NextResponse.json({ error: 'Failed to create attachment record' }, { status: 500 })
    }

    // Create history entry
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: params.id,
        changed_by: user.id,
        field_name: 'attachment',
        old_value: null,
        new_value: 'File uploaded',
        change_reason: `Uploaded file: ${file.name}`
      })

    // Invalidate cache
    revalidateTag(CACHE_TAGS.tickets)

    return NextResponse.json({
      success: true,
      attachment
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in attachments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
