import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

export interface HotelBooking {
  id: string                          // Amadeus booking ID
  userId: string                      // Firebase user UID
  offerId: string                     // Original offer ID
  confirmationNumber: string          // Hotel confirmation code
  
  // Hotel Information
  hotel: {
    hotelId: string                   // Amadeus hotel ID
    name: string
    address: string
    images: string[]
    geoCode?: {
      latitude: number
      longitude: number
    }
  }
  
  // Booking Details  
  checkInDate: string
  checkOutDate: string
  adults: number
  rooms: number
  nights: number
  
  // Guest Information
  guest: {
    title: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  
  // Pricing
  totalPrice: number
  currency: string
  pricePerNight?: number
  
  // Status & Meta
  status: 'confirmed' | 'upcoming' | 'completed' | 'cancelled'
  bookedAt: Timestamp
  updatedAt: Timestamp
  
  // Amadeus Raw Data (for detailed access)
  amadeusData: any
}

export interface TransferBooking {
  id: string                          // Amadeus transfer booking ID
  userId: string                      // Firebase user UID
  offerId: string                     // Original offer ID
  confirmationNumber: string          // Transfer confirmation code
  
  // Transfer Information
  transfer: {
    transferId: string                // Amadeus transfer ID
    transferType: string              // PRIVATE, SHARED, TAXI
    vehicleDescription: string
    vehicleCode: string
    serviceProvider: string
    pickupLocation: string
    dropoffLocation: string
    pickupDateTime: string
    passengers: number
    vehicleImage?: string
  }
  
  // Guest Information
  passenger: {
    title: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  
  // Pricing
  totalPrice: number
  currency: string
  
  // Status & Meta
  status: 'confirmed' | 'upcoming' | 'completed' | 'cancelled'
  bookedAt: Timestamp
  updatedAt: Timestamp
  
  // Transfer Raw Data (for detailed access)
  transferData: any
}

export class BookingService {
  private static COLLECTION = 'bookings'
  
  /**
   * Lưu booking sau khi thanh toán thành công
   */
  static async saveBooking(bookingData: Omit<HotelBooking, 'bookedAt' | 'updatedAt'>): Promise<void> {
    try {
      const bookingRef = doc(db, this.COLLECTION, bookingData.id)
      
      const bookingDoc: HotelBooking = {
        ...bookingData,
        bookedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }
      
      await setDoc(bookingRef, bookingDoc)
      console.log('✅ Booking saved successfully:', bookingData.id)
    } catch (error) {
      console.error('❌ Error saving booking:', error)
      throw error
    }
  }
  
  /**
   * Lấy tất cả bookings của user
   */
  static async getUserBookings(userId: string): Promise<HotelBooking[]> {
    try {
      const bookingsRef = collection(db, this.COLLECTION)
      // Remove orderBy to avoid index requirement
      const q = query(
        bookingsRef,
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const bookings: HotelBooking[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Only include bookings with valid hotel data structure
        if (data.hotel && data.checkInDate && data.checkOutDate && data.hotel.name) {
          bookings.push({ id: doc.id, ...data } as HotelBooking)
        }
      })
      
      // Sort by bookedAt on client side
      return bookings.sort((a, b) => {
        const aDate = a.bookedAt?.seconds ? new Date(a.bookedAt.seconds * 1000) : new Date(0)
        const bDate = b.bookedAt?.seconds ? new Date(b.bookedAt.seconds * 1000) : new Date(0)
        return bDate.getTime() - aDate.getTime() // Newest first
      })
    } catch (error) {
      console.error('❌ Error getting user bookings:', error)
      throw error
    }
  }
  
  /**
   * Lấy bookings theo status
   */
  static async getUserBookingsByStatus(userId: string, status: HotelBooking['status']): Promise<HotelBooking[]> {
    try {
      const bookingsRef = collection(db, this.COLLECTION)
      const q = query(
        bookingsRef,
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('bookedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const bookings: HotelBooking[] = []
      
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() } as HotelBooking)
      })
      
      return bookings
    } catch (error) {
      console.error('❌ Error getting bookings by status:', error)
      throw error
    }
  }
  
  /**
   * Lấy chi tiết 1 booking
   */
  static async getBookingById(bookingId: string): Promise<HotelBooking | null> {
    try {
      const bookingRef = doc(db, this.COLLECTION, bookingId)
      const bookingSnap = await getDoc(bookingRef)
      
      if (bookingSnap.exists()) {
        return { id: bookingSnap.id, ...bookingSnap.data() } as HotelBooking
      }
      
      return null
    } catch (error) {
      console.error('❌ Error getting booking by ID:', error)
      throw error
    }
  }
  
