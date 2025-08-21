'use client'

import { TStayListing } from '@/data/listings'
import { useHotelList } from '@/hooks/useHotelList'
import ButtonPrimary from '@/shared/ButtonPrimary'
import T from '@/utils/getT'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { FC, ReactNode, useEffect, useState } from 'react'
import SectionTabHeader from './SectionTabHeader'
import StayCard from './StayCard'
import StayCard2 from './StayCard2'

//
interface SectionGridFeaturePlacesProps {
  stayListings: TStayListing[]
  gridClass?: string
  heading?: ReactNode
  subHeading?: string
  headingIsCenter?: boolean
  cardType?: 'card1' | 'card2'
  useAmadeusData?: boolean
}

// City code mapping (moved outside component to avoid useEffect dependency)
const cityCodeMap: Record<string, string> = {
  'New York': 'NYC',
  'Amsterdam': 'AMS',
  'Paris': 'PAR',
  'London': 'LON',
  'Bangkok': 'BKK',
  'Barcelona': 'BCN',
  'Rome': 'ROM'
}

const SectionGridFeaturePlaces: FC<SectionGridFeaturePlacesProps> = ({
  stayListings = [],
  gridClass = '',
  heading = 'Featured places to stay.',
  subHeading = 'Keep calm & travel on',
  cardType = 'card2',
  useAmadeusData = false,
}) => {
  const [activeTab, setActiveTab] = useState('New York')
  const [displayData, setDisplayData] = useState<TStayListing[]>(stayListings)
  const [displayCount, setDisplayCount] = useState(8) // Track how many hotels to display
  const [showMoreClicks, setShowMoreClicks] = useState(0) // Track number of "Show me more" clicks
  const { hotels, loading, error, fetchHotelsByCity } = useHotelList()
  
  const tabs = ['New York', 'Amsterdam', 'Paris', 'London', 'Bangkok', 'Barcelona', 'Rome']

  

  // No cache clearing - use existing cache from localStorage indefinitely
  // Cache will only be cleared when dev server restarts (localStorage persists across F5)
  
  // Handle tab changes and fetch data (with caching after first clear)
  useEffect(() => {
    const cityCode = cityCodeMap[activeTab]
    
    // Always reset display state when changing tabs
    setDisplayCount(8)
    setShowMoreClicks(0)

    if (useAmadeusData && cityCode) {
      fetchHotelsByCity(cityCode, 16) // Will use cache if available after first clear
    }
  }, [useAmadeusData, activeTab, fetchHotelsByCity])

  useEffect(() => {
    if (useAmadeusData && cityCodeMap[activeTab] && hotels.length > 0) {
      setDisplayData(hotels.slice(0, displayCount))
    } else if (!useAmadeusData || !cityCodeMap[activeTab]) {
      // For cities without Amadeus support or when not using Amadeus, use original data
      setDisplayData(stayListings.slice(0, displayCount))
    }
  }, [hotels, activeTab, stayListings, useAmadeusData, displayCount])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Note: displayCount and showMoreClicks will be set by the useEffect above based on localStorage
  }

  const handleShowMore = () => {
    const newClickCount = showMoreClicks + 1
    setShowMoreClicks(newClickCount)
    
    if (newClickCount >= 3) {
      // Third click - redirect to Stay Categories
      window.location.href = '/stay-categories/all'
      return
    }
    
    // First and second click - show 4 more hotels
    const newDisplayCount = displayCount + 4
    setDisplayCount(newDisplayCount)
  }

  let CardName = StayCard
  if (cardType === 'card1') {
    CardName = StayCard
  } else if (cardType === 'card2') {
    CardName = StayCard2
  }

  // Determine button text based on click count
  const getButtonText = () => {
    if (showMoreClicks === 0) return T['common']['Show me more']
    if (showMoreClicks === 1) return T['common']['Show me more']
    return 'View all stays' // Third click will redirect
  }

  return (
    <div className="relative">
      <SectionTabHeader 
        tabActive={activeTab} 
        subHeading={subHeading} 
        tabs={tabs} 
        heading={heading}
        onTabChange={handleTabChange}
      />
      
      {/* Loading state */}
      {loading && cityCodeMap[activeTab] && useAmadeusData && (
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && cityCodeMap[activeTab] && useAmadeusData && (
        <div className="mt-8 text-center">
          <p className="text-red-500 mb-4">Failed to load hotels from Amadeus API for {activeTab}</p>
          <p className="text-sm text-gray-500">Showing sample data instead</p>
        </div>
      )}
      
      {/* Hotels grid */}
      {!loading && (
        <div
          className={`mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3 xl:grid-cols-4 ${gridClass}`}
        >
          {displayData.map((stay) => (
            <CardName key={stay.id} data={stay} />
          ))}
        </div>
      )}
      
      {/* Show message when no data */}
      {!loading && displayData.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">No hotels found for {activeTab}</p>
        </div>
      )}
      
      <div className="mt-16 flex items-center justify-center">
        <ButtonPrimary onClick={handleShowMore}>
          {getButtonText()}
          <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
        </ButtonPrimary>
      </div>
    </div>
  )
}

export default SectionGridFeaturePlaces
