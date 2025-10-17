"use client"

import { useQuery } from "@tanstack/react-query"
import { createGraphQLClient } from "@/lib/graphql/client"
import { gql } from "graphql-request"
import { myTicketKeys } from "./use-my-tickets-graphql-query"

/**
 * Get My Tickets analytics and insights
 */
async function fetchMyTicketsAnalyticsGraphQL(userId: string, dateRange?: { from: string; to: string }) {
  console.log("📈 My Tickets Analytics: Fetching analytics for user:", userId)

  const client = await createGraphQLClient()

  const baseFilter = { requester_id: { eq: userId } }
  const dateFilter = dateRange ? {
    and: [
      baseFilter,
      { created_at: { gte: dateRange.from } },
      { created_at: { lte: dateRange.to } }
    ]
  } : baseFilter

  const query = gql`
    query GetMyTicketsAnalytics($filter: ticketsFilter, $dateFilter: ticketsFilter) {
      # Overall statistics
      totalTickets: ticketsCollection(filter: $filter) {
        totalCount
      }
      
      # Status distribution
      statusDistribution: ticketsCollection(filter: $filter) {
        edges {
          node {
            status
            created_at
          }
        }
      }
      
      # Priority distribution
      priorityDistribution: ticketsCollection(filter: $filter) {
        edges {
          node {
            priority
            created_at
          }
        }
      }
      
      # Type distribution
      typeDistribution: ticketsCollection(filter: $filter) {
        edges {
          node {
            type
            created_at
          }
        }
      }
      
      # Resolution time analysis
      resolvedTickets: ticketsCollection(
        filter: { 
          and: [
            $filter
            { status: { in: ["resolved", "closed"] } }
          ]
        }
      ) {
        edges {
          node {
            created_at
            updated_at
            status
            priority
            type
          }
        }
      }
      
      # Monthly trends
      monthlyTrends: ticketsCollection(filter: $dateFilter) {
        edges {
          node {
            created_at
            status
            priority
            type
          }
        }
      }
      
      # Overdue analysis
      overdueTickets: ticketsCollection(
        filter: { 
          and: [
            $filter
            { due_date: { lt: "${new Date().toISOString()}" } }
            { status: { nin: ["resolved", "closed", "cancelled"] } }
          ]
        }
      ) {
        edges {
          node {
            due_date
            priority
            type
            created_at
          }
        }
      }
      
      # Recent activity
      recentActivity: ticketsCollection(
        filter: $filter
        orderBy: [{ updated_at: DescNullsLast }]
        first: 10
      ) {
        edges {
          node {
            id
            ticket_number
            title
            status
            priority
            updated_at
            created_at
          }
        }
      }
    }
  `

  const data: any = await client.request(query, { 
    filter: baseFilter, 
    dateFilter: dateFilter 
  })

  // Process status distribution
  const statusDistribution = data.statusDistribution.edges.reduce((acc: any, edge: any) => {
    const status = edge.node.status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Process priority distribution
  const priorityDistribution = data.priorityDistribution.edges.reduce((acc: any, edge: any) => {
    const priority = edge.node.priority
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {})

  // Process type distribution
  const typeDistribution = data.typeDistribution.edges.reduce((acc: any, edge: any) => {
    const type = edge.node.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  // Calculate resolution times
  const resolutionTimes = data.resolvedTickets.edges.map((edge: any) => {
    const created = new Date(edge.node.created_at)
    const updated = new Date(edge.node.updated_at)
    const resolutionTime = updated.getTime() - created.getTime()
    return {
      ticketId: edge.node.id,
      resolutionTimeHours: resolutionTime / (1000 * 60 * 60),
      priority: edge.node.priority,
      type: edge.node.type,
      status: edge.node.status
    }
  })

  // Calculate average resolution time by priority
  const avgResolutionByPriority = resolutionTimes.reduce((acc: any, item: any) => {
    if (!acc[item.priority]) {
      acc[item.priority] = { total: 0, count: 0 }
    }
    acc[item.priority].total += item.resolutionTimeHours
    acc[item.priority].count += 1
    return acc
  }, {})

  Object.keys(avgResolutionByPriority).forEach(priority => {
    avgResolutionByPriority[priority].average = 
      avgResolutionByPriority[priority].total / avgResolutionByPriority[priority].count
  })

  // Process monthly trends
  const monthlyTrends = data.monthlyTrends.edges.reduce((acc: any, edge: any) => {
    const date = new Date(edge.node.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        total: 0,
        byStatus: {},
        byPriority: {},
        byType: {}
      }
    }
    
    acc[monthKey].total += 1
    
    const status = edge.node.status
    acc[monthKey].byStatus[status] = (acc[monthKey].byStatus[status] || 0) + 1
    
    const priority = edge.node.priority
    acc[monthKey].byPriority[priority] = (acc[monthKey].byPriority[priority] || 0) + 1
    
    const type = edge.node.type
    acc[monthKey].byType[type] = (acc[monthKey].byType[type] || 0) + 1
    
    return acc
  }, {})

  // Process overdue analysis
  const overdueAnalysis = data.overdueTickets.edges.map((edge: any) => {
    const dueDate = new Date(edge.node.due_date)
    const now = new Date()
    const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      ticketId: edge.node.id,
      overdueDays,
      priority: edge.node.priority,
      type: edge.node.type,
      created_at: edge.node.created_at
    }
  })

  // Calculate insights
  const insights = {
    totalTickets: data.totalTickets.totalCount,
    openTickets: statusDistribution.new + (statusDistribution.waiting_on_you || 0) + (statusDistribution.waiting_on_customer || 0),
    resolvedTickets: statusDistribution.resolved + (statusDistribution.closed || 0),
    overdueTickets: overdueAnalysis.length,
    avgResolutionTime: resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum: number, item: any) => sum + item.resolutionTimeHours, 0) / resolutionTimes.length
      : 0,
    mostCommonType: Object.keys(typeDistribution).reduce((a, b) => 
      typeDistribution[a] > typeDistribution[b] ? a : b, 'unknown'
    ),
    mostCommonPriority: Object.keys(priorityDistribution).reduce((a, b) => 
      priorityDistribution[a] > priorityDistribution[b] ? a : b, 'unknown'
    ),
    resolutionRate: data.totalTickets.totalCount > 0 
      ? ((statusDistribution.resolved + (statusDistribution.closed || 0)) / data.totalTickets.totalCount) * 100
      : 0
  }

  return {
    totalTickets: data.totalTickets.totalCount,
    statusDistribution,
    priorityDistribution,
    typeDistribution,
    avgResolutionByPriority,
    monthlyTrends,
    overdueAnalysis,
    recentActivity: data.recentActivity.edges.map((edge: any) => edge.node),
    insights,
    resolutionTimes
  }
}

/**
 * Get My Tickets performance metrics
 */
async function fetchMyTicketsPerformanceGraphQL(userId: string) {
  console.log("⚡ My Tickets Performance: Fetching performance metrics for user:", userId)

  const client = await createGraphQLClient()

  const query = gql`
    query GetMyTicketsPerformance($requesterId: UUID!) {
      # Response time analysis
      responseTimeAnalysis: ticketsCollection(
        filter: { requester_id: { eq: $requesterId } }
      ) {
        edges {
          node {
            created_at
            updated_at
            status
            priority
            first_response_time
            resolution_time
          }
        }
      }
      
      # SLA compliance
      slaCompliance: ticketsCollection(
        filter: { requester_id: { eq: $requesterId } }
      ) {
        edges {
          node {
            due_date
            status
            priority
            created_at
            sla_policy_id
          }
        }
      }
      
      # Satisfaction ratings
      satisfactionRatings: ticketsCollection(
        filter: { 
          requester_id: { eq: $requesterId }
          satisfaction_rating: { isNull: false }
        }
      ) {
        edges {
          node {
            satisfaction_rating
            status
            priority
            type
            created_at
          }
        }
      }
    }
  `

  const data: any = await client.request(query, { requesterId: userId })

  // Process response time analysis
  const responseTimes = data.responseTimeAnalysis.edges.map((edge: any) => {
    const created = new Date(edge.node.created_at)
    const updated = new Date(edge.node.updated_at)
    const responseTime = edge.node.first_response_time || 
      (updated.getTime() - created.getTime()) / (1000 * 60 * 60) // hours
    
    return {
      ticketId: edge.node.id,
      responseTimeHours: responseTime,
      resolutionTimeHours: edge.node.resolution_time || 0,
      priority: edge.node.priority,
      status: edge.node.status
    }
  })

  // Process SLA compliance
  const slaCompliance = data.slaCompliance.edges.map((edge: any) => {
    const dueDate = edge.node.due_date ? new Date(edge.node.due_date) : null
    const created = new Date(edge.node.created_at)
    const now = new Date()
    
    let isCompliant = true
    let daysOverdue = 0
    
    if (dueDate) {
      if (edge.node.status === 'resolved' || edge.node.status === 'closed') {
        isCompliant = new Date(edge.node.updated_at) <= dueDate
      } else {
        isCompliant = now <= dueDate
        daysOverdue = Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      }
    }
    
    return {
      ticketId: edge.node.id,
      isCompliant,
      daysOverdue,
      priority: edge.node.priority,
      status: edge.node.status,
      dueDate: edge.node.due_date
    }
  })

  // Process satisfaction ratings
  const satisfactionData = data.satisfactionRatings.edges.map((edge: any) => ({
    ticketId: edge.node.id,
    rating: edge.node.satisfaction_rating,
    priority: edge.node.priority,
    type: edge.node.type,
    status: edge.node.status
  }))

  // Calculate performance metrics
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum: number, item: any) => sum + item.responseTimeHours, 0) / responseTimes.length
    : 0

  const avgResolutionTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum: number, item: any) => sum + item.resolutionTimeHours, 0) / responseTimes.length
    : 0

  const slaComplianceRate = slaCompliance.length > 0 
    ? (slaCompliance.filter((item: any) => item.isCompliant).length / slaCompliance.length) * 100
    : 0

  const avgSatisfaction = satisfactionData.length > 0 
    ? satisfactionData.reduce((sum: number, item: any) => sum + item.rating, 0) / satisfactionData.length
    : 0

  return {
    avgResponseTime,
    avgResolutionTime,
    slaComplianceRate,
    avgSatisfaction,
    responseTimes,
    slaCompliance,
    satisfactionData,
    totalTickets: data.responseTimeAnalysis.edges.length,
    compliantTickets: slaCompliance.filter((item: any) => item.isCompliant).length,
    ratedTickets: satisfactionData.length
  }
}

