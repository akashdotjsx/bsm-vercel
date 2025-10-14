import { useState } from 'react'

interface Service {
  id: string
  name: string
  description?: string
  category_id: string
  estimated_delivery_days?: number
  popularity_score?: number
  status?: string
  organization_id?: string
  created_at?: string
  updated_at?: string
}

interface AddServiceData {
  name: string
  description?: string
  category_id: string
  estimated_delivery_days?: number
  popularity_score?: number
}

interface UpdateServiceData {
  id: string
  name?: string
  description?: string
  estimated_delivery_days?: number
  popularity_score?: number
}

export function useServices() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addService = async (serviceData: AddServiceData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create service')
      }
      
      const data = await response.json()
      return data.service
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error creating service:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateService = async (serviceData: UpdateServiceData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update service')
      }
      
      const data = await response.json()
      return data.service
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error updating service:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteService = async (serviceId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/services?id=${serviceId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete service')
      }
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error deleting service:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    addService,
    updateService,
    deleteService
  }
}