'use client'

import { useState, useEffect, useCallback } from 'react'
import { Combobox } from '@headlessui/react'
import { ChevronUpDownIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface LocationResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
    country_code?: string
    postcode?: string
  }
}

export interface LocationData {
  addressLine: string
  cityName: string
  countryCode: string
  geoCode: string // "lat,lng" format
  name: string
  formatted_address: string
  place_id: string
}

interface GeocodingInputProps {
  placeholder?: string
  description?: string
  onLocationSelect: (location: LocationData) => void
  name?: string
  required?: boolean
  className?: string
}

const GeocodingInput: React.FC<GeocodingInputProps> = ({
  placeholder = "Enter destination address...",
  description = "Destination",
  onLocationSelect,
  name = "location",
  required = false,
  className = ""
}) => {
  const [query, setQuery] = useState('')
  const [locations, setLocations] = useState<LocationResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Custom debounce hook
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Convert Nominatim result to our LocationData format
  const convertNominatimToLocationData = (result: LocationResult): LocationData => {
    const address = result.address
    
    // Build address line from components
    const addressParts = []
    if (address.house_number) addressParts.push(address.house_number)
    if (address.road) addressParts.push(address.road)
    if (address.suburb) addressParts.push(address.suburb)
    
    const addressLine = addressParts.length > 0 ? addressParts.join(' ') : result.display_name.split(',')[0]
    const cityName = address.city || address.town || address.village || address.county || address.state || ''
    const countryCode = address.country_code?.toUpperCase() || ''
    const geoCode = `${result.lat},${result.lon}`
    
    return {
      addressLine,
      cityName,
      countryCode,
      geoCode,
      name: addressLine,
      formatted_address: result.display_name,
      place_id: result.place_id.toString()
    }
  }

  // Search function using OpenStreetMap Nominatim
  const searchLocations = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setLocations([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=8&countrycodes=&accept-language=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        setLocations(data || [])
      } else {
        console.error('Geocoding search failed')
        setLocations([])
      }
    } catch (error) {
      console.error('Geocoding search error:', error)
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      searchLocations(query)
    }, 500)

    setDebounceTimer(newTimer)

    // Cleanup
    return () => {
      if (newTimer) {
        clearTimeout(newTimer)
      }
    }
  }, [query])

  const handleLocationSelect = (location: LocationResult | null) => {
    if (location) {
      const locationData = convertNominatimToLocationData(location)
      setSelectedLocation(location)
      onLocationSelect(locationData)
      setQuery(location.display_name)
      console.log('📍 Location selected:', locationData.cityName)
    } else {
      setSelectedLocation(null)
      setQuery('')
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Combobox value={selectedLocation} onChange={(location: LocationResult) => handleLocationSelect(location)}>
        <div className="relative">
          <Combobox.Input
            className="w-full border-none bg-transparent p-0 text-sm font-semibold placeholder-neutral-400 focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 sm:text-base xl:text-lg"
            placeholder={placeholder}
            displayValue={(location: LocationResult) => location ? location.display_name : query}
            onChange={(event) => setQuery(event.target.value)}
            name={name}
            required={required}
          />
          
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-4 w-4 text-neutral-400" />
          </Combobox.Button>
        </div>

        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 sm:text-sm">
          {loading && (
            <div className="px-4 py-2 text-neutral-500">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600"></div>
                Searching locations...
              </div>
            </div>
          )}
          
          {!loading && locations.length === 0 && query.length >= 3 && (
            <div className="px-4 py-2 text-neutral-500">
              No locations found.
            </div>
          )}

          {locations.map((location) => (
            <Combobox.Option
              key={location.place_id}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                  active ? 'bg-primary-100 text-primary-900 dark:bg-primary-800 dark:text-primary-100' : 'text-neutral-900 dark:text-neutral-100'
                }`
              }
              value={location}
            >
              {({ selected }) => (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-4 w-4 mt-0.5 text-neutral-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {location.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      {location.display_name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {location.address?.country || 'Unknown Country'}
                    </div>
                  </div>
                </div>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
      
      <div className="mt-1 text-sm font-light text-neutral-400">
        <span className="line-clamp-1">{description}</span>
      </div>
    </div>
  )
}

export default GeocodingInput