import { TStayListing } from '@/data/listings'
import { useCallback, useEffect, useState } from 'react'

interface UseHotelListResult {
  hotels: TStayListing[]
  loading: boolean
  error: string | null
  fetchHotelsByCity: (cityCode: string) => Promise<void>
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
  const getCacheKey = (cityCode: string) => `${CACHE_KEY_PREFIX}${cityCode}`

  const getCachedData = (cityCode: string): CachedHotelData | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(getCacheKey(cityCode))
      if (!cached) return null

      const data: CachedHotelData = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(getCacheKey(cityCode))
        return null
      }
      
      return data
    } catch (error) {
      console.warn('Failed to read hotel cache:', error)
      return null
    }
  }

  const setCachedData = (cityCode: string, hotels: TStayListing[]) => {
    if (typeof window === 'undefined') return
    
    try {
      const cacheData: CachedHotelData = {
        cityCode,
        hotels,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      }
      
      localStorage.setItem(getCacheKey(cityCode), JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache hotel data:', error)
    }
  }

  const fetchHotelsByCity = useCallback(async (cityCode: string) => {
    if (!cityCode) return
    
    // Try to get from cache first
    const cachedData = getCachedData(cityCode)
    if (cachedData) {
      console.log(`Using cached hotel data for ${cityCode}`)
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

      const response = await fetch(`/api/hotels-list?${searchParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch hotels')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setHotels(data.data)
        // Cache the result for future use
        setCachedData(cityCode, data.data)
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