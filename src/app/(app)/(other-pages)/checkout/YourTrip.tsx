'use client'

import ModalSelectDate from '@/components/ModalSelectDate'
import ModalSelectHotelGuests from './ModalSelectHotelGuests'
import { GuestsObject } from '@/type'
import converSelectedDateToString from '@/utils/converSelectedDateToString'
import T from '@/utils/getT'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface YourTripProps {
  defaultDates?: {
    startDate: string
    endDate: string
  }
  defaultGuests?: GuestsObject & {
    rooms?: number
  }
  onDateChange?: (dates: { startDate: string, endDate: string }) => void
  onGuestsChange?: (guests: { rooms: number, adults: number }) => void
}

const YourTrip = ({ defaultDates, defaultGuests, onDateChange, onGuestsChange }: YourTripProps = {}) => {
  const [startDate, setStartDate] = useState<Date | null>(() => {
    if (defaultDates?.startDate) {
      return new Date(defaultDates.startDate)
    }
    return new Date('2025/02/06')
  })
  
  const [endDate, setEndDate] = useState<Date | null>(() => {
    if (defaultDates?.endDate) {
      return new Date(defaultDates.endDate)
    }
    return new Date('2025/02/23')
  })
  
  const [guests, setGuests] = useState<GuestsObject>({
    guestAdults: defaultGuests?.guestAdults || 2,
    guestChildren: defaultGuests?.guestChildren || 0,
    guestInfants: defaultGuests?.guestInfants || 0,
  })
  
  // Track rooms separately 
  const [rooms, setRooms] = useState(defaultGuests?.rooms || 1)

  return (
    <div>
      <h3 className="text-2xl font-semibold">Your trip</h3>
      <div className="z-10 mt-6 flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-3xl border border-neutral-200 sm:flex-row sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse dark:divide-neutral-700 dark:border-neutral-700">
        <ModalSelectDate
          onChange={(dates) => {
            const [start, end] = dates
            setStartDate(start)
            setEndDate(end)
            
            // Notify parent component of date changes
            if (onDateChange && start && end) {
              onDateChange({
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
              })
            }
          }}
          triggerButton={({ openModal }) => (
            <button
              onClick={openModal}
              className="flex flex-1 justify-between gap-x-5 p-5 text-start hover:bg-neutral-50 focus-visible:outline-hidden dark:hover:bg-neutral-800"
              type="button"
            >
              <div className="flex flex-col">
                <span className="text-sm text-neutral-400">{T['HeroSearchForm']['Date range']}</span>
                <span className="mt-1.5 text-lg font-semibold">
                  {startDate ? converSelectedDateToString([startDate, endDate]) : 'Add dates'}
                </span>
              </div>
              <PencilSquareIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}
        />

        <ModalSelectHotelGuests
          defaultValue={{
            rooms: rooms,
            adults: guests.guestAdults
          }}
          onChangeGuests={(hotelGuests) => {
            setRooms(hotelGuests.rooms)
            setGuests(prev => ({
              ...prev,
              guestAdults: hotelGuests.adults
            }))
            
            // Notify parent component of guest changes
            if (onGuestsChange) {
              onGuestsChange({
                rooms: hotelGuests.rooms,
                adults: hotelGuests.adults
              })
            }
          }}
          triggerButton={({ openModal }) => (
            <button
              type="button"
              onClick={openModal}
              className="flex flex-1 justify-between gap-x-5 p-5 text-start hover:bg-neutral-50 focus-visible:outline-hidden dark:hover:bg-neutral-800"
            >
              <div className="flex flex-col">
                <span className="text-sm text-neutral-400">{T['HeroSearchForm']['Guests']}</span>
                <span className="mt-1.5 text-lg font-semibold">
                  <span className="line-clamp-1">
                    {`${rooms} Room${rooms !== 1 ? 's' : ''}, ${guests.guestAdults} Guest${guests.guestAdults !== 1 ? 's' : ''}`}
                  </span>
                </span>
              </div>
              <PencilSquareIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}
        />
      </div>

      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Click on the pencil icon to change your trip details.
      </p>

      <input type="hidden" name="guestAdults" value={guests.guestAdults} />
      <input type="hidden" name="guestChildren" value={guests.guestChildren} />
      <input type="hidden" name="guestInfants" value={guests.guestInfants} />
      <input type="hidden" name="rooms" value={rooms} />
      {/*  */}
      <input type="hidden" name="startDate" value={startDate ? startDate.toISOString() : ''} />
      <input type="hidden" name="endDate" value={endDate ? endDate.toISOString() : ''} />
    </div>
  )
}

export default YourTrip
