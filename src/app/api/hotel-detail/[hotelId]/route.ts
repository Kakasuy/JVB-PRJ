import { NextRequest, NextResponse } from 'next/server'

// Helper function to get default address for fallback
function getDynamicAddress(cityCode: string, countryCode?: string): string {
  // Use available API data to construct meaningful address
  if (countryCode) {
    return `${cityCode}, ${countryCode}`
  }
  if (cityCode) {
    return `${cityCode}`
  }
  // Honest fallback instead of fake addresses
  return 'Address not available'
}

// Helper function to get default coordinates
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

// Get single hotel details by hotelId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params
    const { searchParams } = new URL(request.url)
    
    // Get search parameters for hotel offers (required for pricing and availability)
    const checkInDate = searchParams.get('checkInDate') || '2025-08-20'
    const checkOutDate = searchParams.get('checkOutDate') || '2025-08-22'
    const adults = searchParams.get('adults') || '1'
    const rooms = searchParams.get('rooms') || '1'
    
    console.log(`🏨 Getting hotel detail for: ${hotelId}`)
    console.log(`📅 Dates: ${checkInDate} to ${checkOutDate}, Adults: ${adults}, Rooms: ${rooms}`)

    // Get OAuth token
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

    // Step 1: Get hotel offers (pricing and room details)
    const hotelOffersUrl = new URL('https://test.api.amadeus.com/v3/shopping/hotel-offers')
    hotelOffersUrl.searchParams.append('hotelIds', hotelId)
    hotelOffersUrl.searchParams.append('checkInDate', checkInDate)
    hotelOffersUrl.searchParams.append('checkOutDate', checkOutDate)
    hotelOffersUrl.searchParams.append('roomQuantity', rooms)
    hotelOffersUrl.searchParams.append('adults', adults)
    hotelOffersUrl.searchParams.append('currency', 'USD')

    console.log(`🔍 Fetching hotel offers: ${hotelOffersUrl.toString()}`)

    const hotelOffersResponse = await fetch(hotelOffersUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!hotelOffersResponse.ok) {
      const errorText = await hotelOffersResponse.text()
      console.error(`❌ Hotel offers failed for ${hotelId}:`, errorText)
      return NextResponse.json({ 
        error: `Hotel offers search failed for ${hotelId}`,
        status: hotelOffersResponse.status,
        details: errorText 
      }, { status: 400 })
    }

    const hotelOffersData = await hotelOffersResponse.json()
    console.log(`✅ Found offers for hotel ${hotelId}:`, hotelOffersData.data?.length || 0)

    if (!hotelOffersData.data || hotelOffersData.data.length === 0) {
      return NextResponse.json({
        error: `No offers found for hotel ${hotelId}`,
        hotelId,
        checkInDate,
        checkOutDate
      }, { status: 404 })
    }

    const hotelOffer = hotelOffersData.data[0] // Get the first (and likely only) hotel
    const hotelInfo = hotelOffer.hotel
    const offers = hotelOffer.offers || []

    // Extract cityCode from hotel data (Step 1 of 2-step address process)
    const hotelCityCode = hotelInfo.cityCode || 'NYC'
    console.log(`🌍 Hotel cityCode detected: ${hotelCityCode}`)

    // Step 2: Get detailed hotel information including accurate address
    // Use hotels/by-city API with the detected cityCode (same as Stay Categories)
    let detailedHotelInfo = null
    try {
      console.log(`🔍 Fetching detailed info for hotels in ${hotelCityCode}...`)
      const hotelSearchUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city')
      hotelSearchUrl.searchParams.append('cityCode', hotelCityCode)
      hotelSearchUrl.searchParams.append('radius', '50')
      hotelSearchUrl.searchParams.append('radiusUnit', 'KM')
      hotelSearchUrl.searchParams.append('hotelSource', 'ALL')

      const hotelSearchResponse = await fetch(hotelSearchUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (hotelSearchResponse.ok) {
        const searchData = await hotelSearchResponse.json()
        detailedHotelInfo = searchData.data?.find((h: any) => h.hotelId === hotelId)
        console.log(`🏨 Detailed hotel info for ${hotelId}:`, detailedHotelInfo ? 'Found' : 'Not found')
        if (detailedHotelInfo?.amenities) {
          console.log(`✨ Amenities found:`, detailedHotelInfo.amenities)
        }
      }
    } catch (error) {
      console.warn('Could not fetch detailed hotel info:', error)
    }

    // Process offers to get pricing and room info
    const lowestPriceOffer = offers.length > 0 ? offers.reduce((lowest: any, current: any) => {
      const currentPrice = parseFloat(current.price?.total || '999999')
      const lowestPrice = parseFloat(lowest.price?.total || '999999')
      return currentPrice < lowestPrice ? current : lowest
    }, offers[0]) : null

    // Generate gallery images (using same approach as hotel search)
    const hotelImages = [
      'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
      'https://images.pexels.com/photos/261394/pexels-photo-261394.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/2861361/pexels-photo-2861361.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/6527036/pexels-photo-6527036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/2677398/pexels-photo-2677398.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/7163619/pexels-photo-7163619.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    ]
    
    const randomImageIndex = Math.floor(Math.random() * hotelImages.length)
    const featuredImage = hotelImages[randomImageIndex]
    
    // Create gallery with multiple different images
    const galleryImgs = Array.from({ length: 12 }, (_, index) => 
      hotelImages[(randomImageIndex + index) % hotelImages.length]
    )

    // Extract room and bed information from offers
    const extractRoomInfo = () => {
      if (!lowestPriceOffer?.room) {
        return { beds: 1, bedrooms: 1, bathrooms: 1 }
      }

      const roomInfo = lowestPriceOffer.room
      const roomDescription = roomInfo.description?.text || ''
      
      let beds = roomInfo.typeEstimated?.beds || 1
      let bedrooms = 1 // Default for hotel rooms
      let bathrooms = 1 // Default

      // Parse from description if available
      if (roomDescription) {
        const bedroomMatch = roomDescription.match(/(\d+)\s*bedroom/i)
        if (bedroomMatch) {
          bedrooms = parseInt(bedroomMatch[1])
        }
        
        const bathroomMatch = roomDescription.match(/(\d+)\s*(bathroom|bath)/i)
        if (bathroomMatch) {
          bathrooms = parseInt(bathroomMatch[1])
        }

        // Handle suite descriptions
        if (roomDescription.toLowerCase().includes('suite')) {
          bedrooms = Math.max(bedrooms, 1)
          bathrooms = Math.max(bathrooms, 1)
        }
      }

      return { beds, bedrooms, bathrooms }
    }

    const roomInfo = extractRoomInfo()

    // Get address using 2-step process (same as Stay Categories)
    const getAddress = () => {
      // Priority 1: Use detailed address from hotels/by-city API (most accurate)
      if (detailedHotelInfo?.address?.lines && detailedHotelInfo.address.lines.length > 0) {
        const accurateAddress = detailedHotelInfo.address.lines.join(', ')
        console.log(`✅ Found accurate address from hotels/by-city: ${accurateAddress}`)
        return accurateAddress
      }
      
      // Priority 2: Try basic address from hotel offers (less detailed)
      if (hotelInfo.address?.lines && hotelInfo.address.lines.length > 0) {
        return hotelInfo.address.lines.join(', ')
      }
      
      // Priority 3: Use dynamic fallback with available API data
      const countryCode = hotelInfo.address?.countryCode
      const fallbackAddress = getDynamicAddress(hotelCityCode, countryCode)
      console.log(`⚠️ Using dynamic fallback address: ${fallbackAddress}`)
      return fallbackAddress
    }

    // Create comprehensive hotel detail response
    const hotelDetail = {
      id: `amadeus-hotel://${hotelId}`,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      listingCategory: 'Hotel',
      title: hotelInfo.name || 'Hotel',
      handle: hotelId.toLowerCase(),
      description: lowestPriceOffer?.room?.description?.text || 
                   detailedHotelInfo?.name || 
                   `Experience luxury and comfort at ${hotelInfo.name || 'this beautiful hotel'}.`,
      featuredImage,
      galleryImgs,
      like: Math.random() > 0.7,
      address: getAddress(),
      reviewStart: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      reviewCount: Math.floor(Math.random() * 500 + 20), // 20-520
      price: lowestPriceOffer?.price?.total ? 
             `$${Math.round(parseFloat(lowestPriceOffer.price.total))}` : 
             '$200',
      maxGuests: lowestPriceOffer?.guests?.adults || 2,
      bedrooms: roomInfo.bedrooms,
      bathrooms: roomInfo.bathrooms, 
      beds: roomInfo.beds,
      saleOff: offers.length > 1 ? `-${Math.floor(Math.random() * 15 + 5)}% today` : null,
      isAds: null,
      map: hotelInfo.geoCode ? {
        lat: parseFloat(hotelInfo.geoCode.latitude),
        lng: parseFloat(hotelInfo.geoCode.longitude)
      } : getDefaultCoordinates('NYC'),

      // Enhanced hotel details from Amadeus
      amadeus: {
        hotelId,
        offers: offers.map((offer: any) => ({
          id: offer.id,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          roomType: offer.room?.typeEstimated?.category,
          roomDescription: offer.room?.description?.text,
          bedType: offer.room?.typeEstimated?.bedType,
          price: {
            total: offer.price?.total,
            currency: offer.price?.currency,
            base: offer.price?.base,
          },
          boardType: offer.boardType,
          policies: offer.policies,
          rateCode: offer.rateCode,
        })),
        amenities: detailedHotelInfo?.amenities || [],
        chainCode: hotelInfo.chainCode,
        dupeId: hotelInfo.dupeId,
        lastUpdate: hotelInfo.lastUpdate,
      },

      // Host information (mock for now - could be enhanced with chain info)
      host: {
        displayName: hotelInfo.chainCode || 'Hotel Management',
        avatarUrl: 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=150',
        handle: (hotelInfo.chainCode || 'hotel-management').toLowerCase(),
        description: `Professional hotel management providing excellent service and comfortable accommodations.`,
        listingsCount: Math.floor(Math.random() * 20 + 5),
        reviewsCount: Math.floor(Math.random() * 1000 + 100),
        rating: Math.round((Math.random() * 1 + 4) * 10) / 10, // 4.0-5.0
        responseRate: Math.floor(Math.random() * 20 + 80), // 80-100%
        responseTime: 'within a few hours',
        isSuperhost: Math.random() > 0.7,
        isVerified: true,
        joinedDate: 'January 2020',
      }
    }

    console.log(`✅ Hotel detail created for ${hotelId}: ${hotelDetail.title}`)

    return NextResponse.json({
      success: true,
      data: hotelDetail,
      meta: {
        hotelId,
        offersCount: offers.length,
        checkInDate,
        checkOutDate,
        adults,
        rooms,
        source: 'amadeus-api'
      }
    })

  } catch (error) {
    console.error('❌ Hotel detail API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}