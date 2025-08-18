'use client'

import NcInputNumber from '@/components/NcInputNumber'
import { GuestsObject } from '@/type'
import T from '@/utils/getT'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import { FC, useState, useEffect } from 'react'

interface Props {
  className?: string
  defaultGuests?: {
    adults?: number
    children?: number
    infants?: number
    rooms?: number
  }
  onGuestsChange?: (guests: { adults?: number, rooms?: number }) => void
}

const GuestsInputPopover: FC<Props> = ({ className = 'flex-1', defaultGuests, onGuestsChange }) => {
  // Use default guests if provided, otherwise use fallback values
  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(defaultGuests?.adults || 2)
  const [guestChildrenInputValue, setGuestChildrenInputValue] = useState(defaultGuests?.children ?? 1)
  const [guestInfantsInputValue, setGuestInfantsInputValue] = useState(defaultGuests?.infants ?? 1)
  const [roomsInputValue, setRoomsInputValue] = useState(defaultGuests?.rooms || 1)
  
  // Update internal state when defaultGuests changes
  useEffect(() => {
    if (defaultGuests?.adults !== undefined) {
      setGuestAdultsInputValue(defaultGuests.adults)
    }
    if (defaultGuests?.children !== undefined) {
      setGuestChildrenInputValue(defaultGuests.children)
    }
    if (defaultGuests?.infants !== undefined) {
      setGuestInfantsInputValue(defaultGuests.infants)
    }
    if (defaultGuests?.rooms !== undefined) {
      setRoomsInputValue(defaultGuests.rooms)
    }
  }, [defaultGuests])

  const handleChangeData = (value: number, type: keyof GuestsObject | 'rooms') => {
    let newValue = {
      guestAdults: guestAdultsInputValue,
      guestChildren: guestChildrenInputValue,
      guestInfants: guestInfantsInputValue,
    }
    
    let callbackData: { adults?: number, rooms?: number } = {}
    
    if (type === 'guestAdults') {
      setGuestAdultsInputValue(value)
      newValue.guestAdults = value
      callbackData.adults = value
    }
    if (type === 'guestChildren') {
      setGuestChildrenInputValue(value)
      newValue.guestChildren = value
    }
    if (type === 'guestInfants') {
      setGuestInfantsInputValue(value)
      newValue.guestInfants = value
    }
    if (type === 'rooms') {
      setRoomsInputValue(value)
      callbackData.rooms = value
    }
    
    // Call callback if provided and we have relevant changes
    if (onGuestsChange && (callbackData.adults !== undefined || callbackData.rooms !== undefined)) {
      onGuestsChange(callbackData)
    }
  }

  const totalGuests = guestChildrenInputValue + guestAdultsInputValue + guestInfantsInputValue
  
  // Format display text like "1 Room, 1 Guest"
  const getDisplayText = () => {
    return `${roomsInputValue} Room${roomsInputValue !== 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}`
  }
  
  return (
    <Popover className={`relative flex ${className}`}>
      {({ open }) => (
        <>
          <div className={`flex flex-1 items-center rounded-b-3xl focus:outline-hidden ${open ? 'shadow-lg' : ''}`}>
            <PopoverButton className="relative z-10 flex flex-1 cursor-pointer items-center gap-x-3 p-3 text-start focus:outline-hidden">
              <div className="text-neutral-300 dark:text-neutral-400">
                <UserPlusIcon className="h-5 w-5 lg:h-7 lg:w-7" />
              </div>
              <div className="grow">
                <span className="block font-semibold xl:text-lg">
                  {getDisplayText()}
                </span>
                <span className="mt-1 block text-sm leading-none font-light text-neutral-400">
                  {roomsInputValue} room{roomsInputValue !== 1 ? 's' : ''}, {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                </span>
              </div>
            </PopoverButton>
          </div>

          <PopoverPanel
            transition
            unmount={false}
            className="absolute end-0 top-full z-10 mt-3 w-full rounded-3xl bg-white px-4 py-5 shadow-xl ring-1 ring-black/5 transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 sm:min-w-[340px] sm:px-8 sm:py-6 dark:bg-neutral-800"
          >
            <NcInputNumber
              className="w-full"
              defaultValue={roomsInputValue}
              onChange={(value) => handleChangeData(value, 'rooms')}
              inputName="rooms"
              max={5}
              min={1}
              label="Rooms"
              description=""
            />
            <NcInputNumber
              className="mt-6 w-full"
              defaultValue={guestAdultsInputValue}
              onChange={(value) => handleChangeData(value, 'guestAdults')}
              inputName="guestAdults"
              max={10}
              min={1}
              label={T['HeroSearchForm']['Adults']}
              description=""
            />
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}

export default GuestsInputPopover
