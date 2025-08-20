import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      startLocationCode, 
      startAddressLine, 
      endLocationCode, 
      endAddressLine, 
      transferType, 
      startDateTime, 
      passengers 
    } = body

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

    // Prepare transfer search request body
    const transferSearchBody: any = {
      transferType,
      startDateTime,
      passengers
    }

    // Add start location (priority: locationCode > addressLine)
    if (startLocationCode) {
      transferSearchBody.startLocationCode = startLocationCode
    } else if (startAddressLine) {
      transferSearchBody.startAddressLine = startAddressLine
    }

    // Add end location (priority: locationCode > addressLine)  
    if (endLocationCode) {
      transferSearchBody.endLocationCode = endLocationCode
    } else if (endAddressLine) {
      transferSearchBody.endAddressLine = endAddressLine
    }

    console.log('🚗 Transfer search request:', transferSearchBody)

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
    console.log('✅ Transfer search successful:', transferData)

    return NextResponse.json(transferData)
  } catch (error) {
    console.error('Transfer search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}