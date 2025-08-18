'use client'

import { useHotelSearch } from '@/hooks/useHotelSearch'
import StayCard2 from '@/components/StayCard2'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/shared/Button'

interface HotelSearchResultsProps {
  className?: string
}

// Map location string to city code
const mapLocationToCityCode = (location: string): string => {
  const locationMap: Record<string, string> = {
    // Major global cities
    'New York': 'NYC', 'Paris': 'PAR', 'London': 'LON', 'Tokyo': 'TYO', 'Barcelona': 'BCN',
    'Madrid': 'MAD', 'Rome': 'ROM', 'Amsterdam': 'AMS', 'Berlin': 'BER', 'Vienna': 'VIE',
    'Prague': 'PRG', 'Budapest': 'BUD', 'Warsaw': 'WAW', 'Stockholm': 'STO', 'Oslo': 'OSL',
    'Copenhagen': 'CPH', 'Helsinki': 'HEL', 'Dublin': 'DUB', 'Edinburgh': 'EDI', 'Brussels': 'BRU',
    'Zurich': 'ZUR', 'Geneva': 'GVA', 'Milan': 'MIL', 'Venice': 'VCE', 'Florence': 'FLR',
    'Naples': 'NAP', 'Sydney': 'SYD', 'Melbourne': 'MEL', 'Bangkok': 'BKK', 'Singapore': 'SIN',
    'Hong Kong': 'HKG', 'Seoul': 'SEL', 'Dubai': 'DXB', 'Istanbul': 'IST', 'Cairo': 'CAI',
    'Cape Town': 'CPT', 'Johannesburg': 'JNB', 'Los Angeles': 'LAX', 'San Francisco': 'SFO',
    'Chicago': 'CHI', 'Miami': 'MIA', 'Boston': 'BOS', 'Las Vegas': 'LAS', 'Toronto': 'YYZ',
    'Vancouver': 'YVR', 'Montreal': 'YUL', 'Mexico City': 'MEX', 'Buenos Aires': 'BUE',
    'Rio de Janeiro': 'RIO', 'São Paulo': 'SAO',
    
    // Indian cities
    'Mumbai': 'BOM', 'Delhi': 'DEL', 'Bangalore': 'BLR', 'Kolkata': 'CCU', 'Chennai': 'MAA',
    'Hyderabad': 'HYD', 'Ahmedabad': 'AMD', 'Pune': 'PNQ', 'Jaipur': 'JAI', 'Lucknow': 'LKO',
    'Kanpur': 'KNU', 'Nagpur': 'NAG', 'Indore': 'IDR', 'Thane': 'TNE', 'Bhopal': 'BHO',
    'Visakhapatnam': 'VTZ', 'Pimpri': 'PMP', 'Patna': 'PAT', 'Vadodara': 'BDQ', 'Ghaziabad': 'GHZ',
    'Ludhiana': 'LUH', 'Agra': 'AGR', 'Nashik': 'NAS', 'Faridabad': 'FAR', 'Meerut': 'MRT',
    'Rajkot': 'RAJ', 'Kalyan': 'KAL', 'Vasai': 'VAS', 'Varanasi': 'VNS', 'Srinagar': 'SXR',
    'Aurangabad': 'AUR', 'Dhanbad': 'DHN', 'Amritsar': 'ATQ', 'Navi Mumbai': 'NMU', 'Allahabad': 'IXD',
    'Ranchi': 'IXR', 'Howrah': 'HOW', 'Coimbatore': 'CJB', 'Jabalpur': 'JBP', 'Gwalior': 'GWL',
    'Vijayawada': 'VGA', 'Jodhpur': 'JDH', 'Madurai': 'IXM', 'Raipur': 'RPR', 'Kota': 'KTU',
    'Guwahati': 'GAU', 'Chandigarh': 'IXC', 'Solapur': 'SSE', 'Hubballi': 'HBX', 'Tiruchirappalli': 'TRZ',
    'Bareilly': 'BEK', 'Mysore': 'MYS', 'Tiruppur': 'TUP', 'Gurgaon': 'GGN', 'Aligarh': 'ALI',
    'Jalandhar': 'JLR', 'Bhubaneswar': 'BBI', 'Salem': 'SXV', 'Warangal': 'WGC', 'Guntur': 'GNT',
    'Bhiwandi': 'BHI', 'Saharanpur': 'SRE', 'Gorakhpur': 'GOP', 'Bikaner': 'BKB', 'Amravati': 'AMV',
    'Noida': 'NOI', 'Jamshedpur': 'IXW', 'Bhilai': 'BIL', 'Cuttack': 'CUT', 'Firozabad': 'FIR',
    'Kochi': 'COK', 'Bhavnagar': 'BHU', 'Dehradun': 'DED', 'Durgapur': 'RDP', 'Asansol': 'ASN',
    'Rourkela': 'ROU', 'Nanded': 'NDC', 'Kolhapur': 'KOP', 'Ajmer': 'AJM', 'Akola': 'AKD',
    'Gulbarga': 'GUL', 'Jamnagar': 'JGA', 'Ujjain': 'UJN', 'Loni': 'LON', 'Siliguri': 'SIL',
    'Jhansi': 'JHS', 'Ulhasnagar': 'ULH', 'Jammu': 'IXJ', 'Sangli': 'SNG', 'Mangalore': 'IXE'
  }
  
  // Enhanced matching logic
  const normalizedLoc = location.toLowerCase().trim()
  
  // 1. Direct exact match (case insensitive)
  for (const [city, code] of Object.entries(locationMap)) {
    if (normalizedLoc === city.toLowerCase()) {
      console.log(`Exact match found: "${location}" -> ${code}`)
      return code
    }
  }
  
  // 2. Partial match - location contains city name
  for (const [city, code] of Object.entries(locationMap)) {
    if (normalizedLoc.includes(city.toLowerCase())) {
      console.log(`Partial match found: "${location}" contains "${city}" -> ${code}`)
      return code
    }
  }
  
  // 3. City name contains location (for abbreviations)
  for (const [city, code] of Object.entries(locationMap)) {
    if (city.toLowerCase().includes(normalizedLoc)) {
      console.log(`Reverse partial match found: "${city}" contains "${location}" -> ${code}`)
      return code
    }
  }
  
  // 4. Check if it's already a city code
  if (location.length === 3) {
    const upperCode = location.toUpperCase()
    console.log(`Using as city code: "${location}" -> ${upperCode}`)
    return upperCode
  }
  
  // 5. Default fallback
  console.log(`No match found for "${location}", using default NYC`)
  return 'NYC'
}

