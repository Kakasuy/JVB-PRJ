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

    // Search for airports using Amadeus Airport API
    const airportSearchUrl = `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword)}&page%5Blimit%5D=10`
    
    const airportResponse = await fetch(airportSearchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!airportResponse.ok) {
      const errorText = await airportResponse.text()
      console.error('Airport search failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to search airports', details: errorText },
        { status: airportResponse.status }
      )
    }

    const airportData = await airportResponse.json()
    console.log('✅ Airport search successful:', airportData)

    return NextResponse.json(airportData)
  } catch (error) {
    console.error('Airport search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}