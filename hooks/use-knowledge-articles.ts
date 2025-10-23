import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context'
import type { 
  KnowledgeArticle, 
  CreateArticleInput, 
  ArticleSearchParams,
  ArticleCategory,
  ArticleWithAuthor 
} from '@/lib/types/knowledge'

// Initialize Supabase client
const supabase = createClient()

/**
 * Fetch all knowledge articles with filtering
 */
export function useKnowledgeArticles(params?: ArticleSearchParams) {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-articles', organizationId, params],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID')
      
      let query = supabase
        .from('knowledge_articles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (params?.category) {
        query = query.eq('category', params.category)
      }
      
      if (params?.status) {
        query = query.eq('status', params.status)
      }
      
      if (params?.author_id) {
        query = query.eq('author_id', params.author_id)
      }
      
if (params?.query) {
        // Use full-text search RPC for better relevance & performance
        const { data: searchData, error: searchError } = await supabase.rpc('search_knowledge_articles', {
          search_query: params.query,
          org_id: organizationId,
          category_filter: null,
          status_filter: params.status ?? 'published',
          limit_count: params.limit ?? 20,
          offset_count: params.offset ?? 0,
        })
        if (searchError) {
          console.error('Error searching articles:', searchError)
          throw searchError
        }
        // search RPC returns a subset; fetch full records by IDs to keep types consistent
        const ids = (searchData || []).map((r: any) => r.id)
        if (ids.length === 0) return [] as KnowledgeArticle[]
        const { data: fullData, error: fullError } = await supabase
          .from('knowledge_articles')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false })
        if (fullError) throw fullError
        return fullData as KnowledgeArticle[]
      }
      
      if (params?.tags && params.tags.length > 0) {
        query = query.contains('tags', params.tags)
      }
      
      if (params?.limit) {
        query = query.limit(params.limit)
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching articles:', error)
        throw error
      }
      
      return data as KnowledgeArticle[]
    },
    enabled: !!organizationId,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Fetch single article by ID with author details
 */
export function useArticle(id: string | undefined) {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      if (!id) throw new Error('Article ID required')
      if (!organizationId) throw new Error('No organization ID')
      
      // Fetch article with author details
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          author:profiles!author_id(id, email, first_name, last_name, display_name, avatar_url),
          reviewer:profiles!reviewer_id(id, email, first_name, last_name, display_name)
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()
      
      if (error) {
        console.error('Error fetching article:', error)
        throw error
      }
      
      // Increment view count (fire and forget)
      supabase
        .from('knowledge_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
        .then(() => {})
      
      return data as ArticleWithAuthor
    },
    enabled: !!id && !!organizationId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Create new article
 */
export function useCreateArticle() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()
  
  return useMutation({
    mutationFn: async (input: CreateArticleInput) => {
      if (!organizationId) throw new Error('No organization ID')
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert({
          ...input,
          organization_id: organizationId,
          author_id: user.id,
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating article:', error)
        throw error
      }
      
      return data as KnowledgeArticle
    },
    onSuccess: () => {
      // Invalidate all article queries
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
    },
  })
}

/**
 * Update existing article
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<KnowledgeArticle> & { id: string }) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating article:', error)
        throw error
      }
      
      return data as KnowledgeArticle
    },
    onSuccess: (data) => {
      // Invalidate specific article and list queries
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', data.id] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
    },
  })
}

/**
 * Delete article
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting article:', error)
        throw error
      }
      
      return { id }
    },
    onSuccess: () => {
      // Invalidate all article queries
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
    },
  })
}

/**
 * Get article categories with counts
 */
export function useArticleCategories() {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-categories', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID')
      
      const { data, error } = await supabase
        .from('article_categories')
        .select('id, name, article_count, is_active')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching categories:', error)
        throw error
      }
      
      const categories: ArticleCategory[] = (data || [])
        .map((row: any) => ({
          name: row.name,
          count: row.article_count ?? 0,
          trending: (row.article_count ?? 0) > 10,
        }))
        .sort((a, b) => b.count - a.count)
      
      return categories
    },
    enabled: !!organizationId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Get trending articles (most viewed)
 */
export function useTrendingArticles(limit = 10) {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-trending', organizationId, limit],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID')
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, summary, category, view_count, helpful_count, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching trending articles:', error)
        throw error
      }
      
      return data as Partial<KnowledgeArticle>[]
    },
    enabled: !!organizationId,
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Get recent articles
 */
export function useRecentArticles(limit = 5) {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-recent', organizationId, limit],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID')
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, summary, category, created_at, author_id')
        .eq('organization_id', organizationId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching recent articles:', error)
        throw error
      }
      
      return data as Partial<KnowledgeArticle>[]
    },
    enabled: !!organizationId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Update helpful/not helpful counts
 */
export function useUpdateArticleHelpful() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      helpful, 
      notHelpful 
    }: { 
      id: string
      helpful?: number
      notHelpful?: number 
    }) => {
      const updates: any = {}
      
      if (helpful !== undefined) {
        updates.helpful_count = helpful
      }
      
      if (notHelpful !== undefined) {
        updates.not_helpful_count = notHelpful
      }
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', id)
        .select('id, helpful_count, not_helpful_count')
        .single()
      
      if (error) {
        console.error('Error updating helpful counts:', error)
        throw error
      }
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', data.id] })
    },
  })
}
