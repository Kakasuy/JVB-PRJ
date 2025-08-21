import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Transfer search request received')
    
    const { 
      startLocationCode, 
      startAddressLine, 
      endLocationCode, 
      endAddressLine,
      endCityName,
      endCountryCode,
      endGeoCode,
      transferType, 
      startDateTime, 
      passengers,
      currencyCode = 'USD'
    } = body

    // Validate required fields
    if (!startLocationCode && !startAddressLine) {
      return NextResponse.json(
        { error: 'Start location code or address line is required' },
        { status: 400 }
      )
    }

    if (!endAddressLine) {
      return NextResponse.json(
        { error: 'End address line is required' },
        { status: 400 }
      )
    }

    if (!endCityName) {
      return NextResponse.json(
        { error: 'End city name is required' },
        { status: 400 }
      )
    }

    if (!endCountryCode) {
      return NextResponse.json(
        { error: 'End country code is required' },
        { status: 400 }
      )
    }

    if (!endGeoCode) {
      return NextResponse.json(
        { error: 'End geo code (latitude,longitude) is required' },
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

    // Prepare transfer search request body with all required fields
    const transferSearchBody: any = {
      transferType: transferType || 'PRIVATE',
      startDateTime,
      passengers: passengers || 2,
      currencyCode
    }

    // Add start location (priority: locationCode > addressLine)
    if (startLocationCode) {
      transferSearchBody.startLocationCode = startLocationCode
    } else if (startAddressLine) {
      transferSearchBody.startAddressLine = startAddressLine
    }

    // Add end location with required fields
    transferSearchBody.endAddressLine = endAddressLine
    transferSearchBody.endCityName = endCityName
    transferSearchBody.endCountryCode = endCountryCode
    transferSearchBody.endGeoCode = endGeoCode

    // Add end location code if provided
    if (endLocationCode) {
      transferSearchBody.endLocationCode = endLocationCode
    }

    console.log('🚗 Searching transfers from', startLocationCode || startAddressLine, 'to', endCityName)

    // Call Amadeus Transfer Search API
    const transferResponse = await fetch('https://test.api.amadeus.com/v1/shopping/transfer-offers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferSearchBody),
    })

    if (!transferResponse.ok) {
      const errorText = await transferResponse.text()
      console.error('Transfer search failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to search transfers', details: errorText },
        { status: transferResponse.status }
      )
    }

    const transferData = await transferResponse.json()
    console.log(`✅ Found ${transferData.data?.length || 0} transfer offers`)

    return NextResponse.json(transferData)
  } catch (error) {
    console.error('Transfer search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}