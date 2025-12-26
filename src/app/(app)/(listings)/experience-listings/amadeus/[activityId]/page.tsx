import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { Table, TableBody, TableCell, TableRow } from '@/shared/table'
import T from '@/utils/getT'
import { CheckCircleIcon, ClockIcon, LanguageIcon, UsersIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Form from 'next/form'
import { redirect } from 'next/navigation'
import DatesRangeInputPopover from '../../../components/DatesRangeInputPopover'
import GuestsInputPopover from '../../../components/GuestsInputPopover'
import HeaderGallery from '../../../components/HeaderGallery'
import SectionDateRange from '../../../components/SectionDateRange'
import SectionHeader from '../../../components/SectionHeader'
import { SectionHeading } from '../../../components/SectionHeading'
import SectionHost from '../../../components/SectionHost'
import SectionMap from '../../../components/SectionMap'

// Types for Amadeus API response
interface AmadeusActivityDetail {
  id: string
  name: string
  shortDescription?: string
  description?: string
  geoCode?: {
    latitude: number
    longitude: number
  }
  pictures?: string[]
  bookingLink?: string
  price?: {
    amount: string
    currencyCode: string
  }
  minimumDuration?: string
}

// Transform Amadeus data to match existing UI format
const transformAmadeusData = (amadeusData: AmadeusActivityDetail) => {
  return {
    id: amadeusData.id,
    title: amadeusData.name,
    handle: `amadeus-${amadeusData.id}`,
    address: 'Experience Location',
    description: amadeusData.shortDescription || amadeusData.description || 'Amazing experience awaits you.',
    featuredImage: amadeusData.pictures?.[0] || '/placeholder-experience.jpg',
    galleryImgs: amadeusData.pictures || ['/placeholder-experience.jpg'],
    price: amadeusData.price 
      ? `${amadeusData.price.currencyCode} ${amadeusData.price.amount}`
      : 'Price on request',
    reviewStart: 0, // No reviews for Amadeus data
    reviewCount: 0, // No reviews for Amadeus data
    maxGuests: 10,
    durationTime: amadeusData.minimumDuration || '4 hours',
    languages: ['English'],
    host: {
      displayName: 'Experience Provider',
      avatarUrl: '/default-avatar.jpg',
      handle: `provider-${amadeusData.id}`,
      jobTitle: 'Tour Guide',
      responseRate: '98%',
      responseTime: 'Within 1 hour'
    },
    listingCategory: 'Tour & Activity',
    map: {
      lat: amadeusData.geoCode?.latitude || 0,
      lng: amadeusData.geoCode?.longitude || 0
    },
    bookingLink: amadeusData.bookingLink,
    // Default values
    like: false,
    saleOff: null,
    isAds: null,
    date: new Date().toISOString().split('T')[0],
  }
}

// Fetch Amadeus activity detail
async function getAmadeusActivityDetail(activityId: string): Promise<AmadeusActivityDetail | null> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activity-detail?activityId=${activityId}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity detail')
    }
    
    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Error fetching Amadeus activity detail:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ activityId: string }> }): Promise<Metadata> {
  const { activityId } = await params
  const amadeusData = await getAmadeusActivityDetail(activityId)

  if (!amadeusData) {
    return {
      title: 'Activity not found',
      description: 'The activity you are looking for does not exist.',
    }
  }

  return {
    title: amadeusData.name,
    description: amadeusData.shortDescription || amadeusData.description || 'Experience this amazing activity',
  }
}

