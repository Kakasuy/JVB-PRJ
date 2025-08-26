// Copy HOÀN TOÀN từ ListingFilterTabs.tsx - chỉ thay đổi demo_filters_options
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
  expandable?: boolean
  options: {
    name: string
    description?: string
    defaultChecked?: boolean
    popular?: boolean
    value?: string
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

// TRANSFER FILTER OPTIONS - chỉ thay đổi phần này từ Stay booking
const demo_filters_options = [
  {
    name: 'Price-range',
    label: 'Price Range',
    tabUIType: 'price-range',
    min: 0,
    max: 15000, // EUR for transfers
  },
  {
    name: 'Vehicle-code',
    label: 'Vehicle Type',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Sedan',
        value: 'SDN',
        description: 'Standard sedan vehicles',
        popular: true,
      },
      {
        name: 'SUV',
        value: 'SUV',
        description: 'Sport utility vehicles',
        popular: true,
      },
      {
        name: 'Car',
        value: 'CAR',
        description: 'Standard car vehicles',
        popular: true,
      },
      {
        name: 'Van',
        value: 'VAN',
        description: 'Van and multi-purpose vehicles',
        popular: true,
      },
      {
        name: 'Limousine',
        value: 'LMS',
        description: 'Premium limousine service',
      },
      {
        name: 'Electric Vehicle',
        value: 'ELC',
        description: 'Eco-friendly electric vehicles',
      },
      {
        name: 'Bus',
        value: 'BUS',
        description: 'Large capacity buses',
      },
    ],
  },
  {
    name: 'Vehicle-category',
    label: 'Service Level',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Standard',
        value: 'ST',
        description: 'Standard service level',
        popular: true,
      },
      {
        name: 'Business',
        value: 'BU',
        description: 'Business class service',
        popular: true,
      },
      {
        name: 'Luxury',
        value: 'LX',
        description: 'Premium luxury experience',
        popular: true,
      },
      {
        name: 'Premium',
        value: 'PR',
        description: 'Enhanced premium service',
      },
      {
        name: 'First Class',
        value: 'FC',
        description: 'First class transfer service',
      },
      {
        name: 'Economy',
        value: 'EC',
        description: 'Budget-friendly option',
      },
    ],
  },
  {
    name: 'Extra-services',
    label: 'Included Services',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Meet & Greet',
        value: 'MAG',
        description: 'Meet and greet service at pickup',
        popular: true,
      },
      {
        name: 'Flight Monitoring',
        value: 'FLM',
        description: 'Real-time flight tracking',
        popular: true,
      },
      {
        name: 'Free Cancellation',
        value: 'FREE_CANCEL',
        description: 'Cancel your booking without penalty',
        popular: true,
      },
    ],
  },
  {
    name: 'Passengers-baggage',
    label: 'Passengers & Baggage',
    tabUIType: 'select-number',
    options: [
      {
        name: 'Passengers',
        max: 8,
      },
      {
        name: 'Small Bags',
        max: 10,
      },
      {
        name: 'Large Bags',
        max: 10,
      },
    ],
  },
] satisfies Array<CheckboxFilter | PriceRangeFilter | SelectNumberFilter>

// COPY Y HỆT CODE TỪ ListingFilterTabs - bắt đầu từ đây
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
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Separate popular and additional options
  const popularOptions = filterOption.options.filter(option => (option as any).popular)
  const additionalOptions = filterOption.options.filter(option => !(option as any).popular)
  
  // Determine which options to show
  const visibleOptions = filterOption.expandable 
    ? (isExpanded ? filterOption.options : popularOptions)
    : filterOption.options
  
  return (
    <Fieldset>
      <CheckboxGroup className={className}>
        {visibleOptions.map((option) => (
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
        
        {/* Show expand/collapse button if this filter is expandable and has additional options */}
        {filterOption.expandable && additionalOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              <span>
                {isExpanded 
                  ? `Show less services` 
                  : `Show ${additionalOptions.length} more services`
                }
              </span>
              <ChevronDownIcon 
                className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        )}
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
        // Default to 1 for passengers, 0 for baggage
        const defaultValue = currentValues[option.name] || (option.name === 'Passengers' ? 1 : 0)
        
        return (
          <NcInputNumber 
            key={option.name} 
            inputName={option.name} 
            label={option.name} 
            min={option.name === 'Passengers' ? 1 : 0}
            max={option.max}
            defaultValue={defaultValue}
            onChange={(value) => onValueChange?.(option.name, value)}
          />
        )
      })}
    </div>
  )
}

