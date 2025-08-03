import { useCallback, useEffect, useState, useRef } from 'react'

export interface LocationSuggestion {
  id: string
  name: string
  displayName: string
  iataCode?: string
  type: 'AIRPORT' | 'CITY'
  address?: {
    cityName?: string
    countryName?: string
  }
  analytics?: {
    travelers?: {
      score?: number
    }
  }
}

interface UseLocationSearchResult {
  suggestions: LocationSuggestion[]
  loading: boolean
  error: string | null
  searchLocations: (query: string, locationType?: 'ALL' | 'CITY' | 'AIRPORT') => void
  clearSuggestions: () => void
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: LocationSuggestion[], timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useLocationSearch = (): UseLocationSearchResult => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchLocations = useCallback((query: string, locationType: 'ALL' | 'CITY' | 'AIRPORT' = 'ALL') => {
    // Cancel previous debounced call
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Don't search if query is too short
    if (!query || query.length < 2) {
      setSuggestions([])
      setError(null)
      return
    }

    // Debounce the search
    debounceTimeoutRef.current = setTimeout(async () => {
      // Check cache first (include type in cache key)
      const cacheKey = `${query.toLowerCase().trim()}_${locationType}`
      const cached = cache.get(cacheKey)
      const now = Date.now()

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        setSuggestions(cached.data)
        setError(null)
        return
      }

      // Cancel previous request if exists
      if (abortController) {
        abortController.abort()
      }

      const controller = new AbortController()
      setAbortController(controller)
      setLoading(true)
      setError(null)

      try {
        const url = `/api/location-search?q=${encodeURIComponent(query)}&type=${locationType}`
        const response = await fetch(url, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to search locations')
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          // Cache the results
          cache.set(cacheKey, { data: data.data, timestamp: now })
          setSuggestions(data.data)
        } else {
          setSuggestions([])
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled, ignore
          return
        }
        
        setError(err instanceof Error ? err.message : 'An error occurred while searching')
        setSuggestions([])
      } finally {
        setLoading(false)
        setAbortController(null)
      }
    }, 300) // 300ms debounce
  }, [abortController])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setError(null)
    
    // Cancel any pending debounced calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
  }, [abortController])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortController) {
        abortController.abort()
      }
    }
  }, [abortController])

  return {
    suggestions,
    loading,
    error,
    searchLocations,
    clearSuggestions,
  }
}