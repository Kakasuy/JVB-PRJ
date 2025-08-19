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
  cvv?: string
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
  // Parse expiry date (YYYY-MM format to MM/YY)
  const [year, month] = bookingData.expiryDate?.split('-') || ['', '']
  const expiryFormatted = year && month ? `${month}/${year.slice(2)}` : ''

  return {
    data: {
      type: "hotel-order",
      offerId: bookingData.offerId,
      guests: [
        {
          id: 1,
          name: {
            title: bookingData.title,
            firstName: bookingData.firstName,
            lastName: bookingData.lastName
          },
          contact: {
            phone: bookingData.phone,
            email: bookingData.email
          }
        }
      ],
      payments: [
        {
          id: 1,
          method: bookingData.paymentMethod === 'creditCard' ? 'creditCard' : 'paypal',
          card: bookingData.paymentMethod === 'creditCard' ? {
            cardNumber: bookingData.cardNumber?.replace(/\s/g, ''),
            expiryDate: expiryFormatted,
            cardHolder: {
              name: bookingData.cardHolder
            },
            vendorCode: bookingData.cardVendor
          } : undefined
        }
      ],
      rooms: Array.from({ length: bookingData.rooms }, (_, i) => ({
        guestIds: [1], // Primary booker for all rooms
        paymentId: 1,
        specialRequest: null
      }))
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingRequest = await request.json()
    
    console.log('🏨 Hotel booking request received:', {
      offerId: bookingData.offerId,
      hotelId: bookingData.hotelId,
      guest: `${bookingData.title} ${bookingData.firstName} ${bookingData.lastName}`,
      email: bookingData.email,
      phone: bookingData.phone,
      checkIn: bookingData.checkInDate,
      checkOut: bookingData.checkOutDate,
      rooms: bookingData.rooms,
      adults: bookingData.adults,
      paymentMethod: bookingData.paymentMethod
    })

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
      const requiredCardFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv']
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
    
    console.log('🔄 Sending booking to Amadeus:', JSON.stringify(amadeusPayload, null, 2))

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

    console.log('✅ Amadeus booking successful:', responseData.data)

    // Return successful booking response
    return NextResponse.json({
      success: true,
      data: {
        bookingId: responseData.data.id,
        confirmationNumber: responseData.data.associatedRecords?.[0]?.reference,
        status: responseData.data.bookingStatus,
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