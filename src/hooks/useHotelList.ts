import { TStayListing } from '@/data/listings'
import { useCallback, useEffect, useState } from 'react'

interface UseHotelListResult {
  hotels: TStayListing[]
  loading: boolean
  error: string | null
  fetchHotelsByCity: (cityCode: string, limit?: number) => Promise<void>
}

interface CachedHotelData {
  cityCode: string
  hotels: TStayListing[]
  timestamp: number
  expiresAt: number
}

const FALLBACK_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours for localStorage fallback
const CACHE_KEY_PREFIX = 'hotel-list-'

export const useHotelList = (): UseHotelListResult => {
  const [hotels, setHotels] = useState<TStayListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper functions for localStorage fallback cache
  const getCacheKey = (cityCode: string, limit?: number) => `${CACHE_KEY_PREFIX}${cityCode}-limit-${limit || 8}`

  const getFallbackCachedData = (cityCode: string, limit?: number): CachedHotelData | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(getCacheKey(cityCode, limit))
      if (!cached) return null

      const data: CachedHotelData = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(getCacheKey(cityCode, limit))
        return null
      }
      
      return data
    } catch (error) {
      console.warn('Failed to read localStorage cache:', error)
      return null
    }
  }

  const setFallbackCachedData = (cityCode: string, hotels: TStayListing[], limit?: number) => {
    if (typeof window === 'undefined') return
    
    try {
      const cacheData: CachedHotelData = {
        cityCode,
        hotels,
        timestamp: Date.now(),
        expiresAt: Date.now() + FALLBACK_CACHE_DURATION
      }
      
      localStorage.setItem(getCacheKey(cityCode, limit), JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache hotel data to localStorage:', error)
    }
  }

  // Try to get from persistent file cache first
  const getFileCachedData = async (cityCode: string, limit?: number): Promise<TStayListing[] | null> => {
    try {
      const response = await fetch(`/api/hotel-cache?cityCode=${cityCode}&limit=${limit || 16}`)
      const result = await response.json()
      
      if (result.success && result.cached && result.data) {
        console.log(`📋 Using file cache for ${cityCode} (${result.data.length} hotels)`)
        return result.data
      }
      
      return null
    } catch (error) {
      console.warn('Failed to read file cache:', error)
      return null
    }
  }

  // Save to persistent file cache
  const saveToFileCache = async (cityCode: string, hotels: TStayListing[], limit?: number) => {
    try {
      const response = await fetch('/api/hotel-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityCode, hotels, limit: limit || 16 })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log(`💾 Saved ${hotels.length} hotels to file cache for ${cityCode}`)
      }
    } catch (error) {
      console.warn('Failed to save to file cache:', error)
    }
  }

  const fetchHotelsByCity = useCallback(async (cityCode: string, limit?: number) => {
    if (!cityCode) return
    
    setLoading(true)
    setError(null)

    try {
      // 1. Try file cache first (persistent across restarts)
      const fileCachedData = await getFileCachedData(cityCode, limit)
      if (fileCachedData && fileCachedData.length >= (limit || 8)) {
        setHotels(fileCachedData)
        setLoading(false)
        return
      }

      // 2. Try localStorage cache as fallback
      const localCachedData = getFallbackCachedData(cityCode, limit)
      if (localCachedData && localCachedData.hotels.length >= (limit || 8)) {
        console.log(`📱 Using localStorage cache for ${cityCode} (${localCachedData.hotels.length} hotels)`)
        setHotels(localCachedData.hotels)
        // Also save to file cache for future persistence
        await saveToFileCache(cityCode, localCachedData.hotels, limit)
        setLoading(false)
        return
      }

      // 3. No cache found, fetch from API
      console.log(`🌐 Fetching fresh data for ${cityCode} (no cache available)`)
      
      const searchParams = new URLSearchParams({
        cityCode,
        radius: '20',
        radiusUnit: 'KM',
      })

      // Add limit parameter if specified
      if (limit && limit > 8) {
        searchParams.append('limit', limit.toString())
      }

      const response = await fetch(`/api/hotels-list?${searchParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch hotels')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setHotels(data.data)
        
        // Cache the result in both places
        setFallbackCachedData(cityCode, data.data, limit)
        await saveToFileCache(cityCode, data.data, limit)
        
        console.log(`✅ Fetched and cached ${data.data.length} hotels for ${cityCode}`)
      } else {
        throw new Error('No hotel data received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching hotels'
      setError(errorMessage)
      console.error('Hotel list error:', err)
      
      // Fallback to empty array on error
      setHotels([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    hotels,
    loading,
    error,
    fetchHotelsByCity,
  }
}