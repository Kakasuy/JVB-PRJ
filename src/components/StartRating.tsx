import clsx from 'clsx'
import { FC } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { 
  FaceSmileIcon, 
  HandThumbUpIcon,
  HeartIcon,
  SparklesIcon 
} from '@heroicons/react/24/solid'

interface StartRatingProps {
  className?: string
  point?: number
  reviewCount?: number
  size?: 'lg' | 'md'
  overallRating?: number
  numberOfRatings?: number
}

const StartRating: FC<StartRatingProps> = ({ 
  className, 
  point = 4.5, 
  reviewCount = 112, 
  size = 'md',
  overallRating,
  numberOfRatings 
}) => {
  // Use overallRating if available, otherwise fallback to point
  const displayRating = overallRating !== undefined ? overallRating : Math.round(point * 20)
  const displayCount = numberOfRatings !== undefined ? numberOfRatings : reviewCount
  
  // Get icon based on rating
  const getIcon = () => {
    if (displayRating >= 90) {
      return <SparklesIcon className={clsx('text-green-600', size === 'lg' ? 'size-5' : 'size-4')} />
    } else if (displayRating >= 80) {
      return <HeartIcon className={clsx('text-green-500', size === 'lg' ? 'size-5' : 'size-4')} />
    } else if (displayRating >= 70) {
      return <HandThumbUpIcon className={clsx('text-yellow-600', size === 'lg' ? 'size-5' : 'size-4')} />
    } else if (displayRating >= 60) {
      return <FaceSmileIcon className={clsx('text-orange-500', size === 'lg' ? 'size-5' : 'size-4')} />
    } else {
      return <StarIcon className={clsx('text-orange-400', size === 'lg' ? 'size-5' : 'size-4')} />
    }
  }
  
  return (
    <div
      className={clsx(
        'flex items-center',
        className,
        size === 'lg' && 'gap-x-1.5 text-base',
        size === 'md' && 'gap-x-1 text-sm'
      )}
    >
      <div className="flex items-center gap-x-0.5">
        {getIcon()}
        <span className={clsx(
          'font-semibold',
          displayRating >= 90 ? 'text-green-600' : 
          displayRating >= 80 ? 'text-green-500' :
          displayRating >= 70 ? 'text-yellow-600' :
          displayRating >= 60 ? 'text-orange-500' : 'text-red-500'
        )}>
          {displayRating}
        </span>
      </div>
      <span className="text-neutral-500 dark:text-neutral-400">({displayCount})</span>
    </div>
  )
}

export default StartRating
