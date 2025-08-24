import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      )
    }

    // Get Amadeus access token
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
      console.error('Failed to get access token:', await tokenResponse.text())
      return NextResponse.json(
        { error: 'Failed to authenticate with Amadeus API' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Search for both airports and cities using Amadeus Location API
    const airportSearchUrl = `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword)}&page%5Blimit%5D=8`
    const citySearchUrl = `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(keyword)}&page%5Blimit%5D=5`
    
    // Fetch both airports and cities concurrently
    const [airportResponse, cityResponse] = await Promise.all([
      fetch(airportSearchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }),
      fetch(citySearchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    ])

    // Handle airport response
    let airports = []
    if (airportResponse.ok) {
      const airportData = await airportResponse.json()
      airports = airportData.data || []
    } else {
      console.error('Airport search failed:', await airportResponse.text())
    }

    // Handle city response
    let cities = []
    if (cityResponse.ok) {
      const cityData = await cityResponse.json()
      cities = cityData.data || []
    } else {
      console.error('City search failed:', await cityResponse.text())
    }

    // Combine results with airports first, then cities
    const combinedResults = [...airports, ...cities]
    
    console.log(`✅ Found ${airports.length} airports and ${cities.length} cities for "${keyword}"`)

    return NextResponse.json({
      data: combinedResults,
      meta: {
        count: combinedResults.length,
        airports: airports.length,
        cities: cities.length
      }
    })
  } catch (error) {
    console.error('Airport search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}