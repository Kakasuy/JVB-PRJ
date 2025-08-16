import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cities = ['NYC', 'PAR', 'LON', 'TYO', 'BCN'] // Sample major cities
    const allRoomTypes = new Set<string>()
    
    // Get OAuth token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!,
      }),
    })
    
    const { access_token } = await tokenResponse.json()
    
    // Sample each city
    for (const cityCode of cities) {
      console.log(`Analyzing room types for ${cityCode}...`)
      
      // Get sample hotels
      const hotelListResponse = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=30&hotelSource=ALL`,
        { headers: { 'Authorization': `Bearer ${access_token}` }}
      )
      
      const hotelListData = await hotelListResponse.json()
      const sampleHotels = hotelListData.data?.slice(0, 10) || [] // Sample first 10
      
      if (sampleHotels.length > 0) {
        const hotelIds = sampleHotels.map((h: any) => h.hotelId).join(',')
        
        // Get offers for sample hotels
        const offersResponse = await fetch(
          `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds}&checkInDate=2025-08-20&checkOutDate=2025-08-22&adults=1&rooms=1&currency=USD`,
          { headers: { 'Authorization': `Bearer ${access_token}` }}
        )
        
        const offersData = await offersResponse.json()
        
        // Extract room types
        offersData.data?.forEach((hotel: any) => {
          hotel.offers?.forEach((offer: any) => {
            const roomCategory = offer.room?.typeEstimated?.category
            if (roomCategory) {
              allRoomTypes.add(roomCategory)
            }
          })
        })
      }
    }
    
    const sortedRoomTypes = Array.from(allRoomTypes).sort()
    
    return NextResponse.json({
      success: true,
      totalRoomTypes: sortedRoomTypes.length,
      roomTypes: sortedRoomTypes,
      analysis: {
        citiesAnalyzed: cities,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Room types analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}