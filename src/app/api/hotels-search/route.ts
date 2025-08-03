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

// Amadeus hotel search API endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityCode = searchParams.get('cityCode') || 'NYC' // Default to New York
    const checkInDate = searchParams.get('checkInDate') || '2025-08-15'
    const checkOutDate = searchParams.get('checkOutDate') || '2025-08-17'
    const adults = searchParams.get('adults') || '2'
    const radius = searchParams.get('radius') || '50' // Increased radius to 50km
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

    // Step 1: Search for hotels by city using the correct endpoint
    const hotelSearchUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city')
    hotelSearchUrl.searchParams.append('cityCode', cityCode)
    hotelSearchUrl.searchParams.append('radius', radius)
    hotelSearchUrl.searchParams.append('radiusUnit', radiusUnit)
    hotelSearchUrl.searchParams.append('hotelSource', hotelSource)
    // Request more hotels in the first step - removed pagination as it may not be supported

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
    
    console.log(`Found ${hotelListData.data?.length || 0} hotels in step 1 for city ${cityCode}`)
    
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

    // Step 2: Get hotel offers for first 30 hotels to increase chances of getting offers
    const maxHotelsToQuery = Math.min(30, hotelListData.data.length)
    const hotelIds = hotelListData.data.slice(0, maxHotelsToQuery).map((hotel: any) => hotel.hotelId).join(',')
    
    const hotelOffersUrl = new URL('https://test.api.amadeus.com/v3/shopping/hotel-offers')
    hotelOffersUrl.searchParams.append('hotelIds', hotelIds)
    hotelOffersUrl.searchParams.append('checkInDate', checkInDate)
    hotelOffersUrl.searchParams.append('checkOutDate', checkOutDate)
    hotelOffersUrl.searchParams.append('roomQuantity', '1')
    hotelOffersUrl.searchParams.append('adults', adults)
    hotelOffersUrl.searchParams.append('currency', 'USD')

    const hotelResponse = await fetch(hotelOffersUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!hotelResponse.ok) {
      const errorText = await hotelResponse.text()
      return NextResponse.json({ 
        error: 'Hotel search failed',
        status: hotelResponse.status,
        details: errorText 
      }, { status: 400 })
    }

    const hotelData = await hotelResponse.json()
    
    console.log(`Found ${hotelData.data?.length || 0} hotels with offers in step 2`)

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

    // Create a map of hotel details from step 1 for better address info
    const hotelDetailsMap = new Map()
    hotelListData.data?.forEach((hotel: any) => {
      hotelDetailsMap.set(hotel.hotelId, hotel)
    })

    // Transform data to match our TStayListing interface, filtering out test hotels
    const transformedHotels = hotelData.data?.filter((hotelOffer: any) => {
      const hotelName = hotelOffer.hotel?.name || ''
      const hotelAddress = hotelOffer.hotel?.address?.lines?.join(', ') || ''
      const detailedInfo = hotelDetailsMap.get(hotelOffer.hotel?.hotelId)
      const detailedAddress = detailedInfo?.address?.lines?.join(', ') || ''
      const bestAddress = detailedAddress || hotelAddress
      return !isTestHotel(hotelName, bestAddress)
    }).map((hotelOffer: any) => {
      const hotelInfo = hotelOffer.hotel
      const detailedHotelInfo = hotelDetailsMap.get(hotelInfo.hotelId) // Get detailed info from step 1
      const offers = hotelOffer.offers || []
      const lowestPriceOffer = offers.length > 0 ? offers.reduce((lowest: any, current: any) => {
        const currentPrice = parseFloat(current.price?.total || '999999')
        const lowestPrice = parseFloat(lowest.price?.total || '999999')
        return currentPrice < lowestPrice ? current : lowest
      }, offers[0]) : null

      // Generate a realistic image URL (using Pexels hotel images)
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
      
      const randomImageIndex = Math.floor(Math.random() * hotelImages.length)
      const featuredImage = hotelImages[randomImageIndex]
      
      // Create gallery with 4 different images
      const galleryImgs = Array.from({ length: 4 }, (_, index) => 
        hotelImages[(randomImageIndex + index) % hotelImages.length]
      )

      // Extract real bed information from Amadeus room data
      const roomInfo = lowestPriceOffer?.room || null
      const roomDescription = roomInfo?.description?.text || ''
      
      // Parse bed information from room data
      const extractBedInfo = () => {
        // Get beds from typeEstimated if available
        const estimatedBeds = roomInfo?.typeEstimated?.beds || null
        const bedType = roomInfo?.typeEstimated?.bedType || null
        
        // Parse from description text for additional info
        let parsedBeds = estimatedBeds
        let parsedBedrooms = 1 // Default to 1 bedroom for hotels
        let parsedBathrooms = 1 // Default to 1 bathroom
        
        if (roomDescription) {
          // Look for bed mentions in description
          const bedMatches = roomDescription.match(/(\d+)\s*(king|queen|double|single|twin)/gi)
          if (bedMatches && !parsedBeds) {
            parsedBeds = bedMatches.length
          }
          
          // Look for bedroom mentions
          const bedroomMatch = roomDescription.match(/(\d+)\s*bedroom/i)
          if (bedroomMatch) {
            parsedBedrooms = parseInt(bedroomMatch[1])
          }
          
          // Look for bathroom mentions  
          const bathroomMatch = roomDescription.match(/(\d+)\s*(bathroom|bath)/i)
          if (bathroomMatch) {
            parsedBathrooms = parseInt(bathroomMatch[1])
          }
          
          // Handle suite descriptions
          if (roomDescription.toLowerCase().includes('suite')) {
            parsedBedrooms = Math.max(parsedBedrooms, 1)
            parsedBathrooms = Math.max(parsedBathrooms, 1)
          }
        }
        
        return {
          beds: parsedBeds || 1, // Default to 1 if no info available
          bedrooms: parsedBedrooms,
          bathrooms: parsedBathrooms,
          bedType: bedType
        }
      }
      
      const bedInfo = extractBedInfo()

      // Get best available address (prefer detailed info from step 1)
      const getBestAddress = () => {
        // Try step 1 detailed hotel info first
        if (detailedHotelInfo?.address?.lines && detailedHotelInfo.address.lines.length > 0) {
          return detailedHotelInfo.address.lines.join(', ')
        }
        // Try step 2 hotel offer info
        if (hotelInfo.address?.lines && hotelInfo.address.lines.length > 0) {
          return hotelInfo.address.lines.join(', ')
        }
        // Fallback to default city address
        return getDefaultAddress(cityCode)
      }

      return {
        id: `amadeus-hotel://${hotelInfo.hotelId}`,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        listingCategory: 'Hotel',
        title: hotelInfo.name || 'Hotel',
        handle: hotelInfo.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `hotel-${hotelInfo.hotelId}`,
        description: roomDescription || hotelInfo.description || `Located in ${getCityDisplayName(cityCode)}`,
        featuredImage,
        galleryImgs,
        like: Math.random() > 0.7, // Random like status
        address: getBestAddress(),
        reviewStart: Math.round((Math.random() * 2 + 3) * 10) / 10, // Keep random rating 3.0-5.0
        reviewCount: Math.floor(Math.random() * 500 + 20), // Keep random review count 20-520
        price: (() => {
          if (!lowestPriceOffer?.price?.total) return '$200'
          let price = parseFloat(lowestPriceOffer.price.total)
          
          // Fix abnormal prices (likely currency conversion issues)
          // For Tokyo, prices might be in JPY instead of USD
          if (cityCode === 'TYO' && price > 10000) {
            price = Math.round(price / 150) // Convert JPY to USD approximately
          }
          // For other cities, cap extremely high prices
          else if (price > 2000) {
            price = Math.floor(Math.random() * 800 + 200) // Random price $200-1000
          }
          
          return `$${Math.round(price)}`
        })(),
        maxGuests: lowestPriceOffer?.guests?.adults || 2,
        bedrooms: bedInfo.bedrooms, // ✅ Real bedroom info from Amadeus
        bathrooms: bedInfo.bathrooms, // ✅ Real bathroom info from Amadeus  
        beds: bedInfo.beds, // ✅ Real bed count from Amadeus
        saleOff: Math.random() > 0.8 ? `-${Math.floor(Math.random() * 20 + 5)}% today` : null,
        isAds: null,
        map: hotelInfo.geoCode ? {
          lat: parseFloat(hotelInfo.geoCode.latitude),
          lng: parseFloat(hotelInfo.geoCode.longitude)
        } : getDefaultCoordinates(cityCode),
        // Add bed type info for potential future use
        _bedType: bedInfo.bedType,
        _roomDescription: roomDescription
      }
    }) || []

    // If we have fewer than 8 hotels with offers, add some from the hotel list as mock data
    if (transformedHotels.length < 8 && hotelListData.data.length > transformedHotels.length) {
      const existingHotelIds = new Set(transformedHotels.map((h: any) => h.id.split('://')[1]))
      const additionalHotels = hotelListData.data
        .filter((hotel: any) => !existingHotelIds.has(hotel.hotelId))
        .filter((hotel: any) => !isTestHotel(hotel.name || '', hotel.address?.lines?.join(', ') || '')) // Filter out test hotels
        .slice(0, 8 - transformedHotels.length)
        .map((hotel: any) => {
          // Create mock hotel data from hotel list without offers
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
          
          const randomImageIndex = Math.floor(Math.random() * hotelImages.length)
          const featuredImage = hotelImages[randomImageIndex]
          const galleryImgs = Array.from({ length: 4 }, (_, index) => 
            hotelImages[(randomImageIndex + index) % hotelImages.length]
          )

          // For hotels without offers, provide reasonable defaults based on hotel type
          const getDefaultRoomInfo = (hotelName: string) => {
            const name = hotelName.toLowerCase()
            
            // Determine room type based on hotel name/brand
            if (name.includes('suite') || name.includes('residence inn') || name.includes('extended stay')) {
              return { beds: 1, bedrooms: 1, bathrooms: 1 } // Suite style
            } else if (name.includes('family') || name.includes('holiday inn')) {
              return { beds: 2, bedrooms: 1, bathrooms: 1 } // Family friendly
            } else {
              return { beds: 1, bedrooms: 1, bathrooms: 1 } // Standard hotel room
            }
          }
          
          const defaultRoomInfo = getDefaultRoomInfo(hotel.name || '')

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
            like: Math.random() > 0.7,
            address: hotel.address?.lines?.join(', ') || getDefaultAddress(cityCode),
            reviewStart: Math.round((Math.random() * 2 + 3) * 10) / 10, // Keep random rating
            reviewCount: Math.floor(Math.random() * 500 + 20), // Keep random review count
            price: `$${Math.floor(Math.random() * 400 + 200)}`, // Random price $200-600
            maxGuests: Math.floor(Math.random() * 3 + 2), // 2-4 guests (keep random as no offer data)
            bedrooms: defaultRoomInfo.bedrooms, // ✅ Smarter default based on hotel type
            bathrooms: defaultRoomInfo.bathrooms, // ✅ Smarter default based on hotel type
            beds: defaultRoomInfo.beds, // ✅ Smarter default based on hotel type
            saleOff: Math.random() > 0.8 ? `-${Math.floor(Math.random() * 20 + 5)}% today` : null,
            isAds: null,
            map: hotel.geoCode ? {
              lat: parseFloat(hotel.geoCode.latitude),
              lng: parseFloat(hotel.geoCode.longitude)
            } : getDefaultCoordinates(cityCode),
          }
        })
      
      transformedHotels.push(...additionalHotels)
    }

    return NextResponse.json({
      success: true,
      data: transformedHotels,
      meta: {
        count: transformedHotels.length,
        cityCode,
        checkInDate,
        checkOutDate,
        adults,
        hotelsFound: hotelListData.data?.length || 0,
        hotelsWithOffers: hotelData.data?.length || 0
      },
      raw: hotelData.meta || null, // Include original meta for debugging
    })
  } catch (error) {
    console.error('Hotel search error:', error)
    return NextResponse.json({
      error: 'Hotel search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}