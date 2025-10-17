import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQL, useGraphQLMutation } from '@/hooks/use-graphql'
import { useAuth } from '@/lib/contexts/auth-context'

// Types
export interface ArticleBookmark {
  id: string
  article_id: string
  user_id: string
  organization_id: string
  created_at: string
  article?: {
    id: string
    title: string
    summary: string
    category: string
  }
}

export interface ArticleComment {
  id: string
  article_id: string
  user_id: string
  content: string
  is_internal: boolean
  parent_id: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    first_name: string
    last_name: string
    display_name: string
    avatar_url: string
  }
  replies?: ArticleComment[]
}

export interface ArticleVote {
  id: string
  article_id: string
  user_id: string
  vote_type: 'helpful' | 'not_helpful'
  created_at: string
}

export interface ArticleRevision {
  id: string
  article_id: string
  version_number: number
  title: string
  content: string
  summary: string | null
  change_description: string | null
  changed_by: string
  created_at: string
  user?: {
    id: string
    display_name: string
    email: string
  }
}

// ============= BOOKMARKS =============

/**
 * Get user's bookmarked articles
 */
export function useArticleBookmarks() {
  const { user, organizationId } = useAuth()

  const query = `
    query GetArticleBookmarks($userId: UUID!) {
      article_bookmarksCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            article_id
            created_at
            knowledge_articles {
              id
              title
              summary
              category
              status
            }
          }
        }
      }
    }
  `

  return useGraphQL<{ article_bookmarksCollection: { edges: Array<{ node: any }> } }>(
    query,
    { userId: user?.id },
    {
      enabled: !!user && !!organizationId,
      queryKey: ['article-bookmarks', user?.id],
      select: (data) =>
        data.article_bookmarksCollection.edges.map((edge) => ({
          ...edge.node,
          article: edge.node.knowledge_articles,
        })),
    }
  )
}

/**
 * Check if article is bookmarked by current user
 */
export function useIsArticleBookmarked(articleId: string | undefined) {
  const { user } = useAuth()

  const query = `
    query CheckArticleBookmark($articleId: UUID!, $userId: UUID!) {
      article_bookmarksCollection(
        filter: { 
          article_id: { eq: $articleId }
          user_id: { eq: $userId }
        }
      ) {
        edges {
          node {
            id
          }
        }
      }
    }
  `

  return useGraphQL<{ article_bookmarksCollection: { edges: Array<{ node: { id: string } }> } }>(
    query,
    { articleId, userId: user?.id },
    {
      enabled: !!articleId && !!user,
      queryKey: ['article-bookmark-status', articleId, user?.id],
      select: (data) => ({
        isBookmarked: data.article_bookmarksCollection.edges.length > 0,
        bookmarkId: data.article_bookmarksCollection.edges[0]?.node.id,
      }),
    }
  )
}

/**
 * Toggle article bookmark
 */
export function useToggleArticleBookmark() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()

  const addMutation = useGraphQLMutation<{ insertIntoarticle_bookmarksCollection: { records: any[] } }>(
    `
    mutation AddBookmark($articleId: UUID!, $userId: UUID!, $organizationId: UUID!) {
      insertIntoarticle_bookmarksCollection(
        objects: [{
          article_id: $articleId
          user_id: $userId
          organization_id: $organizationId
        }]
      ) {
        records {
          id
        }
      }
    }
    `,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['article-bookmarks'] })
        queryClient.invalidateQueries({ queryKey: ['article-bookmark-status'] })
      },
    }
  )

  const removeMutation = useGraphQLMutation<{ deleteFromarticle_bookmarksCollection: { records: any[] } }>(
    `
    mutation RemoveBookmark($bookmarkId: UUID!) {
      deleteFromarticle_bookmarksCollection(
        filter: { id: { eq: $bookmarkId } }
      ) {
        records {
          id
        }
      }
    }
    `,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['article-bookmarks'] })
        queryClient.invalidateQueries({ queryKey: ['article-bookmark-status'] })
      },
    }
  )

  return {
    toggle: async (articleId: string, isCurrentlyBookmarked: boolean, bookmarkId?: string) => {
      if (isCurrentlyBookmarked && bookmarkId) {
        await removeMutation.mutateAsync({ bookmarkId })
      } else {
        await addMutation.mutateAsync({
          articleId,
          userId: user?.id,
          organizationId,
        })
      }
    },
    isLoading: addMutation.isPending || removeMutation.isPending,
  }
}

