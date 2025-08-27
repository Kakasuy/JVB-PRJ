'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import { HomeIcon, MapPinIcon, ClockIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface TransferBookingData {
  bookingId: string
  confirmationNumber: string
  transferType: string
  vehicleDescription: string
  vehicleImage?: string
  serviceProvider: string
  pickupLocation: string
  dropoffLocation: string
  pickupDateTime: string
  passengers: number
  totalPrice: string
  currency: string
  paymentMethod: string
  bookingDate: string
  // Guest information
  guest?: {
    title: string
    firstName: string
    lastName: string
    email: string
  }
}

const Page = () => {
  const searchParams = useSearchParams()
  const [bookingData, setBookingData] = useState<TransferBookingData | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [])

  useEffect(() => {
    const loadTransferBookingData = () => {
      // Get URL parameters passed from transfer checkout success
      const bookingId = searchParams.get('bookingId')
      const confirmationNumber = searchParams.get('confirmationNumber')
      const transferType = searchParams.get('transferType')
      const vehicleDescription = searchParams.get('vehicleDescription')
      const serviceProvider = searchParams.get('serviceProvider')
      const pickupLocation = searchParams.get('pickupLocation')
      const dropoffLocation = searchParams.get('dropoffLocation')
      const pickupDateTime = searchParams.get('pickupDateTime')
      const passengers = searchParams.get('passengers')
      const totalPrice = searchParams.get('totalPrice')
      const currency = searchParams.get('currency')
      const paymentMethod = searchParams.get('paymentMethod')
      
      // Guest information
      const guestTitle = searchParams.get('guestTitle')
      const guestFirstName = searchParams.get('guestFirstName')
      const guestLastName = searchParams.get('guestLastName')
      const guestEmail = searchParams.get('guestEmail')

      if (bookingId && confirmationNumber && vehicleDescription) {
        const data: TransferBookingData = {
          bookingId,
          confirmationNumber,
          transferType: transferType || 'PRIVATE',
          vehicleDescription,
          vehicleImage: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
          serviceProvider: serviceProvider || 'Transfer Service',
          pickupLocation: pickupLocation || 'Pickup location',
          dropoffLocation: dropoffLocation || 'Dropoff location', 
          pickupDateTime: pickupDateTime || '',
          passengers: passengers ? parseInt(passengers) : 1,
          totalPrice: totalPrice || '0',
          currency: currency || 'EUR',
          paymentMethod: paymentMethod || 'Credit card',
          bookingDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          guest: (guestTitle && guestFirstName && guestLastName && guestEmail) ? {
            title: guestTitle,
            firstName: guestFirstName,
            lastName: guestLastName,
            email: guestEmail
          } : undefined
        }
        
        setBookingData(data)
        console.log('✅ Transfer booking data loaded from URL params:', data)
      } else {
        console.warn('⚠️ Missing required transfer booking parameters. Using fallback data.')
        // Fallback data if parameters are missing
        setBookingData({
          bookingId: 'TRF-' + Date.now(),
          confirmationNumber: 'TRF' + Date.now().toString().slice(-6),
          transferType: 'PRIVATE',
          vehicleDescription: 'Transfer Vehicle',
          vehicleImage: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
          serviceProvider: 'Transfer Service',
          pickupLocation: 'Airport',
          dropoffLocation: 'Hotel',
          pickupDateTime: new Date().toISOString(),
          passengers: 1,
          totalPrice: '0',
          currency: 'EUR',
          paymentMethod: 'Credit card',
          bookingDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        })
      }
      
      setLoading(false)
    }

    loadTransferBookingData()
  }, [searchParams])

  // Format pickup date/time for display
  const formatPickupDateTime = (dateTime: string) => {
    if (!dateTime) return 'Date not available'
    
    try {
      const date = new Date(dateTime)
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Format passenger count
  const formatPassengers = (count: number) => {
    return count === 1 ? '1 Passenger' : `${count} Passengers`
  }

  // Format route
  const formatRoute = (pickup: string, dropoff: string) => {
    return `${pickup} → ${dropoff}`
  }

  // Format guest name
  const formatGuestName = (guest?: TransferBookingData['guest']) => {
    if (!guest) return 'Guest information not available'
    return `${guest.title} ${guest.firstName} ${guest.lastName}`
  }

  // Format price
  const formatPrice = (amount: string, currency: string) => {
    return `${currency === 'EUR' ? '€' : '$'}${amount}`
  }

  if (loading) {
    return (
      <main className="container mt-10 mb-24 sm:mt-16 lg:mb-32">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-12 px-0 sm:rounded-2xl sm:p-6 xl:p-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!bookingData) {
    return (
      <main className="container mt-10 mb-24 sm:mt-16 lg:mb-32">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-12 px-0 sm:rounded-2xl sm:p-6 xl:p-8">
          <h1 className="text-4xl font-semibold sm:text-5xl text-red-600">Transfer Booking Error</h1>
          <p>Unable to load transfer booking information. Please contact support.</p>
          <ButtonPrimary href="/">
            <HomeIcon className="size-5" />
            Return Home
          </ButtonPrimary>
        </div>
      </main>
    )
  }

  return (
    <main className="container mt-10 mb-24 sm:mt-16 lg:mb-32">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-12 px-0 sm:rounded-2xl sm:p-6 xl:p-8">
        <h1 className="text-4xl font-semibold sm:text-5xl">{T['common']['Congratulation']} 🎉</h1>
        <Divider />

        <div>
          <h3 className="text-2xl font-semibold">Your transfer booking</h3>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center">
            <div className="w-full shrink-0 sm:w-40">
              <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
                <Image
                  fill
                  alt={bookingData.vehicleDescription}
                  className="object-cover"
                  src={bookingData.vehicleImage}
                  sizes="200px"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-3 pt-5 sm:px-5 sm:pb-5">
              <div>
                <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {bookingData.transferType} Transfer
                </span>
                <span className="mt-1 block text-base font-medium sm:text-lg">{bookingData.vehicleDescription}</span>
              </div>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                Provided by {bookingData.serviceProvider}
              </span>
              <Divider className="w-10!" />
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-3xl border border-neutral-200 text-neutral-500 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700 dark:border-neutral-700 dark:text-neutral-400">
          <div className="flex flex-1 gap-x-4 p-5">
            <MapPinIcon className="h-8 w-8 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Route</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatRoute(bookingData.pickupLocation, bookingData.dropoffLocation)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <ClockIcon className="h-8 w-8 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Pickup Time</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatPickupDateTime(bookingData.pickupDateTime)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={UserIcon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Passengers</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatPassengers(bookingData.passengers)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Booking details</h3>
          <DescriptionList className="mt-5">
            <DescriptionTerm>Booking code</DescriptionTerm>
            <DescriptionDetails>{bookingData.bookingId}</DescriptionDetails>
            
            <DescriptionTerm>Confirmation number</DescriptionTerm>
            <DescriptionDetails className="font-mono text-lg">{bookingData.confirmationNumber}</DescriptionDetails>
            
            <DescriptionTerm>Passenger name</DescriptionTerm>
            <DescriptionDetails>{formatGuestName(bookingData.guest)}</DescriptionDetails>
            
            {bookingData.guest?.email && (
              <>
                <DescriptionTerm>Email</DescriptionTerm>
                <DescriptionDetails>{bookingData.guest.email}</DescriptionDetails>
              </>
            )}
            
            <DescriptionTerm>Pickup location</DescriptionTerm>
            <DescriptionDetails>{bookingData.pickupLocation}</DescriptionDetails>
            
            <DescriptionTerm>Dropoff location</DescriptionTerm>
            <DescriptionDetails>{bookingData.dropoffLocation}</DescriptionDetails>
            
            <DescriptionTerm>Pickup date & time</DescriptionTerm>
            <DescriptionDetails>{formatPickupDateTime(bookingData.pickupDateTime)}</DescriptionDetails>
            
            <DescriptionTerm>Booking date</DescriptionTerm>
            <DescriptionDetails>{bookingData.bookingDate}</DescriptionDetails>
            
            <DescriptionTerm>Total amount</DescriptionTerm>
            <DescriptionDetails className="text-xl font-semibold">
              {formatPrice(bookingData.totalPrice, bookingData.currency)}
            </DescriptionDetails>
            
            <DescriptionTerm>Payment method</DescriptionTerm>
            <DescriptionDetails>{bookingData.paymentMethod}</DescriptionDetails>
          </DescriptionList>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Important Information</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Please arrive at pickup location 10 minutes early</li>
            <li>• Keep your confirmation number ready for the driver</li>
            <li>• Contact the service provider for any changes or cancellations</li>
            <li>• You will receive an email confirmation shortly</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <ButtonPrimary href="/car-categories/all" className="flex-1">
            <BriefcaseIcon className="size-5" />
            Book another transfer
          </ButtonPrimary>
          
          <ButtonPrimary href="/" className="flex-1 bg-neutral-900 hover:bg-neutral-800">
            <HomeIcon className="size-5" />
            Return Home
          </ButtonPrimary>
        </div>
      </div>
    </main>
  )
}

export default Page