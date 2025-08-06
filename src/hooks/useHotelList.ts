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

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_KEY_PREFIX = 'hotel-list-'

export const useHotelList = (): UseHotelListResult => {
  const [hotels, setHotels] = useState<TStayListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper functions for localStorage cache
  const getCacheKey = (cityCode: string, limit?: number) => `${CACHE_KEY_PREFIX}${cityCode}-limit-${limit || 8}`

  const getCachedData = (cityCode: string, limit?: number): CachedHotelData | null => {
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
      console.warn('Failed to read hotel cache:', error)
      return null
    }
  }

  const setCachedData = (cityCode: string, hotels: TStayListing[], limit?: number) => {
    if (typeof window === 'undefined') return
    
    try {
      const cacheData: CachedHotelData = {
        cityCode,
        hotels,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      }
      
      localStorage.setItem(getCacheKey(cityCode, limit), JSON.stringify(cacheData))
      
      // Update global cache timestamp when any city cache is created
      const cacheTimestampKey = 'hotels-cache-timestamp'
      localStorage.setItem(cacheTimestampKey, Date.now().toString())
    } catch (error) {
      console.warn('Failed to cache hotel data:', error)
    }
  }

  const fetchHotelsByCity = useCallback(async (cityCode: string, limit?: number) => {
    if (!cityCode) return
    
    // Try to get from cache first
    const cachedData = getCachedData(cityCode, limit)
    if (cachedData && cachedData.hotels.length >= (limit || 8)) {
      console.log(`Using cached hotel data for ${cityCode} with limit ${limit || 8}`)
      setHotels(cachedData.hotels)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
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
        // Cache the result for future use
        setCachedData(cityCode, data.data, limit)
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