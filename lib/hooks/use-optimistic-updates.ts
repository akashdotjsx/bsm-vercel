"use client"

import { useCallback } from "react"
import { useStore } from "@/lib/store"
import { useApp } from "@/lib/contexts/app-context"

export function useOptimisticUpdates() {
  const { addTicket, updateTicket, deleteTicket, addAsset, updateAsset, deleteAsset, addNotification } = useStore()
  const { handleError } = useApp()

  const optimisticTicketUpdate = useCallback(
    async (id: string, updates: any, apiCall: () => Promise<any>) => {
      // Store original state for rollback
      const originalTicket = useStore.getState().tickets.find((t) => t.id === id)

      try {
        // Apply optimistic update
        updateTicket(id, updates)

        // Make API call
        await apiCall()

        addNotification({
          title: "Ticket Updated",
          message: "Ticket has been successfully updated",
          type: "success",
          read: false,
        })
      } catch (error) {
        // Rollback on error
        if (originalTicket) {
          updateTicket(id, originalTicket)
        }
        handleError(error as Error, "optimisticTicketUpdate")
        throw error
      }
    },
    [updateTicket, addNotification, handleError],
  )

  const optimisticTicketCreate = useCallback(
    async (ticket: any, apiCall: () => Promise<any>) => {
      try {
        // Add optimistic ticket
        addTicket(ticket)

        // Make API call
        const result = await apiCall()

        // Update with server response
        updateTicket(ticket.id, result)

        addNotification({
          title: "Ticket Created",
          message: "New ticket has been successfully created",
          type: "success",
          read: false,
        })

        return result
      } catch (error) {
        // Remove optimistic ticket on error
        deleteTicket(ticket.id)
        handleError(error as Error, "optimisticTicketCreate")
        throw error
      }
    },
    [addTicket, updateTicket, deleteTicket, addNotification, handleError],
  )

  const optimisticAssetUpdate = useCallback(
    async (id: string, updates: any, apiCall: () => Promise<any>) => {
      const originalAsset = useStore.getState().assets.find((a) => a.id === id)

      try {
        updateAsset(id, updates)
        await apiCall()

        addNotification({
          title: "Asset Updated",
          message: "Asset has been successfully updated",
          type: "success",
          read: false,
        })
      } catch (error) {
        if (originalAsset) {
          updateAsset(id, originalAsset)
        }
        handleError(error as Error, "optimisticAssetUpdate")
        throw error
      }
    },
    [updateAsset, addNotification, handleError],
  )

  return {
    optimisticTicketUpdate,
    optimisticTicketCreate,
    optimisticAssetUpdate,
  }
}
