import { NextRequest, NextResponse } from 'next/server'

// Helper function for default coordinates and addresses
function getDefaultCoordinates(city: string) {
  const defaults: { [key: string]: { lat: number, lng: number } } = {
    'NYC': { lat: 40.7589, lng: -73.9851 },
    'LON': { lat: 51.5074, lng: -0.1278 },
    'PAR': { lat: 48.8566, lng: 2.3522 },
  }
  return defaults[city] || defaults['NYC']
}

function getDefaultAddress(city: string) {
  const defaults: { [key: string]: string } = {
    'NYC': 'New York, NY, United States',
    'LON': 'London, United Kingdom', 
    'PAR': 'Paris, France',
  }
  return defaults[city] || defaults['NYC']
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params
    const { searchParams } = new URL(request.url)
    
    // Get required parameters
    const hotelId = searchParams.get('hotelId')
    const checkInDate = searchParams.get('checkInDate')
    const checkOutDate = searchParams.get('checkOutDate')
    const adults = searchParams.get('adults') || '1'
    const rooms = searchParams.get('rooms') || '1'

    if (!hotelId || !checkInDate || !checkOutDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: hotelId, checkInDate, checkOutDate'
      }, { status: 400 })
    }

    console.log(`🛒 Getting checkout details for offer: ${offerId}`)
    console.log(`🏨 Hotel: ${hotelId}, Dates: ${checkInDate} to ${checkOutDate}`)

    // Get OAuth token for Amadeus API
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
        success: false,
        error: 'Failed to get OAuth token',
        status: tokenResponse.status,
        details: errorText
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Step 1: Get fresh hotel offers to validate offer still exists
    const hotelOffersUrl = new URL('https://test.api.amadeus.com/v3/shopping/hotel-offers')
    hotelOffersUrl.searchParams.append('hotelIds', hotelId)
    hotelOffersUrl.searchParams.append('checkInDate', checkInDate)
    hotelOffersUrl.searchParams.append('checkOutDate', checkOutDate)
    hotelOffersUrl.searchParams.append('roomQuantity', rooms)
    hotelOffersUrl.searchParams.append('adults', adults)
    hotelOffersUrl.searchParams.append('currency', 'USD')

    const hotelOffersResponse = await fetch(hotelOffersUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!hotelOffersResponse.ok) {
      const errorText = await hotelOffersResponse.text()
      console.error(`❌ Hotel offers failed for checkout:`, errorText)
      return NextResponse.json({
        success: false,
        error: `Hotel offers not available`,
        status: hotelOffersResponse.status,
        details: errorText
      }, { status: 400 })
    }

    const hotelOffersData = await hotelOffersResponse.json()
    
    if (!hotelOffersData.data || hotelOffersData.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No offers available for checkout',
        hotelId,
        checkInDate,
        checkOutDate
      }, { status: 404 })
    }

    const hotelOffer = hotelOffersData.data[0]
    const hotelInfo = hotelOffer.hotel
    const offers = hotelOffer.offers || []
    
    // Find the specific offer by ID, or get the first available one
    let selectedOffer = offers.find((offer: any) => offer.id === offerId) || offers[0]
    
    if (!selectedOffer) {
      return NextResponse.json({
        success: false,
        error: 'Offer not found or no longer available'
      }, { status: 404 })
    }

    // Step 2: Get detailed hotel information for amenities and images
    let detailedHotelInfo = null
    try {
      const cityCode = 'NYC' // Default - could be inferred from coordinates
      const hotelSearchUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city')
      hotelSearchUrl.searchParams.append('cityCode', cityCode)
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
      }
    } catch (error) {
      console.warn('Could not fetch detailed hotel info for checkout:', error)
    }

    // Generate gallery images
    const hotelImages = [
      'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
      'https://images.pexels.com/photos/261394/pexels-photo-261394.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/2861361/pexels-photo-2861361.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/6527036/pexels-photo-6527036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    ]
    const randomImageIndex = Math.floor(Math.random() * hotelImages.length)
    const featuredImage = hotelImages[randomImageIndex]

    // Extract room information from offer
    const extractRoomInfo = (offer: any) => {
      if (!offer?.room) {
        return { beds: 1, bedrooms: 1, bathrooms: 1 }
      }

      const roomInfo = offer.room
      const roomDescription = roomInfo.description?.text || ''
      
      let beds = roomInfo.typeEstimated?.beds || 1
      let bedrooms = 1
      let bathrooms = 1

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

        if (roomDescription.toLowerCase().includes('suite')) {
          bedrooms = Math.max(bedrooms, 1)
          bathrooms = Math.max(bathrooms, 1)
        }
      }

      return { beds, bedrooms, bathrooms }
    }

    const roomInfo = extractRoomInfo(selectedOffer)

    // Create checkout response data
    const checkoutData = {
      // Offer information
      offer: {
        id: selectedOffer.id,
        checkInDate: selectedOffer.checkInDate,
        checkOutDate: selectedOffer.checkOutDate,
        price: {
          total: selectedOffer.price?.total,
          base: selectedOffer.price?.base,
          currency: selectedOffer.price?.currency || 'USD',
          taxes: selectedOffer.price?.taxes || []
        },
        room: {
          type: selectedOffer.room?.typeEstimated?.category,
          description: selectedOffer.room?.description?.text,
          bedType: selectedOffer.room?.typeEstimated?.bedType,
          beds: roomInfo.beds
        },
        guests: {
          adults: parseInt(adults),
          rooms: parseInt(rooms)
        },
        policies: selectedOffer.policies || {},
        boardType: selectedOffer.boardType
      },

      // Hotel information
      hotel: {
        id: hotelId,
        name: hotelInfo.name || 'Hotel',
        address: hotelInfo.address?.lines?.join(', ') || getDefaultAddress('NYC'),
        location: hotelInfo.geoCode ? {
          lat: parseFloat(hotelInfo.geoCode.latitude),
          lng: parseFloat(hotelInfo.geoCode.longitude)
        } : getDefaultCoordinates('NYC'),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
        reviewCount: Math.floor(Math.random() * 500 + 20), // 20-520
        featuredImage,
        amenities: detailedHotelInfo?.amenities || [],
        beds: roomInfo.beds,
        bedrooms: roomInfo.bedrooms,
        bathrooms: roomInfo.bathrooms,
        chainCode: hotelInfo.chainCode,
        lastUpdate: hotelInfo.lastUpdate
      },

      // Search parameters
      searchParams: {
        checkInDate,
        checkOutDate,
        adults: parseInt(adults),
        rooms: parseInt(rooms)
      }
    }

    console.log(`✅ Checkout data prepared for offer ${offerId}`)

    return NextResponse.json({
      success: true,
      data: checkoutData
    })

  } catch (error) {
    console.error('❌ Checkout API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}