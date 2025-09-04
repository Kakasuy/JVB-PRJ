import { FC } from 'react'
import { TransferBooking } from '@/services/BookingService'
import BtnLikeIcon from './BtnLikeIcon'
import { Badge } from '@/shared/Badge'
import Link from 'next/link'
import Image from 'next/image'

export interface TransferCardProps {
  className?: string
  booking: TransferBooking
  size?: 'default' | 'small'
}

const TransferCard: FC<TransferCardProps> = ({ 
  className = '', 
  booking,
  size = 'default'
}) => {
  const {
    id,
    transfer,
    passenger,
    totalPrice,
    currency,
    status,
    confirmationNumber,
    bookedAt
  } = booking

  // Format pickup date for display
  const formatPickupDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pickupFormatted = formatPickupDate(transfer.pickupDateTime)

  // Status styling
  const getStatusConfig = (status: TransferBooking['status']) => {
    switch (status) {
      case 'upcoming':
        return { 
          text: '🚗 Upcoming', 
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
        <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-2xl">
          <Image
            alt={transfer.vehicleDescription}
            fill
            sizes="200px"
            src={transfer.vehicleImage || '/default-car.png'}
            className="object-cover"
          />
        </div>
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
    <div className={`nc-TransferCard2 group relative border border-neutral-200 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-neutral-900 dark:border-neutral-700 ${className}`}>
      {renderSliderGallery()}
      <Link href={`/transfers/${id}`}>
        <div className="space-y-3 p-4">
          {/* Transfer Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h2 className="nc-card-title block font-medium capitalize text-neutral-900 dark:text-white">
                <span className="line-clamp-2">{transfer.vehicleDescription}</span>
              </h2>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="line-clamp-1">{transfer.pickupLocation} → {transfer.dropoffLocation}</span>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
              <span className="font-medium">{pickupFormatted}</span>
              <span>•</span>
              <span>{transfer.passengers} passenger{transfer.passengers > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Price & Service Provider */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-neutral-900 dark:text-neutral-200">
                {currency} {totalPrice}
                <span className="text-sm font-normal text-neutral-500"> total</span>
              </span>
              {confirmationNumber && confirmationNumber !== 'N/A' && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  #{confirmationNumber}
                </span>
              )}
            </div>
            
            {/* Service Provider & Booking Date */}
            <div className="text-right">
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {transfer.serviceProvider}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Booked: {bookedAt && new Date(bookedAt.seconds * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default TransferCard