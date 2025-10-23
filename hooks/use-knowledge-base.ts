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
import { toast } from 'sonner'

const supabase = createClient()

// ===================== ARTICLES =====================

export function useKnowledgeArticles(params?: ArticleSearchParams) {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-articles', organizationId, params],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID')
      
      let query = supabase
        .from('knowledge_articles')
        .select(`
          *,
          author:profiles!author_id(id, email, first_name, last_name, display_name, avatar_url),
          category:article_categories(id, name, icon, color)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      
      if (params?.status) {
        query = query.eq('status', params.status)
      }
      
      if (params?.category_id) {
        query = query.eq('category_id', params.category_id)
      }
      
      if (params?.author_id) {
        query = query.eq('author_id', params.author_id)
      }
      
      if (params?.query) {
        query = query.or(`title.ilike.%${params.query}%,content.ilike.%${params.query}%,summary.ilike.%${params.query}%`)
      }
      
      if (params?.limit) {
        query = query.limit(params.limit)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching articles:', error)
        throw error
      }
      
      return data
    },
    enabled: !!organizationId,
    staleTime: 30000,
  })
}

export function useArticle(id: string | undefined) {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      if (!id || !organizationId) throw new Error('Missing required parameters')
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          author:profiles!author_id(id, email, first_name, last_name, display_name, avatar_url),
          reviewer:profiles!reviewer_id(id, email, first_name, last_name, display_name),
          category:article_categories(id, name, icon, color)
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()
      
      if (error) throw error
      
      // Increment view count
      supabase
        .from('knowledge_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
        .then(() => {})
      
      return data
    },
    enabled: !!id && !!organizationId,
  })
}

export function useCreateArticle() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()
  
  return useMutation({
    mutationFn: async (input: CreateArticleInput & { category_id?: string }) => {
      if (!organizationId || !user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert({
          ...input,
          organization_id: organizationId,
          author_id: user.id,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
      toast.success('Article created successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to create article', {
        description: error.message
      })
    },
  })
}

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
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', data.id] })
      toast.success('Article updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update article', {
        description: error.message
      })
    },
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
      toast.success('Article deleted successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to delete article', {
        description: error.message
      })
    },
  })
}

// ===================== CATEGORIES =====================

export function useArticleCategories() {
  const { organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['knowledge-categories', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID')
      
      const { data: categoriesData, error } = await supabase
        .from('article_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      
      // Get article counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (cat) => {
          const { count } = await supabase
            .from('knowledge_articles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('category_id', cat.id)
            .eq('status', 'published')
          
          return {
            ...cat,
            count: count || 0,
          }
        })
      )
      
      return categoriesWithCounts
    },
    enabled: !!organizationId,
    staleTime: 60000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { organizationId, user } = useAuth()
  
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; icon?: string; color?: string }) => {
      if (!organizationId || !user) throw new Error('Not authenticated')
      
      // Generate slug from name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const { data, error } = await supabase
        .from('article_categories')
        .insert({
          ...input,
          slug,
          organization_id: organizationId,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
      toast.success('Category created successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to create category', {
        description: error.message
      })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; description?: string; icon?: string; color?: string }) => {
      // Generate new slug if name is being updated
      const updateData: any = { ...input }
      if (input.name) {
        updateData.slug = input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }
      
      const { data, error } = await supabase
        .from('article_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
      toast.success('Category updated successfully')
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error} = await supabase
        .from('article_categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
      toast.success('Category deleted successfully')
    },
  })
}

// ===================== BOOKMARKS =====================

export function useArticleBookmarks() {
  const { user, organizationId } = useAuth()
  
  return useQuery({
    queryKey: ['article-bookmarks', user?.id],
    queryFn: async () => {
      if (!user || !organizationId) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('article_bookmarks')
        .select(`
          *,
          article:knowledge_articles(id, title, summary, category_id, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user && !!organizationId,
  })
}

export function useIsArticleBookmarked(articleId: string | undefined) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['article-bookmark-status', articleId, user?.id],
    queryFn: async () => {
      if (!articleId || !user) return { isBookmarked: false, bookmarkId: null }
      
      const { data } = await supabase
        .from('article_bookmarks')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      return {
        isBookmarked: !!data,
        bookmarkId: data?.id || null,
      }
    },
    enabled: !!articleId && !!user,
  })
}

export function useToggleArticleBookmark() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()
  
  return useMutation({
    mutationFn: async ({ articleId, isBookmarked, bookmarkId }: { articleId: string; isBookmarked: boolean; bookmarkId?: string | null }) => {
      if (!user || !organizationId) throw new Error('Not authenticated')
      
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const { error } = await supabase
          .from('article_bookmarks')
          .delete()
          .eq('id', bookmarkId)
        
        if (error) throw error
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('article_bookmarks')
          .insert({
            article_id: articleId,
            user_id: user.id,
            organization_id: organizationId,
          })
        
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['article-bookmark-status', variables.articleId] })
      toast.success(variables.isBookmarked ? 'Bookmark removed' : 'Article bookmarked')
    },
  })
}

// ===================== VOTES =====================

export function useArticleVotes(articleId: string | undefined) {
  return useQuery({
    queryKey: ['article-votes', articleId],
    queryFn: async () => {
      if (!articleId) throw new Error('Article ID required')
      
      const { data, error } = await supabase
        .from('article_votes')
        .select('vote_type')
        .eq('article_id', articleId)
      
      if (error) throw error
      
      const helpful = data.filter(v => v.vote_type === 'helpful').length
      const notHelpful = data.filter(v => v.vote_type === 'not_helpful').length
      
      return { helpful, notHelpful }
    },
    enabled: !!articleId,
  })
}

export function useUserArticleVote(articleId: string | undefined) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user-article-vote', articleId, user?.id],
    queryFn: async () => {
      if (!articleId || !user) return null
      
      const { data } = await supabase
        .from('article_votes')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      return data
    },
    enabled: !!articleId && !!user,
  })
}

export function useVoteArticle() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()
  
  return useMutation({
    mutationFn: async ({ articleId, voteType }: { articleId: string; voteType: 'helpful' | 'not_helpful' }) => {
      if (!user || !organizationId) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('article_votes')
        .upsert({
          article_id: articleId,
          user_id: user.id,
          organization_id: organizationId,
          vote_type: voteType,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'article_id,user_id'
        })
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-votes', variables.articleId] })
      queryClient.invalidateQueries({ queryKey: ['user-article-vote', variables.articleId] })
      toast.success('Vote recorded')
    },
  })
}

// ===================== COMMENTS =====================

export function useArticleComments(articleId: string | undefined) {
  return useQuery({
    queryKey: ['article-comments', articleId],
    queryFn: async () => {
      if (!articleId) throw new Error('Article ID required')
      
      const { data, error } = await supabase
        .from('article_comments')
        .select(`
          *,
          user:profiles(id, email, first_name, last_name, display_name, avatar_url)
        `)
        .eq('article_id', articleId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!articleId,
  })
}

export function useAddArticleComment() {
  const queryClient = useQueryClient()
  const { user, organizationId } = useAuth()
  
  return useMutation({
    mutationFn: async ({ articleId, content, isInternal = false }: { articleId: string; content: string; isInternal?: boolean }) => {
      if (!user || !organizationId) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          organization_id: organizationId,
          content,
          is_internal: isInternal,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', variables.articleId] })
      toast.success('Comment added')
    },
  })
}

export function useDeleteArticleComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ commentId, articleId }: { commentId: string; articleId: string }) => {
      const { error } = await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId)
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', variables.articleId] })
      toast.success('Comment deleted')
    },
  })
}