// ============= COMMENTS =============

/**
 * Get comments for an article
 */
export function useArticleComments(articleId: string | undefined) {
  const query = `
    query GetArticleComments($articleId: UUID!) {
      article_commentsCollection(
        filter: { article_id: { eq: $articleId }, parent_id: { is: null } }
        orderBy: { created_at: AscNullsLast }
      ) {
        edges {
          node {
            id
            content
            is_internal
            created_at
            updated_at
            profiles {
              id
              email
              first_name
              last_name
              display_name
              avatar_url
            }
          }
        }
      }
    }
  `

  return useGraphQL<{ article_commentsCollection: { edges: Array<{ node: any }> } }>(
    query,
    { articleId },
    {
      enabled: !!articleId,
      queryKey: ['article-comments', articleId],
      select: (data) =>
        data.article_commentsCollection.edges.map((edge) => ({
          ...edge.node,
          user: edge.node.profiles,
        })),
    }
  )
}

/**
 * Add comment to article
 */
export function useAddArticleComment() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()

  return useGraphQLMutation<{ insertIntoarticle_commentsCollection: { records: any[] } }>(
    `
    mutation AddArticleComment(
      $articleId: UUID!
      $userId: UUID!
      $organizationId: UUID!
      $content: String!
      $isInternal: Boolean
    ) {
      insertIntoarticle_commentsCollection(
        objects: [{
          article_id: $articleId
          user_id: $userId
          organization_id: $organizationId
          content: $content
          is_internal: $isInternal
        }]
      ) {
        records {
          id
          content
          created_at
        }
      }
    }
    `,
    {
      onSuccess: (_, variables: any) => {
        queryClient.invalidateQueries({ queryKey: ['article-comments', variables.articleId] })
      },
    }
  )
}

/**
 * Delete comment
 */
export function useDeleteArticleComment() {
  const queryClient = useQueryClient()

  return useGraphQLMutation<{ deleteFromarticle_commentsCollection: { records: any[] } }>(
    `
    mutation DeleteArticleComment($commentId: UUID!) {
      deleteFromarticle_commentsCollection(
        filter: { id: { eq: $commentId } }
      ) {
        records {
          id
          article_id
        }
      }
    }
    `,
    {
      onSuccess: (data) => {
        const articleId = data.deleteFromarticle_commentsCollection.records[0]?.article_id
        if (articleId) {
          queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] })
        }
      },
    }
  )
}

// ============= VOTES =============

/**
 * Get vote counts for an article
 */
export function useArticleVoteCounts(articleId: string | undefined) {
  const query = `
    query GetArticleVoteCounts($articleId: UUID!) {
      helpful: article_votesCollection(
        filter: { 
          article_id: { eq: $articleId }
          vote_type: { eq: "helpful" }
        }
      ) {
        edges {
          node {
            id
          }
        }
      }
      notHelpful: article_votesCollection(
        filter: { 
          article_id: { eq: $articleId }
          vote_type: { eq: "not_helpful" }
        }
      ) {
        edges {
          node {
            id
          }
        }
      }
    }
  `

  return useGraphQL<{
    helpful: { edges: Array<{ node: { id: string } }> }
    notHelpful: { edges: Array<{ node: { id: string } }> }
  }>(
    query,
    { articleId },
    {
      enabled: !!articleId,
      queryKey: ['article-vote-counts', articleId],
      select: (data) => ({
        helpful: data.helpful.edges.length,
        notHelpful: data.notHelpful.edges.length,
      }),
    }
  )
}