const TransferFilterTabs = ({
  filterOptions = demo_filters_options,
}: {
  filterOptions?: Partial<typeof demo_filters_options>
}) => {
  const searchParams = useSearchParams()
  const [showAllFilter, setShowAllFilter] = useState(false)
  const [checkedFilters, setCheckedFilters] = useState<Record<string, boolean>>({})
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [passengersBedsCount, setPassengersBedsCount] = useState<Record<string, number>>({
    Passengers: 1,
    'Small Bags': 0,
    'Large Bags': 0
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

  // Initialize checked filters from URL params on mount - ADAPT for Transfer
  useEffect(() => {
    const vehicleCodes = searchParams.get('vehicle_codes')
    const vehicleCategories = searchParams.get('vehicle_categories')
    const extraServices = searchParams.get('extra_services')
    
    const newCheckedFilters: Record<string, boolean> = {}
    
    // Handle vehicle codes
    if (vehicleCodes) {
      const vehicleCodeValues = vehicleCodes.split(',')
      const vehicleCodeFilter = filterOptions.find(f => f?.name === 'Vehicle-code') as CheckboxFilter
      if (vehicleCodeFilter?.options) {
        vehicleCodeFilter.options.forEach(option => {
          const optionValue = (option as any).value || option.name
          if (vehicleCodeValues.includes(optionValue)) {
            newCheckedFilters[option.name] = true
          }
        })
      }
    }
    
    // Handle vehicle categories
    if (vehicleCategories) {
      const vehicleCategoryValues = vehicleCategories.split(',')
      const vehicleCategoryFilter = filterOptions.find(f => f?.name === 'Vehicle-category') as CheckboxFilter
      if (vehicleCategoryFilter?.options) {
        vehicleCategoryFilter.options.forEach(option => {
          const optionValue = (option as any).value || option.name
          if (vehicleCategoryValues.includes(optionValue)) {
            newCheckedFilters[option.name] = true
          }
        })
      }
    }
    
    // Handle extra services
    if (extraServices) {
      const extraServiceValues = extraServices.split(',')
      const extraServiceFilter = filterOptions.find(f => f?.name === 'Extra-services') as CheckboxFilter
      if (extraServiceFilter?.options) {
        extraServiceFilter.options.forEach(option => {
          const optionValue = (option as any).value || option.name
          if (extraServiceValues.includes(optionValue)) {
            newCheckedFilters[option.name] = true
          }
        })
      }
    }
    
    setCheckedFilters(newCheckedFilters)
  }, [searchParams, filterOptions])

  const updateFiltersFromForm = (formData: FormData) => {
    const formDataObject = Object.fromEntries(formData.entries())
    
    // Check what type of form this is based on the data
    const hasCheckboxFilters = Array.from(formData.keys()).some(key => key.includes('[]'))
    const hasPriceRange = formData.has('price-min') || formData.has('price-max')
    const hasPassengersBaggage = formData.has('Passengers') || formData.has('Small Bags') || formData.has('Large Bags')

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

    // Only update passengers & baggage if form contains that data
    if (hasPassengersBaggage) {
      const newPassengersBaggageCount: Record<string, number> = {
        Passengers: 1,
        'Small Bags': 0,
        'Large Bags': 0
      }
      for (const [key, value] of formData.entries()) {
        if ((key === 'Passengers' || key === 'Small Bags' || key === 'Large Bags') && value) {
          const count = Number(value)
          if (count >= 0) {
            newPassengersBaggageCount[key] = count
          }
        }
      }
      setPassengersBedsCount(newPassengersBaggageCount)
    }
  }

  const handleFormSubmit = async (formData: FormData) => {
    console.log('🚨 TRANSFER FILTER FORM SUBMIT!')
    console.log('🚨 Form data entries:', Array.from(formData.entries()))
    
    updateFiltersFromForm(formData)
    
    // Update URL params with filter values
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href)
      
      // Update price range params
      const priceMin = formData.get('price-min')
      const priceMax = formData.get('price-max')
      
      if (priceMin) {
        currentUrl.searchParams.set('price_min', priceMin.toString())
      } else {
        currentUrl.searchParams.delete('price_min')
      }
      
      if (priceMax) {
        currentUrl.searchParams.set('price_max', priceMax.toString())
      } else {
        currentUrl.searchParams.delete('price_max')
      }
      
      // Update passengers & baggage params
      const passengers = formData.get('Passengers')
      const smallBags = formData.get('Small Bags')
      const largeBags = formData.get('Large Bags')
      
      if (passengers && Number(passengers) > 0) {
        currentUrl.searchParams.set('passengers', passengers.toString())
      } else {
        currentUrl.searchParams.delete('passengers')
      }
      
      if (smallBags && Number(smallBags) > 0) {
        currentUrl.searchParams.set('small_bags', smallBags.toString())
      } else {
        currentUrl.searchParams.delete('small_bags')
      }
      
      if (largeBags && Number(largeBags) > 0) {
        currentUrl.searchParams.set('large_bags', largeBags.toString())
      } else {
        currentUrl.searchParams.delete('large_bags')
      }

      // Handle checkbox filters - ADAPT for Transfer
      const vehicleCodeValues: string[] = []
      const vehicleCategoryValues: string[] = []
      const extraServiceValues: string[] = []
      
      for (const [key, value] of formData.entries()) {
        if (key === 'Vehicle-code[]' && value) {
          vehicleCodeValues.push(value.toString())
        } else if (key === 'Vehicle-category[]' && value) {
          vehicleCategoryValues.push(value.toString())
        } else if (key === 'Extra-services[]' && value) {
          extraServiceValues.push(value.toString())
        }
      }
      
      // Update URL with checkbox values
      if (vehicleCodeValues.length > 0) {
        currentUrl.searchParams.set('vehicle_codes', vehicleCodeValues.join(','))
      } else {
        currentUrl.searchParams.delete('vehicle_codes')
      }
      
      if (vehicleCategoryValues.length > 0) {
        currentUrl.searchParams.set('vehicle_categories', vehicleCategoryValues.join(','))
      } else {
        currentUrl.searchParams.delete('vehicle_categories')
      }
      
      if (extraServiceValues.length > 0) {
        currentUrl.searchParams.set('extra_services', extraServiceValues.join(','))
      } else {
        currentUrl.searchParams.delete('extra_services')
      }
      
      // Navigate to updated URL
      window.history.pushState({}, '', currentUrl.toString())
      
      // Dispatch custom event to trigger filters change
      const event = new CustomEvent('filtersChanged', { 
        detail: { url: currentUrl.toString() } 
      })
      window.dispatchEvent(event)
    }
  }

  const handleCheckboxChange = (optionName: string, checked: boolean) => {
    setCheckedFilters(prev => ({
      ...prev,
      [optionName]: checked
    }))
  }

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range)
  }

  const handlePassengersBaggageChange = (fieldName: string, value: number) => {
    setPassengersBedsCount(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const clearAllFilters = () => {
    // Reset all filter states to default
    setCheckedFilters({})
    setPriceRange(null)
    setPassengersBedsCount({
      Passengers: 1,
      'Small Bags': 0,
      'Large Bags': 0
    })
    
    // Clear URL params
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href)
      
      // Clear all filter-related params
      const filterParams = [
        'price_min', 'price_max', 
        'vehicle_codes', 'vehicle_categories', 'extra_services',
        'passengers', 'small_bags', 'large_bags'
      ]
      
      filterParams.forEach(param => {
        currentUrl.searchParams.delete(param)
      })
      
      window.history.pushState({}, '', currentUrl.toString())
      
      // Dispatch event to trigger filters change
      const event = new CustomEvent('filtersChanged', { 
        detail: { url: currentUrl.toString() } 
      })
      window.dispatchEvent(event)
    }
  }

  // Count active filters
  const getFilterCount = (filterOption: any) => {
    if (filterOption.tabUIType === 'checkbox') {
      const filterName = filterOption.name
      const checkedOptionsCount = filterOption.options.filter((option: any) => 
        checkedFilters[option.name]
      ).length
      return checkedOptionsCount
    }
    
    if (filterOption.tabUIType === 'price-range') {
      const currentRange = priceRange || [filterOption.min, filterOption.max]
      const hasCustomRange = currentRange[0] !== filterOption.min || currentRange[1] !== filterOption.max
      return hasCustomRange ? 1 : 0
    }
    
    if (filterOption.tabUIType === 'select-number') {
      const defaultCounts = { Passengers: 1, 'Small Bags': 0, 'Large Bags': 0 }
      const hasChanges = filterOption.options.some((option: any) => {
        const current = passengersBedsCount[option.name] || defaultCounts[option.name as keyof typeof defaultCounts] || 0
        const defaultValue = defaultCounts[option.name as keyof typeof defaultCounts] || 0
        return current !== defaultValue
      })
      return hasChanges ? 1 : 0
    }
    
    return 0
  }

  const getTotalFilterCount = () => {
    return filterOptions.reduce((total, option) => total + getFilterCount(option), 0)
  }

  return (
    <>
      <div className="flex flex-wrap md:gap-x-4 md:gap-y-2">
      {/* Desktop All Filters Button - Copy from Stay booking */}
      <div className="shrink-0 grow md:grow-0">
        <Button
          outline
          onClick={() => setShowAllFilter(true)}
          className="w-full border-black! ring-1 ring-black ring-inset md:w-auto dark:border-neutral-200! dark:ring-neutral-200"
        >
          <HugeiconsIcon icon={FilterVerticalIcon} size={16} color="currentColor" strokeWidth={1.5} />
          <span>All filters</span>
          {getTotalFilterCount() > 0 && (
            <span className="absolute top-0 -right-0.5 flex size-5 items-center justify-center rounded-full bg-black text-[0.65rem] font-semibold text-white ring-2 ring-white dark:bg-neutral-200 dark:text-neutral-900 dark:ring-neutral-900">
              {getTotalFilterCount()}
            </span>
          )}
        </Button>
      </div>

      {/* Individual Filter Tabs - Copy from Stay booking PopoverGroup */}
      <PopoverGroup className="hidden flex-wrap gap-x-4 gap-y-2 md:flex">
        <div className="h-auto w-px bg-neutral-200 dark:bg-neutral-700"></div>
        {filterOptions.map((filterOption, index) => {
          // Only show first 3 filters in tabs like Stay booking
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
              displayText = `€${priceRange[0]} - €${priceRange[1]}`
              badgeCount = 0 // Price range doesn't count as filter but shows value
            }
          } else if (filterOption.tabUIType === 'select-number') {
            // Only count values different from defaults
            badgeCount = Object.entries(passengersBedsCount).filter(([key, value]) => {
              const defaultValue = key === 'Passengers' ? 1 : 0
              return value !== defaultValue
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
                className="absolute -start-5 top-full z-50 mt-3 w-sm transition data-closed:translate-y-1 data-closed:opacity-0"
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
                        onPriceChange={handlePriceRangeChange}
                      />
                    )}
                    {filterOption.tabUIType === 'select-number' && (
                      <NumberSelectPanel 
                        key={index} 
                        filterOption={filterOption as SelectNumberFilter}
                        currentValues={passengersBedsCount}
                        onValueChange={handlePassengersBaggageChange}
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
                        setPassengersBedsCount({
                          Passengers: 1,
                          'Small Bags': 0,
                          'Large Bags': 0
                        })
                      }
                    }}>
                      Clear
                    </ButtonThird>
                    <CloseButton type="submit" as={ButtonPrimary} onClick={() => {
                      console.log('🚨 INDIVIDUAL FILTER APPLY BUTTON CLICKED!')
                    }}>
                      Apply
                    </CloseButton>
                  </div>
                </Form>
              </PopoverPanel>
            </Popover>
          )
        })}
      </PopoverGroup>
    </div>
      
      {/* Desktop & Mobile All Filters Dialog - Copy from Stay booking */}
      <Dialog 
        open={showAllFilter} 
        onClose={setShowAllFilter} 
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
              <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-neutral-100">
                Filters
              </DialogTitle>
              <div className="absolute end-2 top-2">
                <ButtonClose onClick={() => setShowAllFilter(false)} />
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
                            filterOption={filterOption} 
                            checkedValues={checkedFilters}
                            onCheckboxChange={handleCheckboxChange}
                          />
                        )}
                        {filterOption.tabUIType === 'price-range' && (
                          <PriceRagePanel 
                            key={index} 
                            filterOption={filterOption}
                            currentPriceRange={priceRange}
                            onPriceChange={handlePriceRangeChange}
                          />
                        )}
                        {filterOption.tabUIType === 'select-number' && (
                          <NumberSelectPanel 
                            key={index} 
                            filterOption={filterOption}
                            currentValues={passengersBedsCount}
                            onValueChange={handlePassengersBaggageChange}
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
                setPassengersBedsCount({
                  Passengers: 1,
                  'Small Bags': 0,
                  'Large Bags': 0
                })
                // Reset Price Range to default values
                const priceRangeFilter = filterOptions.find(f => f?.tabUIType === 'price-range')
                if (priceRangeFilter) {
                  setPriceRange([priceRangeFilter.min, priceRangeFilter.max])
                }
              }} type="button">
                Clear All
              </ButtonThird>
              <ButtonPrimary type="submit" onClick={() => {
                console.log('🚨 APPLY FILTERS BUTTON CLICKED!')
                setShowAllFilter(false)
              }}>
                Apply filters
              </ButtonPrimary>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default TransferFilterTabs