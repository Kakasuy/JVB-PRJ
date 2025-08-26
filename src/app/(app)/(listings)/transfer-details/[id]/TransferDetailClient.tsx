'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/shared/Badge'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
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
    termsUrl?: string
  }
  quotation: {
    monetaryAmount: string
    currencyCode: string
    totalFees?: {
      monetaryAmount: string
    }
    base?: {
      monetaryAmount: string
    }
  }
  extraServices?: Array<{
    code: string
    description: string
    quotation: {
      monetaryAmount: string
      currencyCode: string
    }
    isBookable: boolean
  }>
  cancellationRules?: Array<{
    ruleDescription: string
    feeType: string
    feeValue: string
    metricType: string
    metricMin: string
    metricMax?: string
  }>
}

export default function TransferDetailClient() {
  const params = useParams()
  const transferId = params.id as string
  const [offer, setOffer] = useState<TransferOffer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getTransferOfferById = (id: string): TransferOffer | null => {
      try {
        // Try sessionStorage first, then localStorage for tab compatibility
        let storedData = sessionStorage.getItem('transferSearchData')
        if (!storedData) {
          storedData = localStorage.getItem('transferSearchData')
        }
        
        console.log('🔍 Looking for transfer ID:', id)
        console.log('📦 SessionStorage data exists:', !!sessionStorage.getItem('transferSearchData'))
        console.log('💾 LocalStorage data exists:', !!localStorage.getItem('transferSearchData'))
        
        if (!storedData) {
          console.log('❌ No transferSearchData found in any storage')
          return null
        }
        
        const searchData = JSON.parse(storedData)
        const offers = searchData.results || []
        console.log(`📋 Found ${offers.length} offers in sessionStorage`)
        console.log('🎯 Available offer IDs:', offers.map((o: any) => o.id))
        
        const foundOffer = offers.find((offer: TransferOffer) => offer.id === id)
        console.log('✅ Found matching offer:', !!foundOffer)
        
        return foundOffer || null
      } catch (error) {
        console.error('❌ Error getting transfer offer:', error)
        return null
      }
    }

    const transferOffer = getTransferOfferById(transferId)
    setOffer(transferOffer)
    setLoading(false)
  }, [transferId])

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
      'LM': { label: 'Limousine', color: 'purple' }
    }
    return categoryMap[category]
  }

  // Vehicle code mapping
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

  const handleBooking = () => {
    console.log('Booking transfer:', offer?.id)
    // Implement booking logic
    alert('Booking functionality will be implemented!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Loading transfer details...
          </p>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 dark:bg-neutral-800">
            <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.664-2.64" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Transfer Details Not Available</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            The transfer details are not available. This may happen if you accessed this page directly or your session has expired.
          </p>
          <div className="space-y-3">
            <ButtonPrimary href="/" className="w-full">
              Search New Transfer
            </ButtonPrimary>
            <ButtonSecondary href="/car-categories/all" className="w-full">
              Browse All Transfers
            </ButtonSecondary>
          </div>
        </div>
      </div>
    )
  }

  const categoryInfo = offer.vehicle?.category ? getCategoryInfo(offer.vehicle.category) : null
  const totalSeats = offer.vehicle.seats?.reduce((sum, seat) => sum + seat.count, 0) || 0
  const totalBags = offer.vehicle.baggages?.reduce((sum, bag) => sum + bag.count, 0) || 0

  return (
    <div className="pb-28">
      {/* Header Gallery */}
      <div className="relative">
        <div className="aspect-w-16 aspect-h-9 sm:aspect-h-6 lg:aspect-h-4 xl:aspect-h-3">
          <Image
            fill
            className="object-contain rounded-xl"
            src={offer.vehicle?.imageURL || '/default-car.png'}
            alt={offer.vehicle?.description || 'Transfer Vehicle'}
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {offer.transferType === 'PRIVATE' && (
            <Badge color="green">
              {offer.transferType}
            </Badge>
          )}
          {categoryInfo && (
            <Badge color={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mt-11 flex flex-col lg:flex-row">
        <div className="w-full space-y-8 lg:w-3/5 lg:space-y-10 lg:pr-10 xl:w-2/3">
          
          {/* Header Info */}
          <div className="listingSection__wrap">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
                  {offer.vehicle?.description || 'Transfer Vehicle'}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-x-2">
                    <MapPinIcon className="h-5 w-5 text-neutral-500" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {offer.start?.locationCode} → {offer.end?.address?.cityName}
                    </span>
                  </div>
                  {offer.vehicle?.code && (
                    <div className="flex items-center gap-1">
                      <Headless.Popover className="relative">
                        <Headless.PopoverButton 
                          className="text-sm font-medium text-neutral-600 dark:text-neutral-300 cursor-help border-b border-dotted border-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-0"
                        >
                          {offer.vehicle.code}
                        </Headless.PopoverButton>
                        <Headless.PopoverPanel 
                          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform"
                        >
                          <div className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-800">
                            <div className="font-medium">{getVehicleCodeInfo(offer.vehicle.code)}</div>
                            <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-neutral-900 dark:bg-neutral-800"></div>
                          </div>
                        </Headless.PopoverPanel>
                      </Headless.Popover>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="listingSection__wrap">
            <h2 className="text-2xl font-semibold">Transfer Details</h2>
            <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
            
            <DescriptionList>
              <DescriptionTerm>Pickup</DescriptionTerm>
              <DescriptionDetails>
                <div className="space-y-1">
                  <div className="font-medium">{offer.start?.locationCode}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {formatDateTime(offer.start?.dateTime)}
                  </div>
                </div>
              </DescriptionDetails>

              <DescriptionTerm>Drop-off</DescriptionTerm>
              <DescriptionDetails>
                <div className="space-y-1">
                  <div className="font-medium">{offer.end?.address?.line}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {offer.end?.address?.cityName}, {offer.end?.address?.countryCode}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {formatDateTime(offer.end?.dateTime)}
                  </div>
                </div>
              </DescriptionDetails>

              <DescriptionTerm>Vehicle</DescriptionTerm>
              <DescriptionDetails>
                <div className="space-y-2">
                  <div className="flex items-center gap-x-4">
                    <div className="flex items-center gap-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span className="text-sm">{totalSeats} seats</span>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <ShieldCheckIcon className="h-4 w-4" />
                      <span className="text-sm">{totalBags} bags</span>
                    </div>
                  </div>
                </div>
              </DescriptionDetails>

              <DescriptionTerm>Service Provider</DescriptionTerm>
              <DescriptionDetails>
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
                  <span className="font-medium">{offer.serviceProvider?.name}</span>
                </div>
              </DescriptionDetails>
            </DescriptionList>
          </div>

          {/* Extra Services */}
          {offer.extraServices && offer.extraServices.length > 0 && (
            <div className="listingSection__wrap">
              <h2 className="text-2xl font-semibold">Extra Services</h2>
              <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
              
              <div className="space-y-3">
                {offer.extraServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{service.description}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {service.isBookable ? 'Available for booking' : 'Included'}
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatPrice(service.quotation.monetaryAmount, service.quotation.currencyCode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          {offer.cancellationRules && offer.cancellationRules.length > 0 && (
            <div className="listingSection__wrap">
              <h2 className="text-2xl font-semibold">Cancellation Policy</h2>
              <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
              
              <div className="space-y-3">
                {offer.cancellationRules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{rule.ruleDescription}</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {rule.feeType === 'PERCENTAGE' ? `${rule.feeValue}% fee` : `${rule.feeValue} fee`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="block w-full flex-grow mt-14 lg:mt-0 lg:w-2/5 xl:w-1/3">
          <div className="listingSection__wrap shadow-xl">
            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-3xl font-semibold">
                {formatPrice(offer.quotation?.monetaryAmount || '0', offer.quotation?.currencyCode || 'EUR')}
              </span>
              <span className="text-lg text-neutral-600 dark:text-neutral-400">total</span>
            </div>

            {/* Price Breakdown */}
            {(offer.quotation?.base || offer.quotation?.totalFees) && (
              <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                {offer.quotation.base && (
                  <div className="flex justify-between text-sm">
                    <span>Base price</span>
                    <span>{formatPrice(offer.quotation.base.monetaryAmount, offer.quotation.currencyCode)}</span>
                  </div>
                )}
                {offer.quotation.totalFees && parseFloat(offer.quotation.totalFees.monetaryAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Fees</span>
                    <span>{formatPrice(offer.quotation.totalFees.monetaryAmount, offer.quotation.currencyCode)}</span>
                  </div>
                )}
              </div>
            )}

            <Divider />

            {/* Booking Form */}
            <form className="space-y-4">
              <ButtonPrimary type="button" onClick={handleBooking} className="w-full">
                Book Transfer
              </ButtonPrimary>
              <ButtonSecondary href="/car-categories/all" className="w-full">
                Back to Search
              </ButtonSecondary>
            </form>

            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <InformationCircleIcon className="h-4 w-4" />
                <span>Free cancellation available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}