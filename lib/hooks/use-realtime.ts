"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useApp } from "@/lib/contexts/app-context"

export function useRealtime() {
  const { setTickets, setAssets, addNotification, user } = useStore()
  const { handleError } = useApp()

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    // Subscribe to ticket changes
    const ticketsSubscription = supabase
      .channel("tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, (payload) => {
        console.log("[v0] Ticket change received:", payload)

        if (payload.eventType === "INSERT") {
          // Refresh tickets to get the new one
          supabase
            .from("tickets")
            .select("*")
            .then(({ data, error }) => {
              if (error) {
                handleError(error, "realtime-tickets-insert")
              } else {
                setTickets(data || [])
                addNotification({
                  title: "New Ticket",
                  message: `A new ticket "${payload.new.title}" has been created`,
                  type: "info",
                  read: false,
                })
              }
            })
        } else if (payload.eventType === "UPDATE") {
          // Refresh tickets to get updated data
          supabase
            .from("tickets")
            .select("*")
            .then(({ data, error }) => {
              if (error) {
                handleError(error, "realtime-tickets-update")
              } else {
                setTickets(data || [])
              }
            })
        } else if (payload.eventType === "DELETE") {
          // Refresh tickets
          supabase
            .from("tickets")
            .select("*")
            .then(({ data, error }) => {
              if (error) {
                handleError(error, "realtime-tickets-delete")
              } else {
                setTickets(data || [])
              }
            })
        }
      })
      .subscribe()

    // Subscribe to asset changes
    const assetsSubscription = supabase
      .channel("assets")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, (payload) => {
        console.log("[v0] Asset change received:", payload)

        supabase
          .from("assets")
          .select("*")
          .then(({ data, error }) => {
            if (error) {
              handleError(error, "realtime-assets")
            } else {
              setAssets(data || [])
            }
          })
      })
      .subscribe()

    return () => {
      ticketsSubscription.unsubscribe()
      assetsSubscription.unsubscribe()
    }
  }, [user, setTickets, setAssets, addNotification, handleError])
}
