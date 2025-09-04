import { NextRequest, NextResponse } from 'next/server'

function capitalizeLocation(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || searchParams.get('q')
    const countryCode = searchParams.get('countryCode')
    const max = searchParams.get('max') || '10'
    
    if (!keyword || keyword.length < 2) {
      return NextResponse.json({ 
        error: 'Keyword must be at least 2 characters long' 
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

    // Build Amadeus City Search API URL
    let cityApiUrl = `https://test.api.amadeus.com/v1/reference-data/locations/cities?keyword=${encodeURIComponent(keyword)}&max=${max}&include=AIRPORTS`
    
    if (countryCode) {
      cityApiUrl += `&countryCode=${countryCode}`
    }

    const cityResponse = await fetch(cityApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!cityResponse.ok) {
      const errorText = await cityResponse.text()
      return NextResponse.json({ 
        error: 'City search failed',
        details: errorText 
      }, { status: 500 })
    }

    const cityData = await cityResponse.json()

    // Transform to match LocationInputField interface + add geoCode
    const suggestions = cityData.data?.map((location: any) => {
      const formattedName = capitalizeLocation(location.name)
      const countryCode = location.address?.countryCode
      const stateCode = location.address?.stateCode
      
      // Create display name with country/state info
      let displayName = formattedName
      if (stateCode && countryCode) {
        displayName += `, ${stateCode.replace('US-', '')}, ${countryCode}`
      } else if (countryCode) {
        displayName += `, ${countryCode}`
      }

      return {
        id: location.iataCode || `city-${Date.now()}-${Math.random()}`,
        name: formattedName,
        iataCode: location.iataCode,
        displayName,
        type: 'CITY',
        address: {
          countryCode: location.address?.countryCode,
          stateCode: location.address?.stateCode,
        },
        geoCode: location.geoCode, // Key data for Tours & Activities API
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        count: suggestions.length,
        keyword,
        countryCode,
        api: 'amadeus-city-search',
      },
    })

  } catch (error) {
    console.error('City search error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}