'use client'

import T from '@/utils/getT'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ButtonSubmit, DateRangeField, GuestNumberField, LocationInputField, VerticalDividerLine } from './ui'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
}

export const ExperiencesSearchForm = ({ className, formStyle = 'default' }: Props) => {
  const router = useRouter()
  const selectedLocationRef = useRef<{ geoCode?: { latitude: number; longitude: number } } | null>(null)

  // Prefetch the stay categories page to improve performance
  useEffect(() => {
    router.prefetch('/experience-categories/all')
  }, [router])

  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())
    console.log('Form submitted', formDataEntries)
    
    // Extract form data
    const location = formDataEntries['location'] as string
    const checkInDate = formDataEntries['checkInDate'] as string
    const checkOutDate = formDataEntries['checkOutDate'] as string
    const guests = formDataEntries['adults'] as string || '1'
    const radius = formDataEntries['radius'] as string || '1'
    
    // Get geoCode from selected location
    const selectedLocation = selectedLocationRef.current
    const geoCode = selectedLocation?.geoCode
    
    if (!geoCode) {
      alert('Please select a location from the dropdown')
      return
    }
    
    // Test API call to Tours & Activities
    try {
      const response = await fetch(`/api/tours-search?latitude=${geoCode.latitude}&longitude=${geoCode.longitude}&radius=${radius}`)
      const data = await response.json()
      
      if (data.success) {
        alert('✅ API call successful! Check F12 Network tab for response data')
        console.log('Tours & Activities Response:', data)
      } else {
        alert('❌ API call failed: ' + data.error)
      }
    } catch (error) {
      alert('❌ Network error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    // Build URL with all params for future navigation
    const searchParams = new URLSearchParams({
      location,
      geoCode: `${geoCode.latitude},${geoCode.longitude}`,
      radius,
      guests,
    })
    
    if (checkInDate) searchParams.set('checkInDate', checkInDate)
    if (checkOutDate) searchParams.set('checkOutDate', checkOutDate)
    
    const url = `/experience-categories/all?${searchParams.toString()}`
    console.log('Future URL:', url)
    
    // For now, don't navigate to let user see the alert
    // router.push(url)
  }

  return (
    <Form
      className={clsx(
        'relative z-10 flex w-full rounded-full bg-white shadow-xl [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:shadow-2xl dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'custom-shadow-1',
        formStyle === 'default' && 'shadow-xl dark:shadow-2xl'
      )}
      action={handleFormSubmit}
    >
      <LocationInputField 
        className="hero-search-form__field-after flex-5/12" 
        fieldStyle={formStyle} 
        category="experience"
        onLocationSelect={(location) => {
          selectedLocationRef.current = location
        }}
      />
      <VerticalDividerLine />
      <DateRangeField
        className="hero-search-form__field-before hero-search-form__field-after flex-4/12"
        fieldStyle={formStyle}
        description={T['HeroSearchForm']['Date range']}
      />
      <VerticalDividerLine />
      <GuestNumberField
        className="hero-search-form__field-before flex-4/12"
        clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
        fieldStyle={formStyle}
        category="experience"
      />

      <ButtonSubmit fieldStyle={formStyle} className="z-10" />
    </Form>
  )
}
