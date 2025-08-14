import { NextRequest, NextResponse } from 'next/server'

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET
const AMADEUS_API_URL = process.env.AMADEUS_API_URL || 'https://test.api.amadeus.com'

let accessToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  try {
    const tokenResponse = await fetch(`${AMADEUS_API_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID!,
        client_secret: AMADEUS_CLIENT_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    accessToken = tokenData.access_token
    tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000
    return accessToken
  } catch (error) {
    console.error('Failed to get access token:', error)
    throw error
  }
}

// Known hotel IDs that have sentiment data in Amadeus test environment
// Based on https://github.com/amadeus4dev/data-collection
const HOTELS_WITH_SENTIMENT_DATA = new Set([
  'ADNYCCTB', 'ADNYCMDO', 'HINYC234', 'ACNYC080', 'MCNYCMIM',
  'TENEWYORK', 'BWNYC133', 'XVNYC057', 'CPNYC235', 'ELNYC496',
  'BGLONBGB', 'MCLONUK', 'SBLONHTL', 'PYLONFAR',
  'ALPARISRU', 'KTPAR006', 'ZEPAR003', 'OIPARB29',
  'ELMADRID', 'SEMAD565', 'RLMAD437',
  'HKTOKYGR', 'AATYO531', 
  'FFMUNICH', 'BSBERLIN'
])

export async function POST(request: NextRequest) {
  try {
    const { hotelIds } = await request.json()
    
    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return NextResponse.json({ error: 'hotelIds array is required' }, { status: 400 })
    }

    const token = await getAccessToken()
    const results = []
    
    // Separate hotels into two groups
    const hotelsWithData = hotelIds.filter(id => HOTELS_WITH_SENTIMENT_DATA.has(id))
    const hotelsWithoutData = hotelIds.filter(id => !HOTELS_WITH_SENTIMENT_DATA.has(id))
    
    console.log(`Processing ${hotelIds.length} hotels:`)
    console.log(`- ${hotelsWithData.length} hotels might have real sentiment data`)
    console.log(`- ${hotelsWithoutData.length} hotels will use mock data`)
    
    // Process hotels with potential real data
    if (hotelsWithData.length > 0) {
      console.log(`Fetching real sentiments for: ${hotelsWithData.join(', ')}`)
      
      for (const hotelId of hotelsWithData) {
        try {
          const url = `${AMADEUS_API_URL}/v2/e-reputation/hotel-sentiments?hotelIds=${hotelId}`
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.amadeus+json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            const sentiment = data.data?.[0]
            
            if (sentiment) {
              results.push({
                hotelId: sentiment.hotelId,
                overallRating: sentiment.overallRating || 0,
                numberOfRatings: sentiment.numberOfRatings || 0,
                numberOfReviews: sentiment.numberOfReviews || 0,
                _isReal: true
              })
              console.log(`✅ Got real sentiment for ${hotelId}: rating=${sentiment.overallRating}, reviews=${sentiment.numberOfRatings}`)
            } else {
              // Even known hotels might not have data, use mock
              const hash = hotelId.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)
              results.push({ 
                hotelId, 
                overallRating: 70 + (hash % 25), // Range 70-94 for known hotels
                numberOfRatings: 100 + (hash % 400), // Range 100-500
                numberOfReviews: Math.floor((100 + (hash % 400)) * 0.8),
                _isMock: true
              })
              console.log(`⚠️ No sentiment data for known hotel ${hotelId}, using mock`)
            }
          } else {
            // API error, use mock data
            const hash = hotelId.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)
            results.push({ 
              hotelId, 
              overallRating: 70 + (hash % 25),
              numberOfRatings: 100 + (hash % 400),
              numberOfReviews: Math.floor((100 + (hash % 400)) * 0.8),
              _isMock: true
            })
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200))
          
        } catch (error) {
          console.error(`Error fetching sentiment for ${hotelId}:`, error)
          // Use mock data on error
          const hash = hotelId.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)
          results.push({ 
            hotelId, 
            overallRating: 70 + (hash % 25),
            numberOfRatings: 100 + (hash % 400),
            numberOfReviews: Math.floor((100 + (hash % 400)) * 0.8),
            _isMock: true
          })
        }
      }
    }
    
    // Process hotels without data (use mock directly)
    for (const hotelId of hotelsWithoutData) {
      const hash = hotelId.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)
      const mockRating = 65 + (hash % 30) // Range 65-94
      const mockCount = 50 + (hash % 450) // Range 50-500
      
      results.push({ 
        hotelId, 
        overallRating: mockRating,
        numberOfRatings: mockCount,
        numberOfReviews: Math.floor(mockCount * 0.8),
        _isMock: true
      })
    }
    
    // Convert to map for easy lookup
    const sentimentsMap = results.reduce((acc, result) => {
      acc[result.hotelId] = result
      return acc
    }, {} as Record<string, any>)
    
    const realCount = results.filter(r => r._isReal).length
    const mockCount = results.filter(r => r._isMock).length
    
    console.log(`✅ Completed: ${realCount} real ratings, ${mockCount} mock ratings`)

    return NextResponse.json({ 
      sentiments: sentimentsMap,
      meta: {
        total: results.length,
        real: realCount,
        mock: mockCount
      }
    })
    
  } catch (error) {
    console.error('Hotel sentiments API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hotel sentiments' },
      { status: 500 }
    )
  }
}