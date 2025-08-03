'use client'

import { useInteractOutside } from '@/hooks/useInteractOutside'
import { useLocationSearch, LocationSuggestion } from '@/hooks/useLocationSearch'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import * as Headless from '@headlessui/react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import {
  BeachIcon,
  EiffelTowerIcon,
  HutIcon,
  LakeIcon,
  Location01Icon,
  TwinTowerIcon,
  Plane01Icon,
  Building02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react'
import clsx from 'clsx'
import _ from 'lodash'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { ClearDataButton } from './ClearDataButton'

type Suggest = {
  id: string
  name: string
  icon?: IconSvgElement
  displayName?: string
  type?: 'AIRPORT' | 'CITY'
}

const demoInitSuggests: Suggest[] = [
  {
    id: '1',
    name: 'Bangkok, Thailand',
    icon: HutIcon,
  },
  {
    id: '2',
    name: 'Ueno, Taito, Tokyo',
    icon: EiffelTowerIcon,
  },
  {
    id: '3',
    name: 'Ikebukuro, Toshima, Tokyo',
    icon: TwinTowerIcon,
  },
  {
    id: '4',
    name: 'San Diego, CA',
    icon: BeachIcon,
  },
  {
    id: '5',
    name: 'Humboldt Park, Chicago, IL',
    icon: LakeIcon,
  },
]

const demoSearchingSuggests: Suggest[] = [
  {
    id: '1',
    name: 'San Diego, CA',
  },
  {
    id: '2',
    name: 'Humboldt Park, Chicago, IL',
  },
  {
    id: '3',
    name: 'Bangor, Northern Ireland',
  },
  {
    id: '4',
    name: 'New York, NY, United States',
  },
  {
    id: '5',
    name: 'Los Angeles, CA, United States',
  },
]

const styles = {
  button: {
    base: 'relative z-10 shrink-0 w-full cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start',
    focused: 'rounded-full bg-transparent focus-visible:outline-hidden dark:bg-white/5 custom-shadow-1',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'py-3 px-7 xl:px-8',
  },
  input: {
    base: 'block w-full truncate border-none bg-transparent p-0 font-semibold placeholder-neutral-800 focus:placeholder-neutral-300 focus:ring-0 focus:outline-hidden dark:placeholder-neutral-200',
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'absolute start-0 top-full z-40 mt-3 hidden-scrollbar max-h-96  overflow-y-auto rounded-3xl bg-white py-3 shadow-xl transition duration-150 data-closed:translate-y-1 data-closed:opacity-0  dark:bg-neutral-800',
    default: 'w-lg sm:py-6',
    small: 'w-md sm:py-5',
  },
}

interface Props {
  placeholder?: string
  description?: string
  className?: string
  inputName?: string
  initSuggests?: Suggest[]
  searchingSuggests?: Suggest[]
  fieldStyle: 'default' | 'small'
  category?: 'stays' | 'car' | 'flight' | 'experience' | 'real-estate' // New prop to determine search context
}

