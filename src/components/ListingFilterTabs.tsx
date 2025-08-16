'use client'

import NcInputNumber from '@/components/NcInputNumber'
import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonThird from '@/shared/ButtonThird'
import { Checkbox, CheckboxField, CheckboxGroup } from '@/shared/Checkbox'
import { Description, Fieldset, Label } from '@/shared/fieldset'
import T from '@/utils/getT'
import {
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { FilterVerticalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Form from 'next/form'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PriceRangeSlider } from './PriceRangeSlider'

type CheckboxFilter = {
  label: string
  name: string
  tabUIType: 'checkbox'
  options: {
    name: string
    description?: string
    defaultChecked?: boolean
  }[]
}
type PriceRangeFilter = {
  name: string
  label: string
  tabUIType: 'price-range'
  min: number
  max: number
}
type SelectNumberFilter = {
  name: string
  label: string
  tabUIType: 'select-number'
  options: {
    name: string
    max: number
  }[]
}

const demo_filters_options = [
  {
    name: 'Room-type',
    label: 'Room Type',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Standard Room',
        value: 'STANDARD_ROOM',
        description: 'Basic comfortable accommodation with essential amenities',
      },
      {
        name: 'Superior Room',
        value: 'SUPERIOR_ROOM',
        description: 'Enhanced room with better amenities and furnishing',
      },
      {
        name: 'Deluxe Room',
        value: 'DELUXE_ROOM',
        description: 'Spacious room with premium features and city views',
      },
      {
        name: 'Executive Room',
        value: 'EXECUTIVE_ROOM',
        description: 'Business-class room with executive lounge access',
      },
      {
        name: 'Club Room',
        value: 'CLUB_ROOM',
        description: 'Premium room with club floor privileges',
      },
      {
        name: 'Junior Suite',
        value: 'JUNIOR_SUITE',
        description: 'Compact suite with separate seating area',
      },
      {
        name: 'Suite',
        value: 'SUITE',
        description: 'Luxurious suite with multiple rooms and living area',
      },
      {
        name: 'Presidential Suite',
        value: 'PRESIDENTIAL_SUITE',
        description: 'Top-tier luxury accommodation with premium amenities',
      },
      {
        name: 'Family Room',
        value: 'FAMILY_ROOM',
        description: 'Spacious room designed for families with children',
      },
      {
        name: 'Connecting Room',
        value: 'CONNECTING_ROOM',
        description: 'Adjacent rooms with internal connecting door',
      },
    ],
  },
  {
    label: 'Price per day',
    name: 'price-per-day',
    tabUIType: 'price-range',
    min: 0,
    max: 1000,
  },
  {
    label: 'Rooms & Beds',
    name: 'rooms-beds',
    tabUIType: 'select-number',
    options: [
      { name: 'Beds', max: 10 },
      { name: 'Bedrooms', max: 10 },
      { name: 'Bathrooms', max: 10 },
    ],
  },
  {
    label: 'Amenities',
    name: 'amenities',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Kitchen',
        value: 'kitchen',
        description: 'Have a place to yourself',
      },
      {
        name: 'Air conditioning',
        value: 'air_conditioning',
        description: 'Have your own room and share some common spaces',
      },
      {
        name: 'Heating',
        value: 'heating',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Dryer',
        value: 'dryer',
        description: 'Stay in a shared space, like a common room',
      },
      {
        name: 'Washer',
        value: 'washer',
        description: 'Stay in a shared space, like a common room',
      },
    ],
  },
  {
    name: 'Facilities',
    label: 'Facilities',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Free parking on premise',
        value: 'free_parking_on_premise',
        description: 'Have a place to yourself',
      },
      {
        name: 'Hot tub',
        value: 'hot_tub',
        description: 'Have your own room and share some common spaces',
      },
      {
        name: 'Gym',
        value: 'gym',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Pool',
        value: 'pool',
        description: 'Stay in a shared space, like a common room',
      },
      {
        name: 'EV charger',
        value: 'ev_charger',
        description: 'Stay in a shared space, like a common room',
      },
    ],
  },
  {
    name: 'House-rules',
    label: 'House rules',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Pets allowed',
        value: 'pets_allowed',
        description: 'Have a place to yourself',
      },
      {
        name: 'Smoking allowed',
        value: 'smoking_allowed',
        description: 'Have your own room and share some common spaces',
      },
    ],
  },
]

