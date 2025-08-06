import { NextRequest, NextResponse } from 'next/server'

// Helper function to get city display name
function getCityDisplayName(cityCode: string): string {
  const cityMap: Record<string, string> = {
    'NYC': 'New York City',
    'TYO': 'Tokyo',
    'PAR': 'Paris', 
    'LON': 'London',
    'BCN': 'Barcelona'
  }
  return cityMap[cityCode] || cityCode
}

// Helper function to get default address for city
function getDefaultAddress(cityCode: string): string {
  const addressMap: Record<string, string> = {
    'NYC': 'New York, NY',
    'TYO': 'Tokyo, Japan',
    'PAR': 'Paris, France',
    'LON': 'London, UK', 
    'BCN': 'Barcelona, Spain'
  }
  return addressMap[cityCode] || `${cityCode}, Unknown`
}

// Helper function to get default coordinates for city
function getDefaultCoordinates(cityCode: string): { lat: number, lng: number } {
  const coordinatesMap: Record<string, { lat: number, lng: number }> = {
    'NYC': { lat: 40.7128, lng: -74.0060 },
    'TYO': { lat: 35.6762, lng: 139.6503 },
    'PAR': { lat: 48.8566, lng: 2.3522 },
    'LON': { lat: 51.5074, lng: -0.1278 },
    'BCN': { lat: 41.3851, lng: 2.1734 }
  }
  return coordinatesMap[cityCode] || { lat: 0, lng: 0 }
}

