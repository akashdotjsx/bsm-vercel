import { z } from 'zod'

// Article Status Enum
export const ArticleStatusEnum = z.enum(['draft', 'published', 'archived', 'review'])
export type ArticleStatus = z.infer<typeof ArticleStatusEnum>

// Full Knowledge Article Schema (matches database)
export const KnowledgeArticleSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  related_service_ids: z.array(z.string().uuid()).optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  reviewer_id: z.string().uuid().optional().nullable(),
  status: ArticleStatusEnum.default('draft'),
  view_count: z.number().int().default(0),
  helpful_count: z.number().int().default(0),
  not_helpful_count: z.number().int().default(0),
  last_reviewed_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>

// Create Article Input (for POST requests)
export const CreateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  related_service_ids: z.array(z.string().uuid()).optional(),
  status: ArticleStatusEnum.default('draft'),
})

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>

// Update Article Input (for PUT requests)
export const UpdateArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  related_service_ids: z.array(z.string().uuid()).optional().nullable(),
  reviewer_id: z.string().uuid().optional().nullable(),
  status: ArticleStatusEnum.optional(),
  last_reviewed_at: z.string().datetime().optional().nullable(),
})

export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>

// Article with Author (for responses with populated data)
export interface ArticleWithAuthor extends KnowledgeArticle {
  author?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    display_name?: string
    avatar_url?: string
  } | null
  reviewer?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    display_name?: string
  } | null
}

// Article Category
export interface ArticleCategory {
  name: string
  count: number
  description?: string
  icon?: string
  trending?: boolean
}

// Article Search Params
export interface ArticleSearchParams {
  query?: string
  category?: string
  tags?: string[]
  status?: ArticleStatus
  author_id?: string
  limit?: number
  offset?: number
}

// Article Analytics
export interface ArticleAnalytics {
  total_articles: number
  published_articles: number
  draft_articles: number
  total_views: number
  avg_helpful_score: number
  categories: ArticleCategory[]
  trending_articles: KnowledgeArticle[]
}

// GraphQL Types
export interface KnowledgeArticlesConnection {
  edges: Array<{
    node: KnowledgeArticle
  }>
  pageInfo?: {
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// AI Generation Types
export interface AIGenerationRequest {
  prompt: string
  context?: string
  style?: 'professional' | 'casual' | 'technical' | 'beginner-friendly'
  max_tokens?: number
  temperature?: number
}

export interface AIGenerationResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
