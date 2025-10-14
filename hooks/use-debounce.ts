import { useState, useEffect } from 'react'

/**
 * Debounce hook to delay updating a value until after a specified delay
 * Useful for search inputs to reduce API calls and re-renders
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 * 
 * // Use debouncedSearch in API calls or filters
 * const { data } = useQuery(['search', debouncedSearch], ...)
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay completes
    // This prevents the debounced value from updating on every keystroke
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