// Amadeus hotel list API endpoint (without pricing/booking details)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityCode = searchParams.get('cityCode') || 'NYC'
    const radius = searchParams.get('radius') || '20'
    const radiusUnit = searchParams.get('radiusUnit') || 'KM'
    const hotelSource = searchParams.get('hotelSource') || 'ALL'

    // Get OAuth token first
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return NextResponse.json({ 
        error: 'Failed to get OAuth token', 
        status: tokenResponse.status,
        details: errorText 
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get hotel list by city (no booking details needed)
    const hotelSearchUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city')
    hotelSearchUrl.searchParams.append('cityCode', cityCode)
    hotelSearchUrl.searchParams.append('radius', radius)
    hotelSearchUrl.searchParams.append('radiusUnit', radiusUnit)
    hotelSearchUrl.searchParams.append('hotelSource', hotelSource)

    const hotelListResponse = await fetch(hotelSearchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!hotelListResponse.ok) {
      const errorText = await hotelListResponse.text()
      return NextResponse.json({ 
        error: 'Hotel list search failed',
        status: hotelListResponse.status,
        details: errorText 
      }, { status: 400 })
    }

    const hotelListData = await hotelListResponse.json()
    
    console.log(`Found ${hotelListData.data?.length || 0} hotels for city ${cityCode}`)
    
    if (!hotelListData.data || hotelListData.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          count: 0,
          cityCode,
          message: 'No hotels found in this city'
        }
      })
    }

    // Helper function to check if hotel is a test property
    const isTestHotel = (hotelName: string, address?: string) => {
      const name = hotelName.toLowerCase()
      const addr = address?.toLowerCase() || ''
      
      const testKeywords = ['test', 'dummy', 'demo', 'sample', 'fake', 'mock', 'prop for', 'test property', 'booking property', 'api test', 'property par', 'property bcn', 'property lon', 'property nyc', 'property tyo']
      
      // Check hotel name for test keywords
      const hasTestName = testKeywords.some(keyword => name.includes(keyword)) || 
                         /^property\s+[a-z]{3}\s+\d{3}$/i.test(name)
      
      // Check address for test patterns
      const hasTestAddress = /^test\d+$/i.test(addr) || addr.includes('test')
      
      // Check for wrong city hotels (e.g., London hotel in Paris results)
      const cityMismatch = (cityCode === 'PAR' && name.includes('london')) ||
                           (cityCode === 'LON' && name.includes('paris')) ||
                           (cityCode === 'NYC' && (name.includes('london') || name.includes('paris'))) ||
                           (cityCode === 'TYO' && (name.includes('london') || name.includes('paris'))) ||
                           (cityCode === 'BCN' && (name.includes('london') || name.includes('paris')))
      
      return hasTestName || hasTestAddress || cityMismatch
    }

    // Create a deterministic random seed based on cityCode for consistent randomization
    const createSeededRandom = (seed: string) => {
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return () => {
        hash = (hash * 9301 + 49297) % 233280
        return hash / 233280
      }
    }

    const seededRandom = createSeededRandom(cityCode)

    // Transform data to match our TStayListing interface, filtering out test hotels
    const filteredHotels = hotelListData.data?.filter((hotel: any) => {
      const hotelName = hotel.name || ''
      const hotelAddress = hotel.address?.lines?.join(', ') || ''
      return !isTestHotel(hotelName, hotelAddress)
    }) || []

    // Shuffle using seeded random (consistent per cityCode)
    const shuffledHotels = [...filteredHotels].sort(() => seededRandom() - 0.5)
    
    const transformedHotels = shuffledHotels
      .slice(0, 8) // Take exactly 8 hotels - random but consistent per city
      .map((hotel: any, index: number) => {
        // Generate realistic image URLs
        const hotelImages = [
          'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
          'https://images.pexels.com/photos/261394/pexels-photo-261394.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
          'https://images.pexels.com/photos/2861361/pexels-photo-2861361.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
          'https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
          'https://images.pexels.com/photos/6527036/pexels-photo-6527036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
          'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
          'https://images.pexels.com/photos/2677398/pexels-photo-2677398.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
          'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
        ]
        
        // Use consistent image based on hotel index for fixed display
        const imageIndex = index % hotelImages.length
        const featuredImage = hotelImages[imageIndex]
        
        // Create gallery with 4 different images - consistent per hotel
        const galleryImgs = Array.from({ length: 4 }, (_, galleryIndex) => 
          hotelImages[(imageIndex + galleryIndex) % hotelImages.length]
        )

        // Get smart room info based on hotel name/brand
        const getDefaultRoomInfo = (hotelName: string) => {
          const name = hotelName.toLowerCase()
          
          if (name.includes('suite') || name.includes('residence inn') || name.includes('extended stay')) {
            return { beds: 1, bedrooms: 1, bathrooms: 1, maxGuests: 4 }
          } else if (name.includes('family') || name.includes('holiday inn')) {
            return { beds: 2, bedrooms: 1, bathrooms: 1, maxGuests: 4 }
          } else if (name.includes('luxury') || name.includes('grand') || name.includes('ritz')) {
            return { beds: 1, bedrooms: 1, bathrooms: 2, maxGuests: 2 }
          } else {
            return { beds: 1, bedrooms: 1, bathrooms: 1, maxGuests: 2 }
          }
        }
        
        const roomInfo = getDefaultRoomInfo(hotel.name || '')

        // Generate reasonable price based on city and hotel type
        const generatePrice = (cityCode: string, hotelName: string) => {
          const name = hotelName.toLowerCase()
          let basePrice = 150 // Default base price
          
          // City multipliers
          const cityMultipliers: Record<string, number> = {
            'NYC': 1.8,
            'LON': 1.6, 
            'PAR': 1.4,
            'TYO': 1.5,
            'BCN': 1.2
          }
          
          // Hotel type multipliers
          let typeMultiplier = 1.0
          if (name.includes('luxury') || name.includes('grand') || name.includes('ritz') || name.includes('marriott')) {
            typeMultiplier = 1.8
          } else if (name.includes('boutique') || name.includes('suite')) {
            typeMultiplier = 1.4
          } else if (name.includes('budget') || name.includes('inn') || name.includes('express')) {
            typeMultiplier = 0.7
          }
          
          const finalPrice = Math.round(basePrice * (cityMultipliers[cityCode] || 1.0) * typeMultiplier)
          return Math.max(finalPrice, 80) // Minimum $80
        }

        return {
          id: `amadeus-hotel://${hotel.hotelId}`,
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          listingCategory: 'Hotel',
          title: hotel.name || 'Hotel',
          handle: hotel.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `hotel-${hotel.hotelId}`,
          description: `Located in ${getCityDisplayName(cityCode)}`,
          featuredImage,
          galleryImgs,
          like: index < 3, // First 3 hotels are liked for consistency
          address: hotel.address?.lines?.join(', ') || getDefaultAddress(cityCode),
          reviewStart: Math.round((4.2 + (index * 0.1)) * 10) / 10, // Consistent rating 4.2-4.9
          reviewCount: 150 + (index * 25), // Consistent review count 150, 175, 200...
          price: `$${generatePrice(cityCode, hotel.name || '')}`, // Smart pricing
          maxGuests: roomInfo.maxGuests,
          bedrooms: roomInfo.bedrooms,
          bathrooms: roomInfo.bathrooms,  
          beds: roomInfo.beds,
          saleOff: index === 1 || index === 4 ? `-${10 + (index * 2)}% today` : null, // Fixed sale pattern
          isAds: null,
          map: hotel.geoCode ? {
            lat: parseFloat(hotel.geoCode.latitude),
            lng: parseFloat(hotel.geoCode.longitude)
          } : getDefaultCoordinates(cityCode),
          // Store original Amadeus data for potential future use
          _amadeusData: {
            hotelId: hotel.hotelId,
            chainCode: hotel.chainCode,
            masterChainCode: hotel.masterChainCode,
            dupeId: hotel.dupeId,
            iataCode: hotel.iataCode,
            lastUpdate: hotel.lastUpdate,
            distance: hotel.distance
          }
        }
      }) || []

    return NextResponse.json({
      success: true,
      data: transformedHotels,
      meta: {
        count: transformedHotels.length,
        cityCode,
        radius,
        totalFound: hotelListData.data?.length || 0,
        source: 'amadeus-hotel-list',
        note: 'Hotel list without pricing - for homepage display'
      },
    })
  } catch (error) {
    console.error('Hotel list error:', error)
    return NextResponse.json({
      error: 'Hotel list failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}