export const LocationInputField: FC<Props> = ({
  placeholder = T['HeroSearchForm']['Location'],
  description = T['HeroSearchForm']['Where are you going?'],
  className = 'flex-1',
  inputName = 'location',
  initSuggests = demoInitSuggests,
  searchingSuggests = demoSearchingSuggests,
  fieldStyle = 'default',
  category = 'stays', // Default to stays
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showPopover, setShowPopover] = useState(false)
  const [selected, setSelected] = useState<Suggest | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // Hook for Amadeus location search
  const { suggestions, loading, error, searchLocations, clearSuggestions } = useLocationSearch()
  
  // Determine location type based on category
  const getLocationType = useCallback(() => {
    switch (category) {
      case 'stays':
      case 'real-estate':
        return 'CITY' // Only cities for accommodations and real estate
      case 'flight':
        return 'AIRPORT' // Only airports for flights
      case 'car':
      case 'experience':
      default:
        return 'ALL' // Both for car rentals and experiences
    }
  }, [category])

  useEffect(() => {
    const _inputFocusTimeOut = setTimeout(() => {
      if (showPopover && inputRef.current) {
        inputRef.current.focus()
      }
    }, 200)
    return () => {
      clearTimeout(_inputFocusTimeOut)
    }
  }, [showPopover])

  // for memoization of the close function
  const closePopover = useCallback(() => {
    setShowPopover(false)
  }, [])

  //  a custom hook that listens for clicks outside the container
  useInteractOutside(containerRef, closePopover)

  // Function to get icon based on location type
  const getLocationIcon = useCallback((suggestion: LocationSuggestion | Suggest): IconSvgElement => {
    if ('icon' in suggestion && suggestion.icon) return suggestion.icon
    if ('type' in suggestion) {
      switch (suggestion.type) {
        case 'AIRPORT':
          return Plane01Icon
        case 'CITY':
          return Building02Icon
        default:
          return Location01Icon
      }
    }
    return Location01Icon
  }, [])

  // Convert LocationSuggestion to Suggest format
  const convertToSuggest = useCallback((suggestion: LocationSuggestion): Suggest => ({
    id: suggestion.id,
    name: suggestion.displayName || suggestion.name,
    displayName: suggestion.displayName,
    type: suggestion.type,
    icon: getLocationIcon(suggestion),
  }), [getLocationIcon])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setShowPopover(true)
    
    if (value.length >= 2) {
      setIsSearching(true)
      const locationType = getLocationType()
      searchLocations(value, locationType)
      setSelected({
        id: Date.now().toString(),
        name: value,
      })
    } else {
      setIsSearching(false)
      clearSuggestions()
      if (value) {
        setSelected({
          id: Date.now().toString(),
          name: value,
        })
      }
    }
  }, [searchLocations, clearSuggestions, getLocationType])

  // Determine what suggestions to show
  const isShowInitSuggests = !selected?.id || (!isSearching && suggestions.length === 0)
  const apiSuggestions = suggestions.map(convertToSuggest)
  
  let suggestsToShow: Suggest[] = []
  if (isShowInitSuggests) {
    suggestsToShow = initSuggests
  } else if (isSearching && suggestions.length > 0) {
    suggestsToShow = apiSuggestions
  } else if (isSearching && suggestions.length === 0 && !loading) {
    // Show fallback suggestions when API returns no results
    suggestsToShow = searchingSuggests
  } else {
    suggestsToShow = searchingSuggests
  }
  return (
    <div
      className={`group relative z-10 flex ${className}`}
      ref={containerRef}
      {...(showPopover && {
        'data-open': 'true',
      })}
    >
      <Headless.Combobox
        value={selected}
        onChange={(value) => {
          setSelected(value || { id: '', name: '' })
          // Close the popover when a value is selected
          if (value?.id) {
            setShowPopover(false)
            setTimeout(() => {
              inputRef.current?.blur()
            }, 50)
          }
        }}
      >
        <div
          onMouseDown={() => setShowPopover(true)}
          onTouchStart={() => setShowPopover(true)}
          className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
        >
          {fieldStyle === 'default' && (
            <MapPinIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
          )}

          <div className="grow">
            <Headless.ComboboxInput
              ref={inputRef}
              aria-label="Search for a location"
              className={clsx(styles.input.base, styles.input[fieldStyle])}
              name={inputName}
              placeholder={placeholder}
              autoComplete="off"
              displayValue={(item?: Suggest) => item?.name || ''}
              onChange={handleInputChange}
            />
            <div className="mt-0.5 text-start text-sm font-light text-neutral-400">
              <span className="line-clamp-1">{description}</span>
            </div>

            <ClearDataButton
              className={clsx(!selected?.id && 'sr-only')}
              onClick={() => {
                setSelected({ id: '', name: '' })
                setShowPopover(false)
                setIsSearching(false)
                clearSuggestions()
                inputRef.current?.focus()
              }}
            />
          </div>
        </div>

        <Headless.Transition show={showPopover} unmount={false}>
          <div className={clsx(styles.panel.base, styles.panel[fieldStyle])}>
            {isShowInitSuggests && (
              <p className="mt-2 mb-3 px-4 text-xs/6 font-normal text-neutral-600 sm:mt-0 sm:px-8 dark:text-neutral-400">
                {T['HeroSearchForm']['Suggested locations']}
              </p>
            )}
            {isShowInitSuggests && <Divider className="opacity-50" />}
            
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="animate-spin h-4 w-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full"></div>
                  Searching locations...
                </div>
              </div>
            )}
            
            {/* Error state */}
            {error && !loading && (
              <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400 sm:px-8">
                {error}
              </div>
            )}
            
            {/* No results message */}
            {isSearching && !loading && suggestions.length === 0 && !error && (
              <div className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 sm:px-8">
                No locations found. Showing popular destinations instead.
              </div>
            )}
            
            <Headless.ComboboxOptions static unmount={false}>
              {suggestsToShow.map((item) => (
                <Headless.ComboboxOption
                  key={item.id}
                  value={item}
                  className="flex items-center gap-3 p-4 data-focus:bg-neutral-100 sm:gap-4.5 sm:px-8 dark:data-focus:bg-neutral-700"
                >
                  <HugeiconsIcon
                    icon={item.icon || Location01Icon}
                    className="size-4 text-neutral-400 sm:size-6 dark:text-neutral-500"
                  />
                  <div className="flex flex-col">
                    <span className="block font-medium text-neutral-700 dark:text-neutral-200">
                      {item.name}
                    </span>
                    {item.type && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.type === 'AIRPORT' ? 'Airport' : 'City'}
                      </span>
                    )}
                  </div>
                </Headless.ComboboxOption>
              ))}
            </Headless.ComboboxOptions>
          </div>
        </Headless.Transition>
      </Headless.Combobox>
    </div>
  )
}
