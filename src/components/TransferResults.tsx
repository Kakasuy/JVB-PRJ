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

  // Paginate offers
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return offers.slice(startIndex, endIndex)
  }, [offers, currentPage])

  // Calculate total pages (max 5)
  const totalPages = useMemo(() => {
    const calculated = Math.ceil(offers.length / ITEMS_PER_PAGE)
    return Math.min(calculated, MAX_PAGES)
  }, [offers.length])

  // Reset to first page when offers change
  useEffect(() => {
    setCurrentPage(1)
  }, [offers])

  useEffect(() => {
    const loadTransferData = () => {
      try {
        // Check if we have search results in sessionStorage
        const storedData = sessionStorage.getItem('transferSearchData')
        if (storedData) {
          const searchData = JSON.parse(storedData)
          console.log(`📦 Displaying ${searchData.results?.length || 0} transfer offers`)
          
          setOffers(searchData.results || [])
          setSearchInfo(searchData.searchParams)
          setHasSearched(true)
          
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
        setLoading(false)
      }
    }

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

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('transferSearchUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('transferSearchUpdated', handleCustomStorageChange)
    }
  }, [])

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Loading transfer offers...
            </p>
          </div>
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
    <div className={className}>
      {/* Results header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 sm:text-xl">
            Over {convertNumbThousand(offers.length)} transfers found
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {searchInfo && (
              <>
                From <span className="font-medium">{searchInfo.from}</span> to{' '}
                <span className="font-medium">{searchInfo.to}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Transfer listings */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-7 xl:grid-cols-2">
        {paginatedOffers.map((offer) => (
          <TransferOfferCard key={offer.id} data={offer} />
        ))}
      </div>

      {/* Pagination */}
      {offers.length > ITEMS_PER_PAGE && totalPages > 1 && (
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
      {offers.length > MAX_PAGES * ITEMS_PER_PAGE && (
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing first {MAX_PAGES * ITEMS_PER_PAGE} results out of {offers.length} total transfers found
          </p>
        </div>
      )}
    </div>
  )
}

export default TransferResults