import { useState, useEffect } from 'react'
import { createGraphQLClient } from '@/lib/graphql/client'
import { gql } from 'graphql-request'

interface FilterOption {
  id: string
  label: string
  color: string
}

interface FilterOptions {
  status: FilterOption[]
  type: FilterOption[]
  priority: FilterOption[]
  assignees: FilterOption[]
  reporters: FilterOption[]
}

// Color mapping for different filter types
const STATUS_COLORS: Record<string, string> = {
  new: '#6EBAFF',
  open: '#6EBAFF', 
  in_progress: '#FFC856',
  pending: '#FF2CB9',
  resolved: '#83CDAA',
  closed: '#64C37D',
  on_hold: '#FFC856'
}

const TYPE_COLORS: Record<string, string> = {
  incident: '#6EBAFF',
  request: '#FF2CB9',
  problem: '#FFC856',
  change: '#83CDAA',
  task: '#64C37D'
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64C37D',
  medium: '#FFC856',
  high: '#FF2CB9',
  critical: '#EB4335',
  urgent: '#B71C1C'
}

const USER_COLORS = [
  '#6EBAFF',
  '#FF2CB9', 
  '#FFC856',
  '#83CDAA',
  '#64C37D',
  '#EB4335',
  '#B71C1C',
  '#9C27B0',
  '#FF9800',
  '#4CAF50'
]

// All available options from the system (not just from existing tickets)
const ALL_STATUS_OPTIONS = [
  { id: "new", label: "New", color: "#6EBAFF" },
  { id: "open", label: "Open", color: "#6EBAFF" },
  { id: "in_progress", label: "In Progress", color: "#FFC856" },
  { id: "pending", label: "Pending", color: "#FF2CB9" },
  { id: "resolved", label: "Resolved", color: "#83CDAA" },
  { id: "closed", label: "Closed", color: "#64C37D" },
  { id: "on_hold", label: "On Hold", color: "#FFC856" }
]

const ALL_TYPE_OPTIONS = [
  { id: "request", label: "Request", color: "#6EBAFF" },
  { id: "incident", label: "Incident", color: "#FF2CB9" },
  { id: "problem", label: "Problem", color: "#FFC856" },
  { id: "change", label: "Change", color: "#83CDAA" },
  { id: "task", label: "Task", color: "#64C37D" }
]

const ALL_PRIORITY_OPTIONS = [
  { id: "low", label: "Low", color: "#64C37D" },
  { id: "medium", label: "Medium", color: "#FFC856" },
  { id: "high", label: "High", color: "#FF2CB9" },
  { id: "critical", label: "Critical", color: "#EB4335" },
  { id: "urgent", label: "Urgent", color: "#B71C1C" }
]

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>({
    status: ALL_STATUS_OPTIONS,
    type: ALL_TYPE_OPTIONS,
    priority: ALL_PRIORITY_OPTIONS,
    assignees: [],
    reporters: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserOptions = async () => {
      try {
        setLoading(true)
        setError(null)

        const client = await createGraphQLClient()

        // Fetch all users from the organization
        const profilesQuery = gql`
          query GetAllProfiles {
            profilesCollection(first: 1000) {
              edges {
                node {
                  id
                  first_name
                  last_name
                  display_name
                  email
                  avatar_url
                }
              }
            }
          }
        `

        const profilesData: any = await client.request(profilesQuery)
        const users = profilesData.profilesCollection.edges.map((e: any) => e.node)

        // Create user options with colors
        const userOptions: FilterOption[] = users.map((user: any, index: number) => ({
          id: user.id,
          label: user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email,
          color: USER_COLORS[index % USER_COLORS.length]
        }))

        console.log('🔍 Filter Options Loaded:', {
          statusCount: ALL_STATUS_OPTIONS.length,
          typeCount: ALL_TYPE_OPTIONS.length,
          priorityCount: ALL_PRIORITY_OPTIONS.length,
          userCount: userOptions.length,
          users: userOptions.map(u => ({ id: u.id, label: u.label })),
          sampleUser: userOptions[0] ? { id: userOptions[0].id, label: userOptions[0].label } : null
        })

        setOptions(prev => ({
          ...prev,
          assignees: userOptions,
          reporters: userOptions // Same users can be both assignees and reporters
        }))

      } catch (err) {
        console.error('Error fetching user options:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user options')
      } finally {
        setLoading(false)
      }
    }

    fetchUserOptions()
  }, [])

  return { options, loading, error }
}