const CheckboxPanel = ({ 
  filterOption, 
  className, 
  checkedValues = {},
  onCheckboxChange
}: { 
  filterOption: CheckboxFilter; 
  className?: string;
  checkedValues?: Record<string, boolean>;
  onCheckboxChange?: (optionName: string, checked: boolean) => void;
}) => {
  return (
    <Fieldset>
      <CheckboxGroup className={className}>
        {filterOption.options.map((option) => (
          <CheckboxField key={option.name}>
            <Checkbox 
              name={`${filterOption.name}[]`} 
              value={(option as any).value || option.name} 
              checked={checkedValues[option.name] || false}
              onChange={(checked) => {
                onCheckboxChange?.(option.name, checked)
              }}
            />
            <Label>{option.name}</Label>
            {option.description && <Description>{option.description}</Description>}
          </CheckboxField>
        ))}
      </CheckboxGroup>
    </Fieldset>
  )
}
const PriceRagePanel = ({ 
  filterOption: { min, max, name },
  currentPriceRange,
  onPriceChange
}: { 
  filterOption: PriceRangeFilter;
  currentPriceRange?: [number, number] | null;
  onPriceChange?: (range: [number, number]) => void;
}) => {
  const [rangePrices, setRangePrices] = useState<[number, number]>(
    currentPriceRange && (currentPriceRange[0] !== min || currentPriceRange[1] !== max) 
      ? currentPriceRange 
      : [min, max]
  )

  // Update local state when currentPriceRange changes
  React.useEffect(() => {
    if (currentPriceRange) {
      setRangePrices(currentPriceRange)
    }
  }, [currentPriceRange])

  const handlePriceChange = (newRange: number[]) => {
    const typedRange: [number, number] = [newRange[0] || min, newRange[1] || max]
    setRangePrices(typedRange)
    onPriceChange?.(typedRange)
  }

  return (
    <>
      <PriceRangeSlider 
        value={rangePrices} 
        onChange={handlePriceChange} 
        min={min} 
        max={max} 
      />
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="price-min" value={rangePrices[0]} />
      <input type="hidden" name="price-max" value={rangePrices[1]} />
    </>
  )
}
const NumberSelectPanel = ({ 
  filterOption: { name, options },
  currentValues = {},
  onValueChange
}: { 
  filterOption: SelectNumberFilter;
  currentValues?: Record<string, number>;
  onValueChange?: (fieldName: string, value: number) => void;
}) => {
  return (
    <div className="relative flex flex-col gap-y-5">
      {options.map((option) => {
        // Default to 1 for all fields since every hotel has at least 1 bed/bedroom/bathroom
        const defaultValue = currentValues[option.name] || 1
        
        return (
          <NcInputNumber 
            key={option.name} 
            inputName={option.name} 
            label={option.name} 
            min={1}
            max={option.max}
            defaultValue={defaultValue}
            onChange={(value) => onValueChange?.(option.name, value)}
          />
        )
      })}
    </div>
  )
}

