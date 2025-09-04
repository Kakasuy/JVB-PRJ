import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { HotelBooking } from '@/services/BookingService'

interface UseUserBookingsResult {
  bookings: HotelBooking[]
  loading: boolean
  error: string | null
  refreshBookings: () => Promise<void>
  getBookingsByStatus: (status: HotelBooking['status']) => HotelBooking[]
}

export const useUserBookings = (): UseUserBookingsResult => {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState<HotelBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!currentUser) {
      setBookings([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch bookings directly from client SDK to avoid server auth issues
      const { BookingService } = await import('@/services/BookingService')
      const bookings = await BookingService.getUserBookings(currentUser.uid)
      setBookings(bookings || [])
      
    } catch (err: any) {
      console.error('Error fetching user bookings:', err)
      setError(err.message || 'Failed to load bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const refreshBookings = async () => {
    await fetchBookings()
  }

  const getBookingsByStatus = (status: HotelBooking['status']): HotelBooking[] => {
    return bookings.filter(booking => booking.status === status)
  }

  // Auto-categorize bookings based on dates
  const categorizeBoodings = (bookings: HotelBooking[]): HotelBooking[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return bookings.map(booking => {
      if (booking.status === 'cancelled') return booking
      
      const checkInDate = new Date(booking.checkInDate)
      const checkOutDate = new Date(booking.checkOutDate)
      checkInDate.setHours(0, 0, 0, 0)
      checkOutDate.setHours(0, 0, 0, 0)
      
      // Auto-update status based on dates
      if (checkOutDate < today) {
        return { ...booking, status: 'completed' as const }
      } else if (checkInDate >= today) {
        return { ...booking, status: 'upcoming' as const }
      } else {
        return { ...booking, status: 'confirmed' as const }
      }
    })
  }

  useEffect(() => {
    fetchBookings()
  }, [currentUser])

  // Auto-categorize bookings when they change
  const categorizedBookings = categorizeBoodings(bookings)

  return {
    bookings: categorizedBookings,
    loading,
    error,
    refreshBookings,
    getBookingsByStatus: (status: HotelBooking['status']) => 
      categorizedBookings.filter(booking => booking.status === status)
  }
}