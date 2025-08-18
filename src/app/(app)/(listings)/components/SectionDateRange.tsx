'use client'

import DatePickerCustomDay from '@/components/DatePickerCustomDay'
import DatePickerCustomHeaderTwoMonth from '@/components/DatePickerCustomHeaderTwoMonth'
import { Divider } from '@/shared/divider'
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { SectionHeading, SectionSubheading } from './SectionHeading'

interface SectionDateRangeProps {
  checkInDate?: string
  checkOutDate?: string
}

const SectionDateRange = ({ checkInDate, checkOutDate }: SectionDateRangeProps) => {
  // Initialize with search params or default dates
  const getInitialStartDate = () => {
    if (checkInDate) {
      const date = new Date(checkInDate)
      return isNaN(date.getTime()) ? new Date('2025/02/02') : date
    }
    return new Date('2025/02/02')
  }
  
  const getInitialEndDate = () => {
    if (checkOutDate) {
      const date = new Date(checkOutDate)
      return isNaN(date.getTime()) ? new Date('2025/02/06') : date
    }
    return new Date('2025/02/06')
  }

  const [startDate, setStartDate] = useState<Date | null>(getInitialStartDate())
  const [endDate, setEndDate] = useState<Date | null>(getInitialEndDate())

  // Update dates when props change
  useEffect(() => {
    if (checkInDate) {
      const date = new Date(checkInDate)
      if (!isNaN(date.getTime())) {
        setStartDate(date)
      }
    }
    if (checkOutDate) {
      const date = new Date(checkOutDate)
      if (!isNaN(date.getTime())) {
        setEndDate(date)
      }
    }
  }, [checkInDate, checkOutDate])

  const onChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <div className="listingSection__wrap">
      <div>
        <SectionHeading>Availability</SectionHeading>
        <SectionSubheading> Prices may increase on weekends or holidays</SectionSubheading>
      </div>
      <Divider className="w-14!" />

      <DatePicker
        selected={startDate}
        onChange={onChangeDate}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        monthsShown={2}
        showPopperArrow={false}
        inline
        renderCustomHeader={(props) => <DatePickerCustomHeaderTwoMonth {...props} />}
        renderDayContents={(day, date) => <DatePickerCustomDay dayOfMonth={day} date={date} />}
      />

      {/* inputs */}
      <input type="hidden" name="startDate" value={startDate ? startDate.toISOString() : ''} />
      <input type="hidden" name="endDate" value={endDate ? endDate.toISOString() : ''} />
    </div>
  )
}

export default SectionDateRange
