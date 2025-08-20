'use client'

import T from '@/utils/getT'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { ButtonSubmit, LocationInputField, VerticalDividerLine } from './ui'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
}

const TRANSFER_TYPES = [
  { value: 'PRIVATE', label: 'Private Transfer', description: 'Dedicated vehicle for you' },
  { value: 'SHARED', label: 'Shared Transfer', description: 'Share with other passengers' },
  { value: 'TAXI', label: 'Taxi', description: 'Standard taxi service' }
]

export const TransferSearchForm: FC<Props> = ({ className, formStyle = 'default' }) => {
  const [transferType, setTransferType] = useState<'PRIVATE' | 'SHARED' | 'TAXI'>('PRIVATE')
  const [passengers, setPassengers] = useState(2)
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')

  const router = useRouter()

  // Prefetch the car categories page to improve performance
  useEffect(() => {
    router.prefetch('/car-categories/all')
  }, [router])

  // Set default date and time
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultDate = tomorrow.toISOString().split('T')[0]
    setPickupDate(defaultDate)
    setPickupTime('10:00')
  }, [])

  const handleFormSubmit = (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())
    console.log('🚗 Transfer search form submitted:', formDataEntries)

    // Validate required fields
    const startLocation = formDataEntries['start-location'] as string
    const endLocation = formDataEntries['end-location'] as string
    const pickupDateTime = `${formDataEntries['pickup-date']}T${formDataEntries['pickup-time']}:00`

    if (!startLocation || !endLocation || !pickupDate || !pickupTime) {
      alert('Please fill in all required fields')
      return
    }

    // Prepare search parameters
    const searchParams = new URLSearchParams({
      from: startLocation,
      to: endLocation,
      datetime: pickupDateTime,
      type: transferType,
      passengers: passengers.toString()
    })

    // Navigate to transfer results page
    const searchUrl = `/car-categories/all?${searchParams.toString()}`
    console.log('🔄 Navigating to:', searchUrl)
    router.push(searchUrl)
  }

  return (
    <Form
      className={clsx(
        'relative z-10 w-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'rounded-t-2xl rounded-b-4xl custom-shadow-1',
        formStyle === 'default' &&
          'rounded-t-2xl rounded-b-[40px] shadow-xl xl:rounded-t-3xl xl:rounded-b-[48px] dark:shadow-2xl'
      )}
      action={handleFormSubmit}
    >
      {/* TRANSFER TYPE SELECTION */}
      <Headless.RadioGroup
        value={transferType}
        onChange={setTransferType}
        aria-label="Transfer Type"
        name="transfer_type"
        className={clsx(
          'flex flex-wrap items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700',
          formStyle === 'small' && 'px-4 py-3 sm:px-7 sm:py-4 xl:px-8',
          formStyle === 'default' && 'px-4 py-3 sm:px-7 sm:py-4 xl:px-8 xl:py-6'
        )}
      >
        {TRANSFER_TYPES.map((type) => (
          <Headless.Radio
            key={type.value}
            value={type.value}
            className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900 sm:px-4`}
          >
            <span className="whitespace-nowrap">{type.label}</span>
          </Headless.Radio>
        ))}
      </Headless.RadioGroup>

      {/* LOCATION AND DATE/TIME INPUTS */}
      <div className="relative flex flex-wrap lg:flex-nowrap pr-20 sm:pr-24 xl:pr-28">
        {/* FROM Location */}
        <div className="w-full lg:flex-1">
          <LocationInputField
            placeholder="Airport code or address"
            description="Pickup location"
            className="hero-search-form__field-after"
            inputName="start-location"
            fieldStyle={formStyle}
            category="car"
          />
        </div>
        
        <VerticalDividerLine />
        
        {/* TO Location */}
        <div className="w-full lg:flex-1">
          <LocationInputField
            placeholder="Airport code or address"
            description="Drop-off location"
            className="hero-search-form__field-before hero-search-form__field-after"
            inputName="end-location"
            fieldStyle={formStyle}
            category="car"
          />
        </div>
        
        <VerticalDividerLine />

        {/* DATE AND TIME */}
        <div className={clsx(
          "w-full sm:w-auto sm:flex-1 relative z-10 shrink-0 cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start",
          formStyle === 'default' && 'px-4 py-4 sm:px-7 xl:px-8 xl:py-6',
          formStyle === 'small' && 'px-4 py-3 sm:px-7 xl:px-8'
        )}>
          <div className="grow">
            <div className="flex gap-2">
              {/* Date Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  name="pickup-date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={clsx(
                    "block w-full truncate border-none bg-transparent p-0 font-semibold focus:ring-0 focus:outline-hidden text-neutral-800 dark:text-neutral-200",
                    formStyle === 'default' && 'text-sm sm:text-base xl:text-lg',
                    formStyle === 'small' && 'text-sm sm:text-base'
                  )}
                  required
                />
              </div>
              
              {/* Time Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="time"
                  name="pickup-time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className={clsx(
                    "block w-full truncate border-none bg-transparent p-0 font-semibold focus:ring-0 focus:outline-hidden text-neutral-800 dark:text-neutral-200",
                    formStyle === 'default' && 'text-sm sm:text-base xl:text-lg',
                    formStyle === 'small' && 'text-sm sm:text-base'
                  )}
                  required
                />
              </div>
            </div>
            <div className="mt-0.5 text-start text-sm font-light text-neutral-400">
              <span className="line-clamp-1">Pickup date & time</span>
            </div>
          </div>
        </div>

        <VerticalDividerLine />

        {/* PASSENGERS */}
        <div className={clsx(
          "w-full sm:w-auto sm:flex-shrink-0 relative z-10 cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start sm:min-w-[120px] md:min-w-[140px] lg:min-w-[160px]",
          formStyle === 'default' && 'px-4 py-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 xl:py-6',
          formStyle === 'small' && 'px-4 py-3 sm:px-5 md:px-6 lg:px-7 xl:px-8'
        )}>
          <div className="grow sm:grow-0 w-full">
            <div className="flex items-center justify-center gap-3 mb-1">
              <button
                type="button"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={passengers <= 1}
              >
                -
              </button>
              <span className={clsx(
                "font-semibold min-w-[2.5rem] text-center text-neutral-800 dark:text-neutral-200",
                formStyle === 'default' && 'text-sm sm:text-base xl:text-lg',
                formStyle === 'small' && 'text-sm sm:text-base'
              )}>
                {passengers}
              </span>
              <button
                type="button"
                onClick={() => setPassengers(Math.min(8, passengers + 1))}
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={passengers >= 8}
              >
                +
              </button>
            </div>
            <div className="text-center sm:text-start text-sm font-light text-neutral-400">
              <span className="line-clamp-1">Passengers</span>
            </div>
          </div>
        </div>

        {/* Hidden inputs for form submission */}
        <input type="hidden" name="transfer-type" value={transferType} />
        <input type="hidden" name="passengers" value={passengers} />

        <ButtonSubmit fieldStyle={formStyle} />
      </div>
    </Form>
  )
}