const ListingFilterTabs = ({
  filterOptions = demo_filters_options,
}: {
  filterOptions?: Partial<typeof demo_filters_options>
}) => {
  const searchParams = useSearchParams()
  const [showAllFilter, setShowAllFilter] = useState(false)
  const [checkedFilters, setCheckedFilters] = useState<Record<string, boolean>>({})
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [roomsBedsCount, setRoomsBedsCount] = useState<Record<string, number>>({
    Beds: 1,
    Bedrooms: 1,
    Bathrooms: 1
  })

  // Initialize price range from URL params on mount
  useEffect(() => {
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    
    if (priceMin || priceMax) {
      const priceRangeFilter = filterOptions.find(f => f?.tabUIType === 'price-range') as PriceRangeFilter
      if (priceRangeFilter) {
        const min = priceMin ? Number(priceMin) : priceRangeFilter.min
        const max = priceMax ? Number(priceMax) : priceRangeFilter.max
        setPriceRange([min, max])
      }
    }
  }, [searchParams, filterOptions])

  // Initialize checked filters from URL params on mount
  useEffect(() => {
    const roomTypes = searchParams.get('room_types')
    
    if (roomTypes) {
      const roomTypeValues = roomTypes.split(',')
      const newCheckedFilters: Record<string, boolean> = {}
      
      // Find Room Type filter options
      const roomTypeFilter = filterOptions.find(f => f?.name === 'Room-type') as CheckboxFilter
      if (roomTypeFilter?.options) {
        roomTypeFilter.options.forEach(option => {
          // Check if this option's value is in the URL params
          const optionValue = (option as any).value || option.name
          if (roomTypeValues.includes(optionValue)) {
            newCheckedFilters[option.name] = true
          }
        })
      }
      
      setCheckedFilters(newCheckedFilters)
    }
  }, [searchParams, filterOptions])

  const updateFiltersFromForm = (formData: FormData) => {
    const formDataObject = Object.fromEntries(formData.entries())
    
    // Check what type of form this is based on the data
    const hasCheckboxFilters = Array.from(formData.keys()).some(key => key.includes('[]'))
    const hasPriceRange = formData.has('price-min') || formData.has('price-max')
    const hasRoomsBeds = formData.has('Beds') || formData.has('Bedrooms') || formData.has('Bathrooms')

    // Only update checkbox filters if form contains checkbox data
    if (hasCheckboxFilters) {
      const newCheckedFilters: Record<string, boolean> = {}
      for (const [key, value] of formData.entries()) {
        if (value && value !== '' && key.includes('[]')) {
          newCheckedFilters[value as string] = true
        }
      }
      setCheckedFilters(newCheckedFilters)
    }

    // Only update price range if form contains price data
    if (hasPriceRange) {
      const minPrice = formData.get('price-min')
      const maxPrice = formData.get('price-max')
      if (minPrice && maxPrice) {
        setPriceRange([Number(minPrice), Number(maxPrice)])
      }
    }

    // Only update rooms & beds if form contains rooms/beds data
    if (hasRoomsBeds) {
      const newRoomsBedsCount: Record<string, number> = {
        Beds: 1,
        Bedrooms: 1,
        Bathrooms: 1
      }
      for (const [key, value] of formData.entries()) {
        if ((key === 'Beds' || key === 'Bedrooms' || key === 'Bathrooms') && value) {
          const count = Number(value)
          if (count > 0) {
            newRoomsBedsCount[key] = count
          }
        }
      }
      setRoomsBedsCount(newRoomsBedsCount)
    }
  }

  const handleFormSubmit = async (formData: FormData) => {
    console.log('🚨 FORM SUBMIT TRIGGERED!')
    console.log('🚨 Form data entries:', Array.from(formData.entries()))
    
    const formDataObject = Object.fromEntries(formData.entries())
    console.log('🔧 Form submitted with data:', formDataObject)
    
    // Debug: Check if price data is in form
    const priceMin = formData.get('price-min')
    const priceMax = formData.get('price-max')
    console.log('🔧 Price data from form:', { priceMin, priceMax })
    updateFiltersFromForm(formData)
    
    // Update URL params with filter values
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href)
      console.log('🔧 Current URL before update:', currentUrl.toString())
      
      // Update price range params
      const priceMin = formData.get('price-min')
      const priceMax = formData.get('price-max')
      console.log('🔧 Updating URL with:', { priceMin, priceMax })
      
      if (priceMin) {
        currentUrl.searchParams.set('price_min', priceMin.toString())
        console.log('🔧 Set price_min:', priceMin.toString())
      } else {
        currentUrl.searchParams.delete('price_min')
        console.log('🔧 Deleted price_min')
      }
      
      if (priceMax) {
        currentUrl.searchParams.set('price_max', priceMax.toString())
        console.log('🔧 Set price_max:', priceMax.toString())
      } else {
        currentUrl.searchParams.delete('price_max')
        console.log('🔧 Deleted price_max')
      }
      
      // Update rooms & beds params
      const beds = formData.get('Beds')
      const bedrooms = formData.get('Bedrooms')
      const bathrooms = formData.get('Bathrooms')
      console.log('🔧 Rooms/beds data from form:', { beds, bedrooms, bathrooms })
      
      if (beds && Number(beds) > 0) {
        currentUrl.searchParams.set('beds', beds.toString())
      } else {
        currentUrl.searchParams.delete('beds')
      }
      
      if (bedrooms && Number(bedrooms) > 0) {
        currentUrl.searchParams.set('bedrooms', bedrooms.toString())
      } else {
        currentUrl.searchParams.delete('bedrooms')
      }
      
      if (bathrooms && Number(bathrooms) > 0) {
        currentUrl.searchParams.set('bathrooms', bathrooms.toString())
      } else {
        currentUrl.searchParams.delete('bathrooms')
      }
      
      // Update room type params
      const roomTypeValues: string[] = []
      for (const [key, value] of formData.entries()) {
        if (key.includes('Room-type[]') && value) {
          roomTypeValues.push(value as string)
        }
      }
      console.log('🔧 Room type data from form:', roomTypeValues)
      
      if (roomTypeValues.length > 0) {
        currentUrl.searchParams.set('room_types', roomTypeValues.join(','))
      } else {
        currentUrl.searchParams.delete('room_types')
      }
      
      console.log('🔧 New URL after update:', currentUrl.toString())
      
      // Update URL without page refresh
      window.history.pushState({}, '', currentUrl.toString())
      console.log('🔧 URL updated in browser')
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('filtersChanged', {
        detail: { 
          priceMin: priceMin ? Number(priceMin) : null, 
          priceMax: priceMax ? Number(priceMax) : null,
          beds: beds ? Number(beds) : null,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          roomTypes: roomTypeValues.length > 0 ? roomTypeValues : null
        }
      }))
      console.log('🔧 Dispatched filtersChanged event')
    }
  }

  const handleCheckboxChange = (optionName: string, checked: boolean) => {
    setCheckedFilters(prev => {
      const newCheckedFilters = { ...prev }
      if (checked) {
        newCheckedFilters[optionName] = true
      } else {
        delete newCheckedFilters[optionName]
      }
      return newCheckedFilters
    })
  }

  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range)
  }

  const handleRoomsBedsChange = (fieldName: string, value: number) => {
    setRoomsBedsCount(prev => {
      const newValues = { ...prev }
      // Always keep value >= 1
      newValues[fieldName] = Math.max(1, value)
      return newValues
    })
  }

  // Count total selected filters (Price Range is not counted as a filter)
  // Beds/Bedrooms/Bathrooms = 1 are not counted as filters (since it's the default)
  const selectedFiltersCount = 
    Object.keys(checkedFilters).length + 
    Object.entries(roomsBedsCount).filter(([key, value]) => {
      // Only count if value > 1 (since 1 is the default for all fields)
      return value > 1
    }).length

  const renderTabAllFilters = () => {
    return (
      <div className="shrink-0 grow md:grow-0">
        <Button
          outline
          onClick={() => setShowAllFilter(true)}
          className="w-full border-black! ring-1 ring-black ring-inset md:w-auto dark:border-neutral-200! dark:ring-neutral-200"
        >
          <HugeiconsIcon icon={FilterVerticalIcon} size={16} color="currentColor" strokeWidth={1.5} />
          <span>{T['common']['All filters']}</span>
          {selectedFiltersCount > 0 && (
            <span className="absolute top-0 -right-0.5 flex size-5 items-center justify-center rounded-full bg-black text-[0.65rem] font-semibold text-white ring-2 ring-white dark:bg-neutral-200 dark:text-neutral-900 dark:ring-neutral-900">
              {selectedFiltersCount}
            </span>
          )}
        </Button>

        <Dialog
          open={showAllFilter}
          onClose={() => setShowAllFilter(false)}
          className="relative z-50"
          as={Form}
          action={handleFormSubmit}
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/50 duration-200 ease-out data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex max-h-screen w-screen items-center justify-center pt-3">
            <DialogPanel
              className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white text-left align-middle shadow-xl duration-200 ease-out data-closed:translate-y-16 data-closed:opacity-0 dark:border dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              transition
            >
              <div className="relative shrink-0 border-b border-neutral-200 p-4 text-center sm:px-8 dark:border-neutral-800">
                <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900">
                  {T['common']['Filters']}
                </DialogTitle>
                <div className="absolute end-2 top-2">
                  <ButtonClose plain onClick={() => setShowAllFilter(false)} />
                </div>
              </div>

              <div className="hidden-scrollbar grow overflow-y-auto text-start">
                <div className="divide-y divide-neutral-200 px-4 sm:px-8 dark:divide-neutral-800">
                  {filterOptions.map((filterOption, index) =>
                    filterOption ? (
                      <div key={index} className="py-7">
                        <h3 className="text-xl font-medium">{filterOption.label}</h3>
                        <div className="relative mt-6">
                          {filterOption.tabUIType === 'checkbox' && (
                            <CheckboxPanel 
                              filterOption={filterOption as CheckboxFilter} 
                              checkedValues={checkedFilters}
                              onCheckboxChange={handleCheckboxChange}
                            />
                          )}
                          {filterOption.tabUIType === 'price-range' && (
                            <PriceRagePanel 
                              key={index} 
                              filterOption={filterOption as PriceRangeFilter}
                              currentPriceRange={priceRange}
                              onPriceChange={handlePriceChange}
                            />
                          )}
                          {filterOption.tabUIType === 'select-number' && (
                            <NumberSelectPanel 
                              key={index} 
                              filterOption={filterOption as SelectNumberFilter}
                              currentValues={roomsBedsCount}
                              onValueChange={handleRoomsBedsChange}
                            />
                          )}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between bg-neutral-50 p-4 sm:px-8 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
                <ButtonThird className="-mx-3" onClick={() => {
                  setCheckedFilters({})
                  setRoomsBedsCount({
                    Beds: 1,
                    Bedrooms: 1,
                    Bathrooms: 1
                  })
                  // Reset Price Range to default values
                  const priceRangeFilter = filterOptions.find(f => f?.tabUIType === 'price-range') as PriceRangeFilter
                  if (priceRangeFilter) {
                    setPriceRange([priceRangeFilter.min, priceRangeFilter.max])
                  }
                  
                  // Don't clear URL params or trigger search - just reset the form values
                  // Keep the dialog open - don't close it
                }} type="button">
                  {T['common']['Clear All']}
                </ButtonThird>
                <ButtonPrimary type="submit" onClick={() => {
                  console.log('🚨 APPLY FILTERS BUTTON CLICKED!')
                  setShowAllFilter(false)
                }}>
                  {T['common']['Apply filters']}
                </ButtonPrimary>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    )
  }

  if (!filterOptions || filterOptions.length === 0) {
    return <div>No filter options available</div>
  }

  return (
    <div className="flex flex-wrap md:gap-x-4 md:gap-y-2">
      {renderTabAllFilters()}
      <PopoverGroup className="hidden flex-wrap gap-x-4 gap-y-2 md:flex">
        <div className="h-auto w-px bg-neutral-200 dark:bg-neutral-700"></div>
        {filterOptions.map((filterOption, index) => {
          // only show 3 filters in the tab. Other filters will be shown in the All-filters-popover
          if (index > 2 || !filterOption) {
            return null
          }

          const checkedNumber = (filterOption as CheckboxFilter).options?.filter(option => 
            checkedFilters[option.name]
          ).length || 0

          // Get display text and badge for different filter types
          let displayText = filterOption.label
          let badgeCount = 0
          
          if (filterOption.tabUIType === 'checkbox') {
            badgeCount = checkedNumber
          } else if (filterOption.tabUIType === 'price-range') {
            if (priceRange && (priceRange[0] !== (filterOption as PriceRangeFilter).min || priceRange[1] !== (filterOption as PriceRangeFilter).max)) {
              displayText = `$${priceRange[0]} - $${priceRange[1]}`
              badgeCount = 0 // Price range doesn't count as filter but shows value
            }
          } else if (filterOption.tabUIType === 'select-number') {
            // Only count values > 1 (since 1 is the default)
            badgeCount = Object.entries(roomsBedsCount).filter(([key, value]) => {
              return value > 1
            }).length
          }

          return (
            <Popover className="relative" key={index}>
              <PopoverButton
                as={Button}
                outline
                className={clsx(
                  'md:px-4',
                  (badgeCount > 0 || (filterOption.tabUIType === 'price-range' && displayText !== filterOption.label)) &&
                    'border-black! ring-1 ring-black ring-inset dark:border-neutral-200! dark:ring-neutral-200'
                )}
              >
                <span>{displayText}</span>
                <ChevronDownIcon className="size-4" />
                {badgeCount > 0 && (
                  <span className="absolute top-0 -right-0.5 flex size-5 items-center justify-center rounded-full bg-black text-[0.65rem] font-semibold text-white ring-2 ring-white dark:bg-neutral-200 dark:text-neutral-900 dark:ring-neutral-900">
                    {badgeCount}
                  </span>
                )}
              </PopoverButton>

              <PopoverPanel
                transition
                unmount={false}
                className="absolute -start-5 top-full z-10 mt-3 w-sm transition data-closed:translate-y-1 data-closed:opacity-0"
              >
                <Form action={handleFormSubmit} className="rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="hidden-scrollbar max-h-[28rem] overflow-y-auto px-5 py-6">
                    {filterOption.tabUIType === 'checkbox' && (
                      <CheckboxPanel 
                        filterOption={filterOption as CheckboxFilter} 
                        checkedValues={checkedFilters}
                        onCheckboxChange={handleCheckboxChange}
                      />
                    )}
                    {filterOption.tabUIType === 'price-range' && (
                      <PriceRagePanel 
                        key={index} 
                        filterOption={filterOption as PriceRangeFilter}
                        currentPriceRange={priceRange}
                        onPriceChange={handlePriceChange}
                      />
                    )}
                    {filterOption.tabUIType === 'select-number' && (
                      <NumberSelectPanel 
                        key={index} 
                        filterOption={filterOption as SelectNumberFilter}
                        currentValues={roomsBedsCount}
                        onValueChange={handleRoomsBedsChange}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-b-2xl bg-neutral-50 p-5 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
                    <ButtonThird type="button" onClick={() => {
                      // Clear filters for this specific filter option - only reset values, don't trigger search
                      if (filterOption.tabUIType === 'checkbox') {
                        const newCheckedFilters = { ...checkedFilters }
                        ;(filterOption as CheckboxFilter).options?.forEach(option => {
                          delete newCheckedFilters[option.name]
                        })
                        setCheckedFilters(newCheckedFilters)
                      } else if (filterOption.tabUIType === 'price-range') {
                        // Reset price range to default values
                        const priceFilter = filterOption as PriceRangeFilter
                        setPriceRange([priceFilter.min, priceFilter.max])
                      } else if (filterOption.tabUIType === 'select-number') {
                        setRoomsBedsCount({
                          Beds: 1,
                          Bedrooms: 1,
                          Bathrooms: 1
                        })
                      }
                    }}>
                      {T['common']['Clear']}
                    </ButtonThird>
                    <CloseButton type="submit" as={ButtonPrimary} onClick={() => {
                      console.log('🚨 INDIVIDUAL FILTER APPLY BUTTON CLICKED!')
                    }}>
                      {T['common']['Apply']}
                    </CloseButton>
                  </div>
                </Form>
              </PopoverPanel>
            </Popover>
          )
        })}
      </PopoverGroup>
    </div>
  )
}

export default ListingFilterTabs
