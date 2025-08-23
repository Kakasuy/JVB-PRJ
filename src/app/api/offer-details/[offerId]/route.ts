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

    // Extract enhanced data for UI
    const enhancedDescription = offerData.data.offers?.[0]?.description?.text
    const enhancedAmenities = offerData.data.hotel?.amenities || []

    console.log(`✅ Offer details retrieved for ${offerId}`)
    console.log(`📝 Enhanced description available: ${!!enhancedDescription}`)
    console.log(`🏨 Enhanced amenities count: ${enhancedAmenities.length}`)

    return NextResponse.json({
      success: true,
      data: {
        // Full API response
        raw: offerData.data,
        // Extracted enhanced data
        enhancedDescription,
        enhancedAmenities,
        // Metadata
        meta: {
          offerId,
          hasDescription: !!enhancedDescription,
          amenitiesCount: enhancedAmenities.length
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