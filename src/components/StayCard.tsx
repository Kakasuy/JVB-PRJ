import BtnLikeIcon from '@/components/BtnLikeIcon'
import SaleOffBadge from '@/components/SaleOffBadge'
import StartRating from '@/components/StartRating'
import { TStayListing } from '@/data/listings'
import { Badge } from '@/shared/Badge'
import { Location06Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { FC } from 'react'
import GallerySlider from './GallerySlider'

interface StayCardProps {
  className?: string
  data: TStayListing
  size?: 'default' | 'small'
  searchParams?: {
    checkInDate?: string
    checkOutDate?: string
    adults?: string
    rooms?: string
  }
}

const StayCard: FC<StayCardProps> = ({ size = 'default', className = '', data, searchParams }) => {
  const {
    galleryImgs,
    listingCategory,
    address,
    title,
    bedrooms,
    handle: listingHandle,
    like,
    saleOff,
    isAds,
    price,
    reviewStart,
    reviewCount,
    id,
  } = data

  // Generate listing URL - handle both Amadeus data and mock data
  const listingHref = (() => {
    let baseUrl = ''
    
    // For Amadeus data (id format: "amadeus-hotel://HOTEL_ID")
    if (id?.startsWith('amadeus-hotel://')) {
      const hotelId = id.replace('amadeus-hotel://', '')
      baseUrl = `/stay-listings/${hotelId}`
    } else {
      // For mock data (use handle)
      baseUrl = `/stay-listings/${listingHandle}`
    }
    
    // Add search parameters if available
    if (searchParams) {
      const params = new URLSearchParams()
      if (searchParams.checkInDate) params.set('checkInDate', searchParams.checkInDate)
      if (searchParams.checkOutDate) params.set('checkOutDate', searchParams.checkOutDate)
      if (searchParams.adults) params.set('adults', searchParams.adults)
      if (searchParams.rooms) params.set('rooms', searchParams.rooms)
      
      const paramString = params.toString()
      if (paramString) {
        baseUrl += `?${paramString}`
      }
    }
    
    return baseUrl
  })()

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full">
        <GallerySlider
          ratioClass="aspect-w-4 aspect-h-3 "
          galleryImgs={galleryImgs}
          href={listingHref}
          galleryClass={size === 'default' ? undefined : ''}
        />
        <BtnLikeIcon isLiked={like} className="absolute end-3 top-3 z-1" />
        {saleOff && <SaleOffBadge className="absolute start-3 top-3" />}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className={size === 'default' ? 'space-y-4 p-4' : 'space-y-1 p-3'}>
        <div className={size === 'default' ? 'space-y-2' : 'space-y-1'}>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {listingCategory} · {bedrooms} beds
          </span>
          <div className="flex items-center gap-x-2">
            {isAds && <Badge color="green">ADS</Badge>}
            <h2 className={`text-base font-semibold text-neutral-900 capitalize dark:text-white`}>
              <span className="line-clamp-1">{title}</span>
            </h2>
          </div>
          <div className="flex items-center gap-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {size === 'default' && (
              <HugeiconsIcon icon={Location06Icon} size={16} color="currentColor" strokeWidth={1.5} />
            )}
            {address}
          </div>
        </div>
        <div className="w-14 border-b border-neutral-100 dark:border-neutral-800"></div>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">
            {price}
            {` `}
            {size === 'default' && (
              <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">/night</span>
            )}
          </span>
          {!!reviewStart && <StartRating 
            reviewCount={reviewCount} 
            point={reviewStart}
            overallRating={(data as any).overallRating}
            numberOfRatings={(data as any).numberOfRatings}
          />}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative bg-white dark:bg-neutral-900 ${
        size === 'default' ? 'border border-neutral-100 dark:border-neutral-800' : ''
      } overflow-hidden rounded-2xl transition-shadow hover:shadow-xl ${className}`}
    >
      {renderSliderGallery()}
      <Link href={listingHref}>{renderContent()}</Link>
    </div>
  )
}

export default StayCard
