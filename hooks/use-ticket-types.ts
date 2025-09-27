"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TicketType {
  value: string
  label: string
  color: string
}

const DEFAULT_TICKET_TYPES: TicketType[] = [
  { value: 'request', label: 'Request', color: 'border-t-blue-400' },
  { value: 'incident', label: 'Incident', color: 'border-t-red-400' },
  { value: 'problem', label: 'Problem', color: 'border-t-orange-400' },
  { value: 'change', label: 'Change', color: 'border-t-green-400' },
  { value: 'task', label: 'Task', color: 'border-t-purple-400' },
]

export function useTicketTypes() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(DEFAULT_TICKET_TYPES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicketTypes = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const supabase = createClient()
        
        // Get unique ticket types from the database
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('type')
          .not('type', 'is', null)
          .limit(1000) // Get a reasonable sample

        if (ticketsError) {
          console.error('Error fetching ticket types:', ticketsError)
          setError('Failed to fetch ticket types')
          return
        }

        // Extract unique types
        const uniqueTypes = [...new Set(tickets.map(ticket => ticket.type))]
        
        // Map database types to our format
        const mappedTypes = uniqueTypes.map(type => {
          const existingType = DEFAULT_TICKET_TYPES.find(t => t.value === type)
          if (existingType) {
            return existingType
          }
          
          // For new types not in our default list, create a new entry
          return {
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
            color: getColorForType(type)
          }
        })

        // Sort types to maintain consistency
        mappedTypes.sort((a, b) => a.label.localeCompare(b.label))
        
        setTicketTypes(mappedTypes)
      } catch (err) {
        console.error('Error in fetchTicketTypes:', err)
        setError('Failed to fetch ticket types')
      } finally {
        setLoading(false)
      }
    }

    fetchTicketTypes()
  }, [])

  return { ticketTypes, loading, error }
}

function getColorForType(type: string): string {
  // Assign colors to new types based on their name
  const colorMap: { [key: string]: string } = {
    'request': 'border-t-blue-400',
    'incident': 'border-t-red-400',
    'problem': 'border-t-orange-400',
    'change': 'border-t-green-400',
    'task': 'border-t-purple-400',
    'bug': 'border-t-red-500',
    'feature': 'border-t-green-500',
    'enhancement': 'border-t-blue-500',
    'maintenance': 'border-t-yellow-500',
    'support': 'border-t-indigo-400',
    'question': 'border-t-gray-400',
    'feedback': 'border-t-pink-400',
  }

  return colorMap[type.toLowerCase()] || 'border-t-gray-400'
}
