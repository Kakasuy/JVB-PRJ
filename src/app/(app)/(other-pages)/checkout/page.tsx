'use client'

import StartRating from '@/components/StartRating'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import Form from 'next/form'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import PayWith from './PayWith'
import YourTrip from './YourTrip'
import { useAuth } from '@/contexts/AuthContext'

interface CheckoutData {
  offer: {
    id: string
    checkInDate: string
    checkOutDate: string
    price: {
      total: string
      base: string
      currency: string
      taxes: any[]
    }
    room: {
      type: string
      description: string
      bedType: string
      beds: number
    }
    guests: {
      adults: number
      rooms: number
    }
    policies: any
    boardType: string
  }
  hotel: {
    id: string
    name: string
    address: string
    location: {
      lat: number
      lng: number
    }
    rating: number
    reviewCount: number
    featuredImage: string
    amenities: string[]
    beds: number
    bedrooms: number
    bathrooms: number
    chainCode?: string
  }
  searchParams: {
    checkInDate: string
    checkOutDate: string
    adults: number
    rooms: number
  }
}

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser } = useAuth()
  
  // State for checkout data
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [originalCheckoutData, setOriginalCheckoutData] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Pending changes state
  const [pendingChanges, setPendingChanges] = useState<{
    checkInDate?: string
    checkOutDate?: string
    adults?: number
    rooms?: number
  } | null>(null)

  // Get URL parameters
  const offerId = searchParams.get('offerId')
  const hotelId = searchParams.get('hotelId')
  const checkInDate = searchParams.get('checkInDate')
  const checkOutDate = searchParams.get('checkOutDate')
  const adults = searchParams.get('adults')
  const rooms = searchParams.get('rooms')

  React.useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [])

  // Fetch checkout data
  useEffect(() => {
    const fetchCheckoutData = async () => {
      if (!offerId || !hotelId || !checkInDate || !checkOutDate) {
        setError('Missing required checkout parameters')
        setLoading(false)
        return
      }

      try {
        const url = new URL(`/api/checkout/${offerId}`, window.location.origin)
        url.searchParams.set('hotelId', hotelId)
        url.searchParams.set('checkInDate', checkInDate)
        url.searchParams.set('checkOutDate', checkOutDate)
        if (adults) url.searchParams.set('adults', adults)
        if (rooms) url.searchParams.set('rooms', rooms)

        console.log('🛒 Fetching checkout data:', url.toString())

        const response = await fetch(url.toString())
        const data = await response.json()

        if (data.success) {
          setCheckoutData(data.data)
          setOriginalCheckoutData(data.data) // Store original for revert
          console.log('✅ Checkout data loaded:', data.data)
          console.log('🔍 Original URL offerId:', offerId)
          console.log('🔍 Returned offer ID:', data.data.offer.id)
          
          // Show fallback notification if offer was changed
          if (data.meta?.offerFallback) {
            console.log('🔄 Offer fallback applied:', data.meta.message)
            // You could show a toast notification here if desired
          } else if (offerId !== data.data.offer.id) {
            console.warn('⚠️ Offer ID mismatch! URL had:', offerId, 'but got:', data.data.offer.id)
          }
        } else {
          setError(data.error || 'Failed to load checkout data')
        }
      } catch (err) {
        console.error('❌ Error fetching checkout data:', err)
        setError('Failed to load checkout information')
      } finally {
        setLoading(false)
      }
    }

    fetchCheckoutData()
  }, [offerId, hotelId, checkInDate, checkOutDate, adults, rooms])

  // Handle date changes from YourTrip component
  const handleDateChange = (dates: { startDate: string, endDate: string }) => {
    if (!checkoutData) return
    
    const hasChanges = dates.startDate !== checkoutData.offer.checkInDate || 
                      dates.endDate !== checkoutData.offer.checkOutDate
    
    if (hasChanges) {
      setPendingChanges(prev => ({
        ...prev,
        checkInDate: dates.startDate,
        checkOutDate: dates.endDate
      }))
    } else {
      // Remove date changes if reverted to original
      setPendingChanges(prev => prev ? {
        ...prev,
        checkInDate: undefined,
        checkOutDate: undefined
      } : null)
    }
  }

  // Handle guests/rooms changes
  const handleGuestsChange = (guests: { rooms: number, adults: number }) => {
    if (!checkoutData) return
    
    const hasChanges = guests.rooms !== checkoutData.offer.guests.rooms || 
                      guests.adults !== checkoutData.offer.guests.adults
    
    if (hasChanges) {
      setPendingChanges(prev => ({
        ...prev,
        rooms: guests.rooms,
        adults: guests.adults
      }))
    } else {
      // Remove guest changes if reverted to original
      setPendingChanges(prev => prev ? {
        ...prev,
        rooms: undefined,
        adults: undefined
      } : null)
    }
  }

  // Check if there are any pending changes
  const hasPendingChanges = pendingChanges && Object.values(pendingChanges).some(v => v !== undefined)

  // Apply pending changes - revalidate offer with new parameters
  const applyChanges = async () => {
    if (!checkoutData || !hotelId || !pendingChanges) return
    
    setIsUpdating(true)
    
    try {
      // Use pending changes or fall back to current values
      const newCheckInDate = pendingChanges.checkInDate || checkoutData.offer.checkInDate
      const newCheckOutDate = pendingChanges.checkOutDate || checkoutData.offer.checkOutDate
      const newAdults = pendingChanges.adults || checkoutData.offer.guests.adults
      const newRooms = pendingChanges.rooms || checkoutData.offer.guests.rooms

      const url = new URL(`/api/checkout/${checkoutData.offer.id}`, window.location.origin)
      url.searchParams.set('hotelId', hotelId)
      url.searchParams.set('checkInDate', newCheckInDate)
      url.searchParams.set('checkOutDate', newCheckOutDate)
      url.searchParams.set('adults', newAdults.toString())
      url.searchParams.set('rooms', newRooms.toString())

      console.log('🔄 Applying changes:', { newCheckInDate, newCheckOutDate, newAdults, newRooms })

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        // Success - update checkout data and clear pending changes
        setCheckoutData(data.data)
        setPendingChanges(null)
        console.log('✅ Changes applied successfully')
      } else {
        // Offer not available - show error but keep pending changes
        setError(data.error || 'Offer not available with new parameters')
        console.log('❌ Offer not available:', data.error)
      }
    } catch (err) {
      console.error('❌ Error applying changes:', err)
      setError('Failed to apply changes. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Revert to original offer
  const revertChanges = () => {
    if (originalCheckoutData) {
      setCheckoutData(originalCheckoutData)
      setPendingChanges(null)
      setError(null)
      console.log('🔙 Reverted to original offer')
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const handleSubmitForm = async (formData: FormData) => {
    const formObject = Object.fromEntries(formData.entries())
    
    // Clear previous errors
    setBookingError(null)
    
    // Validate payment form first
    const paymentMethod = formObject.paymentMethod as string
    
    if (paymentMethod === 'creditCard') {
      // Basic client-side validation
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'cardNumber', 'cardHolder', 'expiryDate']
      const missingFields = requiredFields.filter(field => !formObject[field]?.toString().trim())
      
      if (missingFields.length > 0) {
        setBookingError(`Please fill in all required fields: ${missingFields.join(', ')}`)
        return
      }
      
      // Validate email format
      const email = formObject.email as string
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setBookingError('Please enter a valid email address')
        return
      }
      
      // Validate phone number
      const phone = formObject.phone as string
      if (phone.replace(/\D/g, '').length < 10) {
        setBookingError('Please enter a valid phone number')
        return
      }
      
      // Validate card number
      const cardNumber = formObject.cardNumber as string
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        setBookingError('Please enter a valid card number')
        return
      }
      
      // Validate expiry date
      const expiryDate = formObject.expiryDate as string
      if (expiryDate) {
        const today = new Date()
        const expiry = new Date(expiryDate + '-01') // Add day to make valid date
        if (expiry <= today) {
          setBookingError('Card has expired. Please use a valid card.')
          return
        }
      }
    }
    
    if (!checkoutData) {
      setBookingError('Checkout data not available. Please try again.')
      return
    }
    
    console.log('✅ Form validation passed. Submitting booking...')
    
    setIsSubmitting(true)
    
    try {
      // Prepare booking data
      const bookingPayload = {
        offerId: checkoutData.offer.id,
        hotelId: checkoutData.hotel.id,
        paymentMethod: formObject.paymentMethod as string,
        
        // Hotel Information for saving
        hotelName: checkoutData.hotel.name,
        hotelAddress: checkoutData.hotel.address,
        hotelImages: checkoutData.hotel.galleryImgs || (() => {
          const hotelImages = [
            'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
            'https://images.pexels.com/photos/261394/pexels-photo-261394.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
            'https://images.pexels.com/photos/2861361/pexels-photo-2861361.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
            'https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
            'https://images.pexels.com/photos/6527036/pexels-photo-6527036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
            'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
            'https://images.pexels.com/photos/7163619/pexels-photo-7163619.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
            'https://images.pexels.com/photos/6438752/pexels-photo-6438752.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
          ]
          const randomStart = Math.floor(Math.random() * hotelImages.length)
          return Array.from({ length: 4 }, (_, i) => 
            hotelImages[(randomStart + i) % hotelImages.length]
          )
        })(),
        totalPrice: parseFloat(checkoutData.offer.price.total),
        currency: checkoutData.offer.price.currency,
        
        // Guest Information
        title: formObject.title as string,
        firstName: formObject.firstName as string,
        lastName: formObject.lastName as string,
        email: formObject.email as string,
        phone: formObject.phone as string,
        
        // Payment Information
        cardNumber: formObject.cardNumber as string,
        cardHolder: formObject.cardHolder as string,
        expiryDate: formObject.expiryDate as string,
        cardVendor: formObject.cardVendor as string,
        
        // Booking Details
        checkInDate: checkoutData.offer.checkInDate,
        checkOutDate: checkoutData.offer.checkOutDate,
        adults: checkoutData.offer.guests.adults,
        rooms: checkoutData.offer.guests.rooms
      }
      
      console.log('🔄 Submitting booking to API:', bookingPayload)
      console.log('📤 Request Payload:', JSON.stringify(bookingPayload, null, 2))
      console.log('🔍 URL offerId:', offerId)
      console.log('🔍 Checkout data offerId:', checkoutData.offer.id)
      console.log('🔍 Booking payload offerId:', bookingPayload.offerId)
      
      // Get Firebase auth token
      const idToken = await currentUser?.getIdToken()
      if (!idToken) {
        throw new Error('Authentication required. Please log in.')
      }
      
      const response = await fetch('/api/booking/hotel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(bookingPayload),
      })
      
      console.log('📥 Response Status:', response.status, response.statusText)
      const result = await response.json()
      console.log('📥 Response Body:', JSON.stringify(result, null, 2))
      
      if (result.success) {
        console.log('✅ Booking successful:', result.data)
        
        // Save booking to our database on frontend
        try {
          const { BookingService } = await import('@/services/BookingService')
          
          const bookingToSave = BookingService.transformAmadeusToBooking(
            { data: result.data },
            bookingPayload,
            currentUser.uid
          )
          
          await BookingService.saveBooking(bookingToSave)
          console.log('✅ Booking saved to database:', bookingToSave.id)
        } catch (saveError) {
          console.error('⚠️ Failed to save booking to database:', saveError)
        }
        
        // Redirect to success page with booking details
        const successUrl = new URL('/pay-done', window.location.origin)
        
        // Basic booking information
        successUrl.searchParams.set('bookingId', result.data.bookingId)
        successUrl.searchParams.set('confirmationNumber', result.data.confirmationNumber || '')
        successUrl.searchParams.set('hotelName', checkoutData.hotel.name)
        
        // Additional hotel details
        successUrl.searchParams.set('hotelImage', checkoutData.hotel.featuredImage || '')
        successUrl.searchParams.set('location', checkoutData.hotel.address || '')
        successUrl.searchParams.set('checkInDate', checkoutData.offer.checkInDate)
        successUrl.searchParams.set('checkOutDate', checkoutData.offer.checkOutDate)
        successUrl.searchParams.set('adults', checkoutData.offer.guests.adults.toString())
        successUrl.searchParams.set('rooms', checkoutData.offer.guests.rooms.toString())
        
        // Pricing information
        successUrl.searchParams.set('totalPrice', checkoutData.offer.price.total || '0')
        successUrl.searchParams.set('currency', checkoutData.offer.price.currency || 'USD')
        successUrl.searchParams.set('paymentMethod', formObject.paymentMethod as string)
        
        // Guest information from booking response
        if (result.data.guest) {
          successUrl.searchParams.set('guestTitle', result.data.guest.title || '')
          successUrl.searchParams.set('guestFirstName', result.data.guest.firstName || '')
          successUrl.searchParams.set('guestLastName', result.data.guest.lastName || '')
          successUrl.searchParams.set('guestEmail', result.data.guest.email || '')
        }
        
        // Room details (but not hotel rating)
        if (checkoutData.hotel.beds) {
          successUrl.searchParams.set('beds', checkoutData.hotel.beds.toString())
        }
        if (checkoutData.hotel.bathrooms) {
          successUrl.searchParams.set('bathrooms', checkoutData.hotel.bathrooms.toString())
        }
        
        console.log('🔗 Redirecting to success page:', successUrl.toString())
        
        // Add delay to allow user to see the alert before redirect
        setTimeout(() => {
          router.push(successUrl.toString())
        }, 3000)
      } else {
        console.error('❌ Booking failed:', result.error)
        console.error('❌ Error Code:', result.code)
        console.error('❌ Error Details:', result.details)
        console.error('❌ Full Error Response:', JSON.stringify(result, null, 2))
        
        
        // Handle specific error codes
        if (result.code === 'OFFER_UNAVAILABLE') {
          setBookingError('This offer is no longer available. Please select a different option.')
        } else if (result.code === 'BOOKING_INVALID') {
          setBookingError('Booking information is invalid. Please check your details and try again.')
        } else if (result.code === 'MISSING_FIELDS' || result.code === 'MISSING_CARD_FIELDS') {
          setBookingError(result.error)
        } else {
          setBookingError(result.error || 'Booking failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('❌ Booking submission error:', error)
      console.error('❌ Network/Parse Error Details:', JSON.stringify(error, null, 2))
      
      
      setBookingError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSidebar = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-4">Loading checkout...</span>
          </div>
        </div>
      )
    }

    // Show error state
    if (error && !checkoutData) {
      return (
        <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg mb-4">Checkout Error</div>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              {error || 'Unable to load checkout information'}
            </p>
            <ButtonPrimary onClick={() => router.back()}>
              Go Back
            </ButtonPrimary>
          </div>
        </div>
      )
    }

    // Show offer unavailable error (but keep sidebar data)
    if (error && checkoutData && originalCheckoutData) {
      return (
        <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg mb-4">Offer Not Available</div>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              {error}
            </p>
            <div className="flex flex-col gap-3">
              <ButtonPrimary onClick={revertChanges}>
                Back to Previous Offer
              </ButtonPrimary>
              <button 
                onClick={() => router.back()}
                className="text-neutral-500 hover:text-neutral-700 text-sm underline"
              >
                Return to Hotel Detail
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (!checkoutData) {
      return null
    }

    const { hotel, offer } = checkoutData

    // Calculate number of nights
    const checkIn = new Date(offer.checkInDate)
    const checkOut = new Date(offer.checkOutDate)
    const numberOfNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

    // Pricing calculations
    const totalPrice = parseFloat(offer.price.total)
    const basePrice = parseFloat(offer.price.base || offer.price.total)
    const perNightPrice = basePrice / numberOfNights
    const taxesAndFees = totalPrice - basePrice
    const currency = offer.price.currency

    return (
      <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="w-full shrink-0 sm:w-40">
            <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
              <Image
                alt={hotel.name}
                fill
                sizes="200px"
                src={hotel.featuredImage}
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-3 py-5 text-start sm:ps-5">
            <div>
              <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                Hotel room in {hotel.address}
              </span>
              <span className="mt-1 block text-base font-medium line-clamp-2">{hotel.name}</span>
            </div>
            <p className="block text-sm text-neutral-500 dark:text-neutral-400">
              {hotel.beds} bed{hotel.beds !== 1 ? 's' : ''} · {hotel.bathrooms} bath{hotel.bathrooms !== 1 ? 's' : ''}
            </p>
            <Divider className="w-10!" />
            {/* Board Type Information - Replacing Rating/Reviews */}
            {offer.boardType && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-300/20">
                    {(() => {
                      const boardTypeMap: { [key: string]: { name: string; description: string } } = {
                        'ROOM_ONLY': { name: 'Room Only', description: 'No meals included' },
                        'BREAKFAST': { name: 'Breakfast', description: 'Breakfast included' },
                        'HALF_BOARD': { name: 'Half Board', description: 'Breakfast & dinner included' },
                        'FULL_BOARD': { name: 'Full Board', description: 'All meals included' },
                        'ALL_INCLUSIVE': { name: 'All Inclusive', description: 'All meals & drinks included' },
                        'SELF_CATERING': { name: 'Self Catering', description: 'Kitchen facilities available' },
                        'AMERICAN': { name: 'American Plan', description: 'All meals included' },
                        'CONTINENTAL': { name: 'Continental', description: 'Continental breakfast' },
                        'ENGLISH': { name: 'English Breakfast', description: 'Full English breakfast' }
                      };
                      return boardTypeMap[offer.boardType]?.name || offer.boardType.replace(/_/g, ' ');
                    })()}
                  </span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {(() => {
                    const boardTypeMap: { [key: string]: { name: string; description: string } } = {
                      'ROOM_ONLY': { name: 'Room Only', description: 'No meals included' },
                      'BREAKFAST': { name: 'Breakfast', description: 'Breakfast included' },
                      'HALF_BOARD': { name: 'Half Board', description: 'Breakfast & dinner included' },
                      'FULL_BOARD': { name: 'Full Board', description: 'All meals included' },
                      'ALL_INCLUSIVE': { name: 'All Inclusive', description: 'All meals & drinks included' },
                      'SELF_CATERING': { name: 'Self Catering', description: 'Kitchen facilities available' },
                      'AMERICAN': { name: 'American Plan', description: 'All meals included' },
                      'CONTINENTAL': { name: 'Continental', description: 'Continental breakfast' },
                      'ENGLISH': { name: 'English Breakfast', description: 'Full English breakfast' }
                    };
                    return boardTypeMap[offer.boardType]?.description || 'Meal plan included';
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>

        <Divider className="block lg:hidden" />

        <DescriptionList>
          <DescriptionTerm>{currency} {perNightPrice.toFixed(2)} x {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">{currency} {basePrice.toFixed(2)}</DescriptionDetails>
          
          {taxesAndFees > 0 && (
            <>
              <DescriptionTerm>Taxes & fees</DescriptionTerm>
              <DescriptionDetails className="sm:text-right">{currency} {taxesAndFees.toFixed(2)}</DescriptionDetails>
            </>
          )}
          
          <DescriptionTerm className="font-semibold text-neutral-900 dark:text-neutral-100">Total</DescriptionTerm>
          <DescriptionDetails className="font-semibold sm:text-right">{currency} {totalPrice.toFixed(2)}</DescriptionDetails>
        </DescriptionList>

        {/* Room Details */}
        {offer.room.description && (
          <>
            <Divider />
            <div>
              <h4 className="font-medium mb-2">Room Details</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {offer.room.description}
              </p>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderMain = () => {
    if (loading) {
      return (
        <div className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-4">Loading checkout...</span>
          </div>
        </div>
      )
    }

    if (error && !checkoutData) {
      return (
        <div className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700">
          <div className="text-center py-8">
            <h1 className="text-3xl font-semibold lg:text-4xl mb-4">Checkout Error</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              {error || 'Unable to load checkout information'}
            </p>
            <ButtonPrimary onClick={() => router.back()}>
              Go Back to Hotel
            </ButtonPrimary>
          </div>
        </div>
      )
    }

    if (!checkoutData) {
      return null
    }

    return (
      <Form
        action={handleSubmitForm}
        className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700"
      >
        <h1 className="text-3xl font-semibold lg:text-4xl">Confirm and payment</h1>
        <Divider />
        <YourTrip 
          defaultDates={{
            startDate: checkoutData.offer.checkInDate,
            endDate: checkoutData.offer.checkOutDate
          }}
          defaultGuests={{
            guestAdults: checkoutData.offer.guests.adults,
            guestChildren: 0,
            guestInfants: 0,
            rooms: checkoutData.offer.guests.rooms
          }}
          onDateChange={handleDateChange}
          onGuestsChange={handleGuestsChange}
        />
        
        {/* Apply Changes Button */}
        {hasPendingChanges && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Changes Pending</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Apply changes to update pricing and availability</p>
              </div>
              <ButtonPrimary 
                onClick={applyChanges}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Applying...</span>
                  </div>
                ) : (
                  'Apply Changes'
                )}
              </ButtonPrimary>
            </div>
          </div>
        )}
        
        {/* Show error if offer not available but allow continuing with form */}
        {error && checkoutData && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Offer Not Available</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
                <ButtonPrimary 
                  onClick={revertChanges}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Back to Previous Offer
                </ButtonPrimary>
              </div>
            </div>
          </div>
        )}
        <PayWith />
        
        {/* Booking Error Display */}
        {bookingError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Booking Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{bookingError}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden inputs for form submission */}
        <input type="hidden" name="offerId" value={checkoutData.offer.id} />
        <input type="hidden" name="hotelId" value={checkoutData.hotel.id} />
        
        <div>
          <ButtonPrimary 
            type="submit" 
            className="mt-10 text-base/6!"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing Booking...</span>
              </div>
            ) : (
              'Confirm and pay'
            )}
          </ButtonPrimary>
        </div>
      </Form>
    )
  }

  return (
    <main className="container mt-10 mb-24 flex flex-col gap-14 lg:mb-32 lg:flex-row lg:gap-10">
      <div className="w-full lg:w-3/5 xl:w-2/3">{renderMain()}</div>
      <Divider className="block lg:hidden" />
      <div className="grow">{renderSidebar()}</div>
    </main>
  )
}

export default Page
