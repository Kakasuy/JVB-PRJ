import BtnLikeIcon from '@/components/BtnLikeIcon'
import SaleOffBadge from '@/components/SaleOffBadge'
import { Badge } from '@/shared/Badge'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { 
  SeatSelectorIcon, 
  Luggage02Icon, 
  Car03Icon,
  ClockIcon,
  RouteIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'

// Transfer offer interface based on actual Amadeus API response
interface TransferOffer {
  type: string
  id: string
  transferType: 'PRIVATE' | 'SHARED' | 'TAXI'
  start: {
    dateTime: string
    locationCode?: string
    address?: {
      line: string
      zip?: string
      countryCode?: string
      cityName?: string
      latitude?: number
      longitude?: number
    }
    name?: string
  }
  end: {
    locationCode?: string
    address?: {
      line: string
      zip?: string
      countryCode?: string
      cityName?: string
      latitude?: number
      longitude?: number
    }
    googlePlaceId?: string
    name?: string
  }
  vehicle: {
    code: string
    category: string
    description: string
    seats: Array<{ count: number }>
    baggages: Array<{ count: number; size: string }>
    imageURL?: string
  }
  serviceProvider: {
    code: string
    name: string
    logoUrl?: string
    termsUrl?: string
    contacts?: {
      phoneNumber?: string
      email?: string
    }
  }
  quotation: {
    monetaryAmount: string
    currencyCode: string
    isEstimated?: boolean
    base?: { monetaryAmount: string }
    discount?: { monetaryAmount: string }
    fees?: Array<{
      indicator: string
      monetaryAmount: string
    }>
    totalTaxes?: { monetaryAmount: string }
    totalFees?: { monetaryAmount: string }
  }
  converted?: {
    monetaryAmount: string
    currencyCode: string
    isEstimated?: boolean
    base?: { monetaryAmount: string }
    discount?: { monetaryAmount: string }
    fees?: Array<{
      indicator: string
      monetaryAmount: string
    }>
    totalTaxes?: { monetaryAmount: string }
    totalFees?: { monetaryAmount: string }
  }
  distance?: { value: number; unit: string }
  stopOvers?: Array<any>
  extraServices?: Array<any>
  equipment?: Array<any>
  cancellationRules?: Array<any>
  methodsOfPaymentAccepted?: string[]
  discountCodes?: Array<any>
  startConnectedSegment?: any
  passengerCharacteristics?: Array<any>
}

export interface TransferCardHProps {
  className?: string
  data: TransferOffer
}

const TransferCardH: FC<TransferCardHProps> = ({ className = '', data }) => {
  const {
    id,
    transferType,
    vehicle,
    serviceProvider,
    quotation,
    start,
    end,
    distance
  } = data

  const transferHref = `/transfer-booking/${id}`

  // Calculate discount percentage
  const hasDiscount = quotation.base && quotation.discount
  const discountPercent = hasDiscount 
    ? Math.round((parseFloat(quotation.discount.monetaryAmount) / parseFloat(quotation.base.monetaryAmount)) * 100)
    : 0

  // Format locations
  const startLocation = start.locationCode || start.name || start.address?.cityName || start.address?.line || 'Pickup Location'
  const endLocation = end.locationCode || end.name || end.address?.cityName || end.address?.line || 'Drop-off Location'

  // Format time
  const pickupTime = new Date(start.dateTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const renderSliderGallery = () => {
    return (
      <div className="relative flex w-full shrink-0 items-center justify-center border-e border-neutral-200/80 md:w-72 dark:border-neutral-700">
        <div className="aspect-w-16 w-full aspect-h-9">
          <Image
            fill
            className="object-contain"
            src={vehicle.imageURL || '/images/vehicles/default-car.png'}
            alt={vehicle.description}
            sizes="(max-width: 640px) 100vw, 350px"
          />
        </div>
        <BtnLikeIcon
          colorClass="text-white bg-black/20 hover:bg-black/30"
          isLiked={false}
          className="absolute end-3 top-3 z-1"
        />
        {hasDiscount && <SaleOffBadge className="absolute start-3 top-3" />}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className="flex grow flex-col p-3 sm:p-5">
        <div>
          <div className="flex items-center gap-x-2">
            <Badge color={transferType === 'PRIVATE' ? 'blue' : transferType === 'SHARED' ? 'green' : 'yellow'}>
              {transferType}
            </Badge>
            <h2 className="text-xl font-semibold">
              <span className="line-clamp-1">{vehicle.description}</span>
            </h2>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center">
              <Image
                src={serviceProvider.logoUrl || '/images/providers/default-logo.png'}
                alt={serviceProvider.name}
                width={16}
                height={16}
                className="rounded"
              />
              <span className="ms-2">{serviceProvider.name}</span>
            </div>
            <span>·</span>
            <div className="flex items-center">
              <HugeiconsIcon icon={ClockIcon} size={16} color="currentColor" strokeWidth={1.5} />
              <span className="ms-1">{pickupTime}</span>
            </div>
          </div>
        </div>

        <div className="my-4 w-14 border-b border-neutral-200/80 dark:border-neutral-700" />

        <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
          {/* Seats */}
          <div className="flex items-center gap-x-2">
            <HugeiconsIcon icon={SeatSelectorIcon} size={16} color="currentColor" strokeWidth={1.5} />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {vehicle.seats[0]?.count || 0} seats
            </span>
          </div>
          {/* Baggage */}
          <div className="flex items-center gap-x-2">
            <HugeiconsIcon icon={Luggage02Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {vehicle.baggages[0]?.count || 0} bags
            </span>
          </div>
          {/* Vehicle Category */}
          <div className="flex items-center gap-x-2">
            <HugeiconsIcon icon={Car03Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{vehicle.category}</span>
          </div>
        </div>

        <div className="my-4 w-14 border-b border-neutral-200/80 dark:border-neutral-700" />

        {/* Route */}
        <div className="flex items-center gap-x-2 mb-3">
          <HugeiconsIcon icon={RouteIcon} size={16} color="currentColor" strokeWidth={1.5} />
          <div className="flex items-center gap-x-2 text-sm text-neutral-600 dark:text-neutral-300">
            <span className="font-medium">{startLocation}</span>
            <span>→</span>
            <span className="font-medium">{endLocation}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {distance ? `${distance.value} ${distance.unit} journey` : 'Distance available on booking'}
          </div>
          <div className="flex items-center gap-x-2">
            {hasDiscount && (
              <span className="text-sm text-neutral-400 line-through">
                {quotation.currencyCode} {quotation.base?.monetaryAmount}
              </span>
            )}
            <span className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              {quotation.currencyCode} {quotation.monetaryAmount}
            </span>
            {hasDiscount && (
              <Badge color="red" className="text-xs">
                -{discountPercent}%
              </Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      <Link href={transferHref} className="absolute inset-1 z-1"></Link>
      <div className="flex flex-col md:flex-row">
        {renderSliderGallery()}
        {renderContent()}
      </div>
    </div>
  )
}

export default TransferCardH