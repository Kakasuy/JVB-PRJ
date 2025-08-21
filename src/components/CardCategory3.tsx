import { TCategory } from '@/data/categories'
import convertNumbThousand from '@/utils/convertNumbThousand'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'

// City code mapping for API search
const cityCodeMap: Record<string, string> = {
  'New York, USA': 'NYC',
  'Amsterdam, Netherlands': 'AMS', 
  'Paris, France': 'PAR',
  'London, UK': 'LON',
  'Bangkok, Thailand': 'BKK',
  'Barcelona, Spain': 'BCN',
  'Roma, Italy': 'ROM'
}

export interface CardCategory3Props {
  className?: string
  category: TCategory
}

const CardCategory3: FC<CardCategory3Props> = ({ className = '', category }) => {
  const { count, name, href, thumbnail } = category

  // Get city code for API search
  const cityCode = cityCodeMap[name]
  
  // Create navigation URL with city parameter if city is supported
  const navigationHref = cityCode 
    ? `/stay-categories/all?city=${cityCode}&cityName=${encodeURIComponent(name)}`
    : href

  return (
    <div className={`group relative flex flex-col ${className}`}>
      <div className={`aspect-w-5 relative h-0 w-full shrink-0 overflow-hidden rounded-2xl aspect-h-5 sm:aspect-h-6`}>
        {thumbnail ? (
          <Image
            src={thumbnail}
            className="rounded-2xl object-cover"
            alt={name}
            fill
            sizes="(max-width: 400px) 100vw, 300px"
          />
        ) : null}
        <span className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100"></span>
      </div>
      <div className="mt-4">
        <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
          <Link href={navigationHref} className="absolute inset-0"></Link>
          <span className="line-clamp-1">{name}</span>
        </h2>
        <span className={`mt-1.5 block text-sm text-neutral-600 dark:text-neutral-400`}>
          {convertNumbThousand(count || 0)}+ properties
        </span>
      </div>
    </div>
  )
}

export default CardCategory3
