'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface AutoTransferSearchProps {
  className?: string
}

const AutoTransferSearch: React.FC<AutoTransferSearchProps> = () => {
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log('🚀 AutoTransferSearch useEffect triggered')
    
    const from = searchParams.get('from')
    const to = searchParams.get('to') 
    const datetime = searchParams.get('datetime')
    const hasSearchParams = from && to && datetime
    
    console.log('📊 URL Params check:', {
      from,
      to, 
      datetime,
      hasSearchParams
    })
    
    if (!hasSearchParams) {
      console.log('❌ Missing required URL params, skipping auto-search')
      return
    }


    // Always call API when we have URL params (F5 refresh behavior)
    console.log('🔄 Auto-triggering transfer search from URL params (F5 refresh)...')
    
    // Clear existing data first to show fresh loading state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('transferSearchData')
      localStorage.removeItem('transferSearchData')
      // Notify other components that data was cleared
      window.dispatchEvent(new CustomEvent('transferSearchUpdated'))
    }
    
    triggerTransferSearch()
  }, [searchParams])

  const triggerTransferSearch = async () => {
    // Get params from URL
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const datetime = searchParams.get('datetime') || ''
    const type = searchParams.get('type') || 'PRIVATE'
    const passengers = searchParams.get('passengers') || '1'

    // Parse airport info from 'from' param (format: "CDG - CHARLES DE GAULLE")
    const airportParts = from.split(' - ')
    if (airportParts.length < 2) {
      console.error('Invalid airport format in URL')
      return
    }

    const startLocationCode = airportParts[0]
    
    // Get geocode for destination address using Google Places API
    console.log('🗺️ Getting geocode for destination:', to)
    
    let endGeoCode = null
    let endCityName = ''
    let endCountryCode = ''
    let endAddressLine = to
    
    try {
      const placesResponse = await fetch(`/api/google-places?input=${encodeURIComponent(to)}`)
      const placesResult = await placesResponse.json()
      
      if (placesResult.status === 'OK' && placesResult.data?.length > 0) {
        const place = placesResult.data[0]
        endGeoCode = `${place.geometry.location.lat},${place.geometry.location.lng}`
        
        // Extract city and country from address components
        for (const component of place.address_components || []) {
          if (component.types.includes('locality')) {
            endCityName = component.long_name
          } else if (component.types.includes('country')) {
            endCountryCode = component.short_name
          }
        }
        
        endAddressLine = place.formatted_address
        console.log('✅ Got geocode:', endGeoCode, 'for', endAddressLine)
      } else {
        console.warn('⚠️ Could not geocode destination address')
        return
      }
    } catch (error) {
      console.error('Failed to geocode address:', error)
      return
    }
    
    const requestData = {
      startLocationCode,
      endAddressLine,
      endCityName: endCityName || to,
      endCountryCode: endCountryCode || 'FR',
      endGeoCode,
      transferType: type,
      startDateTime: datetime,
      passengers: parseInt(passengers),
      currencyCode: 'USD'
    }

    console.log('📤 Calling transfer search API...', requestData)

    try {
      const response = await fetch('/api/transfer-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      const searchInfo = {
        from,
        to,
        datetime,
        type,
        passengers
      }

      if (response.ok) {
        console.log('✅ Auto-search API complete! Storing results...')
        
        const searchData = {
          searchParams: searchInfo,
          apiData: requestData,
          results: result.data || [],
          searchTimestamp: Date.now()
        }

        // Store search data and results
        sessionStorage.setItem('transferSearchData', JSON.stringify(searchData))
        localStorage.setItem('transferSearchData', JSON.stringify(searchData))
        
        // Trigger custom event to notify components of data change
        window.dispatchEvent(new CustomEvent('transferSearchUpdated'))
        
      } else {
        console.error('Auto-search API Error:', result.error)
        // Store empty results to stop loading state
        const searchData = {
          searchParams: searchInfo,
          apiData: requestData,
          results: [],
          error: result.error,
          searchTimestamp: Date.now()
        }
        sessionStorage.setItem('transferSearchData', JSON.stringify(searchData))
        localStorage.setItem('transferSearchData', JSON.stringify(searchData))
        window.dispatchEvent(new CustomEvent('transferSearchUpdated'))
      }
    } catch (error) {
      console.error('Auto-search request failed:', error)
      // Store empty results to stop loading state
      const searchData = {
        searchParams: {
          from,
          to,
          datetime,
          type,
          passengers
        },
        apiData: requestData,
        results: [],
        error: error.message,
        searchTimestamp: Date.now()
      }
      sessionStorage.setItem('transferSearchData', JSON.stringify(searchData))
      localStorage.setItem('transferSearchData', JSON.stringify(searchData))
      window.dispatchEvent(new CustomEvent('transferSearchUpdated'))
    }
  }

  return null // This component doesn't render anything
}

export default AutoTransferSearch