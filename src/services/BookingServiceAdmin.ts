import { adminDb } from '@/lib/firebase-admin'
import { HotelBooking } from './BookingService'

export class BookingServiceAdmin {
  static async saveBooking(booking: HotelBooking): Promise<void> {
    try {
      const docRef = adminDb.collection('bookings').doc(booking.id)
      await docRef.set({
        ...booking,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Booking saved to Firestore:', booking.id)
    } catch (error) {
      console.error('❌ Error saving booking to Firestore:', error)
      throw error
    }
  }

  static async getBookingById(bookingId: string): Promise<HotelBooking | null> {
    try {
      const docRef = adminDb.collection('bookings').doc(bookingId)
      const doc = await docRef.get()
      
      if (!doc.exists) {
        return null
      }
      
      return doc.data() as HotelBooking
    } catch (error) {
      console.error('❌ Error getting booking from Firestore:', error)
      throw error
    }
  }

  static async getUserBookings(userId: string): Promise<HotelBooking[]> {
    try {
      const bookingsRef = adminDb.collection('bookings')
      const q = bookingsRef.where('userId', '==', userId).orderBy('createdAt', 'desc')
      const querySnapshot = await q.get()
      
      const bookings: HotelBooking[] = []
      querySnapshot.forEach((doc) => {
        bookings.push(doc.data() as HotelBooking)
      })
      
      return bookings
    } catch (error) {
      console.error('❌ Error getting user bookings from Firestore:', error)
      throw error
    }
  }

  static async updateBookingStatus(bookingId: string, status: HotelBooking['status']): Promise<void> {
    try {
      const docRef = adminDb.collection('bookings').doc(bookingId)
      await docRef.update({
        status,
        updatedAt: new Date()
      })
      console.log('✅ Booking status updated:', bookingId, status)
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      throw error
    }
  }
}