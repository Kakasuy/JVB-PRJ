'use client'

import { MapPinIcon, ClockIcon, UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { Divider } from '@/shared/divider'

interface TransferTripProps {
  transferData: {
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
}

const TransferTrip = ({ transferData }: TransferTripProps) => {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }

  const formatBaggageInfo = () => {
    if (!transferData.vehicle.baggages || transferData.vehicle.baggages.length === 0) {
      return '0 bags'
    }
    
    const totalBags = transferData.vehicle.baggages.reduce((sum, bag) => sum + bag.count, 0)
    
    const bagsBySizes = transferData.vehicle.baggages.reduce((acc: Record<string, number>, bag) => {
      const size = bag.size || 'M' // Default to Medium if no size
      acc[size] = (acc[size] || 0) + bag.count
      return acc
    }, {})
    
    const bagInfo = Object.entries(bagsBySizes)
      .map(([size, count]) => `${count}${size}`)
      .join(' + ')
    
    return `${totalBags} bags (${bagInfo})`
  }

  const pickupDateTime = formatDateTime(transferData.start.dateTime)
  const totalSeats = transferData.vehicle.seats?.reduce((sum, seat) => sum + seat.count, 0) || 0

  return (
    <div>
      <h3 className="text-2xl font-semibold">Your transfer</h3>
      <div className="mt-6 flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-3xl border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
        
        {/* Transfer Route Section */}
        <div className="flex flex-col sm:flex-row sm:items-center p-5 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-3 flex-1">
            <MapPinIcon className="h-6 w-6 text-neutral-500" />
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {transferData.start.locationCode}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Pickup location
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="h-px w-8 bg-neutral-300 dark:bg-neutral-600 sm:w-12"></div>
            <div className="mx-2 text-xs text-neutral-400">→</div>
            <div className="h-px w-8 bg-neutral-300 dark:bg-neutral-600 sm:w-12"></div>
          </div>
          
          <div className="flex items-center space-x-3 flex-1">
            <MapPinIcon className="h-6 w-6 text-neutral-500" />
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {transferData.end.address.cityName}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {transferData.end.address.line}
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Date & Time Section */}
        <div className="flex flex-col sm:flex-row sm:items-center p-5 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 flex-1">
            <ClockIcon className="h-6 w-6 text-neutral-500" />
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {pickupDateTime.date}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Pickup date
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-6"></div> {/* Spacer for alignment */}
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {pickupDateTime.time}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Pickup time
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Vehicle Details Section */}
        <div className="flex flex-col sm:flex-row sm:items-center p-5 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 flex-1">
            <UserIcon className="h-6 w-6 text-neutral-500" />
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {totalSeats} seats
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Passenger capacity
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-1">
            <BriefcaseIcon className="h-6 w-6 text-neutral-500" />
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {formatBaggageInfo()}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Baggage allowance
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Vehicle & Service Provider Section */}
        <div className="flex flex-col sm:flex-row sm:items-center p-5 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                {transferData.vehicle.code}
              </span>
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {transferData.vehicle.description}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {transferData.transferType} Transfer
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-1">
            {transferData.serviceProvider?.logoUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img
                  src={transferData.serviceProvider.logoUrl}
                  alt={transferData.serviceProvider.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {transferData.serviceProvider?.name}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Service provider
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Requests Section */}
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-3">Special requests</h4>
        <div className="space-y-3">
          <textarea
            name="specialRequests"
            rows={3}
            className="block w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-400 dark:focus:border-primary-6000 dark:focus:ring-primary-6000"
            placeholder="Any special instructions for the driver? (e.g., meet at specific terminal, contact number, etc.)"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Optional: Add any special instructions or requirements for your transfer
          </p>
        </div>
      </div>
    </div>
  )
}

export default TransferTrip