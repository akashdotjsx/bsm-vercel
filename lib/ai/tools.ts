import { z } from 'zod';
import {
  searchTicketsForAI,
  getTicketDetailsForAI,
  formatTicketsForAI,
  AITicketContext,
} from './ticket-context';

/**
 * AI Tool Definitions for Ticket Operations
 * 
 * These tools allow the AI to:
 * - Search for tickets
 * - Get ticket details
 * - Analyze ticket patterns
 * - Get ticket statistics
 */

// ============================================
// TOOL SCHEMAS
// ============================================

export const searchTicketsToolSchema = z.object({
  query: z.string().describe('Search query to find tickets'),
  limit: z.number().optional().default(10).describe('Maximum number of results'),
});

export const getTicketDetailsToolSchema = z.object({
  ticketId: z.string().uuid().describe('UUID of the ticket to retrieve'),
});

export const analyzeTicketPatternsToolSchema = z.object({
  timeframe: z
    .enum(['today', 'week', 'month', 'all'])
    .optional()
    .default('week')
    .describe('Timeframe to analyze'),
  groupBy: z
    .enum(['priority', 'status', 'category', 'team'])
    .optional()
    .default('priority')
    .describe('How to group tickets'),
});

export const getTicketStatsToolSchema = z.object({
  timeframe: z
    .enum(['today', 'week', 'month', 'all'])
    .optional()
    .default('week')
    .describe('Timeframe for statistics'),
});

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

/**
 * Search tickets tool
 */
export async function searchTicketsTool(
  params: z.infer<typeof searchTicketsToolSchema>,
  organizationId: string
) {
  const { query, limit } = params;

  const tickets = await searchTicketsForAI(organizationId, query, limit);

  if (tickets.length === 0) {
    return {
      success: true,
      message: `No tickets found matching "${query}"`,
      tickets: [],
    };
  }

  return {
    success: true,
    message: `Found ${tickets.length} ticket(s) matching "${query}"`,
    tickets: tickets.map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.category,
      created_at: t.created_at,
    })),
    formattedSummary: formatTicketsForAI(tickets),
  };
}

/**
 * Get ticket details tool
 */
export async function getTicketDetailsTool(
  params: z.infer<typeof getTicketDetailsToolSchema>,
  organizationId: string
) {
  const { ticketId } = params;

  const ticket = await getTicketDetailsForAI(ticketId);

  if (!ticket) {
    return {
      success: false,
      message: `Ticket with ID ${ticketId} not found`,
      ticket: null,
    };
  }

  return {
    success: true,
    message: `Retrieved details for ticket #${ticket.ticket_number}`,
    ticket: {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      subcategory: ticket.subcategory,
      type: ticket.type,
      urgency: ticket.urgency,
      impact: ticket.impact,
      assignee_ids: ticket.assignee_ids,
      team: ticket.team?.name,
      requester: ticket.requester?.display_name || ticket.requester?.email,
      tags: ticket.tags,
      due_date: ticket.due_date,
      sla_breached: ticket.sla_breached,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    },
  };
}

/**
 * Analyze ticket patterns tool
 */
export async function analyzeTicketPatternsTool(
  params: z.infer<typeof analyzeTicketPatternsToolSchema>,
  tickets: AITicketContext[]
) {
  const { timeframe, groupBy } = params;

  // Filter tickets by timeframe
  const now = new Date();
  const filteredTickets = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.created_at);
    switch (timeframe) {
      case 'today':
        return createdAt.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt >= weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return createdAt >= monthAgo;
      default:
        return true;
    }
  });

  // Group tickets
  const grouped = new Map<string, AITicketContext[]>();
  filteredTickets.forEach((ticket) => {
    let key: string;
    switch (groupBy) {
      case 'priority':
        key = ticket.priority || 'Unknown';
        break;
      case 'status':
        key = ticket.status;
        break;
      case 'category':
        key = ticket.category || 'Uncategorized';
        break;
      case 'team':
        key = ticket.team?.name || 'Unassigned';
        break;
      default:
        key = 'Unknown';
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(ticket);
  });

  // Create analysis
  const analysis = Array.from(grouped.entries()).map(([key, tickets]) => ({
    group: key,
    count: tickets.length,
    percentage: ((tickets.length / filteredTickets.length) * 100).toFixed(1),
    tickets: tickets.slice(0, 3).map((t) => ({
      ticket_number: t.ticket_number,
      title: t.title,
      status: t.status,
    })),
  }));

  // Sort by count descending
  analysis.sort((a, b) => b.count - a.count);

  return {
    success: true,
    message: `Analyzed ${filteredTickets.length} tickets from ${timeframe}, grouped by ${groupBy}`,
    timeframe,
    groupBy,
    totalTickets: filteredTickets.length,
    analysis,
  };
}

/**
 * Get ticket statistics tool
 */
export async function getTicketStatsTool(
  params: z.infer<typeof getTicketStatsToolSchema>,
  tickets: AITicketContext[]
) {
  const { timeframe } = params;

  // Filter tickets by timeframe
  const now = new Date();
  const filteredTickets = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.created_at);
    switch (timeframe) {
      case 'today':
        return createdAt.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt >= weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return createdAt >= monthAgo;
      default:
        return true;
    }
  });

  // Calculate statistics
  const stats = {
    total: filteredTickets.length,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    slaBreached: filteredTickets.filter((t) => t.sla_breached).length,
    unassigned: filteredTickets.filter(
      (t) => !t.assignee_ids || t.assignee_ids.length === 0
    ).length,
    escalated: filteredTickets.filter((t) => t.escalation_level && t.escalation_level > 0).length,
  };

  // Count by status
  filteredTickets.forEach((ticket) => {
    const status = ticket.status;
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

    if (ticket.priority) {
      stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
    }

    if (ticket.category) {
      stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;
    }
  });

  return {
    success: true,
    message: `Statistics for ${timeframe}`,
    timeframe,
    stats,
  };
}

// ============================================
// TOOL REGISTRY
// ============================================

export const AI_TOOLS = [
  {
    name: 'search_tickets',
    description:
      'Search for tickets using a query string. Returns matching tickets with basic information.',
    parameters: searchTicketsToolSchema,
    execute: searchTicketsTool,
  },
  {
    name: 'get_ticket_details',
    description: 'Get detailed information about a specific ticket by its ID.',
    parameters: getTicketDetailsToolSchema,
    execute: getTicketDetailsTool,
  },
  {
    name: 'analyze_ticket_patterns',
    description:
      'Analyze patterns in tickets over a timeframe, grouped by priority, status, category, or team.',
    parameters: analyzeTicketPatternsToolSchema,
    execute: analyzeTicketPatternsTool,
  },
  {
    name: 'get_ticket_stats',
    description: 'Get statistics about tickets including counts by status, priority, and more.',
    parameters: getTicketStatsToolSchema,
    execute: getTicketStatsTool,
  },
] as const;

export type AIToolName = typeof AI_TOOLS[number]['name'];
