import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { HotelBooking, TransferBooking } from '@/services/BookingService'

interface UseUserBookingsResult {
  bookings: HotelBooking[]
  transferBookings: TransferBooking[]
  allBookings: (HotelBooking | TransferBooking)[]
  loading: boolean
  error: string | null
  refreshBookings: () => Promise<void>
  getBookingsByStatus: (status: HotelBooking['status']) => HotelBooking[]
  getTransfersByStatus: (status: TransferBooking['status']) => TransferBooking[]
}

export const useUserBookings = (): UseUserBookingsResult => {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState<HotelBooking[]>([])
  const [transferBookings, setTransferBookings] = useState<TransferBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!currentUser) {
      setBookings([])
      setTransferBookings([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch both hotel and transfer bookings
      const { BookingService } = await import('@/services/BookingService')
      const [hotelBookings, transferBookings] = await Promise.all([
        BookingService.getUserBookings(currentUser.uid),
        BookingService.getUserTransferBookings(currentUser.uid)
      ])
      
      setBookings(hotelBookings || [])
      setTransferBookings(transferBookings || [])
      
    } catch (err: any) {
      console.error('Error fetching user bookings:', err)
      setError(err.message || 'Failed to load bookings')
      setBookings([])
      setTransferBookings([])
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

  const getTransfersByStatus = (status: TransferBooking['status']): TransferBooking[] => {
    return transferBookings.filter(booking => booking.status === status)
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

  // Auto-categorize transfers based on pickup date
  const categorizeTransfers = (transfers: TransferBooking[]): TransferBooking[] => {
    const now = new Date()
    
    return transfers.map(transfer => {
      if (transfer.status === 'cancelled') return transfer
      
      const pickupDate = new Date(transfer.transfer.pickupDateTime)
      
      // Auto-update status based on pickup time
      if (pickupDate < now) {
        return { ...transfer, status: 'completed' as const }
      } else {
        return { ...transfer, status: 'upcoming' as const }
      }
    })
  }

  useEffect(() => {
    fetchBookings()
  }, [currentUser])

  // Auto-categorize bookings when they change
  const categorizedBookings = categorizeBoodings(bookings)
  const categorizedTransfers = categorizeTransfers(transferBookings)

  // Combine all bookings sorted by date
  const allBookings = [...categorizedBookings, ...categorizedTransfers].sort((a, b) => {
    const aDate = a.bookedAt?.seconds ? new Date(a.bookedAt.seconds * 1000) : new Date(0)
    const bDate = b.bookedAt?.seconds ? new Date(b.bookedAt.seconds * 1000) : new Date(0)
    return bDate.getTime() - aDate.getTime()
  })

  return {
    bookings: categorizedBookings,
    transferBookings: categorizedTransfers,
    allBookings,
    loading,
    error,
    refreshBookings,
    getBookingsByStatus: (status: HotelBooking['status']) => 
      categorizedBookings.filter(booking => booking.status === status),
    getTransfersByStatus: (status: TransferBooking['status']) => 
      categorizedTransfers.filter(transfer => transfer.status === status)
  }
}