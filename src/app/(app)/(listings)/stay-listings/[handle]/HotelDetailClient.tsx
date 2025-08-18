'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { Badge } from '@/shared/Badge'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import Form from 'next/form'
import { Fragment } from 'react'
import DatesRangeInputPopover from '../../components/DatesRangeInputPopover'
import GuestsInputPopover from '../../components/GuestsInputPopover'

interface HotelDetailClientProps {
  initialListing: any
  hotelId: string
  searchParams: {
    checkInDate?: string
    checkOutDate?: string
    adults?: string
    rooms?: string
  }
}

interface PricingState {
  loading: boolean
  error: string | null
  data: any | null
}

const HotelDetailClient: React.FC<HotelDetailClientProps> = ({
  initialListing,
  hotelId,
  searchParams: initialSearchParams
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Current applied state (what's actually being used for pricing)
  const [appliedState, setAppliedState] = useState({
    checkInDate: initialSearchParams.checkInDate || '',
    checkOutDate: initialSearchParams.checkOutDate || '',
    adults: parseInt(initialSearchParams.adults || '1'),
    rooms: parseInt(initialSearchParams.rooms || '1')
  })
  
  // Pending form state (what user is currently editing)
  const [pendingState, setPendingState] = useState({
    checkInDate: initialSearchParams.checkInDate || '',
    checkOutDate: initialSearchParams.checkOutDate || '',
    adults: parseInt(initialSearchParams.adults || '1'),
    rooms: parseInt(initialSearchParams.rooms || '1')
  })
  
  // Pricing state
  const [pricing, setPricing] = useState<PricingState>({
    loading: false,
    error: null,
    data: initialListing
  })
  
  // Check if there are pending changes
  const hasPendingChanges = 
    pendingState.checkInDate !== appliedState.checkInDate ||
    pendingState.checkOutDate !== appliedState.checkOutDate ||
    pendingState.adults !== appliedState.adults ||
    pendingState.rooms !== appliedState.rooms

  // Debounced API call to fetch new pricing
  const fetchNewPricing = useCallback(async (params: {
    checkInDate: string
    checkOutDate: string
    adults: number
    rooms: number
  }) => {
    if (!params.checkInDate || !params.checkOutDate) return

    setPricing(prev => ({ ...prev, loading: true, error: null }))

    try {
      const url = new URL(`/api/hotel-detail/${hotelId}`, window.location.origin)
      url.searchParams.set('checkInDate', params.checkInDate)
      url.searchParams.set('checkOutDate', params.checkOutDate)
      url.searchParams.set('adults', params.adults.toString())
      url.searchParams.set('rooms', params.rooms.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success && data.data) {
        setPricing({
          loading: false,
          error: null,
          data: data.data
        })
      } else {
        setPricing({
          loading: false,
          error: 'No available offers for selected dates and guests',
          data: null
        })
      }
    } catch (error) {
      console.error('Error fetching new pricing:', error)
      setPricing({
        loading: false,
        error: 'Failed to fetch pricing. Please try again.',
        data: null
      })
    }
  }, [hotelId])

  // Handle date changes (only update pending state)
  const handleDateChange = useCallback((dates: { startDate?: string, endDate?: string }) => {
    setPendingState(prev => ({
      ...prev,
      checkInDate: dates.startDate || prev.checkInDate,
      checkOutDate: dates.endDate || prev.checkOutDate
    }))
  }, [])

  // Handle guests change (only update pending state)
  const handleGuestsChange = useCallback((guests: { adults?: number, rooms?: number }) => {
    setPendingState(prev => ({
      ...prev,
      adults: guests.adults ?? prev.adults,
      rooms: guests.rooms ?? prev.rooms
    }))
  }, [])
  
  // Apply all pending changes
  const applyChanges = useCallback(() => {
    if (!pendingState.checkInDate || !pendingState.checkOutDate) {
      alert('Please select both check-in and check-out dates')
      return
    }
    
    setAppliedState(pendingState)
    
    fetchNewPricing({
      checkInDate: pendingState.checkInDate,
      checkOutDate: pendingState.checkOutDate,
      adults: pendingState.adults,
      rooms: pendingState.rooms
    })
  }, [pendingState, fetchNewPricing])

  const renderSidebarPriceAndForm = () => {
    // Show loading state
    if (pricing.loading) {
      return (
        <div className="listingSection__wrap sm:shadow-xl">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-4">Updating prices...</span>
          </div>
        </div>
      )
    }

    // Show error state
    if (pricing.error || !pricing.data) {
      return (
        <div className="listingSection__wrap sm:shadow-xl">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg mb-4">No Available Offers</div>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              {pricing.error || 'No offers available for the selected dates and guests.'}
            </p>
            <ButtonSecondary 
              onClick={() => window.location.reload()}
              className="bg-neutral-100 hover:bg-neutral-200"
            >
              Try Different Dates
            </ButtonSecondary>
          </div>
        </div>
      )
    }

    // Get pricing data
    const listing = pricing.data
    const amadeusData = listing?.amadeus
    const offer = amadeusData?.offers?.[0]
    const priceInfo = offer?.price
    
    const basePrice = priceInfo?.base ? parseFloat(priceInfo.base) : null
    const totalPrice = priceInfo?.total ? parseFloat(priceInfo.total) : null
    const currency = priceInfo?.currency || 'USD'
    const taxesAmount = priceInfo?.taxes ? parseFloat(priceInfo.taxes[0]?.amount || '0') : 0
    
    // Calculate number of nights using applied state (for pricing)
    let numberOfNights = 1
    if (appliedState.checkInDate && appliedState.checkOutDate) {
      const checkIn = new Date(appliedState.checkInDate)
      const checkOut = new Date(appliedState.checkOutDate)
      numberOfNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
    }
    
    const perNightPrice = basePrice ? basePrice : (totalPrice ? totalPrice / numberOfNights : null)
    const displayPrice = perNightPrice ? `${currency} ${perNightPrice.toFixed(2)}` : 'N/A'
    const displayTotal = totalPrice ? `${currency} ${totalPrice.toFixed(2)}` : 'N/A'

    // Client-side form submission handler
    const handleSubmitForm = async (formData: FormData) => {
      console.log('Form submitted with data:', Object.fromEntries(formData.entries()))
      // TODO: Redirect to checkout or process booking
      alert('Booking functionality coming soon!')
    }

    return (
      <div className="listingSection__wrap sm:shadow-xl">
        {/* PRICE */}
        <div className="flex items-end flex-nowrap text-xl font-semibold sm:text-2xl lg:text-3xl">
          {totalPrice && perNightPrice && (
            <span className="text-neutral-300 line-through mr-2 flex-shrink-0 text-lg sm:text-xl lg:text-2xl">
              {currency} {(perNightPrice * 1.15).toFixed(0)}
            </span>
          )}
          <span className="flex-shrink-0">{displayPrice}</span>
          <div className="pb-1 ml-1 flex-shrink-0">
            <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 sm:text-base">/night</span>
          </div>
        </div>

        {/* FORM */}
        <Form
          action={handleSubmitForm}
          className="flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-700"
          id="booking-form"
        >
          <input type="hidden" name="checkInDate" value={appliedState.checkInDate} />
          <input type="hidden" name="checkOutDate" value={appliedState.checkOutDate} />
          <input type="hidden" name="adults" value={appliedState.adults} />
          <input type="hidden" name="rooms" value={appliedState.rooms} />
          <input type="hidden" name="hotelId" value={hotelId} />
          
          <DatesRangeInputPopover 
            className="z-11 flex-1"
            defaultDates={{
              startDate: pendingState.checkInDate,
              endDate: pendingState.checkOutDate
            }}
            onDateChange={handleDateChange}
          />
          <div className="w-full border-b border-neutral-200 dark:border-neutral-700"></div>
          <GuestsInputPopover 
            className="flex-1"
            defaultGuests={{
              adults: pendingState.adults,
              children: 0,
              infants: 0,
              rooms: pendingState.rooms
            }}
            onGuestsChange={handleGuestsChange}
          />
          
          {/* Apply Button */}
          {hasPendingChanges && (
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={applyChanges}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Apply Changes
              </button>
            </div>
          )}
        </Form>

        {/* PRICE BREAKDOWN */}
        <DescriptionList>
          {perNightPrice && (
            <>
              <DescriptionTerm>{currency} {perNightPrice.toFixed(2)} x {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}</DescriptionTerm>
              <DescriptionDetails className="sm:text-right">{currency} {(perNightPrice * numberOfNights).toFixed(2)}</DescriptionDetails>
            </>
          )}
          
          {totalPrice && perNightPrice && totalPrice !== (perNightPrice * numberOfNights) && (
            <>
              <DescriptionTerm>Taxes & fees</DescriptionTerm>
              <DescriptionDetails className="sm:text-right">
                {taxesAmount > 0 ? (
                  `${currency} ${taxesAmount.toFixed(2)}`
                ) : (
                  `${currency} ${(totalPrice - (perNightPrice * numberOfNights)).toFixed(2)}`
                )}
              </DescriptionDetails>
            </>
          )}
          
          <DescriptionTerm className="font-semibold text-neutral-900 dark:text-neutral-100">Total</DescriptionTerm>
          <DescriptionDetails className="font-semibold sm:text-right">{displayTotal}</DescriptionDetails>
        </DescriptionList>

        {/* SUBMIT */}
        <ButtonPrimary form="booking-form" type="submit" className="w-full">
          {T['common']['Reserve']}
        </ButtonPrimary>
      </div>
    )
  }

  return (
    <div className="sticky top-5">
      {renderSidebarPriceAndForm()}
    </div>
  )
}

export default HotelDetailClient