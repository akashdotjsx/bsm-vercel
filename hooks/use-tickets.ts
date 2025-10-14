import { useState, useEffect, useCallback, useMemo } from 'react'
import { Ticket, TicketComment, TicketAttachment, ChecklistItem, CreateTicketData, UpdateTicketData } from '@/lib/types/tickets'
// NOTE: This hook uses legacy REST API calls. Consider migrating to GraphQL hooks
// import { ticketAPI } from '@/lib/api/tickets' // DEPRECATED - API file deleted, use REST endpoints directly or GraphQL

export function useTickets(params: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  assignee_id?: string
  search?: string
} = {}) {
  console.log('🏗️ useTickets hook initialized with params:', params)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  // Memoize the params to prevent unnecessary re-renders
  const stableParams = useMemo(() => ({
    page: params.page || 1,
    limit: params.limit || 50,
    status: params.status,
    priority: params.priority,
    type: params.type,
    assignee_id: params.assignee_id,
    search: params.search
  }), [params.page, params.limit, params.status, params.priority, params.type, params.assignee_id, params.search])

  const fetchTickets = useCallback(async () => {
    try {
      console.log('🔄 Starting fetchTickets, setting loading to true')
      setLoading(true)
      setError(null)
      console.log('🔄 Fetching tickets with params:', stableParams)
      
      // Direct REST API call
      const searchParams = new URLSearchParams()
      if (stableParams.page) searchParams.set('page', stableParams.page.toString())
      if (stableParams.limit) searchParams.set('limit', stableParams.limit.toString())
      if (stableParams.status) searchParams.set('status', stableParams.status)
      if (stableParams.priority) searchParams.set('priority', stableParams.priority)
      if (stableParams.type) searchParams.set('type', stableParams.type)
      if (stableParams.assignee_id) searchParams.set('assignee_id', stableParams.assignee_id)
      if (stableParams.search) searchParams.set('search', stableParams.search)
      
      const response = await fetch(`/api/tickets?${searchParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      
      console.log('📊 Tickets fetched successfully:', data)
      console.log('📊 Setting tickets to:', data.tickets?.length || 0, 'tickets')
      setTickets(data.tickets || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
      console.log('✅ Tickets state updated, about to set loading to false')
    } catch (err) {
      console.error('❌ Error fetching tickets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      console.log('🔄 Finally block: setting loading to false')
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchTickets')
    fetchTickets()
  }, [stableParams])

  const createTicket = useCallback(async (data: CreateTicketData) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ticket')
      }
      const result = await response.json()
      const newTicket = result.ticket
      setTickets(prev => [newTicket, ...prev])
      return newTicket
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
      throw err
    }
  }, [])

  const updateTicket = useCallback(async (id: string, data: UpdateTicketData) => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update ticket')
      }
      const result = await response.json()
      const updatedTicket = result.ticket
      setTickets(prev => prev.map(ticket => 
        ticket.id === id ? updatedTicket : ticket
      ))
      return updatedTicket
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket')
      throw err
    }
  }, [])

  const deleteTicket = useCallback(async (id: string) => {
    console.log('🔧 useTickets.deleteTicket called with id:', id)
    try {
      console.log('🔧 Calling DELETE API...')
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete ticket')
      }
      console.log('🔧 API call successful, updating local state...')
      setTickets(prev => {
        const filtered = prev.filter(ticket => ticket.id !== id)
        console.log('🔧 Filtered tickets:', filtered.length, 'from', prev.length)
        return filtered
      })
      console.log('🔧 Local state updated')
    } catch (err) {
      console.error('🔧 Error in deleteTicket:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete ticket')
      throw err
    }
  }, [])

  return {
    tickets,
    loading,
    error,
    pagination,
    refetch: fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket
  }
}

export function useTicket(id: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/tickets/${id}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')
      const result = await response.json()
      setTicket(result.ticket)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchTicket()
    }
  }, [fetchTicket])

  const updateTicket = useCallback(async (data: UpdateTicketData) => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update ticket')
      }
      const result = await response.json()
      const updatedTicket = result.ticket
      setTicket(updatedTicket)
      return updatedTicket
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket')
      throw err
    }
  }, [id])

  return {
    ticket,
    loading,
    error,
    fetchTicket,
    updateTicket
  }
}

export function useTicketComments(ticketId: string) {
  const [comments, setComments] = useState<TicketComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/tickets/${ticketId}/comments`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      const result = await response.json()
      setComments(result.comments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    if (ticketId) {
      fetchComments()
    }
  }, [fetchComments])

  const addComment = useCallback(async (content: string, isInternal = false) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, is_internal: isInternal })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add comment')
      }
      const result = await response.json()
      const newComment = result.comment
      setComments(prev => [...prev, newComment])
      return newComment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      throw err
    }
  }, [ticketId])

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment
  }
}

export function useTicketAttachments(ticketId: string) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ticketAPI.getAttachments(ticketId)
      setAttachments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attachments')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    if (ticketId) {
      fetchAttachments()
    }
  }, [fetchAttachments])

  const uploadAttachment = useCallback(async (file: File, isPublic = false) => {
    try {
      const newAttachment = await ticketAPI.uploadAttachment(ticketId, file, isPublic)
      setAttachments(prev => [...prev, newAttachment])
      return newAttachment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment')
      throw err
    }
  }, [ticketId])

  const downloadAttachment = useCallback(async (attachmentId: string) => {
    try {
      return await ticketAPI.downloadAttachment(ticketId, attachmentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download attachment')
      throw err
    }
  }, [ticketId])

  return {
    attachments,
    loading,
    error,
    fetchAttachments,
    uploadAttachment,
    downloadAttachment
  }
}

export function useTicketChecklist(ticketId: string) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChecklist = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ticketAPI.getChecklist(ticketId)
      setChecklist(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklist')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    if (ticketId) {
      fetchChecklist()
    }
  }, [fetchChecklist])

  const addChecklistItem = useCallback(async (text: string, assigneeId?: string, dueDate?: string) => {
    try {
      const newItem = await ticketAPI.addChecklistItem(ticketId, text, assigneeId, dueDate)
      setChecklist(prev => [...prev, newItem])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add checklist item')
      throw err
    }
  }, [ticketId])

  const updateChecklistItem = useCallback(async (itemId: string, updates: {
    text?: string
    completed?: boolean
    assignee_id?: string
    due_date?: string
  }) => {
    try {
      const updatedItem = await ticketAPI.updateChecklistItem(ticketId, itemId, updates)
      setChecklist(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ))
      return updatedItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update checklist item')
      throw err
    }
  }, [ticketId])

  const deleteChecklistItem = useCallback(async (itemId: string) => {
    try {
      await ticketAPI.deleteChecklistItem(ticketId, itemId)
      setChecklist(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete checklist item')
      throw err
    }
  }, [ticketId])

  return {
    checklist,
    loading,
    error,
    fetchChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem
  }
}

export function useCreateTicket() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTicket = useCallback(async (data: CreateTicketData) => {
    try {
      setLoading(true)
      setError(null)
      const newTicket = await ticketAPI.createTicket(data)
      return newTicket
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createTicket,
    loading,
    error
  }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchProfiles = useCallback(async (query: string, department?: string, role?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ticketAPI.searchProfiles(query, department, role)
      setProfiles(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search profiles')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    profiles,
    loading,
    error,
    searchProfiles
  }
}
