'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Calendar04Icon, UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface BookingData {
  bookingId: string
  confirmationNumber: string
  hotelName: string
  hotelImage?: string
  location?: string
  checkInDate: string
  checkOutDate: string
  guests: {
    adults: number
    rooms: number
  }
  totalPrice: string
  currency: string
  paymentMethod: string
  bookingDate: string
  beds?: number
  bathrooms?: number
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
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [])

  useEffect(() => {
    const loadBookingData = () => {
      // Get URL parameters passed from checkout success
      const bookingId = searchParams.get('bookingId')
      const confirmationNumber = searchParams.get('confirmationNumber')
      const hotelName = searchParams.get('hotelName')
      const hotelImage = searchParams.get('hotelImage')
      const location = searchParams.get('location')
      const checkInDate = searchParams.get('checkInDate')
      const checkOutDate = searchParams.get('checkOutDate')
      const adults = searchParams.get('adults')
      const rooms = searchParams.get('rooms')
      const totalPrice = searchParams.get('totalPrice')
      const currency = searchParams.get('currency')
      const paymentMethod = searchParams.get('paymentMethod')
      const beds = searchParams.get('beds')
      const bathrooms = searchParams.get('bathrooms')
      
      // Guest information
      const guestTitle = searchParams.get('guestTitle')
      const guestFirstName = searchParams.get('guestFirstName')
      const guestLastName = searchParams.get('guestLastName')
      const guestEmail = searchParams.get('guestEmail')

      if (bookingId && confirmationNumber && hotelName) {
        const data: BookingData = {
          bookingId,
          confirmationNumber,
          hotelName,
          hotelImage: hotelImage || 'https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
          location: location || 'Location not specified',
          checkInDate: checkInDate || '',
          checkOutDate: checkOutDate || '',
          guests: {
            adults: adults ? parseInt(adults) : 1,
            rooms: rooms ? parseInt(rooms) : 1
          },
          totalPrice: totalPrice || '0',
          currency: currency || 'USD',
          paymentMethod: paymentMethod || 'Credit card',
          bookingDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          beds: beds ? parseInt(beds) : undefined,
          bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
          guest: (guestTitle && guestFirstName && guestLastName && guestEmail) ? {
            title: guestTitle,
            firstName: guestFirstName,
            lastName: guestLastName,
            email: guestEmail
          } : undefined
        }
        
        setBookingData(data)
        console.log('✅ Booking data loaded from URL params:', data)
      } else {
        console.warn('⚠️ Missing required booking parameters. Using fallback data.')
        // Fallback data if parameters are missing
        setBookingData({
          bookingId: 'BK-' + Date.now(),
          confirmationNumber: 'CONF-' + Date.now(),
          hotelName: 'Hotel Booking',
          hotelImage: 'https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
          location: 'Location not available',
          checkInDate: '',
          checkOutDate: '',
          guests: { adults: 1, rooms: 1 },
          totalPrice: '0',
          currency: 'USD',
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

    loadBookingData()
  }, [searchParams])

  // Format dates for display
  const formatDateRange = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 'Dates not available'
    
    try {
      const startDate = new Date(checkIn)
      const endDate = new Date(checkOut)
      
      const formatOptions: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric',
        year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      }
      
      return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`
    } catch (error) {
      return 'Invalid dates'
    }
  }

  // Format guest count
  const formatGuests = (adults: number, rooms: number) => {
    const guestText = adults === 1 ? '1 Guest' : `${adults} Guests`
    const roomText = rooms === 1 ? '1 Room' : `${rooms} Rooms`
    return `${guestText}, ${roomText}`
  }

  // Format room details
  const formatRoomDetails = (beds?: number, bathrooms?: number) => {
    const parts = []
    if (beds) parts.push(`${beds} ${beds === 1 ? 'bed' : 'beds'}`)
    if (bathrooms) parts.push(`${bathrooms} ${bathrooms === 1 ? 'bath' : 'baths'}`)
    return parts.length > 0 ? parts.join(' · ') : 'Room details not available'
  }

  // Format guest name
  const formatGuestName = (guest?: BookingData['guest']) => {
    if (!guest) return 'Guest information not available'
    return `${guest.title} ${guest.firstName} ${guest.lastName}`
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
          <h1 className="text-4xl font-semibold sm:text-5xl text-red-600">Booking Error</h1>
          <p>Unable to load booking information. Please contact support.</p>
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
          <h3 className="text-2xl font-semibold">{T['common']['Your booking']}</h3>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center">
            <div className="w-full shrink-0 sm:w-40">
              <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
                <Image
                  fill
                  alt={bookingData.hotelName}
                  className="object-cover"
                  src={bookingData.hotelImage}
                  sizes="200px"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-3 pt-5 sm:px-5 sm:pb-5">
              <div>
                <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {bookingData.location}
                </span>
                <span className="mt-1 block text-base font-medium sm:text-lg">{bookingData.hotelName}</span>
              </div>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                {formatRoomDetails(bookingData.beds, bookingData.bathrooms)}
              </span>
              <Divider className="w-10!" />
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-3xl border border-neutral-200 text-neutral-500 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700 dark:border-neutral-700 dark:text-neutral-400">
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={Calendar04Icon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Date</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDateRange(bookingData.checkInDate, bookingData.checkOutDate)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={UserIcon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Guests</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatGuests(bookingData.guests.adults, bookingData.guests.rooms)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Booking detail</h3>
          <DescriptionList className="mt-5">
            <DescriptionTerm>Booking code</DescriptionTerm>
            <DescriptionDetails>{bookingData.bookingId}</DescriptionDetails>
            
            <DescriptionTerm>Confirmation number</DescriptionTerm>
            <DescriptionDetails>{bookingData.confirmationNumber}</DescriptionDetails>
            
            <DescriptionTerm>Guest name</DescriptionTerm>
            <DescriptionDetails>{formatGuestName(bookingData.guest)}</DescriptionDetails>
            
            {bookingData.guest?.email && (
              <>
                <DescriptionTerm>Email</DescriptionTerm>
                <DescriptionDetails>{bookingData.guest.email}</DescriptionDetails>
              </>
            )}
            
            <DescriptionTerm>Date</DescriptionTerm>
            <DescriptionDetails>{bookingData.bookingDate}</DescriptionDetails>
            
            <DescriptionTerm>Total</DescriptionTerm>
            <DescriptionDetails>
              {bookingData.currency === 'USD' ? '$' : bookingData.currency + ' '}
              {bookingData.totalPrice}
            </DescriptionDetails>
            
            <DescriptionTerm>Payment method</DescriptionTerm>
            <DescriptionDetails>{bookingData.paymentMethod}</DescriptionDetails>
          </DescriptionList>
        </div>

        <div>
          <ButtonPrimary href="/">
            <HomeIcon className="size-5" />
            Explore more stays
          </ButtonPrimary>
        </div>
      </div>
    </main>
  )
}

export default Page