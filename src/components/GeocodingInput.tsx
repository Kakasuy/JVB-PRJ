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
  const [inputValue, setInputValue] = useState('')
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
    if (location && location.place_id !== -1) { // Check if it's a real location, not virtual one
      const locationData = convertNominatimToLocationData(location)
      setSelectedLocation(location)
      onLocationSelect(locationData)
      setQuery(location.display_name)
      setInputValue(location.display_name)
      console.log('📍 Location selected:', locationData.cityName)
    } else {
      // Don't clear everything when selecting virtual location or null
      setSelectedLocation(null)
    }
  }

  // Create a virtual location from inputValue to prevent clearing
  const getComboboxValue = () => {
    if (selectedLocation) return selectedLocation
    if (inputValue) {
      return {
        place_id: -1, // Virtual ID to identify this as user input
        display_name: inputValue,
        lat: '0',
        lon: '0',
        address: {}
      } as LocationResult
    }
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <Combobox value={getComboboxValue()} onChange={(location: LocationResult) => handleLocationSelect(location)}>
        <div className="relative">
          <Combobox.Input
            className="w-full border-none bg-transparent p-0 text-sm font-semibold placeholder-neutral-400 focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 sm:text-base xl:text-lg"
            placeholder={placeholder}
            displayValue={(location: LocationResult) => location ? location.display_name : inputValue}
            onChange={(event) => {
              setInputValue(event.target.value)
              setQuery(event.target.value)
            }}
            name={name}
            required={required}
          />
          
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-4 w-4 text-neutral-400" />
          </Combobox.Button>
        </div>

        <Combobox.Options 
          static={false}
          className="absolute start-0 top-full z-40 mt-12 hidden-scrollbar max-h-96 overflow-y-auto rounded-3xl bg-white py-3 shadow-xl transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 dark:bg-neutral-800 w-full sm:py-6 pointer-events-auto"
        >
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
              className="flex items-center gap-3 p-4 data-focus:bg-neutral-100 sm:gap-4.5 sm:px-8 dark:data-focus:bg-neutral-700"
              value={location}
            >
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 text-neutral-400 sm:size-6 dark:text-neutral-500">
                  <path d="M13.6177 21.367C13.1841 21.773 12.6044 22 12.0011 22C11.3978 22 10.8182 21.773 10.3845 21.367C6.41302 17.626 1.09076 13.4469 3.68627 7.37966C5.08963 4.09916 8.45834 2 12.0011 2C15.5439 2 18.9126 4.09916 20.316 7.37966C22.9082 13.4393 17.599 17.6389 13.6177 21.367Z"/>
                  <path d="M15.5 11C15.5 12.933 13.933 14.5 12 14.5C10.067 14.5 8.5 12.933 8.5 11C8.5 9.067 10.067 7.5 12 7.5C13.933 7.5 15.5 9.067 15.5 11Z"/>
                </svg>
                <div className="flex flex-col">
                  <span className="block font-medium text-neutral-700 dark:text-neutral-200">
                    {location.display_name.split(',')[0]}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    City
                  </span>
                </div>
              </>
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