/**
 * Get current user's vote for an article
 */
export function useUserArticleVote(articleId: string | undefined) {
  const { user } = useAuth()

  const query = `
    query GetUserArticleVote($articleId: UUID!, $userId: UUID!) {
      article_votesCollection(
        filter: { 
          article_id: { eq: $articleId }
          user_id: { eq: $userId }
        }
      ) {
        edges {
          node {
            id
            vote_type
          }
        }
      }
    }
  `

  return useGraphQL<{ article_votesCollection: { edges: Array<{ node: ArticleVote }> } }>(
    query,
    { articleId, userId: user?.id },
    {
      enabled: !!articleId && !!user,
      queryKey: ['user-article-vote', articleId, user?.id],
      select: (data) => data.article_votesCollection.edges[0]?.node || null,
    }
  )
}

/**
 * Submit or update article vote
 */
export function useVoteArticle() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()

  const upsertMutation = useGraphQLMutation(
    `
    mutation UpsertArticleVote(
      $articleId: UUID!
      $userId: UUID!
      $organizationId: UUID!
      $voteType: String!
    ) {
      insertIntoarticle_votesCollection(
        objects: [{
          article_id: $articleId
          user_id: $userId
          organization_id: $organizationId
          vote_type: $voteType
        }]
        onConflict: {
          constraint: article_votes_unique
          updateColumns: [vote_type, updated_at]
        }
      ) {
        records {
          id
          vote_type
        }
      }
    }
    `,
    {
      onSuccess: (_, variables: any) => {
        queryClient.invalidateQueries({ queryKey: ['article-vote-counts', variables.articleId] })
        queryClient.invalidateQueries({ queryKey: ['user-article-vote', variables.articleId] })
      },
    }
  )

  return {
    vote: (articleId: string, voteType: 'helpful' | 'not_helpful') =>
      upsertMutation.mutateAsync({
        articleId,
        userId: user?.id,
        organizationId,
        voteType,
      }),
    isLoading: upsertMutation.isPending,
  }
}

// ============= REVISIONS =============

/**
 * Get article revision history
 */
export function useArticleRevisions(articleId: string | undefined) {
  const query = `
    query GetArticleRevisions($articleId: UUID!) {
      article_revisionsCollection(
        filter: { article_id: { eq: $articleId } }
        orderBy: { version_number: DescNullsLast }
      ) {
        edges {
          node {
            id
            version_number
            title
            summary
            change_description
            created_at
            profiles {
              id
              display_name
              email
            }
          }
        }
      }
    }
  `

  return useGraphQL<{ article_revisionsCollection: { edges: Array<{ node: any }> } }>(
    query,
    { articleId },
    {
      enabled: !!articleId,
      queryKey: ['article-revisions', articleId],
      select: (data) =>
        data.article_revisionsCollection.edges.map((edge) => ({
          ...edge.node,
          user: edge.node.profiles,
        })),
    }
  )
}

/**
 * Create article revision
 */
export function useCreateArticleRevision() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()

  return useGraphQLMutation<{ insertIntoarticle_revisionsCollection: { records: any[] } }>(
    `
    mutation CreateArticleRevision(
      $articleId: UUID!
      $organizationId: UUID!
      $versionNumber: Int!
      $title: String!
      $content: String!
      $summary: String
      $changeDescription: String
      $changedBy: UUID!
    ) {
      insertIntoarticle_revisionsCollection(
        objects: [{
          article_id: $articleId
          organization_id: $organizationId
          version_number: $versionNumber
          title: $title
          content: $content
          summary: $summary
          change_description: $changeDescription
          changed_by: $changedBy
        }]
      ) {
        records {
          id
          version_number
        }
      }
    }
    `,
    {
      onSuccess: (_, variables: any) => {
        queryClient.invalidateQueries({ queryKey: ['article-revisions', variables.articleId] })
      },
    }
  )
}
