'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import ExperiencesCard from '@/components/ExperiencesCard'
import { Button } from '@/shared/Button'

interface ExperienceOffer {
  id: string
  title: string
  handle: string
  host: {
    displayName: string
    avatarUrl: string
    handle: string
  }
  listingCategory: string
  date: string
  description: string
  durationTime?: string
  languages: string[]
  featuredImage: string
  galleryImgs: string[]
  like: boolean
  address: string
  reviewStart: number
  reviewCount: number
  price: string
  maxGuests: number
  saleOff: any
  isAds: any
  map: { lat: number; lng: number }
  isAmadeusData?: boolean
}

interface ExperienceSearchResultsProps {
  geoCode?: string
  location?: string
}


export const ExperienceSearchResults: React.FC<ExperienceSearchResultsProps> = ({
  geoCode,
  location
}) => {
  const [allOffers, setAllOffers] = useState<ExperienceOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()
  
  const radius = searchParams.get('radius') || '1'
  const EXPERIENCES_PER_PAGE = 8
  const MAX_PAGES = 20 // Allow up to 160 experiences (20 pages x 8 per page)

  // Fetch tours data from API
  const fetchTours = useCallback(async (lat: number, lng: number, searchRadius: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tours-search?latitude=${lat}&longitude=${lng}&radius=${searchRadius}`)
      const data = await response.json()
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch tours')
      }
      
      // Transform Amadeus response to ExperienceCard format
      const transformedOffers: ExperienceOffer[] = data.data
        .filter((offer: any) => offer.pictures && offer.pictures.length > 0 && offer.pictures[0])
        .map((offer: any) => ({
          id: offer.id, // This is the Amadeus activityId
          title: offer.name,
          handle: `amadeus-${offer.id}`, // Mark this as Amadeus data
          host: {
            displayName: 'Experience Provider',
            avatarUrl: '/default-avatar.jpg',
            handle: `provider-${offer.id}`,
          },
          listingCategory: 'Tour & Activity',
          date: new Date().toISOString().split('T')[0],
          description: offer.description?.replace(/<[^>]*>/g, '') || 'Amazing experience awaits you.',
          durationTime: offer.minimumDuration || null,
          languages: ['English'],
          featuredImage: offer.pictures?.[0] || '/placeholder-experience.jpg',
          galleryImgs: offer.pictures || ['/placeholder-experience.jpg'],
          like: false,
          address: 'Experience Location',
          reviewStart: 4.0 + (Math.random() * 1),
          reviewCount: Math.floor(Math.random() * 200) + 50,
          price: `${offer.price?.currencyCode || 'EUR'} ${offer.price?.amount || '0'}`,
          maxGuests: Math.floor(Math.random() * 10) + 2,
          saleOff: null,
          isAds: null,
          map: { 
            lat: offer.geoCode?.latitude || lat, 
            lng: offer.geoCode?.longitude || lng 
          },
          // Add flag to identify Amadeus data
          isAmadeusData: true,
        }))
      
      setAllOffers(transformedOffers)
      console.log('🔍 Tours API success:', transformedOffers.length, 'offers found')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Tours API error:', errorMessage)
      setAllOffers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data when geoCode changes
  useEffect(() => {
    if (geoCode && geoCode.includes(',')) {
      const [lat, lng] = geoCode.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        fetchTours(lat, lng, radius)
      }
    }
  }, [geoCode, radius, fetchTours])

  // Reset to page 1 when search params change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchParams])

  // Calculate pagination
  const totalExperiences = allOffers.length
  const totalPages = Math.min(Math.ceil(totalExperiences / EXPERIENCES_PER_PAGE), MAX_PAGES)
  const maxExperiencesToShow = MAX_PAGES * EXPERIENCES_PER_PAGE // 160 experiences maximum
  const experiencesToDisplay = allOffers.slice(0, maxExperiencesToShow) // Only show first 160 experiences
  
  const paginatedExperiences = useMemo(() => {
    const startIndex = (currentPage - 1) * EXPERIENCES_PER_PAGE
    const endIndex = startIndex + EXPERIENCES_PER_PAGE
    return experiencesToDisplay.slice(startIndex, endIndex)
  }, [experiencesToDisplay, currentPage])

  // Loading state
  if (loading) {
    return (
      <div className="mt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-300 rounded w-48"></div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-w-3 aspect-h-3 bg-neutral-300 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-300 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="mt-8 text-center py-12">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <Button 
          onClick={() => geoCode && fetchTours(...geoCode.split(',').map(Number), radius)} 
          className="rounded-lg"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // No results
  if (!loading && allOffers.length === 0) {
    return (
      <div className="mt-8 text-center py-12">
        <div className="text-neutral-600 mb-4">No experiences found for this location.</div>
        <p className="text-sm text-neutral-500">Try searching in a different area or increasing the search radius.</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      {/* Results summary */}
      <div className="mb-6">
        <p className="text-neutral-600 dark:text-neutral-300">
          Found {totalExperiences} experience{totalExperiences !== 1 ? 's' : ''}{location ? ` in ${location}` : ''}
          {totalExperiences > maxExperiencesToShow && ` (showing first ${maxExperiencesToShow})`}
        </p>
      </div>

      {/* Experiences grid */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedExperiences.map((offer) => (
          <ExperiencesCard key={offer.id} data={offer} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              color="white"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2"
            >
              Previous
            </Button>
            
            {/* Smart pagination */}
            {(() => {
              const pages = []
              
              if (totalPages <= 7) {
                // Show all pages if 7 or fewer
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i)
                }
              } else {
                // Smart pagination for more than 7 pages
                pages.push(1) // Always show first page
                
                let startPage, endPage
                if (currentPage <= 3) {
                  // Near the beginning
                  startPage = 2
                  endPage = 5
                } else if (currentPage >= totalPages - 2) {
                  // Near the end
                  startPage = totalPages - 4
                  endPage = totalPages - 1
                } else {
                  // In the middle
                  startPage = currentPage - 1
                  endPage = currentPage + 1
                }
                
                // Add dots before middle pages if needed
                if (startPage > 2) {
                  pages.push('...')
                }
                
                // Add middle pages
                for (let i = Math.max(2, startPage); i <= Math.min(totalPages - 1, endPage); i++) {
                  pages.push(i)
                }
                
                // Add dots after middle pages if needed
                if (endPage < totalPages - 1) {
                  pages.push('...')
                }
                
                // Always show last page (if more than 1 page)
                if (totalPages > 1) {
                  pages.push(totalPages)
                }
              }
              
              return pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`dots-${index}`} className="px-2 text-neutral-500">
                      ...
                    </span>
                  )
                }
                
                return (
                  <Button
                    key={`page-${page}`}
                    color={currentPage === page ? 'primary' : 'white'}
                    onClick={() => setCurrentPage(page as number)}
                    className="px-3 py-2 min-w-[40px]"
                  >
                    {page}
                  </Button>
                )
              })
            })()}
            
            <Button
              color="white"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}