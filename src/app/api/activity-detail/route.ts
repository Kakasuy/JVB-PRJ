import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')
    
    if (!activityId) {
      return NextResponse.json({ 
        error: 'ActivityId is required' 
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

    // Call Amadeus Activity Detail API
    const activityDetailUrl = `https://test.api.amadeus.com/v1/shopping/activities/${activityId}`
    
    const activityResponse = await fetch(activityDetailUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!activityResponse.ok) {
      const errorText = await activityResponse.text()
      return NextResponse.json({ 
        error: 'Activity detail fetch failed',
        details: errorText 
      }, { status: 500 })
    }

    const activityData = await activityResponse.json()

    return NextResponse.json({
      success: true,
      data: activityData.data || null,
      meta: {
        activityId,
        api: 'amadeus-activity-detail',
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('Activity detail error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}