const Page = async ({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ activityId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { activityId } = await params
  const urlSearchParams = await searchParams
  
  // Fetch Amadeus activity detail
  const amadeusData = await getAmadeusActivityDetail(activityId)
  
  if (!amadeusData?.id) {
    return redirect('/experience-categories/all')
  }

  // Extract search params for dates and guests
  const checkIn = urlSearchParams.checkIn as string
  const checkOut = urlSearchParams.checkOut as string
  const guests = urlSearchParams.guests as string || '2'
  const rooms = urlSearchParams.rooms as string || '1'

  // Transform data to match existing UI format
  const listing = transformAmadeusData(amadeusData)
  
  const {
    address,
    description,
    featuredImage,
    galleryImgs,
    isAds,
    like,
    listingCategory,
    map,
    maxGuests,
    price,
    reviewCount,
    reviewStart,
    saleOff,
    title,
    host,
    durationTime,
    languages,
    bookingLink,
  } = listing


  // Server action to handle form submission
  const handleSubmitForm = async (formData: FormData) => {
    'use server'

    console.log('Amadeus activity booking form submitted:', Object.fromEntries(formData.entries()))
    console.log('Booking link:', bookingLink)
    
    // In real implementation, you might redirect to the booking link or process the booking
    if (bookingLink) {
      // Redirect to provider's booking page
      redirect(bookingLink)
    } else {
      redirect('/checkout')
    }
  }

  const renderSectionHeader = () => {
    return (
      <SectionHeader
        address={address}
        host={host}
        listingCategory={listingCategory}
        reviewCount={0}  // Hide reviews in header for Amadeus data
        reviewStart={0}  // Hide reviews in header for Amadeus data
        title={title}
      >
        <div className="flex flex-col items-center space-y-3 text-center sm:flex-row sm:space-y-0 sm:gap-x-3 sm:text-start">
          <ClockIcon className="h-6 w-6" />
          <span>{durationTime}</span>
        </div>
        <div className="flex flex-col items-center space-y-3 text-center sm:flex-row sm:space-y-0 sm:gap-x-3 sm:text-start">
          <UsersIcon className="h-6 w-6" />
          <span>Up to {maxGuests} people</span>
        </div>
        <div className="flex flex-col items-center space-y-3 text-center sm:flex-row sm:space-y-0 sm:gap-x-3 sm:text-start">
          <LanguageIcon className="h-6 w-6" />
          <span>{languages.length > 0 ? languages.join(', ') : 'Languages not specified'}</span>
        </div>
      </SectionHeader>
    )
  }

  const renderSectionInfo = () => {
    return (
      <div className="listingSection__wrap">
        <SectionHeading>Experience Description</SectionHeading>
        <Divider className="w-14!" />
        
        <div className="prose max-w-none dark:prose-invert">
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {description}
          </p>
          
          {bookingLink && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 This experience is provided by our partner. You&apos;ll be redirected to their booking page to complete your reservation.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSectionIncludes = () => {
    // Default includes for experiences
    const includes_demo = [
      { name: 'Professional Tour Guide' },
      { name: 'All Entrance Tickets' },
      { name: 'Safety Equipment' },
      { name: 'Insurance Coverage' },
      { name: 'Customer Support' },
      { name: 'Flexible Cancellation' },
    ]
    
    return (
      <div className="listingSection__wrap">
        <SectionHeading>What&apos;s Included</SectionHeading>
        <Divider className="w-14!" />

        <div className="grid grid-cols-1 gap-6 text-sm text-neutral-700 lg:grid-cols-2 dark:text-neutral-300">
          {includes_demo.map((item) => (
            <div key={item.name} className="flex items-center gap-x-3">
              <CheckCircleIcon className="mt-px h-6 w-6 shrink-0 text-green-600" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSidebarPriceAndForm = () => {
    return (
      <div className="listingSection__wrap sm:shadow-xl">
        {/* PRICE */}
        <div className="flex justify-between">
          <span className="text-3xl font-semibold">
            {price}
            <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">/person</span>
          </span>
        </div>

        {/* FORM */}
        <Form
          action={handleSubmitForm}
          className="flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-700"
          id="booking-form"
        >
          <DatesRangeInputPopover 
            className="z-11 flex-1" 
            defaultDates={{ startDate: checkIn, endDate: checkOut }}
          />
          <div className="w-full border-b border-neutral-200 dark:border-neutral-700"></div>
          <GuestsInputPopover 
            className="flex-1" 
            defaultGuests={parseInt(guests)}
            defaultRooms={parseInt(rooms)}
          />
        </Form>

        {/* SUM */}
        <DescriptionList>
          <DescriptionTerm>{price} x {guests} guests</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">
            {price.includes('EUR') ? `EUR ${(parseFloat(price.split(' ')[1]) * parseInt(guests)).toFixed(2)}` : 'Total price'}
          </DescriptionDetails>
          <DescriptionTerm>Service charge</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">$0.00</DescriptionDetails>
          <DescriptionTerm className="font-semibold text-neutral-900 dark:text-neutral-100">Total</DescriptionTerm>
          <DescriptionDetails className="font-semibold sm:text-right">
            {price.includes('EUR') ? `EUR ${(parseFloat(price.split(' ')[1]) * parseInt(guests)).toFixed(2)}` : price}
          </DescriptionDetails>
        </DescriptionList>

        {/* SUBMIT */}
        <ButtonPrimary form="booking-form" type="submit">
          {bookingLink ? 'Book with Provider' : T['common']['Reserve']}
        </ButtonPrimary>
      </div>
    )
  }

  return (
    <div>
      {/*  HEADER */}
      <HeaderGallery gridType="grid4" images={galleryImgs} />

      {/* MAIN */}
      <main className="relative z-[1] mt-10 flex flex-col gap-8 lg:flex-row xl:gap-10">
        {/* CONTENT */}
        <div className="flex w-full flex-col gap-y-8 lg:w-3/5 xl:w-[64%] xl:gap-y-10">
          {renderSectionHeader()}
          {renderSectionInfo()}
          {renderSectionIncludes()}
          <SectionDateRange />
        </div>

        {/* SIDEBAR */}
        <div className="grow">
          <div className="sticky top-5">{renderSidebarPriceAndForm()}</div>
        </div>
      </main>

      <Divider className="my-16" />

      <div className="flex flex-col gap-y-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="w-full">
            <SectionHost {...host} />
          </div>
        </div>

        <SectionMap />
      </div>
    </div>
  )
}

export default Page
