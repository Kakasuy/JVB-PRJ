'use client'

import NcInputNumber from '@/components/NcInputNumber'
import clsx from 'clsx'
import { FC, useEffect, useState } from 'react'

interface HotelGuestsData {
  rooms: number
  adults: number
}

interface Props {
  defaultValue?: HotelGuestsData
  onChange?: (data: HotelGuestsData) => void
  className?: string
}

const HotelGuestsInput: FC<Props> = ({ defaultValue, onChange, className }) => {
  const [roomsInputValue, setRoomsInputValue] = useState(defaultValue?.rooms || 1)
  const [adultsInputValue, setAdultsInputValue] = useState(defaultValue?.adults || 1)

  useEffect(() => {
    setRoomsInputValue(defaultValue?.rooms || 1)
  }, [defaultValue?.rooms])
  
  useEffect(() => {
    setAdultsInputValue(defaultValue?.adults || 1)
  }, [defaultValue?.adults])

  const handleChangeData = (value: number, type: keyof HotelGuestsData) => {
    let newValue = {
      rooms: roomsInputValue,
      adults: adultsInputValue,
    }
    
    if (type === 'rooms') {
      setRoomsInputValue(value)
      newValue.rooms = value
    }
    if (type === 'adults') {
      setAdultsInputValue(value)
      newValue.adults = value
    }
    
    onChange && onChange(newValue)
  }

  return (
    <div className={clsx(`relative flex flex-col`, className)}>
      <h3 className="mb-5 block text-xl font-semibold sm:text-2xl">Rooms & Guests</h3>
      
      <NcInputNumber
        className="w-full"
        defaultValue={roomsInputValue}
        onChange={(value) => handleChangeData(value, 'rooms')}
        max={10}
        min={1}
        label="Rooms"
        inputName="rooms"
      />
      
      <NcInputNumber
        className="mt-6 w-full"
        defaultValue={adultsInputValue}
        onChange={(value) => handleChangeData(value, 'adults')}
        max={20}
        min={1}
        label="Adults"
        inputName="adults"
      />
    </div>
  )
}

export default HotelGuestsInput