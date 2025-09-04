import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/BookingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as 'confirmed' | 'upcoming' | 'completed' | 'cancelled' | null
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter',
        code: 'MISSING_USER_ID'
      }, { status: 400 })
    }
    
    // Get all user bookings using client SDK
    const bookings = await BookingService.getUserBookings(userId)
    
    return NextResponse.json({
      success: true,
      data: bookings,
      meta: {
        count: bookings.length,
        userId,
        status: status || 'all'
      }
    })
    
  } catch (error) {
    console.error('❌ Get user bookings API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user bookings',
      code: 'GET_BOOKINGS_ERROR'
    }, { status: 500 })
  }
}