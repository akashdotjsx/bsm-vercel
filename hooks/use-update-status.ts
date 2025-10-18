"use client"

import { useState } from 'react'
import { useGraphQLMutation } from './use-graphql'

interface UpdateStatusParams {
  userId: string
  status: string
  statusColor: string
}

export function useUpdateStatus() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateStatus = async ({ userId, status, statusColor }: UpdateStatusParams) => {
    setIsUpdating(true)
    setError(null)

    const mutation = `
      mutation UpdateUserStatus($userId: UUID!, $status: String!, $statusColor: String!) {
        updateprofilesCollection(
          filter: { id: { eq: $userId } }
          set: { status: $status, status_color: $statusColor }
        ) {
          records {
            id
            status
            status_color
          }
        }
      }
    `

    try {
      const result = await useGraphQLMutation(mutation, {
        userId,
        status,
        statusColor,
      })

      setIsUpdating(false)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update status')
      setError(error)
      setIsUpdating(false)
      throw error
    }
  }

  return {
    updateStatus,
    isUpdating,
    error,
  }
}