export const HotelSearchResults: React.FC<HotelSearchResultsProps> = ({ className }) => {
  const { hotels, loading, error, searchHotels } = useHotelSearch()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)

  
  const HOTELS_PER_PAGE = 8
  const MAX_PAGES = 5

  // Get search parameters from URL or use defaults
  const searchConfig = useMemo(() => {
    // Default dates: check-in today + 2 days, check-out today + 3 days (1 day stay)
    const today = new Date()
    const defaultCheckIn = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    const defaultCheckOut = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    
    // Get cityCode from URL params - prioritize cityCode over location
    const cityCodeParam = searchParams.get('cityCode')
    const locationParam = searchParams.get('location')
    
    let cityCode: string
    
    if (cityCodeParam) {
      // Direct cityCode from API selection - use it directly
      cityCode = cityCodeParam
      console.log('Using direct cityCode from form:', cityCode)
    } else if (locationParam) {
      // Fallback: map location string to cityCode for backward compatibility
      cityCode = mapLocationToCityCode(locationParam)
      console.log('Mapped location to cityCode:', locationParam, '->', cityCode)
    } else {
      // Default fallback
      cityCode = 'NYC'
      console.log('Using default cityCode:', cityCode)
    }
    
    return {
      cityCode,
      checkInDate: searchParams.get('checkInDate') || defaultCheckIn.toISOString().split('T')[0],
      checkOutDate: searchParams.get('checkOutDate') || defaultCheckOut.toISOString().split('T')[0],
      adults: searchParams.get('adults') || '1', // Default to 1 adult
      rooms: searchParams.get('rooms') || '1', // Default to 1 room
      radius: searchParams.get('radius') || '30',
      // Price range filters
      price_min: searchParams.get('price_min'),
      price_max: searchParams.get('price_max'),
      // Rooms & Beds filters
      beds: searchParams.get('beds'),
      bedrooms: searchParams.get('bedrooms'),
      bathrooms: searchParams.get('bathrooms'),
      // Room Type filters
      room_types: searchParams.get('room_types'),
      // Amenities filters
      amenities: searchParams.get('amenities'),
      // Hotel Stars filters
      hotel_stars: searchParams.get('hotel_stars'),
      // Board Type filters
      board_types: searchParams.get('board_types'),
      // Policy filters
      free_cancellation: searchParams.get('free_cancellation'),
      refundable_only: searchParams.get('refundable_only')
    }
  }, [searchParams])

  // Perform search when searchConfig changes (initial load and when URL params change)
  useEffect(() => {
    searchHotels(searchConfig)
  }, [searchConfig, searchHotels])

  // REMOVED: Custom event handler for filtersChanged
  // Now using only URL-based approach for better performance and reliability
  // The useEffect above (lines 145-147) handles all filter changes via URL params

  // Reset to page 1 when search params change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchParams])

  // Calculate pagination
  const totalHotels = hotels.length
  const totalPages = Math.min(Math.ceil(totalHotels / HOTELS_PER_PAGE), MAX_PAGES)
  const maxHotelsToShow = MAX_PAGES * HOTELS_PER_PAGE // 16 hotels maximum
  const hotelsToDisplay = hotels.slice(0, maxHotelsToShow) // Only show first 16 hotels
  
  const paginatedHotels = useMemo(() => {
    const startIndex = (currentPage - 1) * HOTELS_PER_PAGE
    const endIndex = startIndex + HOTELS_PER_PAGE
    return hotelsToDisplay.slice(startIndex, endIndex)
  }, [hotelsToDisplay, currentPage])



  // Get city name from city code for display
  const getCityName = (cityCode: string): string => {
    const cityMap: Record<string, string> = {
      // Major global cities
      'NYC': 'New York', 'PAR': 'Paris', 'LON': 'London', 'TYO': 'Tokyo', 'BCN': 'Barcelona',
      'MAD': 'Madrid', 'ROM': 'Rome', 'AMS': 'Amsterdam', 'BER': 'Berlin', 'VIE': 'Vienna',
      'PRG': 'Prague', 'BUD': 'Budapest', 'WAW': 'Warsaw', 'STO': 'Stockholm', 'OSL': 'Oslo',
      'CPH': 'Copenhagen', 'HEL': 'Helsinki', 'DUB': 'Dublin', 'EDI': 'Edinburgh', 'BRU': 'Brussels',
      'ZUR': 'Zurich', 'GVA': 'Geneva', 'MIL': 'Milan', 'VCE': 'Venice', 'FLR': 'Florence',
      'NAP': 'Naples', 'SYD': 'Sydney', 'MEL': 'Melbourne', 'BKK': 'Bangkok', 'SIN': 'Singapore',
      'HKG': 'Hong Kong', 'SEL': 'Seoul', 'DXB': 'Dubai', 'IST': 'Istanbul', 'CAI': 'Cairo',
      'CPT': 'Cape Town', 'JNB': 'Johannesburg', 'LAX': 'Los Angeles', 'SFO': 'San Francisco',
      'CHI': 'Chicago', 'MIA': 'Miami', 'BOS': 'Boston', 'LAS': 'Las Vegas', 'YYZ': 'Toronto',
      'YVR': 'Vancouver', 'YUL': 'Montreal', 'MEX': 'Mexico City', 'BUE': 'Buenos Aires',
      'RIO': 'Rio de Janeiro', 'SAO': 'São Paulo',
      
      // Indian cities
      'BOM': 'Mumbai', 'DEL': 'Delhi', 'BLR': 'Bangalore', 'CCU': 'Kolkata', 'MAA': 'Chennai',
      'HYD': 'Hyderabad', 'AMD': 'Ahmedabad', 'PNQ': 'Pune', 'JAI': 'Jaipur', 'LKO': 'Lucknow',
      'KNU': 'Kanpur', 'NAG': 'Nagpur', 'IDR': 'Indore', 'TNE': 'Thane', 'BHO': 'Bhopal',
      'VTZ': 'Visakhapatnam', 'PMP': 'Pimpri', 'PAT': 'Patna', 'BDQ': 'Vadodara', 'GHZ': 'Ghaziabad',
      'LUH': 'Ludhiana', 'AGR': 'Agra', 'NAS': 'Nashik', 'FAR': 'Faridabad', 'MRT': 'Meerut',
      'RAJ': 'Rajkot', 'KAL': 'Kalyan', 'VAS': 'Vasai', 'VNS': 'Varanasi', 'SXR': 'Srinagar',
      'AUR': 'Aurangabad', 'DHN': 'Dhanbad', 'ATQ': 'Amritsar', 'NMU': 'Navi Mumbai', 'IXD': 'Allahabad',
      'IXR': 'Ranchi', 'HOW': 'Howrah', 'CJB': 'Coimbatore', 'JBP': 'Jabalpur', 'GWL': 'Gwalior',
      'VGA': 'Vijayawada', 'JDH': 'Jodhpur', 'IXM': 'Madurai', 'RPR': 'Raipur', 'KTU': 'Kota',
      'GAU': 'Guwahati', 'IXC': 'Chandigarh', 'SSE': 'Solapur', 'HBX': 'Hubballi', 'TRZ': 'Tiruchirappalli',
      'BEK': 'Bareilly', 'MYS': 'Mysore', 'TUP': 'Tiruppur', 'GGN': 'Gurgaon', 'ALI': 'Aligarh',
      'JLR': 'Jalandhar', 'BBI': 'Bhubaneswar', 'SXV': 'Salem', 'WGC': 'Warangal', 'GNT': 'Guntur',
      'BHI': 'Bhiwandi', 'SRE': 'Saharanpur', 'GOP': 'Gorakhpur', 'BKB': 'Bikaner', 'AMV': 'Amravati',
      'NOI': 'Noida', 'IXW': 'Jamshedpur', 'BIL': 'Bhilai', 'CUT': 'Cuttack', 'FIR': 'Firozabad',
      'COK': 'Kochi', 'BHU': 'Bhavnagar', 'DED': 'Dehradun', 'RDP': 'Durgapur', 'ASN': 'Asansol',
      'ROU': 'Rourkela', 'NDC': 'Nanded', 'KOP': 'Kolhapur', 'AJM': 'Ajmer', 'AKD': 'Akola',
      'GUL': 'Gulbarga', 'JGA': 'Jamnagar', 'UJN': 'Ujjain', 'SIL': 'Siliguri',
      'JHS': 'Jhansi', 'ULH': 'Ulhasnagar', 'IXJ': 'Jammu', 'SNG': 'Sangli', 'IXE': 'Mangalore'
    }
    return cityMap[cityCode] || cityCode
  }

  if (loading) {
    return (
      <div className={`mt-8 ${className || ''}`}>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-lg">Searching hotels in {getCityName(searchConfig.cityCode)}...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`mt-8 ${className || ''}`}>
        <div className="text-center py-16">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
          <Button 
            onClick={() => searchHotels(searchConfig)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hotels.length) {
    return (
      <div className={`mt-8 ${className || ''}`}>
        <div className="text-center py-16">
          <div className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            No hotels available in {getCityName(searchConfig.cityCode)}
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Sorry, no hotels found for your search criteria. Please try different dates or location.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => {
                const fallbackConfig = { ...searchConfig, cityCode: 'PAR' }
                searchHotels(fallbackConfig)
              }}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Try Paris
            </Button>
            <Button 
              onClick={() => {
                const fallbackConfig = { ...searchConfig, cityCode: 'LON' }
                searchHotels(fallbackConfig)
              }}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Try London
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`mt-8 ${className || ''}`}>
      {/* Results summary */}
      <div className="mb-6">
        <p className="text-neutral-600 dark:text-neutral-300">
          Found {totalHotels} hotel{totalHotels !== 1 ? 's' : ''} in {getCityName(searchConfig.cityCode)}
          {totalHotels > maxHotelsToShow && ` (showing first ${maxHotelsToShow})`}
        </p>
      </div>

      {/* Hotels grid */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedHotels.map((hotel) => (
          <StayCard2 key={hotel.id} data={hotel} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              color="white"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2"
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                color={currentPage === page ? 'primary' : 'white'}
                onClick={() => setCurrentPage(page)}
                className="px-3 py-2 min-w-[40px]"
              >
                {page}
              </Button>
            ))}
            
            <Button
              color="white"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Search info */}
      <div className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <p>
          Search: {getCityName(searchConfig.cityCode)} • {searchConfig.checkInDate} to {searchConfig.checkOutDate} • {searchConfig.rooms} room{searchConfig.rooms !== '1' ? 's' : ''} • {searchConfig.adults} adult{searchConfig.adults !== '1' ? 's' : ''}
        </p>
      </div>
    </div>
  )
}