import { NextRequest, NextResponse } from 'next/server'

// Get specific offer details using Amadeus v3/shopping/hotel-offers/{offerId} API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params
    
    console.log(`🔍 Fetching offer details for: ${offerId}`)

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

    // Call Amadeus hotel offers API with specific offerId
    const offerUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers/${offerId}`
    
    console.log(`🔍 Calling Amadeus API: ${offerUrl}`)

    const offerResponse = await fetch(offerUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!offerResponse.ok) {
      const errorText = await offerResponse.text()
      console.error(`❌ Amadeus API error for offer ${offerId}:`, errorText)
      
      return NextResponse.json({
        success: false,
        error: `Offer details not available for ${offerId}`,
        status: offerResponse.status,
        details: errorText
      }, { status: offerResponse.status })
    }

    const offerData = await offerResponse.json()
    
    if (!offerData.data) {
      return NextResponse.json({
        success: false,
        error: 'No offer data found',
        offerId
      }, { status: 404 })
    }

    // Extract enhanced data for UI with priority logic
    const offer = offerData.data.offers?.[0]
    const roomDescription = offer?.roomInformation?.description
    const offerDescription = offer?.description?.text
    
    // Priority: Room description → Offer description
    const enhancedDescription = roomDescription || offerDescription
    const enhancedAmenities = offerData.data.hotel?.amenities || []
    
    // Extract additional offer details
    const boardType = offer?.boardType
    const roomCategory = offer?.room?.typeEstimated?.category
    const bedType = offer?.room?.typeEstimated?.bedType
    const beds = offer?.room?.typeEstimated?.beds

    console.log(`✅ Offer details retrieved for ${offerId}`)
    console.log(`🏠 Room description available: ${!!roomDescription}`)
    console.log(`📋 Offer description available: ${!!offerDescription}`)
    console.log(`📝 Using description: ${roomDescription ? 'Room Info' : offerDescription ? 'Offer Info' : 'None'}`)
    console.log(`🏨 Enhanced amenities count: ${enhancedAmenities.length}`)

    return NextResponse.json({
      success: true,
      data: {
        // Full API response
        raw: offerData.data,
        // Extracted enhanced data
        enhancedDescription,
        enhancedAmenities,
        // Additional offer details
        offerDetails: {
          boardType,
          roomCategory,
          bedType,
          beds
        },
        // Metadata
        meta: {
          offerId,
          hasRoomDescription: !!roomDescription,
          hasOfferDescription: !!offerDescription,
          usingRoomDescription: !!roomDescription,
          descriptionType: roomDescription ? 'room' : offerDescription ? 'offer' : 'none',
          amenitiesCount: enhancedAmenities.length,
          hasOfferDetails: !!(boardType || roomCategory || bedType || beds)
        }
      }
    })

  } catch (error) {
    console.error('❌ Offer details API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}