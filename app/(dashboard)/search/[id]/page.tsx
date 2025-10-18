'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SearchPage from '../page'

export default function SearchIDPage() {
  const params = useParams()
  const [query, setQuery] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSearchQuery = async () => {
      const id = params.id as string
      
      if (!id) {
        setQuery('')
        setLoading(false)
        return
      }

      try {
        // Fetch the query from the search ID
        const response = await fetch(`/api/search/id?id=${encodeURIComponent(id)}`)
        
        if (response.ok) {
          const { query: searchQuery } = await response.json()
          setQuery(searchQuery)
        } else {
          // ID not found, show empty search
          setQuery('')
        }
      } catch (error) {
        console.error('Error fetching search query:', error)
        setQuery('')
      } finally {
        setLoading(false)
      }
    }

    fetchSearchQuery()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading search...</p>
        </div>
      </div>
    )
  }

  // Render the search page with the fetched query (URL stays as /search/abc123)
  return <SearchPage initialQuery={query || ''} />
}
