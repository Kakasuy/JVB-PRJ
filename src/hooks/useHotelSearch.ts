import { TStayListing } from '@/data/listings'
import { useCallback, useEffect, useState } from 'react'

interface UseHotelSearchResult {
  hotels: TStayListing[]
  loading: boolean
  error: string | null
  searchHotels: (params?: HotelSearchParams) => Promise<void>
}

interface HotelSearchParams {
  cityCode?: string
  checkInDate?: string
  checkOutDate?: string
  adults?: string
  radius?: string
  price_min?: string | null
  price_max?: string | null
}

export const useHotelSearch = (): UseHotelSearchResult => {
  const [hotels, setHotels] = useState<TStayListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchHotels = useCallback(async (params: HotelSearchParams = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        cityCode: params.cityCode || 'NYC',
        checkInDate: params.checkInDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        checkOutDate: params.checkOutDate || new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 32 days from now
        adults: params.adults || '2',
        radius: params.radius || '20',
      })
      
      // Add price filters if provided
      if (params.price_min) {
        searchParams.append('price_min', params.price_min)
      }
      if (params.price_max) {
        searchParams.append('price_max', params.price_max)
      }
      
      console.log('🔧 useHotelSearch building URL with params:', Object.fromEntries(searchParams.entries()))

      const response = await fetch(`/api/hotels-search?${searchParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch hotels')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setHotels(data.data)
      } else {
        throw new Error('No hotel data received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching hotels'
      setError(errorMessage)
      console.error('Hotel search error:', err)
      
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
    searchHotels,
  }
}