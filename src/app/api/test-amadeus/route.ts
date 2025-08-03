import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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

    // Test flight search
    const flightResponse = await fetch(
      'https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=LAX&departureDate=2025-08-15&adults=1&max=5',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!flightResponse.ok) {
      const errorText = await flightResponse.text()
      return NextResponse.json({ 
        error: 'Flight search failed',
        status: flightResponse.status,
        details: errorText 
      }, { status: 400 })
    }

    const flightData = await flightResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Amadeus API connection successful!',
      token_info: {
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
      },
      flight_search: {
        total_offers: flightData.data?.length || 0,
        sample_offer: flightData.data?.[0] || null,
      },
      meta: flightData.meta || null,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}