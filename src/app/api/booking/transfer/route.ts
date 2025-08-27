import { NextRequest, NextResponse } from 'next/server'

// Mock booking storage utility
const saveBookingToStorage = (bookingData: any) => {
  // In a real app, this would save to database
  // For now, we'll just log and return success
  console.log('📝 Mock: Saving transfer booking to database:', bookingData)
  
  // Future: Save to database/localStorage
  // const existingBookings = getStoredBookings()
  // existingBookings.transfers.push(bookingData)
  // saveToStorage(existingBookings)
  
  return true
}

// Generate confirmation number
const generateConfirmationNumber = () => {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '') // 240827
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0') // 001-999
  return `TRF${date}${sequence}` // TRF240827001
}

// Generate booking ID
const generateBookingId = () => {
  return `BK${Math.random().toString(36).substr(2, 8).toUpperCase()}` // BKAB12CD34
}

// Mock Transfer Booking API
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('🚗 Mock Transfer Booking API called with data:', data)
    
    // Basic validation
    if (!data.offerId) {
      return NextResponse.json({
        success: false,
        error: 'Missing offer ID',
        code: 'MISSING_OFFER_ID'
      }, { status: 400 })
    }
    
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required passenger information',
        code: 'MISSING_FIELDS'
      }, { status: 400 })
    }
    
    if (data.paymentMethod === 'creditCard') {
      if (!data.cardNumber || !data.cardHolder || !data.expiryDate) {
        return NextResponse.json({
          success: false,
          error: 'Missing required credit card information',
          code: 'MISSING_CARD_FIELDS'
        }, { status: 400 })
      }
    }
    
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock booking confirmation data
    const confirmationNumber = generateConfirmationNumber()
    const bookingId = generateBookingId()
    const bookingDate = new Date().toISOString()
    
    // Create mock booking response (mimicking Amadeus Transfer Booking API)
    const mockBookingResponse = {
      type: "transfer-order",
      id: bookingId,
      reference: `REF${Date.now()}`,
      quoteId: `QTE${Date.now()}`,
      status: "CONFIRMED",
      bookingRequirements: {
        invoiceAddressRequired: false,
        creditCardRequired: true
      },
      methodsOfPayment: ["CREDIT_CARD"],
      transfers: [{
        confirmNbr: confirmationNumber, // Key field for management/cancellation
        start: {
          dateTime: data.pickupDateTime,
          locationCode: data.pickupLocation
        },
        end: {
          address: {
            line: data.dropoffLocation,
            cityName: data.dropoffLocation, 
            countryCode: "FR" // Mock country
          },
          dateTime: data.pickupDateTime // Same as start for now
        },
        duration: "PT1H30M", // Mock 1.5 hours
        vehicle: {
          code: "SDN",
          description: data.vehicleDescription || "Transfer Vehicle"
        }
      }],
      travelers: [{
        id: "1",
        title: data.title,
        firstName: data.firstName,
        lastName: data.lastName,
        contacts: {
          phoneNumber: data.phone,
          email: data.email
        }
      }],
      quotation: {
        monetaryAmount: data.totalPrice || "100.00",
        currencyCode: data.currency || "EUR"
      },
      bookingMetadata: {
        bookingDate,
        paymentMethod: data.paymentMethod,
        specialRequests: data.note || null
      }
    }
    
    // Save booking to mock storage
    const saved = saveBookingToStorage(mockBookingResponse)
    
    if (!saved) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save booking',
        code: 'BOOKING_SAVE_ERROR'
      }, { status: 500 })
    }
    
    console.log('✅ Mock Transfer booking created successfully:', {
      bookingId,
      confirmationNumber,
      passenger: `${data.title} ${data.firstName} ${data.lastName}`,
      route: `${data.pickupLocation} → ${data.dropoffLocation}`
    })
    
    // Return success response matching Amadeus format
    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        confirmationNumber,
        status: 'CONFIRMED',
        type: 'transfer',
        // Data for success page redirect
        transferDetails: {
          vehicleDescription: data.vehicleDescription || 'Transfer Vehicle',
          serviceProvider: data.serviceProvider || 'Transfer Service',
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,
          pickupDateTime: data.pickupDateTime,
          passengers: data.passengers || 1
        },
        passenger: {
          title: data.title,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone
        },
        payment: {
          totalPrice: data.totalPrice || "100.00",
          currency: data.currency || "EUR",
          paymentMethod: data.paymentMethod
        },
        booking: {
          date: bookingDate,
          reference: `REF${Date.now()}`
        }
      },
      message: 'Transfer booking confirmed successfully'
    })
    
  } catch (error) {
    console.error('❌ Mock Transfer Booking API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error during booking process',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET method for booking retrieval (future feature)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const confirmNbr = searchParams.get('confirmNbr')
  
  if (!confirmNbr) {
    return NextResponse.json({
      success: false,
      error: 'Missing confirmation number'
    }, { status: 400 })
  }
  
  // Mock booking retrieval
  return NextResponse.json({
    success: true,
    data: {
      message: 'Booking retrieval not implemented yet',
      confirmNbr
    }
  })
}