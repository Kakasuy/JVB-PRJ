import { TStayListing } from '@/data/listings'
import { useCallback, useEffect, useState, useRef } from 'react'
import { 
  applyClientSideFilters, 
  requiresAPICall, 
  CLIENT_SIDE_FILTERS, 
  SERVER_SIDE_FILTERS,
  type ClientSideFilterParams 
} from '@/utils/clientSideFilters'

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
  rooms?: string
  radius?: string
  price_min?: string | null
  price_max?: string | null
  beds?: string | null
  bedrooms?: string | null
  bathrooms?: string | null
  room_types?: string | null
  amenities?: string | null
  hotel_stars?: string | null
  board_types?: string | null
  free_cancellation?: string | null
  refundable_only?: string | null
  payment_types?: string | null
}

export const useHotelSearch = (): UseHotelSearchResult => {
  const [hotels, setHotels] = useState<TStayListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Cache for server-side data and last search params
  const serverDataCache = useRef<TStayListing[]>([])
  const lastServerParams = useRef<HotelSearchParams>({})

  // Helper function to extract client-side filters from params
  const extractClientSideFilters = (params: HotelSearchParams): ClientSideFilterParams => {
    return {
      price_min: params.price_min,
      price_max: params.price_max,
      hotel_stars: params.hotel_stars,
      beds: params.beds,
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      free_cancellation: params.free_cancellation,
      refundable_only: params.refundable_only,
      payment_types: params.payment_types
    }
  }

  // Helper function to extract server-side filters from params
  const extractServerSideFilters = (params: HotelSearchParams): Partial<HotelSearchParams> => {
    return {
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults,
      rooms: params.rooms,
      radius: params.radius,
      amenities: params.amenities,
      board_types: params.board_types,
      room_types: params.room_types
    }
  }

  // Check if server-side params have changed
  const serverParamsChanged = (newParams: HotelSearchParams): boolean => {
    const newServerParams = extractServerSideFilters(newParams)
    const oldServerParams = extractServerSideFilters(lastServerParams.current)
    
    return JSON.stringify(newServerParams) !== JSON.stringify(oldServerParams)
  }

  const searchHotels = useCallback(async (params: HotelSearchParams = {}) => {
    console.log('🔍 useHotelSearch called with params:', params)
    
    // Check if we need to call API for server-side filters
    const needsAPICall = serverParamsChanged(params)
    const clientSideFilters = extractClientSideFilters(params)
    
    console.log('🤔 Analysis:', {
      needsAPICall,
      hasServerData: serverDataCache.current.length > 0,
      clientSideFilters
    })

    // If we have server data and only client-side filters changed, use client-side filtering
    if (!needsAPICall && serverDataCache.current.length > 0) {
      console.log('⚡ Using client-side filtering (instant response)')
      setLoading(true) // Brief loading for UI feedback
      
      // Apply client-side filters to cached server data
      const filteredHotels = applyClientSideFilters(serverDataCache.current, clientSideFilters)
      
      // Simulate brief loading for better UX
      setTimeout(() => {
        setHotels(filteredHotels)
        setError(null)
        setLoading(false)
      }, 100)
      
      return
    }

    // Need to make API call for server-side filters
    setLoading(true)
    setError(null)

    try {
      // Build search params - only include server-side filters for API call
      const serverParams = extractServerSideFilters(params)
      const searchParams = new URLSearchParams({
        cityCode: serverParams.cityCode || 'NYC',
        checkInDate: serverParams.checkInDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOutDate: serverParams.checkOutDate || new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: serverParams.adults || '2',
        rooms: serverParams.rooms || '1',
        radius: serverParams.radius || '20',
      })
      
      // Add server-side only filters
      if (serverParams.amenities) {
        searchParams.append('amenities', serverParams.amenities)
      }
      if (serverParams.board_types) {
        searchParams.append('board_types', serverParams.board_types)
      }
      if (serverParams.room_types) {
        searchParams.append('room_types', serverParams.room_types)
      }
      
      console.log('🔧 API call with server-side params:', Object.fromEntries(searchParams.entries()))

      const response = await fetch(`/api/hotels-search?${searchParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch hotels')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        // Cache server data
        serverDataCache.current = data.data
        lastServerParams.current = params
        
        // Apply client-side filters to fresh server data
        const filteredHotels = applyClientSideFilters(data.data, clientSideFilters)
        
        console.log('✅ API success:', {
          serverResults: data.data.length,
          finalResults: filteredHotels.length,
          appliedClientFilters: Object.keys(clientSideFilters).filter(key => 
            clientSideFilters[key as keyof ClientSideFilterParams] != null
          )
        })
        
        setHotels(filteredHotels)
      } else {
        throw new Error('No hotel data received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching hotels'
      setError(errorMessage)
      console.error('Hotel search error:', err)
      
      // Fallback to empty array on error
      setHotels([])
      serverDataCache.current = []
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