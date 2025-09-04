import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/BookingService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params
    
    const booking = await BookingService.getBookingById(bookingId)
    
    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: booking
    })
    
  } catch (error) {
    console.error('❌ Get booking details API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get booking details',
      code: 'GET_BOOKING_ERROR'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params
    const { status, userId } = await request.json()
    
    // Validate status
    const validStatuses = ['confirmed', 'upcoming', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 })
    }
    
    // Verify booking exists and user owns it
    const booking = await BookingService.getBookingById(bookingId)
    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      }, { status: 404 })
    }
    
    if (booking.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      }, { status: 403 })
    }
    
    // Update status
    await BookingService.updateBookingStatus(bookingId, status)
    
    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${status}`
    })
    
  } catch (error) {
    console.error('❌ Update booking status API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking status',
      code: 'UPDATE_BOOKING_ERROR'
    }, { status: 500 })
  }
}