// ============================================================================
// REACT QUERY HOOKS FOR MY TICKETS ANALYTICS
// ============================================================================

/**
 * Hook to fetch My Tickets analytics
 */
export function useMyTicketsAnalyticsQuery(userId: string, dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: [...myTicketKeys.all, 'analytics', userId, dateRange],
    queryFn: () => fetchMyTicketsAnalyticsGraphQL(userId, dateRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  })
}

/**
 * Hook to fetch My Tickets performance metrics
 */
export function useMyTicketsPerformanceQuery(userId: string) {
  return useQuery({
    queryKey: [...myTicketKeys.all, 'performance', userId],
    queryFn: () => fetchMyTicketsPerformanceGraphQL(userId),
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId,
  })
}

/**
 * Hook for My Tickets dashboard data (combines analytics and performance)
 */
export function useMyTicketsDashboardQuery(userId: string) {
  const analyticsQuery = useMyTicketsAnalyticsQuery(userId)
  const performanceQuery = useMyTicketsPerformanceQuery(userId)

  return {
    analytics: analyticsQuery,
    performance: performanceQuery,
    isLoading: analyticsQuery.isLoading || performanceQuery.isLoading,
    isError: analyticsQuery.isError || performanceQuery.isError,
    error: analyticsQuery.error || performanceQuery.error,
  }
}

