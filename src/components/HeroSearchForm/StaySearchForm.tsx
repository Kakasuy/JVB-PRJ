'use client'

import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ButtonSubmit, DateRangeField, GuestNumberField, LocationInputField, VerticalDividerLine } from './ui'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
}

export const StaySearchForm = ({ className, formStyle = 'default' }: Props) => {
  const router = useRouter()

  // Prefetch the stay categories page to improve performance
  useEffect(() => {
    router.prefetch('/stay-categories/all')
  }, [router])

  const handleFormSubmit = (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())
    console.log('Form submitted - Raw FormData:', formDataEntries)
    
    // Debug: Log individual fields
    console.log('Location:', formDataEntries['location'])
    console.log('CheckInDate:', formDataEntries['checkInDate'])
    console.log('CheckOutDate:', formDataEntries['checkOutDate'])
    console.log('Adults:', formDataEntries['adults'])

    // Get form values or set defaults
    const location = formDataEntries['location'] as string || 'New York' // Default location
    const checkInDate = formDataEntries['checkInDate'] as string
    const checkOutDate = formDataEntries['checkOutDate'] as string
    const adults = formDataEntries['adults'] as string || '1' // Default to 1 adult

    // Set default dates if not provided (check-in +2 days, check-out +3 days from today)
    const today = new Date()
    const defaultCheckIn = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    const defaultCheckOut = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    const finalCheckIn = checkInDate || defaultCheckIn.toISOString().split('T')[0]
    const finalCheckOut = checkOutDate || defaultCheckOut.toISOString().split('T')[0]

    // Map location to city codes
    const locationToCityCode = (loc: string): string => {
      const locationMap: Record<string, string> = {
        'New York': 'NYC',
        'Paris': 'PAR',
        'London': 'LON',
        'Tokyo': 'TYO',
        'Barcelona': 'BCN'
      }
      
      // Find city code by partial match
      const normalizedLoc = loc.toLowerCase()
      for (const [city, code] of Object.entries(locationMap)) {
        if (normalizedLoc.includes(city.toLowerCase()) || 
            city.toLowerCase().includes(normalizedLoc)) {
          return code
        }
      }
      return 'NYC' // Default to NYC
    }

    const cityCode = locationToCityCode(location)

    // Build URL with search parameters
    const searchParams = new URLSearchParams({
      location: location, // Send original location, let HotelSearchResults handle mapping
      checkInDate: finalCheckIn,
      checkOutDate: finalCheckOut,
      adults: adults
    })

    let url = '/stay-categories/all'
    url = `${url}?${searchParams.toString()}`
    
    router.push(url)
  }

  return (
    <Form
      className={clsx(
        'relative z-10 flex w-full rounded-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'custom-shadow-1',
        formStyle === 'default' && 'shadow-xl dark:shadow-2xl'
      )}
      action={handleFormSubmit}
    >
      <LocationInputField 
        className="hero-search-form__field-after flex-5/12" 
        fieldStyle={formStyle} 
        category="stays"
      />
      <VerticalDividerLine />
      <DateRangeField
        className="hero-search-form__field-before hero-search-form__field-after flex-4/12"
        fieldStyle={formStyle}
      />
      <VerticalDividerLine />
      <GuestNumberField
        className="hero-search-form__field-before flex-4/12"
        clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
        fieldStyle={formStyle}
      />

      <ButtonSubmit fieldStyle={formStyle} className="z-10" />
    </Form>
  )
}