  /**
   * Cập nhật trạng thái booking
   */
  static async updateBookingStatus(bookingId: string, status: HotelBooking['status']): Promise<void> {
    try {
      const bookingRef = doc(db, this.COLLECTION, bookingId)
      
      await updateDoc(bookingRef, {
        status,
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Booking status updated:', bookingId, status)
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      throw error
    }
  }
  
  /**
   * Hủy booking
   */
  static async cancelBooking(bookingId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const booking = await this.getBookingById(bookingId)
      if (!booking || booking.userId !== userId) {
        throw new Error('Booking not found or access denied')
      }
      
      await this.updateBookingStatus(bookingId, 'cancelled')
      console.log('✅ Booking cancelled successfully:', bookingId)
    } catch (error) {
      console.error('❌ Error cancelling booking:', error)
      throw error
    }
  }
  
  /**
   * Auto update booking status dựa trên dates
   */
  static async updateExpiredBookings(userId: string): Promise<void> {
    try {
      const bookings = await this.getUserBookings(userId)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (const booking of bookings) {
        const checkOutDate = new Date(booking.checkOutDate)
        checkOutDate.setHours(0, 0, 0, 0)
        
        // Nếu đã checkout và status vẫn là confirmed/upcoming → completed
        if (checkOutDate < today && (booking.status === 'confirmed' || booking.status === 'upcoming')) {
          await this.updateBookingStatus(booking.id, 'completed')
        }
        // Nếu chưa checkin và status = confirmed → upcoming  
        else if (booking.status === 'confirmed') {
          const checkInDate = new Date(booking.checkInDate)
          checkInDate.setHours(0, 0, 0, 0)
          
          if (checkInDate >= today) {
            await this.updateBookingStatus(booking.id, 'upcoming')
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating expired bookings:', error)
    }
  }
  
  /**
   * Transform Amadeus response thành HotelBooking format
   */
  static transformAmadeusToBooking(
    amadeusResponse: any, 
    originalRequest: any, 
    userId: string
  ): Omit<HotelBooking, 'bookedAt' | 'updatedAt'> {
    const booking = amadeusResponse.data
    const hotelBooking = booking?.hotelBookings?.[0] || booking
    
    // Calculate nights
    const checkIn = new Date(originalRequest.checkInDate)
    const checkOut = new Date(originalRequest.checkOutDate)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      id: hotelBooking?.id || amadeusResponse.data?.id || `booking_${Date.now()}`,
      userId,
      offerId: originalRequest.offerId,
      confirmationNumber: hotelBooking?.providerConfirmationId || amadeusResponse.data?.associatedRecords?.[0]?.reference || 'N/A',
      
      hotel: {
        hotelId: originalRequest.hotelId,
        name: originalRequest.hotelName || 'Hotel',
        address: originalRequest.hotelAddress || 'Address not available',
        images: originalRequest.hotelImages || ['/placeholder-hotel.jpg']
      },
      
      checkInDate: originalRequest.checkInDate,
      checkOutDate: originalRequest.checkOutDate,
      adults: originalRequest.adults,
      rooms: originalRequest.rooms,
      nights,
      
      guest: {
        title: originalRequest.title,
        firstName: originalRequest.firstName,
        lastName: originalRequest.lastName,
        email: originalRequest.email,
        phone: originalRequest.phone
      },
      
      totalPrice: originalRequest.totalPrice || 0,
      currency: originalRequest.currency || 'USD',
      pricePerNight: originalRequest.totalPrice ? Math.round(originalRequest.totalPrice / nights) : 0,
      
      status: 'confirmed',
      amadeusData: amadeusResponse
    }
  }

  /**
   * Lưu transfer booking sau khi thanh toán thành công
   */
  static async saveTransferBooking(bookingData: Omit<TransferBooking, 'bookedAt' | 'updatedAt'>): Promise<void> {
    try {
      const bookingRef = doc(db, this.COLLECTION, bookingData.id)
      
      const bookingDoc: TransferBooking = {
        ...bookingData,
        bookedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }
      
      await setDoc(bookingRef, bookingDoc)
      console.log('✅ Transfer booking saved successfully:', bookingData.id)
    } catch (error) {
      console.error('❌ Error saving transfer booking:', error)
      throw error
    }
  }

  /**
   * Lấy tất cả bookings của user (hotels + transfers)
   */
  static async getAllUserBookings(userId: string): Promise<(HotelBooking | TransferBooking)[]> {
    try {
      const bookingsRef = collection(db, this.COLLECTION)
      const q = query(
        bookingsRef,
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const bookings: (HotelBooking | TransferBooking)[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Phân biệt hotel vs transfer booking dựa trên structure
        if (data.hotel) {
          bookings.push({ id: doc.id, ...data } as HotelBooking)
        } else if (data.transfer) {
          bookings.push({ id: doc.id, ...data } as TransferBooking)
        }
      })
      
      // Sort by bookedAt on client side
      return bookings.sort((a, b) => {
        const aDate = a.bookedAt?.seconds ? new Date(a.bookedAt.seconds * 1000) : new Date(0)
        const bDate = b.bookedAt?.seconds ? new Date(b.bookedAt.seconds * 1000) : new Date(0)
        return bDate.getTime() - aDate.getTime() // Newest first
      })
    } catch (error) {
      console.error('❌ Error getting all user bookings:', error)
      throw error
    }
  }

  /**
   * Lấy chỉ transfer bookings của user (tránh compound index requirement)
   */
  static async getUserTransferBookings(userId: string): Promise<TransferBooking[]> {
    try {
      const allBookings = await this.getAllUserBookings(userId)
      
      // Filter transfers on client side to avoid index requirement
      const transfers = allBookings.filter((booking): booking is TransferBooking => 
        'transfer' in booking
      )
      
      return transfers
    } catch (error) {
      console.error('❌ Error getting user transfer bookings:', error)
      throw error
    }
  }

  /**
   * Transform Transfer API response thành TransferBooking format
   */
  static transformTransferToBooking(
    transferResponse: any,
    originalRequest: any,
    userId: string
  ): Omit<TransferBooking, 'bookedAt' | 'updatedAt'> {
    const transferData = transferResponse.data
    
    return {
      id: transferData.bookingId || `transfer_${Date.now()}`,
      userId,
      offerId: originalRequest.offerId,
      confirmationNumber: transferData.confirmationNumber || 'N/A',
      
      transfer: {
        transferId: transferData.bookingId,
        transferType: originalRequest.transferType || 'PRIVATE',
        vehicleDescription: transferData.transferDetails?.vehicleDescription || originalRequest.vehicleDescription,
        vehicleCode: originalRequest.vehicleCode || 'SDN',
        serviceProvider: transferData.transferDetails?.serviceProvider || originalRequest.serviceProvider,
        pickupLocation: transferData.transferDetails?.pickupLocation || originalRequest.pickupLocation,
        dropoffLocation: transferData.transferDetails?.dropoffLocation || originalRequest.dropoffLocation,
        pickupDateTime: transferData.transferDetails?.pickupDateTime || originalRequest.pickupDateTime,
        passengers: parseInt(transferData.transferDetails?.passengers) || originalRequest.passengers || 1,
        vehicleImage: originalRequest.vehicleImage || 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
      },
      
      passenger: {
        title: transferData.passenger?.title || originalRequest.title,
        firstName: transferData.passenger?.firstName || originalRequest.firstName,
        lastName: transferData.passenger?.lastName || originalRequest.lastName,
        email: transferData.passenger?.email || originalRequest.email,
        phone: transferData.passenger?.phone || originalRequest.phone
      },
      
      totalPrice: parseFloat(transferData.payment?.totalPrice) || parseFloat(originalRequest.totalPrice) || 0,
      currency: transferData.payment?.currency || originalRequest.currency || 'EUR',
      
      status: 'confirmed',
      transferData: transferResponse
    }
  }

  /**
   * Auto update transfer booking status dựa trên pickup date
   */
  static async updateExpiredTransferBookings(userId: string): Promise<void> {
    try {
      const transfers = await this.getUserTransferBookings(userId)
      const now = new Date()
      
      for (const transfer of transfers) {
        const pickupDate = new Date(transfer.transfer.pickupDateTime)
        
        // Nếu đã qua pickup time và status vẫn là confirmed/upcoming → completed
        if (pickupDate < now && (transfer.status === 'confirmed' || transfer.status === 'upcoming')) {
          await this.updateTransferBookingStatus(transfer.id, 'completed')
        }
        // Nếu chưa đến pickup time và status = confirmed → upcoming
        else if (transfer.status === 'confirmed' && pickupDate > now) {
          await this.updateTransferBookingStatus(transfer.id, 'upcoming')
        }
      }
    } catch (error) {
      console.error('❌ Error updating expired transfer bookings:', error)
    }
  }

  /**
   * Cập nhật trạng thái transfer booking
   */
  static async updateTransferBookingStatus(bookingId: string, status: TransferBooking['status']): Promise<void> {
    try {
      const bookingRef = doc(db, this.COLLECTION, bookingId)
      
      await updateDoc(bookingRef, {
        status,
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Transfer booking status updated:', bookingId, status)
    } catch (error) {
      console.error('❌ Error updating transfer booking status:', error)
      throw error
    }
  }
}