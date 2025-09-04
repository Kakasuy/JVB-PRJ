import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/BookingService'

export async function POST(request: NextRequest) {
  try {
    // The body should be a HotelBooking object already transformed
    const bookingData = await request.json()
    
    // Validate required fields
    if (!bookingData.id || !bookingData.userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required booking fields: id, userId',
        code: 'MISSING_FIELDS'
      }, { status: 400 })
    }
    
    // Save to Firestore using client SDK (runs with user auth context)
    await BookingService.saveBooking(bookingData)
    
    return NextResponse.json({
      success: true,
      data: {
        bookingId: bookingData.id,
        confirmationNumber: bookingData.confirmationNumber,
        message: 'Booking saved successfully'
      }
    })
    
  } catch (error) {
    console.error('❌ Save booking API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save booking',
      code: 'SAVE_BOOKING_ERROR'
    }, { status: 500 })
  }
}