'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface LocationData {
  displayName: string
  cityCode?: string
  iataCode?: string
}

interface LocationContextType {
  selectedLocation: LocationData | null
  setSelectedLocation: (location: LocationData | null) => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider')
  }
  return context
}