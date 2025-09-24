"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useApp } from "@/lib/contexts/app-context"

export function useOptimizedRealtime() {
  const {
    tickets,
    setTickets,
    updateTicket,
    addTicket,
    deleteTicket,
    assets,
    setAssets,
    updateAsset,
    addAsset,
    deleteAsset,
    addNotification,
    user,
  } = useStore()
  const { handleError } = useApp()

  const handleTicketChange = useCallback(
    (payload: any) => {
      console.log("[v0] Optimized ticket change received:", payload.eventType, payload.new?.id)

      try {
        switch (payload.eventType) {
          case "INSERT":
            if (payload.new) {
              addTicket(payload.new)
              addNotification({
                title: "New Ticket",
                message: `A new ticket "${payload.new.title}" has been created`,
                type: "info",
                read: false,
              })
            }
            break

          case "UPDATE":
            if (payload.new) {
              updateTicket(payload.new.id, payload.new)

              // Notify about status changes
              if (payload.old?.status !== payload.new.status) {
                addNotification({
                  title: "Ticket Updated",
                  message: `Ticket "${payload.new.title}" status changed to ${payload.new.status}`,
                  type: "info",
                  read: false,
                })
              }
            }
            break

          case "DELETE":
            if (payload.old) {
              deleteTicket(payload.old.id)
              addNotification({
                title: "Ticket Deleted",
                message: `Ticket "${payload.old.title}" has been deleted`,
                type: "warning",
                read: false,
              })
            }
            break
        }
      } catch (error) {
        handleError(error as Error, "realtime-ticket-change")
      }
    },
    [addTicket, updateTicket, deleteTicket, addNotification, handleError],
  )

  const handleAssetChange = useCallback(
    (payload: any) => {
      console.log("[v0] Optimized asset change received:", payload.eventType, payload.new?.id)

      try {
        switch (payload.eventType) {
          case "INSERT":
            if (payload.new) {
              addAsset(payload.new)
            }
            break

          case "UPDATE":
            if (payload.new) {
              updateAsset(payload.new.id, payload.new)
            }
            break

          case "DELETE":
            if (payload.old) {
              deleteAsset(payload.old.id)
            }
            break
        }
      } catch (error) {
        handleError(error as Error, "realtime-asset-change")
      }
    },
    [addAsset, updateAsset, deleteAsset, handleError],
  )

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    const ticketsSubscription = supabase
      .channel("optimized_tickets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          // Only listen to changes for tickets user is involved with
          filter: `assignee_id=eq.${user.id},or(reporter_id=eq.${user.id})`,
        },
        handleTicketChange,
      )
      .subscribe()

    const assetsSubscription = supabase
      .channel("optimized_assets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
          filter: `owner_id=eq.${user.id}`,
        },
        handleAssetChange,
      )
      .subscribe()

    const notificationsSubscription = supabase
      .channel("user_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            addNotification({
              id: payload.new.id,
              title: payload.new.title,
              message: payload.new.message,
              type: payload.new.type,
              read: payload.new.read,
            })
          }
        },
      )
      .subscribe()

    return () => {
      ticketsSubscription.unsubscribe()
      assetsSubscription.unsubscribe()
      notificationsSubscription.unsubscribe()
    }
  }, [user, handleTicketChange, handleAssetChange, addNotification])

  const forceSync = useCallback(async () => {
    if (!user) return

    try {
      const supabase = createClient()

      // Fetch only updated data since last sync
      const lastSync = useStore.getState().cache.timestamps.tickets
      const syncTime = new Date(lastSync).toISOString()

      const { data: updatedTickets } = await supabase
        .from("tickets")
        .select("*")
        .or(`assignee_id.eq.${user.id},reporter_id.eq.${user.id}`)
        .gte("updated_at", syncTime)

      const { data: updatedAssets } = await supabase
        .from("assets")
        .select("*")
        .eq("owner_id", user.id)
        .gte("updated_at", syncTime)

      // Merge updates into existing state
      if (updatedTickets?.length) {
        updatedTickets.forEach((ticket) => {
          const existingIndex = tickets.findIndex((t) => t.id === ticket.id)
          if (existingIndex >= 0) {
            updateTicket(ticket.id, ticket)
          } else {
            addTicket(ticket)
          }
        })
      }

      if (updatedAssets?.length) {
        updatedAssets.forEach((asset) => {
          const existingIndex = assets.findIndex((a) => a.id === asset.id)
          if (existingIndex >= 0) {
            updateAsset(asset.id, asset)
          } else {
            addAsset(asset)
          }
        })
      }
    } catch (error) {
      handleError(error as Error, "force-sync")
    }
  }, [user, tickets, assets, updateTicket, addTicket, updateAsset, addAsset, handleError])

  return { forceSync }
}
