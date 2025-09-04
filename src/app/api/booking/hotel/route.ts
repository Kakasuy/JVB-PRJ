import { NextRequest, NextResponse } from 'next/server'

interface BookingRequest {
  offerId: string
  hotelId: string
  paymentMethod: string
  
  // Guest Information
  title: string
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Payment Information (Credit Card)
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  cardVendor?: string
  
  // Booking Details
  checkInDate: string
  checkOutDate: string
  adults: number
  rooms: number
}

async function getAmadeusToken() {
  const tokenUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token'
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMADEUS_CLIENT_ID!,
    client_secret: process.env.AMADEUS_CLIENT_SECRET!,
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

function transformToAmadeusFormat(bookingData: BookingRequest) {
  // Parse expiry date - Amadeus expects MMYY format
  let expiryFormatted = ''
  if (bookingData.expiryDate) {
    const [year, month] = bookingData.expiryDate.split('-')
    if (year && month) {
      // Ensure MM format (pad with 0 if needed)
      const monthPadded = month.padStart(2, '0')
      expiryFormatted = `${monthPadded}${year.slice(2)}`
    }
  }
  
  // Validate required payment fields
  if (!bookingData.cardNumber || !bookingData.cardHolder || !expiryFormatted || !bookingData.cardVendor) {
    throw new Error('Missing required payment card information')
  }

  // Correct structure: hotelOfferId should be inside roomAssociations
  const payload = {
    data: {
      type: "hotel-order",
      guests: [
        {
          tid: 1,
          title: bookingData.title,
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          phone: bookingData.phone,
          email: bookingData.email
        }
      ],
      travelAgent: {
        contact: {
          email: bookingData.email
        }
      },
      roomAssociations: Array.from({ length: bookingData.rooms }, (_, i) => ({
        guestReferences: [
          {
            guestReference: "1"
          }
        ],
        hotelOfferId: bookingData.offerId,
        hotelReward: {}
      })),
      payment: {
        method: "CREDIT_CARD",
        paymentCard: {
          paymentCardInfo: {
            vendorCode: bookingData.cardVendor?.toUpperCase(),
            cardNumber: bookingData.cardNumber?.replace(/\s/g, ''),
            expiryDate: expiryFormatted,
            holderName: bookingData.cardHolder?.toUpperCase()
          }
        }
      }
    }
  }

  return payload
}

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingRequest = await request.json()
    
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Missing authentication token',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    
    const idToken = authHeader.split('Bearer ')[1]
    
    // Import Firebase Admin from lib
    const { adminAuth } = await import('@/lib/firebase-admin')
    
    // Verify the ID token
    let userId: string
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      userId = decodedToken.uid
    } catch (tokenError) {
      console.error('Invalid Firebase token:', tokenError)
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      }, { status: 401 })
    }
    

    // Validate required fields
    const requiredFields = ['offerId', 'hotelId', 'firstName', 'lastName', 'email', 'phone']
    const missingFields = requiredFields.filter(field => !bookingData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_FIELDS'
      }, { status: 400 })
    }

    // Validate payment method specific fields
    if (bookingData.paymentMethod === 'creditCard') {
      const requiredCardFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cardVendor']
      const missingCardFields = requiredCardFields.filter(field => !bookingData[field])
      
      if (missingCardFields.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Missing credit card fields: ${missingCardFields.join(', ')}`,
          code: 'MISSING_CARD_FIELDS'
        }, { status: 400 })
      }
    }

    // Get Amadeus access token
    const accessToken = await getAmadeusToken()
    
    // Transform booking data to Amadeus format
    const amadeusPayload = transformToAmadeusFormat(bookingData)
    
    console.log('🔄 Transformed Amadeus Payload:', JSON.stringify(amadeusPayload, null, 2))
    console.log('💳 Payment Debug:', {
      vendorCode: bookingData.cardVendor,
      cardNumber: bookingData.cardNumber?.substring(0, 4) + '****',
      expiryDate: bookingData.expiryDate,
      holderName: bookingData.cardHolder
    })

    // Validate offer before booking - check if offer is still available
    const offerUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers/${bookingData.offerId}`
    const offerResponse = await fetch(offerUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!offerResponse.ok) {
      console.error('❌ Offer validation failed:', offerResponse.status)
      return NextResponse.json({
        success: false,
        error: 'Hotel offer is no longer available. Please search for new offers.',
        code: 'OFFER_EXPIRED'
      }, { status: 400 })
    }

    // Make booking request to Amadeus
    const bookingUrl = 'https://test.api.amadeus.com/v2/booking/hotel-orders'
    
    const response = await fetch(bookingUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(amadeusPayload),
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('❌ Amadeus booking failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      })
      console.error('🔥 Full Amadeus Response:', JSON.stringify(responseData, null, 2))
      console.error('🔥 Request URL:', bookingUrl)
      console.error('🔥 Request Headers:', {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      })
      
      // Handle specific Amadeus errors
      if (response.status === 400) {
        return NextResponse.json({
          success: false,
          error: responseData.errors?.[0]?.detail || 'Invalid booking data',
          code: 'BOOKING_INVALID',
          details: responseData.errors
        }, { status: 400 })
      }
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        }, { status: 401 })
      }
      
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Offer no longer available',
          code: 'OFFER_UNAVAILABLE'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Booking failed. Please try again.',
        code: 'BOOKING_FAILED'
      }, { status: 500 })
    }

    console.log('✅ Amadeus booking successful:', responseData.data?.hotelBookings?.[0]?.bookingStatus || 'confirmed')

    // Handle Amadeus API v2 response format
    const hotelBooking = responseData.data?.hotelBookings?.[0] || responseData.data
    
    // Note: Booking will be saved to database on frontend after successful response
    // This avoids server-side Firebase Admin SDK credential issues
    console.log('ℹ️ Booking successful - frontend will handle database save')
    
    // Return successful booking response
    return NextResponse.json({
      success: true,
      data: {
        bookingId: hotelBooking?.id || responseData.data?.id,
        confirmationNumber: hotelBooking?.providerConfirmationId || responseData.data?.associatedRecords?.[0]?.reference,
        status: hotelBooking?.bookingStatus || responseData.data?.bookingStatus || 'confirmed',
        hotel: {
          id: bookingData.hotelId,
          checkIn: bookingData.checkInDate,
          checkOut: bookingData.checkOutDate,
          rooms: bookingData.rooms,
          guests: bookingData.adults
        },
        guest: {
          title: bookingData.title,
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone
        },
        payment: {
          method: bookingData.paymentMethod,
          status: 'confirmed'
        },
        createdAt: new Date().toISOString()
      },
      message: 'Booking confirmed successfully'
    })

  } catch (error) {
    console.error('❌ Booking API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'SERVER_ERROR'
    }, { status: 500 })
  }
}