// Example GraphQL queries for tickets using pg_graphql conventions
// Note: The exact naming may vary depending on your GraphQL configuration.
// You can introspect via the Supabase GraphQL Explorer to verify names.

export const LIST_TICKETS = /* GraphQL */ `
  query ListTickets($limit: Int = 50, $offset: Int = 0, $status: String) {
    ticketsCollection(
      filter: { status: { eq: $status } }
      orderBy: [{ createdAt: DescNullsLast }]
      first: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          ticketNumber
          title
          status
          priority
          assigneeId
          createdAt
        }
      }
    }
  }
`

export const CREATE_TICKET = /* GraphQL */ `
  mutation CreateTicket($input: [TicketsInsertInput!]!) {
    insertIntoTicketsCollection(objects: $input) {
      records { id ticketNumber title status priority createdAt }
    }
  }
`
