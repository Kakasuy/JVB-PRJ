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
}

export const GuestNumberField: FC<Props> = ({
  fieldStyle = 'default',
  className = 'flex-1',
  clearDataButtonClassName,
}) => {
  const searchParams = useSearchParams()
  
  // Get initial guest count from URL parameters
  const getInitialGuestCount = useCallback(() => {
    const adultsParam = searchParams.get('adults')
    return adultsParam ? parseInt(adultsParam) : 1 // Default to 1 adult
  }, [searchParams])
  
  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(getInitialGuestCount())

  // Update guest count when URL parameters change
  useEffect(() => {
    const newGuestCount = getInitialGuestCount()
    setGuestAdultsInputValue(newGuestCount)
  }, [getInitialGuestCount])

  const handleChangeData = (value: number) => {
    setGuestAdultsInputValue(value)
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
                {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}
              </span>
              <span className="mt-1 block text-sm leading-none font-light text-neutral-400">
                {totalGuests ? `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}` : 'Add guests'}
              </span>
            </div>
          </PopoverButton>

          <ClearDataButton
            className={clsx(totalGuests <= 1 && 'sr-only', clearDataButtonClassName)}
            onClick={() => {
              setGuestAdultsInputValue(1) // Reset to minimum 1 guest
            }}
          />

          <PopoverPanel unmount={false} transition className={clsx(styles.panel.base, styles.panel[fieldStyle])}>
            <NcInputNumber
              className="w-full"
              defaultValue={guestAdultsInputValue}
              onChange={(value) => handleChangeData(value)}
              max={10}
              min={1} // Minimum 1 guest required
              label="Guests"
              description="" // Remove age description
              inputName="adults" // Changed from 'guestAdults' to 'adults' to match API
            />
            
            {/* Removed Children and Infants sections */}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}