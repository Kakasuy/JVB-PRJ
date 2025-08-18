import BtnLikeIcon from '@/components/BtnLikeIcon'
import GallerySlider from '@/components/GallerySlider'
import RateBadge from '@/components/RateBadge'
import RateCodeBadge from '@/components/RateCodeBadge'
import SaleOffBadge from '@/components/SaleOffBadge'
import StartRating from '@/components/StartRating'
import { TStayListing } from '@/data/listings'
import { Badge } from '@/shared/Badge'
import T from '@/utils/getT'
import { RateFamilyCode } from '@/utils/getRateBadge'
import { Location06Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Link from 'next/link'
import { FC } from 'react'

interface StayCard2Props {
  className?: string
  data: TStayListing
  size?: 'default' | 'small'
}

const StayCard2: FC<StayCard2Props> = ({ size = 'default', className = '', data }) => {
  const {
    galleryImgs,
    listingCategory,
    address,
    title,
    bedrooms,
    beds,
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
    // For Amadeus data (id format: "amadeus-hotel://HOTEL_ID")
    if (id?.startsWith('amadeus-hotel://')) {
      const hotelId = id.replace('amadeus-hotel://', '')
      return `/stay-listings/${hotelId}`
    }
    // For mock data (use handle)
    return `/stay-listings/${listingHandle}`
  })()

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full">
        <GallerySlider ratioClass="aspect-w-12 aspect-h-11" galleryImgs={galleryImgs} href={listingHref} />
        <BtnLikeIcon isLiked={like} className="absolute end-3 top-3 z-1" />
        {saleOff && <SaleOffBadge className="absolute start-3 top-3" />}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className={clsx(size === 'default' ? 'mt-3 gap-y-3' : 'mt-2 gap-y-2', 'flex flex-col')}>
        <div className="flex flex-col gap-y-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {listingCategory} · {beds} beds
          </span>
          <div className="flex items-center gap-x-2">
            {isAds && <Badge color="green">ADS</Badge>}
            <h2 className={`text-base font-semibold text-neutral-900 capitalize dark:text-white`}>
              <span className="line-clamp-1">{title}</span>
            </h2>
          </div>
          <div className="flex items-center gap-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {size === 'default' && (
              <HugeiconsIcon
                className="mb-0.5"
                icon={Location06Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.5}
              />
            )}
            <span>{address}</span>
          </div>
        </div>
        <div className="w-14 border-b border-neutral-100 dark:border-neutral-800"></div>
        <div className="flex items-center justify-between gap-2">
          <div>
            {(data as any)?._amadeusData?.distance ? (
              <>
                <span className="text-base font-semibold">{(data as any)._amadeusData.distance.value} {(data as any)._amadeusData.distance.unit}</span>
                {size === 'default' && (
                  <>
                    <span className="mx-1 text-sm font-light text-neutral-400 dark:text-neutral-500">from</span>
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      city center
                    </span>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">{price}</span>
                {/* Show RateCode badge instead of RateFamily */}
                {(data as any).lowestRateInfo?.rateCode && (
                  <RateCodeBadge 
                    rateCode={(data as any).lowestRateInfo.rateCode}
                  />
                )}
                {size === 'default' && (
                  <>
                    <span className="text-sm font-light text-neutral-400 dark:text-neutral-500">/</span>
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      {T['common']['night']}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
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
    <div className={`group relative ${className}`}>
      {renderSliderGallery()}
      <Link href={listingHref}>{renderContent()}</Link>
    </div>
  )
}

export default StayCard2
