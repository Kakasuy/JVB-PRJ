import { FC } from 'react'
import { HotelBooking } from '@/services/BookingService'
import BtnLikeIcon from './BtnLikeIcon'
import GallerySlider from './GallerySlider'
import StartRating from './StartRating'
import { Badge } from '@/shared/Badge'
import Link from 'next/link'

export interface BookingCardProps {
  className?: string
  booking: HotelBooking
  size?: 'default' | 'small'
}

const BookingCard: FC<BookingCardProps> = ({ 
  className = '', 
  booking,
  size = 'default'
}) => {
  const {
    id,
    hotel,
    checkInDate,
    checkOutDate,
    nights,
    totalPrice,
    currency,
    status,
    confirmationNumber,
    bookedAt
  } = booking

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const checkInFormatted = formatDate(checkInDate)
  const checkOutFormatted = formatDate(checkOutDate)

  // Status styling
  const getStatusConfig = (status: HotelBooking['status']) => {
    switch (status) {
      case 'upcoming':
        return { 
          text: '📅 Upcoming', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
        }
      case 'completed':
        return { 
          text: '✅ Completed', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
        }
      case 'cancelled':
        return { 
          text: '❌ Cancelled', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
        }
      default:
        return { 
          text: '✅ Confirmed', 
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
        }
    }
  }

  const statusConfig = getStatusConfig(status)

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full">
        <GallerySlider
          uniqueID={`BookingCard_${id}`}
          ratioClass="aspect-w-4 aspect-h-3 "
          galleryImgs={hotel.images || ['/placeholder-hotel.jpg']}
          href={`/bookings/${id}`}
        />
        <BtnLikeIcon isLiked={false} className="absolute right-3 top-3 z-[1]" />
        
        {/* Status Badge */}
        <div className="absolute left-3 top-3">
          <Badge 
            className={`${statusConfig.color} px-2 py-1 text-xs font-medium rounded-full`}
          >
            {statusConfig.text}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className={`nc-StayCard2 group relative ${className}`}>
      {renderSliderGallery()}
      <Link href={`/bookings/${id}`}>
        <div className="space-y-3 p-4">
          {/* Hotel Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h2 className="nc-card-title block font-medium capitalize text-neutral-900 dark:text-white">
                <span className="line-clamp-2">{hotel.name}</span>
              </h2>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="line-clamp-1">{hotel.address}</span>
            </div>
          </div>

          {/* Booking Dates */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
              <span className="font-medium">{checkInFormatted} - {checkOutFormatted}</span>
              <span>•</span>
              <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
            </div>
          </div>

          {/* Price & Confirmation */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-neutral-900 dark:text-neutral-200">
                {currency} ${totalPrice}
                <span className="text-sm font-normal text-neutral-500"> total</span>
              </span>
              {confirmationNumber && confirmationNumber !== 'N/A' && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  #{confirmationNumber}
                </span>
              )}
            </div>
            
            {/* Booking Date */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Booked: {bookedAt && new Date(bookedAt.seconds * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default BookingCard