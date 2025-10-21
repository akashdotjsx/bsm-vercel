import { gql } from 'graphql-request'

// ============================================
// TICKETS QUERIES
// ============================================

export const GET_TICKETS_QUERY = gql`
  query GetTickets(
    $filter: ticketsFilter
    $first: Int
    $offset: Int
  ) {
    ticketsCollection(
      filter: $filter
      first: $first
      offset: $offset
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
          requester_id
          assignee_id
          assignee_ids
          team_id
          sla_policy_id
          due_date
          first_response_at
          resolved_at
          closed_at
          sla_breached
          channel
          escalation_level
          ai_sentiment
          ai_confidence
          auto_assigned
          custom_fields
          tags
          created_at
          updated_at
          requester: profiles {
            id
            first_name
            last_name
            display_name
            email
            avatar_url
          }
          assignee: profiles {
            id
            first_name
            last_name
            display_name
            email
            avatar_url
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const GET_TICKET_BY_ID_QUERY = gql`
  query GetTicketById($id: UUID!) {
    ticketsCollection(filter: { id: { eq: $id } }) {
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
          requester_id
          assignee_id
          assignee_ids
          team_id
          sla_policy_id
          due_date
          first_response_at
          resolved_at
          closed_at
          sla_breached
          channel
          source_reference
          escalation_level
          ai_sentiment
          ai_confidence
          auto_assigned
          custom_fields
          tags
          created_at
          updated_at
          organization_id
          requester: profiles {
            id
            first_name
            last_name
            display_name
            email
            avatar_url
          }
          assignee: profiles {
            id
            first_name
            last_name
            display_name
            email
            avatar_url
          }
          team: teams {
            id
            name
            description
          }
          comments: ticket_commentsCollection(filter: { ticket_id: { eq: $id } }, orderBy: [{ created_at: DescNullsLast }], first: 200) {
            edges {
              node {
                id
                ticket_id
                content
                is_internal
                is_system
                created_at
                author: profiles {
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
          attachments: ticket_attachmentsCollection(filter: { ticket_id: { eq: $id } }, orderBy: [{ created_at: DescNullsLast }], first: 200) {
            edges {
              node {
                id
                ticket_id
                filename
                file_size
                mime_type
                storage_path
                is_public
                created_at
                uploaded_by: profiles {
                  id
                  display_name
                }
              }
            }
          }
          checklist: ticket_checklistCollection(filter: { ticket_id: { eq: $id } }, orderBy: [{ created_at: DescNullsLast }], first: 200) {
            edges {
              node {
                id
                ticket_id
                text
                completed
                due_date
                created_at
                updated_at
                assignee: profiles {
                  id
                  display_name
                  email
                  avatar_url
                }
              }
            }
          }
          history: ticket_historyCollection(filter: { ticket_id: { eq: $id } }, orderBy: [{ created_at: DescNullsLast }], first: 500) {
            edges {
              node {
                id
                ticket_id
                field_name
                old_value
                new_value
                change_reason
                created_at
                changed_by: profiles {
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
        }
      }
    }
  }
`

// ============================================
// USERS/PROFILES QUERIES
// ============================================

export const GET_PROFILES_QUERY = gql`
  query GetProfiles(
    $filter: profilesFilter
    $orderBy: [profilesOrderBy!]
    $first: Int
    $offset: Int
  ) {
    profilesCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          email
          first_name
          last_name
          display_name
          avatar_url
          phone
          department
          role
          is_active
          created_at
          updated_at
          organization: organizations {
            id
            name
          }
          manager: profiles {
            id
            display_name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const GET_PROFILE_BY_ID_QUERY = gql`
  query GetProfileById($id: UUID!) {
    profilesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          organization_id
          email
          first_name
          last_name
          display_name
          avatar_url
          phone
          department
          role
          manager_id
          is_active
          timezone
          language
          notification_preferences
          created_at
          updated_at
          organization: organizations {
            id
            name
            domain
          }
          manager: profiles {
            id
            display_name
            email
          }
        }
      }
    }
  }
`

// ============================================
// TEAMS QUERIES
// ============================================

export const GET_TEAMS_QUERY = gql`
  query GetTeams(
    $filter: teamsFilter
    $orderBy: [teamsOrderBy!]
    $first: Int
    $offset: Int
  ) {
    teamsCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          name
          description
          department
          lead_id
          organization_id
          is_active
          created_at
          updated_at
          lead: profiles {
            id
            display_name
            email
            first_name
            last_name
            avatar_url
          }
          organization: organizations {
            id
            name
          }
          members: team_membersCollection {
            edges {
              node {
                id
                role
                user: profiles {
                  id
                  display_name
                  email
                  avatar_url
                  first_name
                  last_name
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

// ============================================
// SERVICES QUERIES
// ============================================

export const GET_SERVICES_QUERY = gql`
  query GetServices(
    $filter: servicesFilter
    $orderBy: [servicesOrderBy!]
    $first: Int
    $offset: Int
  ) {
    servicesCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          name
          description
          icon
          short_description
          detailed_description
          is_requestable
          requires_approval
          estimated_delivery_days
          popularity_score
          total_requests
          status
          form_schema
          created_at
          updated_at
          category: service_categories {
            id
            name
            description
            icon
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const GET_SERVICE_CATEGORIES_QUERY = gql`
  query GetServiceCategories(
    $filter: service_categoriesFilter
    $orderBy: [service_categoriesOrderBy!]
  ) {
    service_categoriesCollection(
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          description
          icon
          color
          display_order
          is_active
          created_at
          services: servicesCollection(filter: { status: { eq: "active" } }) {
            edges {
              node {
                id
                name
                is_requestable
              }
            }
          }
        }
      }
    }
  }
`

// ============================================
// SERVICE REQUESTS QUERIES
// ============================================

export const GET_SERVICE_REQUESTS_QUERY = gql`
  query GetServiceRequests(
    $filter: service_requestsFilter
    $orderBy: [service_requestsOrderBy!]
    $first: Int
    $offset: Int
  ) {
    service_requestsCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          request_number
          title
          description
          business_justification
          status
          priority
          urgency
          estimated_delivery_date
          actual_delivery_date
          cost_center
          form_data
          created_at
          updated_at
          service: services {
            id
            name
            icon
            estimated_delivery_days
          }
          requester: profiles {
            id
            first_name
            last_name
            display_name
            email
            department
          }
          assignee: profiles {
            id
            display_name
            email
          }
          approver: profiles {
            id
            display_name
            email
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

// ============================================
// ASSETS QUERIES
// ============================================

export const GET_ASSETS_QUERY = gql`
  query GetAssets(
    $filter: assetsFilter
    $orderBy: [assetsOrderBy!]
    $first: Int
    $offset: Int
  ) {
    assetsCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          asset_tag
          name
          hostname
          ip_address
          mac_address
          serial_number
          model
          manufacturer
          operating_system
          os_version
          cpu_info
          memory_gb
          storage_gb
          location
          status
          criticality
          lifecycle_stage
          purchase_date
          warranty_expiry
          cost
          depreciation_rate
          custom_fields
          tags
          last_seen_at
          created_at
          updated_at
          asset_type: asset_types {
            id
            name
            icon
            color
            description
          }
          owner: profiles {
            id
            display_name
            email
          }
          support_team: teams {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const GET_ASSET_TYPES_QUERY = gql`
  query GetAssetTypes(
    $filter: asset_typesFilter
    $orderBy: [asset_typesOrderBy!]
  ) {
    asset_typesCollection(
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          description
          icon
          color
          schema_definition
          is_active
          created_at
          updated_at
        }
      }
    }
  }
`

// ============================================
// SEARCH QUERIES (Multi-entity)
// ============================================

export const GLOBAL_SEARCH_QUERY = gql`
  query GlobalSearch(
    $searchTerm: String!
    $limit: Int
  ) {
    tickets: ticketsCollection(
      filter: {
        or: [
          { title: { ilike: $searchTerm } }
          { description: { ilike: $searchTerm } }
          { ticket_number: { ilike: $searchTerm } }
        ]
      }
      first: $limit
    ) {
      edges {
        node {
          id
          ticket_number
          title
          status
          priority
          created_at
        }
      }
    }
    users: profilesCollection(
      filter: {
        or: [
          { display_name: { ilike: $searchTerm } }
          { email: { ilike: $searchTerm } }
          { department: { ilike: $searchTerm } }
        ]
      }
      first: $limit
    ) {
      edges {
        node {
          id
          display_name
          email
          department
          avatar_url
        }
      }
    }
    assets: assetsCollection(
      filter: {
        or: [
          { name: { ilike: $searchTerm } }
          { hostname: { ilike: $searchTerm } }
          { ip_address: { ilike: $searchTerm } }
          { asset_tag: { ilike: $searchTerm } }
        ]
      }
      first: $limit
    ) {
      edges {
        node {
          id
          name
          asset_tag
          status
          asset_type: asset_types {
            name
            icon
          }
        }
      }
    }
    services: servicesCollection(
      filter: {
        or: [
          { name: { ilike: $searchTerm } }
          { description: { ilike: $searchTerm } }
        ]
      }
      first: $limit
    ) {
      edges {
        node {
          id
          name
          icon
          short_description
        }
      }
    }
  }
`

// ============================================
// ANALYTICS/DASHBOARD QUERIES
// ============================================

export const GET_DASHBOARD_STATS_QUERY = gql`
  query GetDashboardStats($organizationId: UUID!) {
    ticketsCollection(filter: { organization_id: { eq: $organizationId } }) {
      edges {
        node {
          id
          status
          priority
          created_at
        }
      }
    }
    service_requestsCollection(filter: { organization_id: { eq: $organizationId } }) {
      edges {
        node {
          id
          status
          created_at
        }
      }
    }
    assetsCollection(filter: { organization_id: { eq: $organizationId } }) {
      edges {
        node {
          id
          status
          criticality
        }
      }
    }
  }
`

// ============================================
// WORKFLOW QUERIES
// ============================================

export const GET_WORKFLOWS_QUERY = gql`
  query GetWorkflows(
    $filter: workflowsFilter
    $orderBy: [workflowsOrderBy!]
    $first: Int
    $offset: Int
  ) {
    workflowsCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          organization_id
          name
          description
          entity_type
          status
          version
          workflow_config
          initial_status
          trigger_conditions
          tags
          created_by
          created_at
          updated_at
          creator: profiles {
            id
            first_name
            last_name
            display_name
            email
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const GET_WORKFLOW_BY_ID_QUERY = gql`
  query GetWorkflowById($id: UUID!) {
    workflowsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          organization_id
          name
          description
          entity_type
          status
          version
          workflow_config
          initial_status
          trigger_conditions
          tags
          created_by
          created_at
          updated_at
          creator: profiles {
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
  }
`

export const GET_WORKFLOW_EXECUTIONS_QUERY = gql`
  query GetWorkflowExecutions(
    $filter: workflow_executionsFilter
    $orderBy: [workflow_executionsOrderBy!]
    $first: Int
    $offset: Int
  ) {
    workflow_executionsCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          workflow_id
          entity_id
          entity_type
          current_status
          status
          started_at
          completed_at
          error_message
          execution_log
          triggered_by
          workflow: workflows {
            id
            name
            entity_type
          }
          trigger_user: profiles {
            id
            first_name
            last_name
            display_name
            email
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const GET_WORKFLOW_EXECUTION_BY_ID_QUERY = gql`
  query GetWorkflowExecutionById($id: UUID!) {
    workflow_executionsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          workflow_id
          entity_id
          entity_type
          current_status
          status
          started_at
          completed_at
          error_message
          execution_log
          triggered_by
          workflow: workflows {
            id
            name
            description
            entity_type
            workflow_config
          }
          trigger_user: profiles {
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
  }
`
