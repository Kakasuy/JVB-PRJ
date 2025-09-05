// Types for Amadeus API responses

export interface AmadeusActivityDetail {
  id: string
  name: string
  shortDescription?: string
  description?: string
  geoCode?: {
    latitude: number
    longitude: number
  }
  pictures?: string[]
  bookingLink?: string
  price?: {
    amount: string
    currencyCode: string
  }
  minimumDuration?: string
}

export interface AmadeusApiResponse<T> {
  success: boolean
  data: T | null
  meta?: {
    activityId?: string
    api?: string
    timestamp?: string
  }
  error?: string
  details?: string
}

export interface AmadeusActivity {
  id: string
  name: string
  shortDescription?: string
  geoCode?: {
    latitude: number
    longitude: number
  }
  pictures?: string[]
  price?: {
    amount: string
    currencyCode: string
  }
  minimumDuration?: string
}