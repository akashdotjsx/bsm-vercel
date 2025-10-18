/**
 * GraphQL Queries for Knowledge Base
 * Uses Supabase's pg_graphql extension
 */

// Fetch all articles with pagination
export const GET_KNOWLEDGE_ARTICLES = `
  query GetKnowledgeArticles(
    $organizationId: UUID!
    $status: String
    $category: String
    $limit: Int = 10
    $offset: Int = 0
  ) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        status: { eq: $status }
        category: { eq: $category }
      }
      first: $limit
      offset: $offset
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          organization_id
          title
          content
          summary
          category
          tags
          status
          view_count
          helpful_count
          not_helpful_count
          created_at
          updated_at
          author_id
          reviewer_id
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

// Fetch single article by ID with author details
export const GET_ARTICLE_BY_ID = `
  query GetArticleById($id: UUID!, $organizationId: UUID!) {
    knowledge_articlesCollection(
      filter: {
        id: { eq: $id }
        organization_id: { eq: $organizationId }
      }
      first: 1
    ) {
      edges {
        node {
          id
          organization_id
          title
          content
          summary
          category
          tags
          related_service_ids
          status
          view_count
          helpful_count
          not_helpful_count
          last_reviewed_at
          created_at
          updated_at
          author_id
          reviewer_id
        }
      }
    }
  }
`

// Search articles by title or content
export const SEARCH_ARTICLES = `
  query SearchArticles(
    $organizationId: UUID!
    $searchQuery: String!
    $limit: Int = 20
  ) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        status: { eq: "published" }
        or: [
          { title: { ilike: $searchQuery } }
          { content: { ilike: $searchQuery } }
          { summary: { ilike: $searchQuery } }
        ]
      }
      first: $limit
      orderBy: [{ view_count: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          summary
          category
          tags
          view_count
          created_at
          author_id
        }
      }
    }
  }
`

// Get articles by category
export const GET_ARTICLES_BY_CATEGORY = `
  query GetArticlesByCategory(
    $organizationId: UUID!
    $category: String!
    $status: String = "published"
    $limit: Int = 50
  ) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        category: { eq: $category }
        status: { eq: $status }
      }
      first: $limit
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          summary
          category
          tags
          status
          view_count
          helpful_count
          created_at
          updated_at
          author_id
        }
      }
    }
  }
`

// Get category statistics (using aggregation)
export const GET_CATEGORY_STATS = `
  query GetCategoryStats($organizationId: UUID!) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        status: { eq: "published" }
      }
    ) {
      edges {
        node {
          category
        }
      }
    }
  }
`

// Get trending articles (most viewed)
export const GET_TRENDING_ARTICLES = `
  query GetTrendingArticles(
    $organizationId: UUID!
    $limit: Int = 10
  ) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        status: { eq: "published" }
      }
      first: $limit
      orderBy: [{ view_count: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          summary
          category
          view_count
          helpful_count
          created_at
        }
      }
    }
  }
`

// Get recent articles
export const GET_RECENT_ARTICLES = `
  query GetRecentArticles(
    $organizationId: UUID!
    $limit: Int = 5
  ) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        status: { eq: "published" }
      }
      first: $limit
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          summary
          category
          created_at
          author_id
        }
      }
    }
  }
`

// Get articles by author
export const GET_ARTICLES_BY_AUTHOR = `
  query GetArticlesByAuthor(
    $organizationId: UUID!
    $authorId: UUID!
    $limit: Int = 20
  ) {
    knowledge_articlesCollection(
      filter: {
        organization_id: { eq: $organizationId }
        author_id: { eq: $authorId }
      }
      first: $limit
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          summary
          category
          status
          view_count
          created_at
          updated_at
        }
      }
    }
  }
`

// GraphQL Mutations (Note: Supabase pg_graphql auto-generates these)

// Create article mutation
export const CREATE_ARTICLE_MUTATION = `
  mutation CreateArticle(
    $object: knowledge_articlesInsertInput!
  ) {
    insertIntoknowledge_articlesCollection(
      objects: [$object]
    ) {
      affectedCount
      records {
        id
        organization_id
        title
        content
        summary
        category
        tags
        status
        created_at
        updated_at
        author_id
      }
    }
  }
`

// Update article mutation
export const UPDATE_ARTICLE_MUTATION = `
  mutation UpdateArticle(
    $id: UUID!
    $set: knowledge_articlesUpdateInput!
  ) {
    updateknowledge_articlesCollection(
      filter: { id: { eq: $id } }
      set: $set
    ) {
      affectedCount
      records {
        id
        title
        content
        summary
        category
        tags
        status
        updated_at
      }
    }
  }
`

// Delete article mutation
export const DELETE_ARTICLE_MUTATION = `
  mutation DeleteArticle($id: UUID!) {
    deleteFromknowledge_articlesCollection(
      filter: { id: { eq: $id } }
    ) {
      affectedCount
      records {
        id
        title
      }
    }
  }
`

// Increment view count
export const INCREMENT_VIEW_COUNT = `
  mutation IncrementViewCount($id: UUID!, $currentCount: Int!) {
    updateknowledge_articlesCollection(
      filter: { id: { eq: $id } }
      set: { view_count: $currentCount }
    ) {
      affectedCount
      records {
        id
        view_count
      }
    }
  }
`

// Update helpful count
export const UPDATE_HELPFUL_COUNT = `
  mutation UpdateHelpfulCount(
    $id: UUID!
    $helpful: Int!
    $notHelpful: Int!
  ) {
    updateknowledge_articlesCollection(
      filter: { id: { eq: $id } }
      set: {
        helpful_count: $helpful
        not_helpful_count: $notHelpful
      }
    ) {
      affectedCount
      records {
        id
        helpful_count
        not_helpful_count
      }
    }
  }
`

// Helper function to execute GraphQL queries
export async function executeGraphQLQuery<T = any>(
  query: string,
  variables: Record<string, any>,
  supabaseUrl: string,
  supabaseKey: string
): Promise<T> {
  const response = await fetch(`${supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  return result.data as T
}
