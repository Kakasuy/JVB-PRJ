'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface HotelState {
  checkInDate: string
  checkOutDate: string
  adults: number
  rooms: number
}

interface HotelStateContextType {
  appliedState: HotelState
  currentOffer: any | null
  updateAppliedState: (newState: HotelState) => void
  updateCurrentOffer: (offer: any | null) => void
}

const HotelStateContext = createContext<HotelStateContextType | undefined>(undefined)

interface HotelStateProviderProps {
  children: ReactNode
  initialState: {
    checkInDate?: string
    checkOutDate?: string
    adults?: string
    rooms?: string
  }
  initialOffer?: any
}

export const HotelStateProvider: React.FC<HotelStateProviderProps> = ({
  children,
  initialState,
  initialOffer
}) => {
  const [appliedState, setAppliedState] = useState<HotelState>({
    checkInDate: initialState.checkInDate || '',
    checkOutDate: initialState.checkOutDate || '',
    adults: parseInt(initialState.adults || '1'),
    rooms: parseInt(initialState.rooms || '1')
  })

  const [currentOffer, setCurrentOffer] = useState<any | null>(initialOffer || null)

  const updateAppliedState = useCallback((newState: HotelState) => {
    setAppliedState(newState)
  }, [])

  const updateCurrentOffer = useCallback((offer: any | null) => {
    setCurrentOffer(offer)
  }, [])

  return (
    <HotelStateContext.Provider value={{
      appliedState,
      currentOffer,
      updateAppliedState,
      updateCurrentOffer
    }}>
      {children}
    </HotelStateContext.Provider>
  )
}

export const useHotelState = () => {
  const context = useContext(HotelStateContext)
  if (context === undefined) {
    throw new Error('useHotelState must be used within a HotelStateProvider')
  }
  return context
}