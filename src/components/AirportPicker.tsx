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
  const [inputValue, setInputValue] = useState('')
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
      const airportText = `${airport.iataCode} - ${airport.name}`
      setQuery(airportText)
      setInputValue(airportText)
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
              airport ? `${airport.iataCode} - ${airport.name}` : inputValue
            }
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
              className="flex items-center gap-3 p-4 data-focus:bg-neutral-100 sm:gap-4.5 sm:px-8 dark:data-focus:bg-neutral-700"
              value={airport}
            >
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 text-neutral-400 sm:size-6 dark:text-neutral-500">
                  <path d="M17.8 19.2L16 11l3.5-3.5C20 7 20 6.5 19.5 6.5s-1.5.5-1.5.5L12 9 6 2H4l2 7-2 1-2-2H0l2 4 2 4h2l2-2 2 1 7 2h2z" />
                </svg>
                <div className="flex flex-col">
                  <span className="block font-medium text-neutral-700 dark:text-neutral-200">
                    {airport.iataCode} - {airport.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Airport
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

export default AirportPicker