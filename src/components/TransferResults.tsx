'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import TransferOfferCard from '@/components/TransferOfferCard'
import { Button } from '@/shared/Button'
import convertNumbThousand from '@/utils/convertNumbThousand'

const ITEMS_PER_PAGE = 8
const MAX_PAGES = 5

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

interface TransferResultsProps {
  className?: string
}

const TransferResults: React.FC<TransferResultsProps> = ({ className = '' }) => {
  const searchParams = useSearchParams()
  const [offers, setOffers] = useState<TransferOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInfo, setSearchInfo] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // Check if we have fresh search parameters (indicates user just searched)  
  const hasSearchParams = searchParams.get('from') || searchParams.get('to') || searchParams.get('datetime')
  
  // Function to check stored data
  const hasStoredData = () => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('transferSearchData') || localStorage.getItem('transferSearchData')
  }
  
  const isActiveSearch = isMounted && hasSearchParams && !hasStoredData()
  
  // Debug logs (only after mount to avoid hydration issues)
  if (isMounted) {
    console.log('🔍 TransferResults Debug:', {
      hasSearchParams,
      isActiveSearch,
      loading,
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      datetime: searchParams.get('datetime'),
      storedData: !!sessionStorage.getItem('transferSearchData') || !!localStorage.getItem('transferSearchData')
    })
  }
  
  // Timeout for loading state
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Apply filters to offers
  const filteredOffers = useMemo(() => {
    if (!offers.length) return offers

    let filtered = [...offers]

    // Price range filter
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    
    if (priceMin || priceMax) {
      filtered = filtered.filter(offer => {
        const price = parseFloat(offer.quotation.monetaryAmount)
        const min = priceMin ? parseFloat(priceMin) : 0
        const max = priceMax ? parseFloat(priceMax) : Infinity
        return price >= min && price <= max
      })
    }

    // Vehicle Type filter
    const vehicleCodes = searchParams.get('vehicle_codes')
    if (vehicleCodes) {
      const selectedVehicleCodes = vehicleCodes.split(',')
      filtered = filtered.filter(offer => {
        const vehicleCode = offer.vehicle.code
        return selectedVehicleCodes.includes(vehicleCode)
      })
    }

    // Vehicle Category (Service Level) filter
    const vehicleCategories = searchParams.get('vehicle_categories')
    if (vehicleCategories) {
      const selectedVehicleCategories = vehicleCategories.split(',')
      filtered = filtered.filter(offer => {
        const vehicleCategory = offer.vehicle.category
        return selectedVehicleCategories.includes(vehicleCategory)
      })
    }

    // Extra Services filter
    const extraServices = searchParams.get('extra_services')
    if (extraServices) {
      const selectedServices = extraServices.split(',')
      // Note: Amadeus API doesn't provide extra services in response
      // This would need to be implemented based on actual data structure
      console.log('🔧 Extra services filter not yet implemented:', selectedServices)
    }

    // Passengers & Baggage filter
    const passengers = searchParams.get('passengers')
    const smallBags = searchParams.get('small_bags')
    const largeBags = searchParams.get('large_bags')
    
    if (passengers || smallBags || largeBags) {
      filtered = filtered.filter(offer => {
        const vehicleSeats = offer.vehicle.seats?.[0]?.count || 0
        const vehicleBaggages = offer.vehicle.baggages || []
        
        // Check passenger capacity
        if (passengers) {
          const requiredPassengers = parseInt(passengers)
          if (vehicleSeats < requiredPassengers) {
            return false
          }
        }
        
        // Check baggage capacity (simplified - check total baggage count)
        if (smallBags || largeBags) {
          const requiredSmallBags = smallBags ? parseInt(smallBags) : 0
          const requiredLargeBags = largeBags ? parseInt(largeBags) : 0
          const totalRequiredBags = requiredSmallBags + requiredLargeBags
          
          const totalVehicleBags = vehicleBaggages.reduce((total, bag) => total + bag.count, 0)
          if (totalVehicleBags < totalRequiredBags) {
            return false
          }
        }
        
        return true
      })
    }

    console.log(`🎯 Filtered ${offers.length} offers down to ${filtered.length} offers`, {
      priceMin,
      priceMax,
      vehicleCodes,
      vehicleCategories,
      extraServices,
      passengers,
      smallBags,
      largeBags,
      originalCount: offers.length,
      filteredCount: filtered.length
    })

    return filtered
  }, [offers, searchParams])

  // Paginate filtered offers
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredOffers.slice(startIndex, endIndex)
  }, [filteredOffers, currentPage])

  // Calculate total pages (max 5) based on filtered results
  const totalPages = useMemo(() => {
    const calculated = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE)
    return Math.min(calculated, MAX_PAGES)
  }, [filteredOffers.length])

  // Mount effect
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset to first page when offers or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [offers, searchParams])

  useEffect(() => {
    const loadTransferData = () => {
      try {
        // Check if we have search results in sessionStorage or localStorage
        let storedData = null
        if (typeof window !== 'undefined') {
          storedData = sessionStorage.getItem('transferSearchData')
          if (!storedData) {
            storedData = localStorage.getItem('transferSearchData')
          }
        }
        
        // If we have search params but no data yet, keep loading (active search)
        if (hasSearchParams && !storedData) {
          console.log('🔄 Active search detected, showing skeleton loading...')
          if (!loading) {
            setLoading(true)
          }
          
          // Set timeout to stop loading after 30 seconds
          if (searchTimeout) clearTimeout(searchTimeout)
          const timeout = setTimeout(() => {
            console.log('⏰ Search timeout reached, stopping loading...')
            setLoading(false)
          }, 30000)
          setSearchTimeout(timeout)
          
          return // Keep loading state
        }
        
        if (storedData) {
          const searchData = JSON.parse(storedData)
          console.log(`📦 Displaying ${searchData.results?.length || 0} transfer offers`)
          
          setOffers(searchData.results || [])
          setSearchInfo(searchData.searchParams)
          setHasSearched(true)
          
          // Clear timeout when data arrives
          if (searchTimeout) {
            clearTimeout(searchTimeout)
            setSearchTimeout(null)
          }
          
          // Hide default car listings when we have transfer results
          const fallbackElement = document.querySelector('.transfer-fallback')
          if (fallbackElement) {
            (fallbackElement as HTMLElement).style.display = 'none'
          }
        } else {
          setOffers([])
          
          // Show default car listings when no transfer data
          const fallbackElement = document.querySelector('.transfer-fallback')
          if (fallbackElement) {
            (fallbackElement as HTMLElement).style.display = 'block'
          }
        }
      } catch (error) {
        console.error('Error loading transfer data:', error)
        setOffers([])
      } finally {
        // Only stop loading if we're not in active search state
        if (!isActiveSearch) {
          setLoading(false)
        }
      }
    }

    // Only run after component is mounted
    if (!isMounted) return
    
    // Initial load
    loadTransferData()

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'transferSearchData') {
        console.log('🔄 Detected sessionStorage change, reloading...')
        setLoading(true)
        loadTransferData()
      }
    }

    // Listen for custom event (from same tab)
    const handleCustomStorageChange = () => {
      console.log('🔄 Detected new search, reloading...')
      setLoading(true)
      loadTransferData()
    }

    // Listen for filter changes
    const handleFiltersChanged = (event: any) => {
      console.log('🎯 Filters changed, applying to transfer results...')
      // Force re-render with current filters
      loadTransferData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('transferSearchUpdated', handleCustomStorageChange)
    window.addEventListener('filtersChanged', handleFiltersChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('transferSearchUpdated', handleCustomStorageChange)
      window.removeEventListener('filtersChanged', handleFiltersChanged)
      // Clear timeout on cleanup
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [hasSearchParams, isActiveSearch, isMounted])

  if (loading) {
    console.log('🎭 Showing skeleton loading state')
    const fromLocation = searchParams.get('from') || (searchInfo?.from)
    const toLocation = searchParams.get('to') || (searchInfo?.to)
    
    return (
      <div className={className}>
        {/* Results header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded animate-pulse mt-2 dark:bg-neutral-700"></div>
          </div>
        </div>

        {/* Transfer listings skeleton */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-7 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
              {/* Header skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
                <div className="h-8 w-20 bg-neutral-200 rounded-full animate-pulse dark:bg-neutral-700"></div>
              </div>
              
              {/* Route info skeleton */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
                <div className="h-0.5 flex-1 bg-neutral-200 animate-pulse dark:bg-neutral-700"></div>
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
              </div>
              
              {/* Vehicle info skeleton */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-16 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
                <div className="flex-1">
                  <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700 mb-2"></div>
                  <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
                </div>
              </div>
              
              {/* Features skeleton */}
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 bg-neutral-200 rounded-full animate-pulse dark:bg-neutral-700"></div>
                <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse dark:bg-neutral-700"></div>
                <div className="h-6 w-18 bg-neutral-200 rounded-full animate-pulse dark:bg-neutral-700"></div>
              </div>
              
              {/* Price and button skeleton */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse dark:bg-neutral-700"></div>
                </div>
                <div className="h-10 w-24 bg-neutral-200 rounded-full animate-pulse dark:bg-neutral-700"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading status text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isMounted && isActiveSearch && fromLocation && toLocation 
              ? `Searching transfers from ${fromLocation} to ${toLocation}...`
              : 'Loading transfer offers...'
            }
          </p>
        </div>
      </div>
    )
  }

  if (!hasSearched) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Start Your Search
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Use the search form above to find transfer options for your trip.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center dark:bg-neutral-800">
              <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.664-2.64M15 9.34c-.18-.14-.38-.27-.59-.39m-6.82 0c-.21.12-.41.25-.59.39M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                No Transfers Found
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                We couldn't find any transfer options for your search criteria. Try adjusting your dates or locations.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} mt-8`}>
      {/* Results header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 sm:text-xl">
            Over {convertNumbThousand(filteredOffers.length)} transfers found
            {searchInfo && (
              <span className="text-sm text-neutral-600 dark:text-neutral-400 font-normal ml-2">
                from <span className="font-medium">{searchInfo.from}</span> to{' '}
                <span className="font-medium">{searchInfo.to}</span>
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Transfer listings */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-7 xl:grid-cols-2">
        {paginatedOffers.map((offer) => (
          <TransferOfferCard key={offer.id} data={offer} />
        ))}
      </div>

      {/* Pagination */}
      {filteredOffers.length > ITEMS_PER_PAGE && totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              color="white"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="text-sm"
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                color={currentPage === page ? 'primary' : 'white'}
                onClick={() => setCurrentPage(page)}
                className="text-sm w-10 h-10"
              >
                {page}
              </Button>
            ))}
            
            <Button
              color="white"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Show info about pagination limit */}
      {filteredOffers.length > MAX_PAGES * ITEMS_PER_PAGE && (
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing first {MAX_PAGES * ITEMS_PER_PAGE} results out of {filteredOffers.length} filtered transfers found
          </p>
        </div>
      )}
    </div>
  )
}

export default TransferResults