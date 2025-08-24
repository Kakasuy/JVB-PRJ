'use client'

import T from '@/utils/getT'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter, useSearchParams } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { ButtonSubmit, VerticalDividerLine } from './ui'
import AirportPicker from '@/components/AirportPicker'
import GeocodingInput, { LocationData } from '@/components/GeocodingInput'

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

type TransferType = 'PRIVATE' | 'SHARED' | 'TAXI' | 'HOURLY' | 'AIRPORT_EXPRESS' | 'AIRPORT_BUS'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
}

const TRANSFER_TYPES = [
  { value: 'PRIVATE', label: 'Private Transfer', description: 'Dedicated vehicle for you' },
  { value: 'SHARED', label: 'Shared Transfer', description: 'Share with other passengers' },
  { value: 'TAXI', label: 'Taxi', description: 'Standard taxi service' },
  { value: 'HOURLY', label: 'Hourly Services', description: 'Book by hour with flexible stops' },
  { value: 'AIRPORT_EXPRESS', label: 'Airport Express', description: 'Fast direct airport connection' },
  { value: 'AIRPORT_BUS', label: 'Airport Buses', description: 'Scheduled bus service to airport' }
]

export const TransferSearchForm: FC<Props> = ({ className, formStyle = 'default' }) => {
  const [transferType, setTransferType] = useState<TransferType>('PRIVATE')
  const [passengers, setPassengers] = useState(2)
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  
  // Location data
  const [startAirport, setStartAirport] = useState<AirportData | null>(null)
  const [endLocation, setEndLocation] = useState<LocationData | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Prefetch the car categories page to improve performance
  useEffect(() => {
    router.prefetch('/car-categories/all')
  }, [router])

  // Set default date and time
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultDate = tomorrow.toISOString().split('T')[0]
    setPickupDate(defaultDate)
    setPickupTime('10:00')
  }, [])

  // Restore form state from URL parameters
  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const datetime = searchParams.get('datetime')
    const type = searchParams.get('type') as TransferType
    const passengersParam = searchParams.get('passengers')

    if (from) {
      // Parse airport info from "AMS - Amsterdam Airport Schiphol" format
      const [iataCode, ...nameParts] = from.split(' - ')
      if (iataCode && nameParts.length > 0) {
        const name = nameParts.join(' - ')
        setStartAirport({
          iataCode,
          name,
          address: { cityName: '', countryName: '' },
          geoCode: { latitude: 0, longitude: 0 }
        })
      }
    }

    if (to) {
      // Parse location info - this is the formatted_address
      setEndLocation({
        addressLine: to.split(',')[0] || to,
        cityName: to.split(',')[1]?.trim() || '',
        countryCode: '',
        geoCode: '0,0',
        name: to.split(',')[0] || to,
        formatted_address: to,
        place_id: 'restored'
      })
    }

    if (datetime) {
      const [date, time] = datetime.split('T')
      if (date) setPickupDate(date)
      if (time) setPickupTime(time.slice(0, 5)) // Remove seconds
    }

    if (type && TRANSFER_TYPES.some(t => t.value === type)) {
      setTransferType(type)
    }

    if (passengersParam) {
      const passengerCount = parseInt(passengersParam)
      if (passengerCount > 0 && passengerCount <= 8) {
        setPassengers(passengerCount)
      }
    }
  }, [searchParams])

  const handleAirportSelect = (airport: AirportData | null) => {
    setStartAirport(airport)
    console.log('🛫 Airport selected:', airport?.iataCode)
  }

  const handleLocationSelect = (location: LocationData) => {
    setEndLocation(location)
    console.log('📍 Destination selected:', location?.cityName)
  }

  const handleFormSubmit = async () => {
    console.log('🚗 Transfer search:', startAirport?.iataCode, '→', endLocation?.cityName)

    // Validate required fields
    if (!startAirport) {
      alert('Please select a departure airport')
      return
    }

    if (!endLocation) {
      alert('Please select a destination address')
      return
    }

    if (!pickupDate || !pickupTime) {
      alert('Please select pickup date and time')
      return
    }

    const pickupDateTime = `${pickupDate}T${pickupTime}:00`

    // Prepare search info for URL and display
    const searchInfo = {
      from: `${startAirport.iataCode} - ${startAirport.name}`,
      to: endLocation.formatted_address,
      datetime: pickupDateTime,
      type: transferType,
      passengers: passengers.toString()
    }

    // Clear any existing search data to ensure loading state shows
    sessionStorage.removeItem('transferSearchData')
    localStorage.removeItem('transferSearchData')
    
    // Navigate to car categories IMMEDIATELY to show loading state
    const urlParams = new URLSearchParams(searchInfo)
    const resultsUrl = `/car-categories/all?${urlParams.toString()}`
    router.push(resultsUrl)

    // Prepare API request data
    const requestData = {
      startLocationCode: startAirport.iataCode,
      endAddressLine: endLocation.addressLine,
      endCityName: endLocation.cityName,
      endCountryCode: endLocation.countryCode,
      endGeoCode: endLocation.geoCode,
      transferType: transferType,
      startDateTime: pickupDateTime,
      passengers: passengers,
      currencyCode: 'USD'
    }

    console.log('📤 Calling transfer search API in background...')

    // Call API in background after navigation
    try {
      const response = await fetch('/api/transfer-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (response.ok) {
        console.log('🎉 API complete! Storing results...')
        
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
        console.error('API Error:', result.error)
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
      console.error('Request failed:', error)
      // Store empty results to stop loading state
      const searchData = {
        searchParams: searchInfo,
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

  return (
    <Form
      className={clsx(
        'relative z-10 w-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'rounded-t-2xl rounded-b-4xl custom-shadow-1',
        formStyle === 'default' &&
          'rounded-t-2xl rounded-b-[40px] shadow-xl xl:rounded-t-3xl xl:rounded-b-[48px] dark:shadow-2xl'
      )}
      action={handleFormSubmit}
    >
      {/* TRANSFER TYPE SELECTION */}
      <Headless.RadioGroup
        value={transferType}
        onChange={setTransferType}
        aria-label="Transfer Type"
        name="transfer_type"
        className={clsx(
          'flex flex-wrap items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700',
          formStyle === 'small' && 'px-4 py-3 sm:px-7 sm:py-4 xl:px-8',
          formStyle === 'default' && 'px-4 py-3 sm:px-7 sm:py-4 xl:px-8 xl:py-6'
        )}
      >
        {TRANSFER_TYPES.map((type) => (
          <Headless.Radio
            key={type.value}
            value={type.value}
            className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900 sm:px-4`}
          >
            <span className="whitespace-nowrap">{type.label}</span>
          </Headless.Radio>
        ))}
      </Headless.RadioGroup>

      {/* LOCATION AND DATE/TIME INPUTS */}
      <div className="relative flex flex-wrap xl:flex-nowrap pr-16 sm:pr-20 xl:pr-24">
        {/* FROM Airport */}
        <div className={clsx(
          "w-full lg:w-[38%] xl:w-[35%] relative z-10 cursor-pointer flex items-center focus:outline-hidden text-start",
          formStyle === 'default' && 'px-4 py-4 sm:px-7 xl:px-8 xl:py-6',
          formStyle === 'small' && 'px-4 py-3 sm:px-7 xl:px-8'
        )}>
          <div className="grow">
            <AirportPicker
              placeholder="Search departure airport..."
              description="Pickup location"
              onAirportSelect={handleAirportSelect}
              name="start-airport"
              required
            />
          </div>
        </div>
        
        <VerticalDividerLine />
        
        {/* TO Location */}
        <div className={clsx(
          "w-full lg:w-[38%] xl:w-[35%] relative z-10 cursor-pointer flex items-center focus:outline-hidden text-start",
          formStyle === 'default' && 'px-4 py-4 sm:px-7 xl:px-8 xl:py-6',
          formStyle === 'small' && 'px-4 py-3 sm:px-7 xl:px-8'
        )}>
          <div className="grow">
            <GeocodingInput
              placeholder="Enter destination address..."
              description="Drop-off location"
              onLocationSelect={handleLocationSelect}
              name="end-location"
              required
            />
          </div>
        </div>
        
        <VerticalDividerLine />

        {/* DATE AND TIME */}
        <div className={clsx(
          "w-full lg:w-[14%] xl:w-[18%] relative z-10 shrink-0 cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start",
          formStyle === 'default' && 'px-3 py-4 sm:px-4 xl:px-5 xl:py-6',
          formStyle === 'small' && 'px-3 py-3 sm:px-4 xl:px-5'
        )}>
          <div className="w-full">
            <div className="flex flex-col gap-1">
              {/* Date Input */}
              <input
                type="date"
                name="pickup-date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={clsx(
                  "block w-full border-none bg-transparent p-0 font-semibold focus:ring-0 focus:outline-hidden text-neutral-800 dark:text-neutral-200",
                  formStyle === 'default' && 'text-sm xl:text-base',
                  formStyle === 'small' && 'text-xs sm:text-sm'
                )}
                required
              />
              
              {/* Time Input */}
              <input
                type="time"
                name="pickup-time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className={clsx(
                  "block w-full border-none bg-transparent p-0 font-semibold focus:ring-0 focus:outline-hidden text-neutral-800 dark:text-neutral-200",
                  formStyle === 'default' && 'text-sm xl:text-base',
                  formStyle === 'small' && 'text-xs sm:text-sm'
                )}
                required
              />
            </div>
            <div className="mt-0.5 text-start text-xs font-light text-neutral-400">
              <span className="line-clamp-1">Pickup date & time</span>
            </div>
          </div>
        </div>

        <VerticalDividerLine />

        {/* PASSENGERS */}
        <div className={clsx(
          "w-full lg:w-[10%] xl:w-[12%] relative z-10 cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start",
          formStyle === 'default' && 'px-2 py-4 sm:px-3 md:px-4 lg:px-5 xl:px-6 xl:py-6',
          formStyle === 'small' && 'px-2 py-3 sm:px-3 md:px-4 lg:px-5 xl:px-6'
        )}>
          <div className="w-full">
            <div className="flex items-center justify-center gap-1 mb-1">
              <button
                type="button"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                disabled={passengers <= 1}
              >
                -
              </button>
              <span className={clsx(
                "font-semibold min-w-[1.5rem] text-center text-neutral-800 dark:text-neutral-200",
                formStyle === 'default' && 'text-sm xl:text-base',
                formStyle === 'small' && 'text-xs sm:text-sm'
              )}>
                {passengers}
              </span>
              <button
                type="button"
                onClick={() => setPassengers(Math.min(8, passengers + 1))}
                className="w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                disabled={passengers >= 8}
              >
                +
              </button>
            </div>
            <div className="text-center text-xs font-light text-neutral-400">
              <span className="line-clamp-1">Passengers</span>
            </div>
          </div>
        </div>

        {/* Hidden inputs for form submission */}
        <input type="hidden" name="transfer-type" value={transferType} />
        <input type="hidden" name="passengers" value={passengers} />

        <button
          type="button"
          onClick={handleFormSubmit}
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 end-4 flex w-12 h-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:end-6 sm:h-12 sm:w-12",
            formStyle === 'small' && 'sm:end-5 sm:h-10 sm:w-10'
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </Form>
  )
}