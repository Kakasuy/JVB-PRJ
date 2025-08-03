import { NextRequest, NextResponse } from 'next/server'

// Helper function to capitalize only first letter of each word
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
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'ALL' // ALL, CITY, AIRPORT
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters long' 
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

    // Determine subType based on requested type
    let subType = 'AIRPORT,CITY'
    if (type === 'CITY') {
      subType = 'CITY'
    } else if (type === 'AIRPORT') {
      subType = 'AIRPORT'
    }

    // Search for locations (airports, cities, points of interest)
    const locationResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?subType=${subType}&keyword=${encodeURIComponent(query)}&page%5Blimit%5D=10&sort=analytics.travelers.score&view=FULL`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!locationResponse.ok) {
      const errorText = await locationResponse.text()
      return NextResponse.json({ 
        error: 'Location search failed',
        details: errorText 
      }, { status: 500 })
    }

    const locationData = await locationResponse.json()

    // Transform data to match our component interface
    const suggestions = locationData.data?.map((location: any) => {
      // Format names with proper capitalization
      const formattedName = capitalizeLocation(location.name)
      const formattedCityName = location.address?.cityName ? capitalizeLocation(location.address.cityName) : null
      const formattedCountryName = location.address?.countryName ? capitalizeLocation(location.address.countryName) : null
      
      // Create a display name with city and country
      let displayName = formattedName
      if (formattedCityName && formattedCityName !== formattedName) {
        displayName += `, ${formattedCityName}`
      }
      if (formattedCountryName) {
        displayName += `, ${formattedCountryName}`
      }

      return {
        id: location.id,
        name: formattedName,
        iataCode: location.iataCode,
        address: {
          ...location.address,
          cityName: formattedCityName,
          countryName: formattedCountryName,
        },
        type: location.subType,
        analytics: location.analytics,
        displayName,
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        count: suggestions.length,
        query,
      },
    })

  } catch (error) {
    console.error('Location search error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}