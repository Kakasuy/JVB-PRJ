'use client'

import { useState, useEffect } from 'react'
import { Combobox } from '@headlessui/react'
import { ChevronUpDownIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface AirportData {
  iataCode: string
  name: string
  address: {
    cityName: string
    countryName: string
  }
  geoCode: {
    latitude: number
    longitude: number
  }
}

interface AirportPickerProps {
  placeholder?: string
  description?: string
  onAirportSelect: (airport: AirportData | null) => void
  name?: string
  required?: boolean
  className?: string
}

const AirportPicker: React.FC<AirportPickerProps> = ({
  placeholder = "Search airports...",
  description = "Airport",
  onAirportSelect,
  name = "airport",
  required = false,
  className = ""
}) => {
  const [query, setQuery] = useState('')
  const [airports, setAirports] = useState<AirportData[]>([])
  const [selectedAirport, setSelectedAirport] = useState<AirportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Search function
  const searchAirports = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setAirports([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/airports?keyword=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setAirports(data.data || [])
      } else {
        console.error('Airport search failed')
        setAirports([])
      }
    } catch (error) {
      console.error('Airport search error:', error)
      setAirports([])
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
      searchAirports(query)
    }, 300)

    setDebounceTimer(newTimer)

    // Cleanup
    return () => {
      if (newTimer) {
        clearTimeout(newTimer)
      }
    }
  }, [query])

  const handleAirportSelect = (airport: AirportData | null) => {
    setSelectedAirport(airport)
    onAirportSelect(airport)
    if (airport) {
      setQuery(`${airport.iataCode} - ${airport.name}`)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Combobox value={selectedAirport} onChange={handleAirportSelect}>
        <div className="relative">
          <Combobox.Input
            className="w-full border-none bg-transparent p-0 text-sm font-semibold placeholder-neutral-400 focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 sm:text-base xl:text-lg"
            placeholder={placeholder}
            displayValue={(airport: AirportData) => 
              airport ? `${airport.iataCode} - ${airport.name}` : ''
            }
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
                Searching airports...
              </div>
            </div>
          )}
          
          {!loading && airports.length === 0 && query !== '' && (
            <div className="px-4 py-2 text-neutral-500">
              No airports found.
            </div>
          )}

          {airports.map((airport) => (
            <Combobox.Option
              key={`${airport.iataCode}-${airport.name}`}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                  active ? 'bg-primary-100 text-primary-900 dark:bg-primary-800 dark:text-primary-100' : 'text-neutral-900 dark:text-neutral-100'
                }`
              }
              value={airport}
            >
              {({ selected }) => (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-4 w-4 mt-0.5 text-neutral-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${selected ? 'text-primary-600' : ''}`}>
                        {airport.iataCode}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {airport.address?.cityName}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                      {airport.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {airport.address?.countryName}
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

export default AirportPicker