'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import Form from 'next/form'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import TransferTrip from './TransferTrip'
import PayWith from './PayWith'
import { useAuth } from '@/contexts/AuthContext'

interface TransferCheckoutData {
  offer: {
    id: string
    transferType: string
    vehicle: {
      code: string
      description: string
      seats: Array<{
        count: number
      }>
      baggages: Array<{
        count: number
        size: string
      }>
      imageURL: string
    }
    start: {
      locationCode: string
      dateTime: string
    }
    end: {
      address: {
        line: string
        cityName: string
        countryCode: string
      }
      dateTime: string
    }
    quotation: {
      monetaryAmount: string
      currencyCode: string
    }
    serviceProvider: {
      logoUrl: string
      name: string
    }
  }
  searchParams: {
    from: string
    to: string
    datetime: string
    passengers: number
  }
}

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser } = useAuth()
  
  // State for checkout data
  const [checkoutData, setCheckoutData] = useState<TransferCheckoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get URL parameters
  const offerId = searchParams.get('offerId')

  React.useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [])

  // Fetch checkout data from sessionStorage/localStorage
  useEffect(() => {
    const fetchCheckoutData = () => {
      if (!offerId) {
        setError('Missing transfer offer ID')
        setLoading(false)
        return
      }

      try {
        // Try sessionStorage first, then localStorage for tab compatibility
        let storedData = sessionStorage.getItem('transferSearchData')
        if (!storedData) {
          storedData = localStorage.getItem('transferSearchData')
        }
        
        if (!storedData) {
          setError('Transfer data not found. Please search again.')
          setLoading(false)
          return
        }

        const searchData = JSON.parse(storedData)
        const offers = searchData.results || []
        
        console.log('🔍 Looking for transfer offer:', offerId)
        console.log('📊 Available offers:', offers.length)
        
        const foundOffer = offers.find((offer: any) => offer.id === offerId)
        
        if (!foundOffer) {
          setError('Transfer offer not found or expired. Please search again.')
          setLoading(false)
          return
        }

        const transferCheckoutData: TransferCheckoutData = {
          offer: foundOffer,
          searchParams: searchData.searchParams || {
            from: foundOffer.start?.locationCode || '',
            to: foundOffer.end?.address?.cityName || '',
            datetime: foundOffer.start?.dateTime || '',
            passengers: foundOffer.vehicle?.seats?.reduce((sum: number, seat: any) => sum + seat.count, 0) || 1
          }
        }

        setCheckoutData(transferCheckoutData)
        console.log('✅ Transfer checkout data loaded:', transferCheckoutData)
      } catch (err) {
        console.error('❌ Error loading transfer checkout data:', err)
        setError('Failed to load transfer information')
      } finally {
        setLoading(false)
      }
    }

    fetchCheckoutData()
  }, [offerId])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const formatPrice = (amount: string, currency: string) => {
    return `${currency === 'EUR' ? '€' : '$'}${amount}`
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
    
    console.log('✅ Form validation passed. Submitting transfer booking...')
    
    setIsSubmitting(true)
    
    try {
      // Prepare booking data for transfer API
      const bookingPayload = {
        offerId: checkoutData.offer.id,
        paymentMethod: formObject.paymentMethod as string,
        
        // Passenger Information
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
        
        // Transfer Details
        pickupLocation: checkoutData.offer.start.locationCode,
        dropoffLocation: checkoutData.offer.end.address.cityName,
        pickupDateTime: checkoutData.offer.start.dateTime,
        passengers: checkoutData.searchParams.passengers,
        vehicleDescription: checkoutData.offer.vehicle.description,
        serviceProvider: checkoutData.offer.serviceProvider?.name,
        
        // Pricing
        totalPrice: checkoutData.offer.quotation.monetaryAmount,
        currency: checkoutData.offer.quotation.currencyCode,
        
        // Special requests
        note: formObject.specialRequests as string || ''
      }
      
      console.log('🚗 Submitting transfer booking to API:', bookingPayload)
      
      const response = await fetch('/api/booking/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      })
      
      console.log('📥 Response Status:', response.status, response.statusText)
      const result = await response.json()
      console.log('📥 Response Body:', JSON.stringify(result, null, 2))
      
      if (result.success) {
        console.log('✅ Transfer booking successful:', result.data)
        
        // Save transfer booking to our database on frontend
        try {
          const { BookingService } = await import('@/services/BookingService')
          
          const transferToSave = BookingService.transformTransferToBooking(
            { data: result.data },
            bookingPayload,
            currentUser.uid
          )
          
          await BookingService.saveTransferBooking(transferToSave)
          console.log('✅ Transfer booking saved to database:', transferToSave.id)
        } catch (saveError) {
          console.error('⚠️ Failed to save transfer booking to database:', saveError)
        }
        
        // Redirect to transfer success page with booking details
        const successUrl = new URL('/car-pay-done', window.location.origin)
        
        // Basic booking information
        successUrl.searchParams.set('bookingId', result.data.bookingId)
        successUrl.searchParams.set('confirmationNumber', result.data.confirmationNumber)
        successUrl.searchParams.set('transferType', 'TRANSFER')
        
        // Transfer details
        successUrl.searchParams.set('vehicleDescription', result.data.transferDetails.vehicleDescription)
        successUrl.searchParams.set('serviceProvider', result.data.transferDetails.serviceProvider)
        successUrl.searchParams.set('pickupLocation', result.data.transferDetails.pickupLocation)
        successUrl.searchParams.set('dropoffLocation', result.data.transferDetails.dropoffLocation)
        successUrl.searchParams.set('pickupDateTime', result.data.transferDetails.pickupDateTime)
        successUrl.searchParams.set('passengers', result.data.transferDetails.passengers.toString())
        
        // Pricing information
        successUrl.searchParams.set('totalPrice', result.data.payment.totalPrice)
        successUrl.searchParams.set('currency', result.data.payment.currency)
        successUrl.searchParams.set('paymentMethod', result.data.payment.paymentMethod)
        
        // Guest information
        successUrl.searchParams.set('guestTitle', result.data.passenger.title)
        successUrl.searchParams.set('guestFirstName', result.data.passenger.firstName)
        successUrl.searchParams.set('guestLastName', result.data.passenger.lastName)
        successUrl.searchParams.set('guestEmail', result.data.passenger.email)
        
        console.log('🔗 Redirecting to transfer success page:', successUrl.toString())
        
        // Add delay to show success state
        setTimeout(() => {
          router.push(successUrl.toString())
        }, 1500)
      } else {
        console.error('❌ Transfer booking failed:', result.error)
        
        // Handle specific error codes
        if (result.code === 'OFFER_UNAVAILABLE') {
          setBookingError('This transfer is no longer available. Please select a different option.')
        } else if (result.code === 'BOOKING_INVALID') {
          setBookingError('Booking information is invalid. Please check your details and try again.')
        } else if (result.code === 'MISSING_FIELDS' || result.code === 'MISSING_CARD_FIELDS') {
          setBookingError(result.error)
        } else {
          setBookingError(result.error || 'Booking failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('❌ Transfer booking submission error:', error)
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
            <span className="ml-4">Loading transfer checkout...</span>
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
              {error || 'Unable to load transfer checkout information'}
            </p>
            <ButtonPrimary onClick={() => router.back()}>
              Go Back
            </ButtonPrimary>
          </div>
        </div>
      )
    }

    if (!checkoutData) {
      return null
    }

    const { offer } = checkoutData
    const totalPrice = parseFloat(offer.quotation.monetaryAmount)
    const currency = offer.quotation.currencyCode

    return (
      <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="w-full shrink-0 sm:w-40">
            <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
              <Image
                alt={offer.vehicle.description}
                fill
                sizes="200px"
                src={offer.vehicle.imageURL || '/default-car.png'}
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-3 py-5 text-start sm:ps-5">
            <div>
              <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                {offer.transferType} Transfer
              </span>
              <span className="mt-1 block text-base font-medium line-clamp-2">{offer.vehicle.description}</span>
            </div>
            <p className="block text-sm text-neutral-500 dark:text-neutral-400">
              {offer.vehicle.seats?.reduce((sum, seat) => sum + seat.count, 0)} seats • {offer.vehicle.baggages?.reduce((sum, bag) => sum + bag.count, 0)} bags
            </p>
            <Divider className="w-10!" />
            <div className="flex items-center gap-3">
              {offer.serviceProvider?.logoUrl && (
                <div className="h-8 w-8 rounded">
                  <Image
                    src={offer.serviceProvider.logoUrl}
                    alt={offer.serviceProvider.name}
                    width={32}
                    height={32}
                    className="rounded object-contain"
                    unoptimized
                  />
                </div>
              )}
              <span className="font-medium text-sm">{offer.serviceProvider?.name}</span>
            </div>
          </div>
        </div>

        <Divider className="block lg:hidden" />

        <DescriptionList>
          <DescriptionTerm>Transfer fare</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">{formatPrice(offer.quotation.monetaryAmount, currency)}</DescriptionDetails>
          
          <DescriptionTerm className="font-semibold text-neutral-900 dark:text-neutral-100">Total</DescriptionTerm>
          <DescriptionDetails className="font-semibold sm:text-right">{formatPrice(offer.quotation.monetaryAmount, currency)}</DescriptionDetails>
        </DescriptionList>

        {/* Transfer Details */}
        <Divider />
        <div>
          <h4 className="font-medium mb-3">Transfer Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">From:</span>
              <span className="font-medium">{offer.start.locationCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">To:</span>
              <span className="font-medium">{offer.end.address.cityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Pickup:</span>
              <span className="font-medium">{formatDateTime(offer.start.dateTime)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMain = () => {
    if (loading) {
      return (
        <div className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-4">Loading transfer checkout...</span>
          </div>
        </div>
      )
    }

    if (error && !checkoutData) {
      return (
        <div className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700">
          <div className="text-center py-8">
            <h1 className="text-3xl font-semibold lg:text-4xl mb-4">Transfer Checkout Error</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              {error || 'Unable to load transfer checkout information'}
            </p>
            <ButtonPrimary onClick={() => router.back()}>
              Go Back to Transfer
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
        
        <TransferTrip 
          transferData={checkoutData.offer}
        />
        
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
        
        {/* Submit Button */}
        <ButtonPrimary
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `Complete Booking - ${formatPrice(checkoutData.offer.quotation.monetaryAmount, checkoutData.offer.quotation.currencyCode)}`
          )}
        </ButtonPrimary>
        
        {/* Hidden inputs for form submission */}
        <input type="hidden" name="offerId" value={checkoutData.offer.id} />
      </Form>
    )
  }

  return (
    <div className="nc-TransferCheckoutPage">
      <main className="container mt-11 mb-24 lg:mb-32 flex flex-col-reverse lg:flex-row">
        <div className="w-full lg:w-3/5 xl:w-2/3 lg:pr-10">{renderMain()}</div>
        <div className="hidden lg:block flex-grow">{renderSidebar()}</div>
      </main>
    </div>
  )
}

export default Page