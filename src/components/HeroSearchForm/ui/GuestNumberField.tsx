'use client'

import NcInputNumber from '@/components/NcInputNumber'
import T from '@/utils/getT'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { FC, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ClearDataButton } from './ClearDataButton'

const styles = {
  button: {
    base: 'relative z-10 shrink-0 w-full cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start',
    focused: 'rounded-full bg-transparent focus-visible:outline-hidden dark:bg-white/5 custom-shadow-1 ',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'py-3 px-7 xl:px-8',
  },
  mainText: {
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'absolute end-0 top-full z-50 mt-3 flex w-sm flex-col gap-y-6 rounded-3xl bg-white px-8 py-7 shadow-xl transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 dark:bg-neutral-800',
    default: '',
    small: '',
  },
}

interface Props {
  fieldStyle: 'default' | 'small'
  className?: string
  clearDataButtonClassName?: string
  category?: 'stays' | 'car' | 'flight' | 'experience' | 'real-estate'
}

export const GuestNumberField: FC<Props> = ({
  fieldStyle = 'default',
  className = 'flex-1',
  clearDataButtonClassName,
  category = 'stays',
}) => {
  const searchParams = useSearchParams()
  
  // Get initial guest count from URL parameters
  const getInitialGuestCount = useCallback(() => {
    const adultsParam = searchParams.get('adults')
    return adultsParam ? parseInt(adultsParam) : 1 // Default to 1 adult
  }, [searchParams])
  
  // Get initial room/radius count from URL parameters
  const getInitialRoomCount = useCallback(() => {
    if (category === 'experience') {
      const radiusParam = searchParams.get('radius')
      return radiusParam ? parseInt(radiusParam) : 1 // Default radius 1km
    } else {
      const roomsParam = searchParams.get('rooms')
      return roomsParam ? parseInt(roomsParam) : 1 // Default to 1 room
    }
  }, [searchParams, category])
  
  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(getInitialGuestCount())
  const [roomsInputValue, setRoomsInputValue] = useState(getInitialRoomCount())

  // Update guest count when URL parameters change
  useEffect(() => {
    const newGuestCount = getInitialGuestCount()
    const newRoomCount = getInitialRoomCount()
    setGuestAdultsInputValue(newGuestCount)
    setRoomsInputValue(newRoomCount)
  }, [getInitialGuestCount, getInitialRoomCount])

  const handleChangeData = (value: number) => {
    setGuestAdultsInputValue(value)
    // For stays: If guests are less than rooms, increase rooms to match
    if (category !== 'experience' && value < roomsInputValue) {
      setRoomsInputValue(value)
    }
  }
  
  const handleChangeRooms = (value: number) => {
    setRoomsInputValue(value)
    // For stays: If rooms exceed guests, increase guests to match (min 1 guest per room)
    if (category !== 'experience' && value > guestAdultsInputValue) {
      setGuestAdultsInputValue(value)
    }
  }

  const totalGuests = guestAdultsInputValue
  
  return (
    <Popover className={`group relative z-10 flex ${className}`}>
      {({ open: showPopover }) => (
        <>
          <PopoverButton
            className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
          >
            {fieldStyle === 'default' && (
              <UserPlusIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
            )}

            <div className="grow">
              <span className={clsx('block font-semibold', styles.mainText[fieldStyle])}>
                {category === 'experience' 
                  ? `${roomsInputValue}km, ${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}`
                  : `${roomsInputValue} Room${roomsInputValue !== 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}`
                }
              </span>
              <span className="mt-1 block text-sm leading-none font-light text-neutral-400">
                {category === 'experience'
                  ? `${roomsInputValue}km radius, ${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`
                  : `${roomsInputValue} room${roomsInputValue !== 1 ? 's' : ''}, ${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`
                }
              </span>
            </div>
          </PopoverButton>

          <ClearDataButton
            className={clsx(totalGuests <= 1 && roomsInputValue <= 1 && 'sr-only', clearDataButtonClassName)}
            onClick={() => {
              setGuestAdultsInputValue(1) // Reset to minimum 1 guest
              setRoomsInputValue(1) // Reset to minimum 1 room
            }}
          />

          <PopoverPanel unmount={false} transition className={clsx(styles.panel.base, styles.panel[fieldStyle])}>
            <NcInputNumber
              className="w-full"
              defaultValue={roomsInputValue}
              onChange={(value) => handleChangeRooms(value)}
              max={category === 'experience' ? 8 : 8} // Max 8km radius or 8 rooms
              min={1}
              label={category === 'experience' ? 'Search Radius' : 'Rooms'}
              description={category === 'experience' ? 'Kilometers from city center' : ''}
              inputName={category === 'experience' ? 'radius' : 'rooms'}
            />
            
            <NcInputNumber
              className="w-full"
              defaultValue={guestAdultsInputValue}
              onChange={(value) => handleChangeData(value)}
              max={category === 'experience' ? 20 : roomsInputValue * 4} // Max 20 guests for experience
              min={1}
              label="Guests"
              description={category === 'experience' ? 'Number of participants' : ''}
              inputName="adults"
            />
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}