import {
  Bathtub02Icon,
  BedSingle01Icon,
  BodySoapIcon,
  CableCarIcon,
  CctvCameraIcon,
  HairDryerIcon,
  MeetingRoomIcon,
  ShampooIcon,
  Speaker01Icon,
  TvSmartIcon,
  VirtualRealityVr01Icon,
  WaterEnergyIcon,
  WaterPoloIcon,
  Wifi01Icon,
} from '@/components/Icons'
import { getListingReviews } from '@/data/data'
import { getStayListingByHandle } from '@/data/listings'

// Helper function to get hotel detail from API
async function getHotelDetail(hotelId: string, searchParams?: {
  checkInDate?: string
  checkOutDate?: string
  adults?: string
  rooms?: string
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    // Build URL with search parameters
    const url = new URL(`${baseUrl}/api/hotel-detail/${hotelId}`)
    if (searchParams?.checkInDate) url.searchParams.set('checkInDate', searchParams.checkInDate)
    if (searchParams?.checkOutDate) url.searchParams.set('checkOutDate', searchParams.checkOutDate)
    if (searchParams?.adults) url.searchParams.set('adults', searchParams.adults)
    if (searchParams?.rooms) url.searchParams.set('rooms', searchParams.rooms)
    
    const response = await fetch(url.toString(), {
      cache: 'no-store' // Always get fresh data
    })
    
    if (!response.ok) {
      console.error(`Hotel detail API failed: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching hotel detail:', error)
    return null
  }
}
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { Badge } from '@/shared/Badge'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import { UsersIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Form from 'next/form'
import { redirect } from 'next/navigation'
import { Fragment } from 'react'
import DatesRangeInputPopover from '../../components/DatesRangeInputPopover'
import GuestsInputPopover from '../../components/GuestsInputPopover'
import HeaderGallery from '../../components/HeaderGallery'
import SectionDateRange from '../../components/SectionDateRange'
import SectionHeader from '../../components/SectionHeader'
import { SectionHeading, SectionSubheading } from '../../components/SectionHeading'
import SectionHost from '../../components/SectionHost'
import SectionListingReviews from '../../components/SectionListingReviews'
import SectionMap from '../../components/SectionMap'
import HotelDetailClient from './HotelDetailClient'
import HotelDetailWrapper from './HotelDetailWrapper'
import { HotelStateProvider } from './HotelStateContext'
import HotelInfoHeader from './HotelInfoHeader'

export async function generateMetadata({ 
  params,
  searchParams 
}: { 
  params: Promise<{ handle: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { handle } = await params
  const search = await searchParams
  
  // Extract search parameters for API call
  const checkInDate = search.checkInDate as string
  const checkOutDate = search.checkOutDate as string
  const adults = search.adults as string || '1'
  const rooms = search.rooms as string || '1'
  
  // Try to get hotel detail from Amadeus API first
  let listing = await getHotelDetail(handle, {
    checkInDate,
    checkOutDate,
    adults,
    rooms
  })
  
  // If API fails, fall back to mock data
  if (!listing) {
    listing = await getStayListingByHandle(handle)
  }

  if (!listing) {
    return {
      title: 'Hotel not found',
      description: 'The hotel you are looking for does not exist.',
    }
  }

  return {
    title: listing?.title,
    description: listing?.description,
  }
}

const Page = async ({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ handle: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { handle } = await params
  const search = await searchParams

  // Extract search parameters
  const checkInDate = search.checkInDate as string
  const checkOutDate = search.checkOutDate as string
  const adults = search.adults as string || '1'
  const rooms = search.rooms as string || '1'

  // Try to get hotel detail from Amadeus API first with search parameters
  let listing = await getHotelDetail(handle, {
    checkInDate,
    checkOutDate,
    adults,
    rooms
  })
  
  // If API fails or handle is not a hotel ID, fall back to mock data
  if (!listing) {
    console.log(`No Amadeus data found for ${handle}, trying mock data...`)
    listing = await getStayListingByHandle(handle)
  }

  if (!listing?.id) {
    return redirect('/stay-categories/all')
  }
  const {
    address,
    bathrooms,
    bedrooms,
    date,
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
    beds,
  } = listing
  const reviews = (await getListingReviews(handle)).slice(0, 3) // Fetching only the first 3 reviews for display

  // Server action to handle form submission
  const handleSubmitForm = async (formData: FormData) => {
    'use server'

    // Handle form submission logic here
    console.log('Form submitted with data:', Object.fromEntries(formData.entries()))
    // For example, you can redirect to a checkout page or process the booking
    redirect('/checkout')
  }
  //

  const renderSectionHeader = () => {
    return (
      <SectionHeader
        address={address}
        host={host}
        listingCategory={listingCategory}
        reviewCount={reviewCount}
        reviewStart={reviewStart}
        title={title}
      >
        <div className="flex items-center gap-x-3">
          <UsersIcon className="mb-0.5 size-6" />
          <span>{maxGuests} guests</span>
        </div>
        <div className="flex items-center gap-x-3">
          <BedSingle01Icon className="mb-0.5 size-6" />
          <span>{beds} beds</span>
        </div>
        <div className="flex items-center gap-x-3">
          <Bathtub02Icon className="mb-0.5 size-6" />
          <span>{bathrooms} baths</span>
        </div>
        <div className="flex items-center gap-x-3">
          <MeetingRoomIcon className="mb-0.5 size-6" />
          <span>{bedrooms} bedrooms</span>
        </div>
      </SectionHeader>
    )
  }

  const renderSectionInfo = () => {
    const roomRates = [
      {
        name: 'monday-thursday',
        title: 'Monday - Thursday',
        price: '$199',
      },
      {
        name: 'friday-sunday',
        title: 'Friday - Sunday',
        price: '$219',
      },
      {
        name: 'rent-by-month',
        title: 'Rent by month',
        price: '-8.34 %',
      },
      {
        name: 'minimum-nights',
        title: 'Minimum number of nights',
        price: '1 night',
      },
      {
        name: 'maximum-nights',
        title: 'Max number of nights',
        price: '90 nights',
      },
    ]
    return (
      <div className="listingSection__wrap">
        <SectionHeading>Stay information</SectionHeading>
        <div className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          <span>{description}</span>
          
          {/* Show Amadeus-specific room details if available */}
          {(listing as any)?.amadeus?.offers?.[0]?.roomDescription && (
            <>
              <br /><br />
              <span>
                <strong>Room Details:</strong> {(listing as any).amadeus.offers[0].roomDescription}
              </span>
            </>
          )}
        </div>

        <Divider className="w-14!" />

        <div>
          <SectionHeading>Room Rates </SectionHeading>
          <SectionSubheading>Prices may increase on weekends or holidays</SectionSubheading>
        </div>
        <DescriptionList>
          {roomRates.map((item) => (
            <Fragment key={item.name}>
              <DescriptionTerm>{item.title}</DescriptionTerm>
              <DescriptionDetails>{item.price}</DescriptionDetails>
            </Fragment>
          ))}
        </DescriptionList>
      </div>
    )
  }

  const renderSectionAmenities = () => {
    const Amenities_demos = [
      { name: 'Fast wifi', icon: Wifi01Icon },
      { name: 'Bathtub', icon: Bathtub02Icon },
      { name: 'Hair dryer', icon: HairDryerIcon },
      { name: 'Sound system', icon: Speaker01Icon },
      { name: 'Shampoo', icon: ShampooIcon },
      { name: 'Body soap', icon: BodySoapIcon },
      { name: 'Water Energy ', icon: WaterEnergyIcon },
      { name: 'Water Polo', icon: WaterPoloIcon },
      { name: 'Cable Car', icon: CableCarIcon },
      { name: 'Tv Smart', icon: TvSmartIcon },
      { name: 'Cctv Camera', icon: CctvCameraIcon },
      { name: 'Virtual Reality Vr', icon: VirtualRealityVr01Icon },
    ]

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>Amenities</SectionHeading>
          <SectionSubheading>About the property&apos;s amenities and services</SectionSubheading>
        </div>
        <Divider className="w-14!" />

        <div className="grid grid-cols-1 gap-6 text-sm text-neutral-700 xl:grid-cols-3 dark:text-neutral-300">
          {Amenities_demos.filter((_, i) => i < 12).map((item) => (
            <div key={item.name} className="flex items-center gap-x-3">
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        {/* ----- */}
        <div className="w-14 border-b border-neutral-200"></div>
        <div>
          <ButtonSecondary>View more 20 amenities</ButtonSecondary>
        </div>
      </div>
    )
  }

  const renderSectionPolicies = () => {
    const amadeusData = (listing as any)?.amadeus
    if (!amadeusData?.offers?.[0]?.policies) {
      return null
    }

    const policies = amadeusData.offers[0].policies
    const cancellations = policies.cancellations || []
    const paymentType = policies.paymentType
    const refundable = policies.refundable

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>Booking Policies</SectionHeading>
          <SectionSubheading>Important information about your reservation</SectionSubheading>
        </div>
        <Divider className="w-14!" />

        <div className="space-y-6">
          {/* Cancellation Policy */}
          {cancellations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Cancellation Policy
              </h4>
              <div className="mt-3 space-y-2">
                {cancellations.map((cancellation: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        Cancel before {new Date(cancellation.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      {cancellation.amount === '0' || !cancellation.amount ? (
                        <Badge color="green">Free Cancellation</Badge>
                      ) : (
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          ${Math.round(parseFloat(cancellation.amount))} fee
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Policy */}
          {paymentType && (
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Payment Policy
              </h4>
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  {paymentType === 'guarantee' && (
                    <>
                      <Badge color="blue">Credit Card Required</Badge>
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        Pay when you arrive at the hotel
                      </span>
                    </>
                  )}
                  {paymentType === 'prepay' && (
                    <>
                      <Badge color="purple">Prepayment Required</Badge>
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        Full payment required in advance
                      </span>
                    </>
                  )}
                  {paymentType === 'deposit' && (
                    <>
                      <Badge color="yellow">Deposit Required</Badge>
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        Partial payment required upfront
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Refund Policy */}
          {refundable?.cancellationRefund && (
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Refund Policy
              </h4>
              <div className="mt-3">
                {refundable.cancellationRefund === 'NON_REFUNDABLE' ? (
                  <Badge color="red">Non-Refundable</Badge>
                ) : refundable.cancellationRefund === 'REFUNDABLE_UP_TO_DEADLINE' ? (
                  <Badge color="green">Refundable Up To Deadline</Badge>
                ) : (
                  <Badge color="gray">{refundable.cancellationRefund}</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }


  return (
    <HotelStateProvider initialState={{ checkInDate, checkOutDate, adults, rooms }}>
      <div>
        {/*  HEADER */}
        <HeaderGallery images={galleryImgs} />

        {/* MAIN */}
        <main className="relative z-[1] mt-10 flex flex-col gap-8 lg:flex-row xl:gap-10">
          {/* CONTENT */}
          <div className="flex w-full flex-col gap-y-8 lg:w-3/5 xl:w-[64%] xl:gap-y-10">
            <HotelInfoHeader listing={listing} />
            {renderSectionInfo()}
            {renderSectionAmenities()}
            {renderSectionPolicies()}
            <SectionDateRange />
          </div>

          {/* SIDEBAR */}
          <div className="grow">
            <div className="sticky top-5">
              <HotelDetailClient 
                initialListing={listing}
                hotelId={handle}
                searchParams={{
                  checkInDate,
                  checkOutDate,
                  adults,
                  rooms
                }}
              />
            </div>
          </div>
        </main>

        <Divider className="my-16" />

        <div className="flex flex-col gap-y-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="w-full lg:w-4/9 xl:w-1/3">
              <SectionHost {...host} />
            </div>
            <div className="w-full lg:w-2/3">
              <SectionListingReviews reviewCount={reviewCount} reviewStart={reviewStart} reviews={reviews} />
            </div>
          </div>

          <SectionMap />
        </div>
      </div>
    </HotelStateProvider>
  )
}

export default Page
