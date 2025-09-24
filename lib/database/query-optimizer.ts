"use client"

import { apiClient } from "@/lib/api/client"

export class QueryOptimizer {
  private static instance: QueryOptimizer

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  async getTicketsOptimized(
    options: {
      status?: string[]
      priority?: string[]
      assigneeId?: string
      limit?: number
      offset?: number
      includeDetails?: boolean
    } = {},
  ) {
    const { status, priority, assigneeId, limit = 50, offset = 0, includeDetails = false } = options

    // Select only necessary fields for list view
    const selectFields = includeDetails
      ? "*"
      : "id, title, status, priority, assignee_id, created_at, updated_at, service_id"

    const filters: any = {}
    if (status?.length) filters.status = { in: status }
    if (priority?.length) filters.priority = { in: priority }
    if (assigneeId) filters.assignee_id = assigneeId

    return apiClient.get("tickets", {
      select: selectFields,
      filters,
      orderBy: { column: "created_at", ascending: false },
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      tags: ["tickets", "tickets_list"],
    })
  }

  async batchUpdateTickets(updates: Array<{ id: string; updates: any }>) {
    // Group updates by type for efficiency
    const statusUpdates = updates.filter((u) => u.updates.status)
    const priorityUpdates = updates.filter((u) => u.updates.priority)
    const assigneeUpdates = updates.filter((u) => u.updates.assignee_id)

    const promises = []

    // Use RPC for bulk status updates
    if (statusUpdates.length > 0) {
      promises.push(
        apiClient.rpc("bulk_update_ticket_status", {
          ticket_ids: statusUpdates.map((u) => u.id),
          new_status: statusUpdates[0].updates.status,
        }),
      )
    }

    // Use RPC for bulk priority updates
    if (priorityUpdates.length > 0) {
      promises.push(
        apiClient.rpc("bulk_update_ticket_priority", {
          ticket_ids: priorityUpdates.map((u) => u.id),
          new_priority: priorityUpdates[0].updates.priority,
        }),
      )
    }

    // Use RPC for bulk assignee updates
    if (assigneeUpdates.length > 0) {
      promises.push(
        apiClient.rpc("bulk_update_ticket_assignee", {
          ticket_ids: assigneeUpdates.map((u) => u.id),
          new_assignee_id: assigneeUpdates[0].updates.assignee_id,
        }),
      )
    }

    await Promise.all(promises)
  }

  async getAssetsWithDependencies(assetIds: string[]) {
    // Use RPC for complex dependency queries
    return apiClient.rpc(
      "get_assets_with_dependencies",
      {
        asset_ids: assetIds,
      },
      {
        cache: true,
        cacheTTL: 10 * 60 * 1000, // 10 minutes
        tags: ["assets", "asset_dependencies"],
      },
    )
  }

  async searchWithRanking(
    searchTerm: string,
    tables: string[] = ["tickets", "assets", "knowledge_articles"],
    limit = 20,
    offset = 0,
  ) {
    const searchPromises = tables.map((table) => {
      switch (table) {
        case "tickets":
          return apiClient.rpc("search_tickets", {
            search_term: searchTerm,
            limit_count: limit,
            offset_count: offset,
          })
        case "assets":
          return apiClient.rpc("search_assets", {
            search_term: searchTerm,
            limit_count: limit,
            offset_count: offset,
          })
        case "knowledge_articles":
          return apiClient.rpc("search_knowledge_articles", {
            search_term: searchTerm,
            limit_count: limit,
            offset_count: offset,
          })
        default:
          return Promise.resolve([])
      }
    })

    const results = await Promise.all(searchPromises)

    // Combine and sort by relevance
    const combined = results.flat().sort((a, b) => (b.rank || 0) - (a.rank || 0))

    return combined.slice(0, limit)
  }

  async getDashboardData(userId: string) {
    // Use parallel queries with caching
    const [ticketStats, recentTickets, assetStats, notifications, slaMetrics] = await Promise.all([
      apiClient.rpc(
        "get_ticket_statistics",
        { user_id: userId },
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000,
          tags: ["dashboard", "ticket_stats"],
        },
      ),
      this.getTicketsOptimized({
        assigneeId: userId,
        limit: 10,
        includeDetails: false,
      }),
      apiClient.rpc(
        "get_asset_statistics",
        { user_id: userId },
        {
          cache: true,
          cacheTTL: 10 * 60 * 1000,
          tags: ["dashboard", "asset_stats"],
        },
      ),
      apiClient.get("notifications", {
        select: "id, title, message, type, read, created_at",
        filters: { user_id: userId, read: false },
        orderBy: { column: "created_at", ascending: false },
        limit: 5,
        cache: true,
        cacheTTL: 1 * 60 * 1000,
        tags: ["notifications"],
      }),
      apiClient.rpc(
        "get_sla_metrics",
        { user_id: userId },
        {
          cache: true,
          cacheTTL: 15 * 60 * 1000,
          tags: ["dashboard", "sla_metrics"],
        },
      ),
    ])

    return {
      ticketStats,
      recentTickets,
      assetStats,
      notifications,
      slaMetrics,
    }
  }

  async preloadCriticalData(userId: string) {
    const preloadPromises = [
      // Preload user's tickets
      this.getTicketsOptimized({ assigneeId: userId, limit: 100 }),
      // Preload user's assets
      apiClient.get("assets", {
        select: "id, name, type, status, location",
        filters: { owner_id: userId },
        cache: true,
        cacheTTL: 15 * 60 * 1000,
        tags: ["assets", "user_assets"],
      }),
      // Preload service catalog
      apiClient.get("services", {
        select: "id, name, category, status",
        filters: { status: "active" },
        cache: true,
        cacheTTL: 30 * 60 * 1000,
        tags: ["services", "service_catalog"],
      }),
      // Preload knowledge base categories
      apiClient.rpc(
        "get_knowledge_categories",
        {},
        {
          cache: true,
          cacheTTL: 60 * 60 * 1000, // 1 hour
          tags: ["knowledge_base", "categories"],
        },
      ),
    ]

    await Promise.allSettled(preloadPromises)
  }
}

export const queryOptimizer = QueryOptimizer.getInstance()
