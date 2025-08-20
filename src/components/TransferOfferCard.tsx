import BtnLikeIcon from '@/components/BtnLikeIcon'
import { Badge } from '@/shared/Badge'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'

interface TransferOffer {
  id: string
  type: string
  transferType: string
  start: {
    dateTime: string
    locationCode: string
  }
  end: {
    dateTime: string
    address: {
      line: string
      countryCode: string
      cityName: string
      latitude: number
      longitude: number
    }
  }
  vehicle: {
    code: string
    category: string
    description: string
    imageURL: string
    baggages: Array<{
      count: number
      size: string
    }>
    seats: Array<{
      count: number
    }>
  }
  serviceProvider: {
    code: string
    name: string
    logoUrl: string
  }
  quotation: {
    monetaryAmount: string
    currencyCode: string
  }
}

export interface TransferOfferCardProps {
  className?: string
  data: TransferOffer
}

const TransferOfferCard: FC<TransferOfferCardProps> = ({ className = '', data }) => {
  const {
    id,
    transferType,
    start,
    end,
    vehicle,
    serviceProvider,
    quotation
  } = data

  const totalSeats = vehicle.seats?.reduce((sum, seat) => sum + seat.count, 0) || 0
  const totalBags = vehicle.baggages?.reduce((sum, bag) => sum + bag.count, 0) || 0

  const formatPrice = (amount: string, currency: string) => {
    return `${currency === 'EUR' ? '€' : '$'}${amount}`
  }

  const listingHref = `/transfer-details/${id}`

  const renderSliderGallery = () => {
    return (
      <div className="relative flex w-full shrink-0 items-center justify-center border-e border-neutral-200/80 md:w-72 dark:border-neutral-700">
        <div className="aspect-w-16 w-full aspect-h-9">
          <Image
            fill
            className="object-contain"
            src={vehicle?.imageURL || '/default-car.png'}
            alt={vehicle?.description || 'Transfer Vehicle'}
            sizes="(max-width: 640px) 100vw, 350px"
            unoptimized
          />
        </div>
        <BtnLikeIcon
          colorClass="text-white bg-black/20 hover:bg-black/30"
          isLiked={false}
          className="absolute end-3 top-3 z-1"
        />
        {transferType === 'PRIVATE' && (
          <Badge color="green" className="absolute start-3 top-3">
            {transferType}
          </Badge>
        )}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className="flex grow flex-col p-3 sm:p-5">
        <div>
          <div className="flex items-center gap-x-2">
            <h2 className="text-xl font-semibold capitalize">
              <span className="line-clamp-1">{vehicle?.description || 'Transfer Vehicle'}</span>
            </h2>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center">
              <span className="hidden text-base sm:inline-block">
                <MapPinIcon className="h-4 w-4" />
              </span>
              <span className="line-clamp-1 sm:ms-2">
                {start?.locationCode || 'Pickup'} → {end?.address?.cityName || 'Destination'}
              </span>
            </div>
          </div>
        </div>

        <div className="my-4 w-14 border-b border-neutral-200/80 dark:border-neutral-700" />

        <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
          {/* Seats */}
          <div className="flex items-center gap-x-2">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {totalSeats} seats
            </span>
          </div>
          
          {/* Baggage */}
          <div className="flex items-center gap-x-2">
            <ShieldCheckIcon className="h-4 w-4" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {totalBags} bags
            </span>
          </div>
        </div>

        <div className="my-4 w-14 border-b border-neutral-200/80 dark:border-neutral-700" />

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            By {serviceProvider?.name || 'Service Provider'}
          </div>
          <span className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            {formatPrice(quotation?.monetaryAmount || '0', quotation?.currencyCode || 'EUR')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      <Link href={listingHref} className="absolute inset-1 z-1"></Link>
      <div className="flex flex-col md:flex-row">
        {renderSliderGallery()}
        {renderContent()}
      </div>
    </div>
  )
}

export default TransferOfferCard