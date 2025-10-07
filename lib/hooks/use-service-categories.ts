import { useState, useEffect } from 'react'

interface ServiceCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parent_id?: string
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
  services?: any[]
}

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/service-categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching service categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async (categoryData: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)
      
      const response = await fetch('/api/service-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }
      
      const data = await response.json()
      
      // Add the new category to the top of the list
      setCategories(prev => [data.category, ...prev])
      
      return data.category
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error creating service category:', err)
      throw err
    }
  }

  const updateCategory = async (categoryData: { id: string; name?: string; description?: string; icon?: string; color?: string }) => {
    try {
      setError(null)
      
      const response = await fetch('/api/service-categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }
      
      const data = await response.json()
      
      // Update the category in the local state
      setCategories(prev => prev.map(cat => 
        cat.id === categoryData.id ? { ...cat, ...data.category } : cat
      ))
      
      return data.category
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error updating service category:', err)
      throw err
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/service-categories?id=${categoryId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }
      
      // Remove the category from the local state
      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error deleting service category:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  }
}
