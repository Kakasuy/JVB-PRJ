import BtnLikeIcon from '@/components/BtnLikeIcon'
import { Badge } from '@/shared/Badge'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'
import * as Headless from '@headlessui/react'

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

  // Format baggage info with sizes
  const formatBaggageInfo = () => {
    if (!vehicle.baggages || vehicle.baggages.length === 0) return '0 bags'
    
    const bagsBySizes = vehicle.baggages.reduce((acc: Record<string, number>, bag) => {
      const size = bag.size || 'M' // Default to Medium if no size
      acc[size] = (acc[size] || 0) + bag.count
      return acc
    }, {})
    
    const sizeLabels: Record<string, string> = {
      'S': 'Small',
      'M': 'Medium', 
      'L': 'Large',
      'XL': 'Extra Large'
    }
    
    const bagInfo = Object.entries(bagsBySizes)
      .map(([size, count]) => `${count}${size}`)
      .join(' + ')
    
    return `${totalBags} bags (${bagInfo})`
  }

  const formatPrice = (amount: string, currency: string) => {
    return `${currency === 'EUR' ? '€' : '$'}${amount}`
  }

  // Vehicle category mapping
  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { label: string; color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray' }> = {
      'ST': { label: 'Standard', color: 'blue' },
      'EC': { label: 'Economy', color: 'green' },
      'LX': { label: 'Luxury', color: 'purple' },
      'PR': { label: 'Premium', color: 'yellow' },
      'BU': { label: 'Business', color: 'purple' },
      'VN': { label: 'Van', color: 'gray' },
      'SV': { label: 'SUV', color: 'red' },
      'LM': { label: 'Limousine', color: 'purple' },
      'EL': { label: 'Electric', color: 'green' },
      'HY': { label: 'Hybrid', color: 'green' },
      'SP': { label: 'Sport', color: 'red' },
      'CM': { label: 'Comfort', color: 'blue' },
      'EX': { label: 'Executive', color: 'purple' },
      'FL': { label: 'Full-size', color: 'yellow' },
      'MD': { label: 'Mid-size', color: 'blue' },
      'CP': { label: 'Compact', color: 'green' },
      'MI': { label: 'Mini', color: 'green' },
      'PU': { label: 'Pickup', color: 'gray' },
      'CV': { label: 'Convertible', color: 'red' },
      'WG': { label: 'Wagon', color: 'gray' },
      'FC': { label: 'First Class', color: 'yellow' }
    }
    return categoryMap[category]
  }

  const categoryInfo = vehicle?.category ? getCategoryInfo(vehicle.category) : null

  // Vehicle code mapping for tooltips
  const getVehicleCodeInfo = (code: string) => {
    const codeMap: Record<string, string> = {
      'SDN': 'Sedan',
      'SUV': 'SUV',
      'VAN': 'Van',
      'LIM': 'Limousine',
      'LMS': 'Limousine',
      'BUS': 'Bus',
      'MPV': 'Multi-Purpose Vehicle',
      'HBK': 'Hatchback',
      'EST': 'Estate/Wagon',
      'CNV': 'Convertible',
      'CUP': 'Coupe',
      'MIN': 'Mini',
      'CMP': 'Compact',
      'ECO': 'Economy',
      'LUX': 'Luxury',
      'ELC': 'Electric Vehicle',
      'HYB': 'Hybrid Vehicle',
      'TRK': 'Truck',
      'PUP': 'Pickup Truck',
      'CAB': 'Convertible Cabriolet',
      'ROD': 'Roadster',
      'SPT': 'Sports Car',
      'OFF': 'Off-road Vehicle',
      '4WD': '4-Wheel Drive',
      'AWD': 'All-Wheel Drive',
      'MBV': 'Minibus',
      'CBR': 'Cabriolet',
      'WGN': 'Wagon',
      'VIN': 'Vintage Car',
      'LRG': 'Large Vehicle',
      'SML': 'Small Vehicle',
      'MED': 'Medium Vehicle'
    }
    return codeMap[code] || code
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
          className="absolute end-3 top-3 z-10 pointer-events-auto"
        />
        <div className="absolute start-3 top-3 flex flex-col gap-2">
          {transferType === 'PRIVATE' && (
            <Badge color="green">
              {transferType}
            </Badge>
          )}
          {categoryInfo && (
            <Badge color={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          )}
        </div>
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
            {vehicle?.code && (
              <div className="flex items-center gap-1 relative z-10">
                <Headless.Popover className="relative">
                  <Headless.PopoverButton 
                    className="text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-help border-b border-dotted border-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-0 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {vehicle.code}
                  </Headless.PopoverButton>
                  <Headless.PopoverPanel 
                    className="absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 transform pointer-events-auto"
                  >
                    <div className="rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-800">
                      <div className="font-medium">{getVehicleCodeInfo(vehicle.code)}</div>
                      <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-neutral-900 dark:bg-neutral-800"></div>
                    </div>
                  </Headless.PopoverPanel>
                </Headless.Popover>
              </div>
            )}
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
            <BriefcaseIcon className="h-4 w-4" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {formatBaggageInfo()}
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
      <Link href={listingHref} className="absolute inset-1 z-1 pointer-events-auto"></Link>
      <div className="flex flex-col md:flex-row">
        {renderSliderGallery()}
        {renderContent()}
      </div>
    </div>
  )
}

export default TransferOfferCard