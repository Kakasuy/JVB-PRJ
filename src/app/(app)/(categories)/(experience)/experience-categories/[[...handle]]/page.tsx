import ExperiencesCard from '@/components/ExperiencesCard'
import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { ExperiencesSearchForm } from '@/components/HeroSearchForm/ExperiencesSearchForm'
import ListingFilterTabs from '@/components/ListingFilterTabs'
import SectionSliderCards from '@/components/SectionSliderCards'
import { getExperienceCategoryByHandle } from '@/data/categories'
import { getExperienceListingFilterOptions, getExperienceListings } from '@/data/listings'
import { Button } from '@/shared/Button'
import { Divider } from '@/shared/divider'
import { Heading } from '@/shared/Heading'
import Pagination, { PaginationPrevious, PaginationNext } from '@/shared/Pagination'
import convertNumbThousand from '@/utils/convertNumbThousand'
import { HotAirBalloonIcon, MapPinpoint02Icon, MapsLocation01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import clsx from 'clsx'

// Helper function to build pagination URL
function buildPaginationURL(searchParams: any, pageNum: number): string {
  const params = new URLSearchParams()
  
  // Copy all existing search params except page
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key !== 'page' && value) {
      params.set(key, value as string)
    }
  })
  
  // Set new page number
  if (pageNum > 1) {
    params.set('page', pageNum.toString())
  }
  
  return params.toString()
}

// Transform Amadeus Tours API response to ExperienceCard format
async function getToursAndActivities(latitude: number, longitude: number, radius: number) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tours-search?latitude=${latitude}&longitude=${longitude}&radius=${radius}`, {
      cache: 'no-store' // Always fetch fresh data
    })
    
    const data = await response.json()
    
    if (!data.success || !data.data) {
      console.error('Tours API failed:', data.error)
      return [] // Return empty array if API fails
    }
    
    // Transform Amadeus response to ExperienceCard format - filter out offers without valid images
    return data.data
      .filter((offer: any) => offer.pictures && offer.pictures.length > 0 && offer.pictures[0])
      .map((offer: any, index: number) => ({
      id: offer.id,
      title: offer.name,
      handle: `${offer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${offer.id}`,
      host: {
        displayName: 'Experience Provider',
        avatarUrl: '/default-avatar.jpg',
        handle: `provider-${offer.id}`,
      },
      listingCategory: 'Tour & Activity',
      date: new Date().toISOString().split('T')[0],
      description: offer.description?.replace(/<[^>]*>/g, '') || 'Amazing experience awaits you.',
      durationTime: offer.minimumDuration || null,
      languages: ['English'], // Default language
      featuredImage: offer.pictures?.[0] || '/placeholder-experience.jpg',
      galleryImgs: offer.pictures || ['/placeholder-experience.jpg'],
      like: false,
      address: 'Experience Location',
      reviewStart: 4.0 + (Math.random() * 1), // Random rating 4.0-5.0
      reviewCount: Math.floor(Math.random() * 200) + 50, // Random 50-250 reviews
      price: `${offer.price?.currencyCode || 'EUR'} ${offer.price?.amount || '0'}`,
      maxGuests: Math.floor(Math.random() * 10) + 2, // Random 2-12 guests
      saleOff: null,
      isAds: null,
      map: { 
        lat: offer.geoCode?.latitude || latitude, 
        lng: offer.geoCode?.longitude || longitude 
      },
    }))
  } catch (error) {
    console.error('Error fetching tours:', error)
    return [] // Return empty array on error
  } finally {
    // Log API call for debugging
    console.log(`🔍 Tours API called: latitude=${latitude}, longitude=${longitude}, radius=${radius}`)
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle?: string[] }> }): Promise<Metadata> {
  const { handle } = await params
  const category = await getExperienceCategoryByHandle(handle?.[0])
  if (!category) {
    return {
      title: 'Collection not found',
      description: 'The collection you are looking for does not exist.',
    }
  }
  const { name, description } = category
  return { title: name, description }
}

const Page = async ({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { handle } = await params
  const urlSearchParams = await searchParams

  const category = await getExperienceCategoryByHandle(handle?.[0])
  
  // Check if we have geoCode from search form
  const geoCode = urlSearchParams.geoCode as string
  const radius = urlSearchParams.radius as string || '1'
  const currentPage = Math.max(1, parseInt(urlSearchParams.page as string) || 1) // Ensure page >= 1
  const itemsPerPage = 8
  
  let allListings
  if (geoCode) {
    // Use API data when geoCode is available
    const [lat, lng] = geoCode.split(',')
    allListings = await getToursAndActivities(parseFloat(lat), parseFloat(lng), parseInt(radius))
  } else {
    // Fallback to mock data
    allListings = await getExperienceListings()
  }
  
  // Pagination logic - ensure we have data
  const totalItems = allListings.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const validPage = Math.min(currentPage, totalPages || 1) // Don't exceed total pages
  
  const startIndex = (validPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const listings = allListings.slice(startIndex, endIndex)
  
  const filterOptions = await getExperienceListingFilterOptions()

  if (!category?.id) {
    return redirect('/experience-categories/all')
  }

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading={category.name}
          image={category.coverImage}
          imageAlt={category.name}
          searchForm={<ExperiencesSearchForm formStyle="default" />}
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{category.region} </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={HotAirBalloonIcon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{convertNumbThousand(category.count)} experiences</span>
            </div>
          }
        />
      </div>

      <div className="relative container mt-14 lg:mt-24">
        {/* start heading */}
        <div className="flex flex-wrap items-end justify-between gap-x-2.5 gap-y-5">
          <h2 id="heading" className="scroll-mt-20 text-lg font-semibold sm:text-xl">
            {allListings.length} experiences found
            {category.handle !== 'all' ? ` in ${category.name}` : null}
          </h2>
          <Button color="white" className="ms-auto" href={'/experience-categories-map/' + category.handle}>
            <span className="me-1">Show map</span>
            <HugeiconsIcon icon={MapsLocation01Icon} size={20} color="currentColor" strokeWidth={1.5} />
          </Button>
        </div>
        <Divider className="my-8 md:mb-12" />
        {/* end heading */}
        <ListingFilterTabs filterOptions={filterOptions} />

        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:mt-10 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ExperiencesCard key={listing.id} data={listing} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            {validPage > 1 && (
              <Button
                href={`?${buildPaginationURL(urlSearchParams, validPage - 1)}`}
                className="rounded-lg px-4 py-2 border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
                plain
              >
                Previous
              </Button>
            )}
            
            {/* Page numbers */}
            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const pageNum = i + 1
              const isActive = pageNum === validPage
              return (
                <Button
                  key={pageNum}
                  href={`?${buildPaginationURL(urlSearchParams, pageNum)}`}
                  className={clsx("rounded-lg px-4 py-2 min-w-[40px]", 
                    isActive 
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" 
                      : "border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
                  )}
                  plain={!isActive}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            {validPage < totalPages && (
              <Button
                href={`?${buildPaginationURL(urlSearchParams, validPage + 1)}`}
                className="rounded-lg px-4 py-2 border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
                plain
              >
                Next
              </Button>
            )}
            
            <span className="ml-4 text-sm text-neutral-600 dark:text-neutral-400">
              Page {validPage} of {totalPages}
            </span>
          </div>
        )}

        <Divider className="my-14 lg:my-24" />
        <Heading className="mb-12">Just a few spots left.</Heading>
        <SectionSliderCards listings={listings.slice(0, 8)} cardType="experience" />
      </div>
    </div>
  )
}

export default Page
