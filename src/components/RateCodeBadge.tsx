import clsx from 'clsx'

interface RateCodeBadgeProps {
  rateCode?: string
  className?: string
}

// Mapping rate codes to full names
const rateCodeDescriptions: Record<string, string> = {
  // Standard/Public
  'RAC': 'Rack Rate - Standard public rate',
  'BAR': 'Best Available Rate',
  'PUB': 'Published Rate',
  
  // Promotional
  'PRO': 'Promotional Rate - Special offer',
  'PKG': 'Package Rate - Bundled offer',
  'LTD': 'Limited Time Offer',
  'ADV': 'Advance Purchase - Book early & save',
  
  // Corporate/Negotiated
  'COR': 'Corporate Rate - Business discount',
  'NEG': 'Negotiated Rate - Special agreement',
  'GOV': 'Government Rate',
  'CON': 'Consortium Rate',
  
  // Member/Loyalty
  'AAA': 'AAA/CAA Member Rate',
  'SEN': 'Senior Citizen Rate',
  'MIL': 'Military Rate',
  'MEM': 'Member Rate',
  
  // Special
  'NRF': 'Non-Refundable Rate',
  'PRE': 'Prepaid Rate',
  'WKD': 'Weekend Special',
  'GRP': 'Group Rate',
  
  // Industry
  'AIR': 'Airline Crew Rate',
  'TRV': 'Travel Industry Rate',
  
  // Chain-specific codes observed
  '57J': 'Special Rate - Crowne Plaza',
  'T45': 'Tactical Rate - Holiday Inn',
}

// Get description for unknown codes based on patterns
const getUnknownCodeDescription = (code: string): string => {
  // Pattern matching for common prefixes
  if (code.startsWith('T')) return 'Time-limited Offer'
  if (code.startsWith('M')) return 'Member/Loyalty Rate'
  if (code.startsWith('P')) return 'Package/Promotional Rate'
  if (code.startsWith('S')) return 'Special Rate'
  if (code.startsWith('H')) return 'Hotel Special Rate'
  if (code.startsWith('D')) return 'Discounted Rate'
  if (code.startsWith('E')) return 'Early Booking Rate'
  if (code.startsWith('L')) return 'Last Minute Rate'
  if (code.startsWith('W')) return 'Weekend/Weekly Rate'
  
  // Numeric patterns
  if (/^\d+[A-Z]$/.test(code)) return 'Contract Rate'
  if (/^[A-Z]\d+$/.test(code)) return 'Special Offer'
  
  // Default
  return 'Special Rate'
}

// Get color based on rate type
const getRateCodeColor = (rateCode?: string): string => {
  if (!rateCode) return 'bg-gray-100 text-gray-600'
  
  // Promotional rates - green
  if (['PRO', 'PKG', 'LTD', 'ADV'].includes(rateCode)) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  }
  
  // Corporate/Negotiated - blue
  if (['COR', 'NEG', 'GOV', 'CON'].includes(rateCode)) {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
  
  // Member rates - purple
  if (['AAA', 'SEN', 'MIL', 'MEM'].includes(rateCode)) {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  }
  
  // Non-refundable - orange
  if (['NRF', 'PRE'].includes(rateCode)) {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  }
  
  // Chain-specific and patterns
  if (rateCode.startsWith('T') || ['57J', 'T45'].includes(rateCode)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  }
  
  // Default - gray
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

const RateCodeBadge = ({ rateCode, className }: RateCodeBadgeProps) => {
  if (!rateCode) return null
  
  // Get description from mapping or generate based on pattern
  const description = rateCodeDescriptions[rateCode] || 
    `${getUnknownCodeDescription(rateCode)} (${rateCode})`
  
  const colorClass = getRateCodeColor(rateCode)
  
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        'cursor-help transition-colors duration-200',
        colorClass,
        className
      )}
      title={description}
    >
      {rateCode}
    </span>
  )
}

export default RateCodeBadge