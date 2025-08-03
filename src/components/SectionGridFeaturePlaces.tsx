'use client'

import { TStayListing } from '@/data/listings'
import { useHotelSearch } from '@/hooks/useHotelSearch'
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
  'Tokyo': 'TYO',
  'Paris': 'PAR',
  'London': 'LON',
  'Barcelona': 'BCN'
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
  const { hotels, loading, error, searchHotels } = useHotelSearch()
  
  const tabs = ['New York', 'Tokyo', 'Paris', 'London', 'Barcelona']

  useEffect(() => {
    if (useAmadeusData && activeTab === 'New York') {
      searchHotels({ cityCode: cityCodeMap[activeTab] })
    }
  }, [useAmadeusData, activeTab, searchHotels])

  useEffect(() => {
    if (useAmadeusData && activeTab === 'New York' && hotels.length > 0) {
      setDisplayData(hotels.slice(0, 8)) // Limit to 8 hotels
    } else if (!useAmadeusData || activeTab !== 'New York') {
      // For other cities or when not using Amadeus, use original data
      setDisplayData(stayListings.slice(0, 8))
    }
  }, [hotels, activeTab, stayListings, useAmadeusData])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (useAmadeusData && tab === 'New York') {
      searchHotels({ cityCode: cityCodeMap[tab] })
    } else {
      // For other cities, use mock data
      setDisplayData(stayListings.slice(0, 8))
    }
  }

  let CardName = StayCard
  if (cardType === 'card1') {
    CardName = StayCard
  } else if (cardType === 'card2') {
    CardName = StayCard2
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
      {loading && activeTab === 'New York' && useAmadeusData && (
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && activeTab === 'New York' && useAmadeusData && (
        <div className="mt-8 text-center">
          <p className="text-red-500 mb-4">Failed to load hotels from Amadeus API</p>
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
        <ButtonPrimary href={'/stay-categories/all'}>
          {T['common']['Show me more']}
          <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
        </ButtonPrimary>
      </div>
    </div>
  )
}

export default SectionGridFeaturePlaces
