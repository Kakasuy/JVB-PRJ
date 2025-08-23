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

// Helper function to fetch enhanced offer details
async function getEnhancedOfferDetails(offerId: string) {
  if (!offerId) return null
  
  try {
    console.log(`🔍 Fetching enhanced details for offer: ${offerId}`)
    
    // Call our API endpoint to get enhanced details
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/offer-details/${offerId}`)
    
    if (!response.ok) {
      console.warn(`⚠️ Could not fetch enhanced details for offer ${offerId}`)
      return null
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Enhanced details loaded for ${offerId}`)
      return result.data
    }
    
    return null
  } catch (error) {
    console.error('❌ Error fetching enhanced offer details:', error)
    return null
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

  // Get enhanced offer details if available
  const firstOfferId = (listing as any)?.amadeus?.offers?.[0]?.id
  const enhancedOfferDetails = firstOfferId ? await getEnhancedOfferDetails(firstOfferId) : null

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
    // Enhanced description from detailed API
    const enhancedDescription = enhancedOfferDetails?.enhancedDescription
    const hasEnhancedData = !!enhancedDescription
    const offerDetails = enhancedOfferDetails?.offerDetails
    const hasOfferDetails = enhancedOfferDetails?.meta?.hasOfferDetails
    
    return (
      <div className="listingSection__wrap">
        <SectionHeading>Stay information</SectionHeading>
        <div className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          {/* Base description */}
          <span>{description}</span>
          
          {/* Enhanced room details from offerId API */}
          {hasEnhancedData && (
            <>
              <br /><br />
              <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
                <h4 className="mb-2 font-medium text-neutral-900 dark:text-neutral-100">
                  {enhancedOfferDetails?.meta?.usingRoomDescription ? 
                    'Detailed Room Information:' : 
                    'Offer Information:'}
                </h4>
                <span className="text-sm leading-relaxed">
                  {enhancedDescription}
                </span>
              </div>
            </>
          )}

          {/* Additional offer details */}
          {hasOfferDetails && (
            <>
              <br /><br />
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <h4 className="mb-3 font-medium text-neutral-900 dark:text-neutral-100">
                  Offer Details:
                </h4>
                <div className="space-y-2 text-sm">
                  {offerDetails?.boardType && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-700 dark:text-blue-300">Board Type:</span>
                      <span className="capitalize">{offerDetails.boardType.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  )}
                  {offerDetails?.roomCategory && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-700 dark:text-blue-300">Room Category:</span>
                      <span className="capitalize">{offerDetails.roomCategory}</span>
                    </div>
                  )}
                  {offerDetails?.bedType && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-700 dark:text-blue-300">Bed Type:</span>
                      <span className="capitalize">{offerDetails.bedType.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  )}
                  {offerDetails?.beds && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-700 dark:text-blue-300">Number of Beds:</span>
                      <span>{offerDetails.beds}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Fallback: Show existing room description if no enhanced data */}
          {!hasEnhancedData && (listing as any)?.amadeus?.offers?.[0]?.roomDescription && (
            <>
              <br /><br />
              <span>
                <strong>Room Details:</strong> {(listing as any).amadeus.offers[0].roomDescription}
              </span>
            </>
          )}
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            {hasEnhancedData ? 
              `Using enhanced description from offerId API (${enhancedOfferDetails?.meta?.descriptionType || 'unknown'} info)` :
              'Using base description'
            }
            {hasOfferDetails && <span> | Additional offer details available</span>}
          </div>
        )}
      </div>
    )
  }

  const renderSectionAmenities = () => {
    // Get amenities from Amadeus API data (back to original logic)
    const apiAmenities = (listing as any)?.amenities || []
    
    // Complete Amadeus amenities mapping with readable names
    const amenityNames: { [key: string]: string } = {
      // Business Facilities
      'BUS.2': 'Photocopier',
      'BUS.28': 'Printer', 
      'BUS.37': 'Audio Visual Equipment',
      'BUS.38': 'White/Blackboard',
      'BUS.39': 'Business Center',
      'BUS.40': 'Cellular Phone Rental',
      'BUS.41': 'Computer Rental',
      'BUS.42': 'Executive Desk',
      'BUS.45': 'LCD/Projector',
      'BUS.46': 'Meeting Rooms',
      'BUS.48': 'Overhead Projector',
      'BUS.49': 'Secretarial Services',
      'BUS.94': 'Conference Suite',
      'BUS.95': 'Convention Center',
      'BUS.96': 'Meeting Facilities',

      // Hotel Amenities & Services
      'HAC.1': '24 Hour Front Desk',
      'HAC.101': 'Disabled Facilities',
      'HAC.103': 'Multilingual Staff',
      'HAC.104': 'Wedding Services',
      'HAC.105': 'Banqueting Facilities',
      'HAC.106': 'Porter/Bellboy',
      'HAC.107': 'Beauty Parlour',
      'HAC.110': 'Womens Guest Rooms',
      'HAC.111': 'Pharmacy',
      'HAC.15': 'Car Rental',
      'HAC.16': 'Casino',
      'HAC.165': 'Bar/Lounge',
      'HAC.172': 'Transportation',
      'HAC.178': 'WiFi',
      'HAC.179': 'Wireless Connectivity',
      'HAC.191': 'Ballroom',
      'HAC.192': 'Bus Parking',
      'HAC.193': 'Childrens Play Area',
      'HAC.194': 'Nursery',
      'HAC.195': 'Disco',
      'HAC.2': '24 Hour Room Service',
      'HAC.20': 'Coffee Shop',
      'HAC.201': 'Baggage Storage',
      'HAC.217': 'No Kids Allowed',
      'HAC.218': 'Kids Welcome',
      'HAC.219': 'Courtesy Car',
      'HAC.22': 'Concierge',
      'HAC.220': 'No Porn Films',
      'HAC.221': 'Internet Hotspots',
      'HAC.222': 'Free Internet',
      'HAC.223': 'Internet Services',
      'HAC.224': 'Pets Allowed',
      'HAC.227': 'Free Breakfast',
      'HAC.24': 'Conference Facilities',
      'HAC.259': 'High Speed Internet',
      'HAC.26': 'Exchange Facilities',
      'HAC.276': 'Lobby',
      'HAC.28': 'Doctor On Call',
      'HAC.281': '24H Coffee Shop',
      'HAC.282': 'Airport Shuttle',
      'HAC.283': 'Luggage Service',
      'HAC.284': 'Piano Bar',
      'HAC.285': 'VIP Security',
      'HAC.30': 'Driving Range',
      'HAC.32': 'Duty Free Shop',
      'HAC.33': 'Elevator',
      'HAC.34': 'Executive Floor',
      'HAC.35': 'Gym',
      'HAC.36': 'Express Check In',
      'HAC.37': 'Express Check Out',
      'HAC.39': 'Florist',
      'HAC.4': 'Connecting Rooms',
      'HAC.41': 'Free Airport Shuttle',
      'HAC.42': 'Free Parking',
      'HAC.43': 'Free Transportation',
      'HAC.44': 'Games Room',
      'HAC.45': 'Gift Shop',
      'HAC.46': 'Hairdresser',
      'HAC.52': 'Ice Machines',
      'HAC.53': 'Garage Parking',
      'HAC.55': 'Jacuzzi',
      'HAC.56': 'Jogging Track',
      'HAC.57': 'Kennels',
      'HAC.58': 'Laundry Service',
      'HAC.6': 'Airline Desk',
      'HAC.60': 'Live Entertainment',
      'HAC.61': 'Massage',
      'HAC.62': 'Night Club',
      'HAC.66': 'Swimming Pool',
      'HAC.68': 'Parking',
      'HAC.7': 'ATM/Cash Machine',
      'HAC.72': 'Poolside Snack Bar',
      'HAC.76': 'Restaurant',
      'HAC.77': 'Room Service',
      'HAC.78': 'Safe Deposit Box',
      'HAC.79': 'Sauna',
      'HAC.8': 'Baby Sitting',
      'HAC.83': 'Solarium',
      'HAC.84': 'Spa',
      'HAC.88': 'Convenience Store',
      'HAC.9': 'Picnic Area',
      'HAC.90': 'Theatre Desk',
      'HAC.91': 'Tour Desk',
      'HAC.92': 'Translation Services',
      'HAC.93': 'Travel Agency',
      'HAC.97': 'Valet Parking',
      'HAC.98': 'Vending Machines',

      // Room Amenities
      'RMA.2': 'Air Conditioning',
      'RMA.19': 'Tea/Coffee Making Facilities',
      'RMA.92': 'Safe',
      'RMA.50': 'Hair Dryer',
      'RMA.69': 'Minibar',
      'RMA.20': 'Television',
      'RMA.88': 'Refrigerator',
      'RMA.55': 'Iron/Ironing Board',
      'RMA.13': 'Bath',
      'RMA.142': 'Shower',
      'RMA.123': 'Wi-Fi In Room',

      // Recreation
      'RST.36': 'Fitness Center',
      'RST.5': 'Beach',
      'RST.71': 'Tennis',
      'RST.27': 'Golf',
      'RST.20': 'Fishing',
      'RST.61': 'Horse Riding',
      'RST.67': 'Miniature Golf',
      'RST.82': 'Scuba Diving',
      'RST.88': 'Snow Skiing',

      // Accessibility
      'PHY.102': 'Accessible Baths',
      'PHY.6': 'Handicap Facilities',
      'PHY.28': 'Wheelchair Accessible',

      // Security
      'SEC.22': 'Fire Detectors',
      'SEC.58': 'Security Guard',
      'SEC.9': 'Fire Safety'
    }

    // Smart icon mapping
    const getAmenityIcon = (code: string, name: string) => {
      const searchText = (code + ' ' + name).toLowerCase()
      
      if (searchText.includes('wifi') || searchText.includes('internet')) return Wifi01Icon
      if (searchText.includes('parking') || searchText.includes('garage') || searchText.includes('valet')) return CableCarIcon
      if (searchText.includes('restaurant') || searchText.includes('dining') || searchText.includes('coffee') || searchText.includes('breakfast')) return TvSmartIcon
      if (searchText.includes('bar') || searchText.includes('lounge') || searchText.includes('disco')) return Speaker01Icon
      if (searchText.includes('fitness') || searchText.includes('gym') || searchText.includes('exercise')) return WaterEnergyIcon
      if (searchText.includes('spa') || searchText.includes('massage') || searchText.includes('sauna') || searchText.includes('beauty')) return ShampooIcon
      if (searchText.includes('pool') || searchText.includes('swimming') || searchText.includes('beach') || searchText.includes('jacuzzi')) return WaterPoloIcon
      if (searchText.includes('room service') || searchText.includes('minibar') || searchText.includes('refrigerator')) return BodySoapIcon
      if (searchText.includes('concierge') || searchText.includes('reception') || searchText.includes('front desk')) return CctvCameraIcon
      if (searchText.includes('business') || searchText.includes('meeting') || searchText.includes('conference')) return VirtualRealityVr01Icon
      if (searchText.includes('laundry') || searchText.includes('dry clean') || searchText.includes('hair dryer')) return HairDryerIcon
      if (searchText.includes('pet') || searchText.includes('animal') || searchText.includes('accessible') || searchText.includes('handicap')) return Bathtub02Icon
      if (searchText.includes('security') || searchText.includes('safe') || searchText.includes('fire')) return CctvCameraIcon
      
      return Wifi01Icon // Default
    }

    // Enhanced fallback amenities (more realistic hotel amenities)
    const fallbackAmenities = [
      { name: 'Free WiFi', icon: Wifi01Icon },
      { name: 'Free Parking', icon: CableCarIcon },
      { name: 'Restaurant', icon: TvSmartIcon },
      { name: '24 Hour Front Desk', icon: CctvCameraIcon },
      { name: 'Air Conditioning', icon: Wifi01Icon },
      { name: 'Fitness Center', icon: WaterEnergyIcon },
      { name: 'Swimming Pool', icon: WaterPoloIcon },
      { name: 'Room Service', icon: BodySoapIcon },
      { name: 'Concierge', icon: CctvCameraIcon },
      { name: 'Laundry Service', icon: HairDryerIcon },
      { name: 'Business Center', icon: VirtualRealityVr01Icon },
      { name: 'Spa', icon: ShampooIcon }
    ]

    // Process all amenities from API
    const displayAmenities = apiAmenities.length > 0 
      ? apiAmenities.map((amenity: string) => {
          const name = amenityNames[amenity] || amenity.replace(/_/g, ' ')
          return {
            name,
            icon: getAmenityIcon(amenity, name),
            code: amenity
          }
        })
      : fallbackAmenities

    const totalCount = apiAmenities.length > 0 ? apiAmenities.length : 6

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>Amenities</SectionHeading>
          <SectionSubheading>About the property&apos;s amenities and services</SectionSubheading>
        </div>
        <Divider className="w-14!" />

        <div className="grid grid-cols-1 gap-6 text-sm text-neutral-700 xl:grid-cols-3 dark:text-neutral-300">
          {displayAmenities.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex items-center gap-x-3">
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        {totalCount > 6 && (
          <>
            <div className="w-14 border-b border-neutral-200"></div>
            <div>
              <ButtonSecondary>View more {totalCount - 6} amenities</ButtonSecondary>
            </div>
          </>
        )}
        
        {/* Debug: Show if using API data */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            {apiAmenities.length > 0 ? `Using API amenities (${apiAmenities.length})` : 'Using fallback amenities'}
          </div>
        )}
        
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
            <SectionDateRange 
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
            />
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
