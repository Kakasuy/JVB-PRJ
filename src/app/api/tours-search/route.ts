import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = searchParams.get('radius') || '1'
    
    if (!latitude || !longitude) {
      return NextResponse.json({ 
        error: 'Latitude and longitude are required' 
      }, { status: 400 })
    }

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
      return NextResponse.json({ 
        error: 'Failed to authenticate with Amadeus API' 
      }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Call Amadeus Tours & Activities API
    const toursApiUrl = `https://test.api.amadeus.com/v1/shopping/activities?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    
    const toursResponse = await fetch(toursApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!toursResponse.ok) {
      const errorText = await toursResponse.text()
      return NextResponse.json({ 
        error: 'Tours search failed',
        details: errorText 
      }, { status: 500 })
    }

    const toursData = await toursResponse.json()

    return NextResponse.json({
      success: true,
      data: toursData.data || [],
      meta: {
        ...toursData.meta,
        searchParams: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseInt(radius)
        },
        api: 'amadeus-tours-activities',
      },
    })

  } catch (error) {
    console.error('Tours search error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}