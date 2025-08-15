export type RateFamilyCode = 'P' | 'X' | 'N' | 'S'

export interface RateBadgeInfo {
  label: string
  color: string
  icon: string
  description: string
}

export const getRateBadgeInfo = (rateFamilyCode: RateFamilyCode): RateBadgeInfo => {
  const badgeMap: Record<RateFamilyCode, RateBadgeInfo> = {
    'P': {
      label: 'Flexible',
      color: 'bg-green-100 text-green-800',
      icon: '✓',
      description: 'Free cancellation available'
    },
    'X': {
      label: 'Best Deal',
      color: 'bg-orange-100 text-orange-800', 
      icon: '⚡',
      description: 'Non-refundable, lowest price'
    },
    'N': {
      label: 'Corporate',
      color: 'bg-blue-100 text-blue-800',
      icon: '🏢',
      description: 'Business discount rate'
    },
    'S': {
      label: 'Special',
      color: 'bg-purple-100 text-purple-800',
      icon: '🎯',
      description: 'Limited time offer'
    }
  }

  return badgeMap[rateFamilyCode] || badgeMap['P']
}

export const getRateCompactBadge = (rateFamilyCode: RateFamilyCode): string => {
  const compactMap: Record<RateFamilyCode, string> = {
    'P': '✓',
    'X': '⚡', 
    'N': '🏢',
    'S': '🎯'
  }
  
  return compactMap[rateFamilyCode] || '✓'
}