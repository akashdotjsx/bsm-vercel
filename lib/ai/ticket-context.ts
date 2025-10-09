import { gql } from 'graphql-request';
import { createServerGraphQLClient } from '@/lib/graphql/client';

/**
 * GraphQL query to fetch recent tickets for AI context
 * Fetches the 20 most recent tickets with essential information
 */
export const GET_RECENT_TICKETS_FOR_AI = gql`
  query GetRecentTicketsForAI($organizationId: UUID!, $limit: Int!) {
    ticketsCollection(
      filter: { organization_id: { eq: $organizationId } }
      orderBy: [{ created_at: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          id
          ticket_number
          title
          description
          type
          category
          subcategory
          priority
          urgency
          impact
          status
          assignee_ids
          team_id
          due_date
          sla_breached
          channel
          escalation_level
          ai_sentiment
          tags
          created_at
          updated_at
          requester: profiles {
            display_name
            email
            department
          }
          team: teams {
            name
          }
        }
      }
    }
  }
`;

/**
 * Interface for ticket data returned from GraphQL
 */
export interface AITicketContext {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  type: string | null;
  category: string | null;
  subcategory: string | null;
  priority: string | null;
  urgency: string | null;
  impact: string | null;
  status: string;
  assignee_ids: string[] | null;
  team_id: string | null;
  due_date: string | null;
  sla_breached: boolean | null;
  channel: string | null;
  escalation_level: number | null;
  ai_sentiment: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  requester: {
    display_name: string | null;
    email: string;
    department: string | null;
  } | null;
  team: {
    name: string;
  } | null;
}

/**
 * Fetch recent tickets for AI context
 */
export async function fetchRecentTicketsForAI(
  organizationId: string,
  limit: number = 20
): Promise<AITicketContext[]> {
  const client = createServerGraphQLClient();
  
  try {
    const data = await client.request(GET_RECENT_TICKETS_FOR_AI, {
      organizationId,
      limit,
    });

    // Extract tickets from GraphQL response
    const tickets = (data as any).ticketsCollection?.edges?.map(
      (edge: any) => edge.node
    ) || [];

    return tickets;
  } catch (error) {
    console.error('Error fetching tickets for AI context:', error);
    return [];
  }
}

/**
 * Format tickets into a context string for AI
 */
export function formatTicketsForAI(tickets: AITicketContext[]): string {
  if (tickets.length === 0) {
    return 'No recent tickets available.';
  }

  const ticketSummaries = tickets.map((ticket, index) => {
    const parts = [
      `${index + 1}. Ticket #${ticket.ticket_number}: ${ticket.title}`,
      `   Status: ${ticket.status}`,
    ];

    if (ticket.priority) {
      parts.push(`   Priority: ${ticket.priority}`);
    }

    if (ticket.category) {
      parts.push(`   Category: ${ticket.category}`);
    }

    if (ticket.description) {
      const shortDesc = ticket.description.slice(0, 100);
      parts.push(`   Description: ${shortDesc}${ticket.description.length > 100 ? '...' : ''}`);
    }

    if (ticket.requester) {
      parts.push(`   Requester: ${ticket.requester.display_name || ticket.requester.email}`);
    }

    if (ticket.assignee_ids && ticket.assignee_ids.length > 0) {
      parts.push(`   Assignees: ${ticket.assignee_ids.length} assigned`);
    }

    if (ticket.team) {
      parts.push(`   Team: ${ticket.team.name}`);
    }

    if (ticket.tags && ticket.tags.length > 0) {
      parts.push(`   Tags: ${ticket.tags.join(', ')}`);
    }

    parts.push(`   Created: ${new Date(ticket.created_at).toLocaleString()}`);

    return parts.join('\n');
  });

  return `Recent Tickets (${tickets.length}):\n\n${ticketSummaries.join('\n\n')}`;
}

/**
 * Search tickets by query for AI
 */
export async function searchTicketsForAI(
  organizationId: string,
  query: string,
  limit: number = 10
): Promise<AITicketContext[]> {
  const client = createServerGraphQLClient();

  const SEARCH_TICKETS_QUERY = gql`
    query SearchTicketsForAI(
      $organizationId: UUID!
      $searchTerm: String!
      $limit: Int!
    ) {
      ticketsCollection(
        filter: {
          and: [
            { organization_id: { eq: $organizationId } }
            {
              or: [
                { title: { ilike: $searchTerm } }
                { description: { ilike: $searchTerm } }
                { ticket_number: { ilike: $searchTerm } }
              ]
            }
          ]
        }
        orderBy: [{ created_at: DescNullsLast }]
        first: $limit
      ) {
        edges {
          node {
            id
            ticket_number
            title
            description
            type
            category
            subcategory
            priority
            urgency
            impact
            status
            assignee_ids
            team_id
            due_date
            sla_breached
            channel
            escalation_level
            ai_sentiment
            tags
            created_at
            updated_at
            requester: profiles {
              display_name
              email
              department
            }
            team: teams {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request(SEARCH_TICKETS_QUERY, {
      organizationId,
      searchTerm: `%${query}%`,
      limit,
    });

    const tickets = (data as any).ticketsCollection?.edges?.map(
      (edge: any) => edge.node
    ) || [];

    return tickets;
  } catch (error) {
    console.error('Error searching tickets for AI:', error);
    return [];
  }
}

/**
 * Get ticket details by ID for AI
 */
export async function getTicketDetailsForAI(
  ticketId: string
): Promise<AITicketContext | null> {
  const client = createServerGraphQLClient();

  const GET_TICKET_DETAILS_QUERY = gql`
    query GetTicketDetailsForAI($ticketId: UUID!) {
      ticketsCollection(filter: { id: { eq: $ticketId } }) {
        edges {
          node {
            id
            ticket_number
            title
            description
            type
            category
            subcategory
            priority
            urgency
            impact
            status
            assignee_ids
            team_id
            due_date
            sla_breached
            channel
            escalation_level
            ai_sentiment
            tags
            created_at
            updated_at
            requester: profiles {
              display_name
              email
              department
            }
            team: teams {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request(GET_TICKET_DETAILS_QUERY, {
      ticketId,
    });

    const edges = (data as any).ticketsCollection?.edges;
    if (edges && edges.length > 0) {
      return edges[0].node;
    }

    return null;
  } catch (error) {
    console.error('Error fetching ticket details for AI:', error);
    return null;
  }
}
