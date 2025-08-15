import { getRateBadgeInfo, getRateCompactBadge, type RateFamilyCode } from '@/utils/getRateBadge'
import clsx from 'clsx'

interface RateBadgeProps {
  rateFamilyCode: RateFamilyCode
  variant?: 'full' | 'compact' | 'icon-only'
  className?: string
}

const RateBadge = ({ 
  rateFamilyCode, 
  variant = 'full',
  className 
}: RateBadgeProps) => {
  const badgeInfo = getRateBadgeInfo(rateFamilyCode)

  if (variant === 'icon-only') {
    return (
      <span 
        className={clsx('text-sm', className)}
        title={`${badgeInfo.label} - ${badgeInfo.description}`}
      >
        {badgeInfo.icon}
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span 
        className={clsx(
          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
          badgeInfo.color,
          className
        )}
        title={badgeInfo.description}
      >
        {badgeInfo.icon}
      </span>
    )
  }

  return (
    <span 
      className={clsx(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        badgeInfo.color,
        className
      )}
      title={badgeInfo.description}
    >
      <span className="mr-1">{badgeInfo.icon}</span>
      {badgeInfo.label}
    </span>
  )
}

export default RateBadge