'use client'

import DatePickerCustomDay from '@/components/DatePickerCustomDay'
import DatePickerCustomHeaderTwoMonth from '@/components/DatePickerCustomHeaderTwoMonth'
import T from '@/utils/getT'
import clsx from 'clsx'
import { FC, useState } from 'react'
import DatePicker from 'react-datepicker'

interface Props {
  className?: string
  onChange?: (value: [Date | null, Date | null]) => void
  defaultStartDate?: Date | null
  defaultEndDate?: Date | null
}

const StayDatesRangeInput: FC<Props> = ({ className, defaultEndDate, defaultStartDate, onChange }) => {
  // Default checkin: 2 days from today, checkout: 1 day after checkin
  const getDefaultStartDate = () => {
    if (defaultStartDate) return defaultStartDate
    const today = new Date()
    today.setDate(today.getDate() + 2)
    return today
  }
  
  const getDefaultEndDate = () => {
    if (defaultEndDate) return defaultEndDate
    const today = new Date()
    today.setDate(today.getDate() + 3) // 3 days from today = 1 day after checkin
    return today
  }

  const [startDate, setStartDate] = useState<Date | null>(getDefaultStartDate())
  const [endDate, setEndDate] = useState<Date | null>(getDefaultEndDate())

  const onChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    if (onChange) {
      onChange([start, end])
    }
  }

  return (
    <>
      <div className={clsx(className)}>
        <h3 className="block text-center text-xl font-semibold sm:text-2xl">
          {T['HeroSearchForm']["When's your trip?"]}
        </h3>
        <div className="relative z-10 flex shrink-0 justify-center py-5">
          <DatePicker
            selected={startDate}
            onChange={onChangeDate}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            monthsShown={2}
            showPopperArrow={false}
            inline
            renderCustomHeader={(p) => <DatePickerCustomHeaderTwoMonth {...p} />}
            renderDayContents={(day, date) => <DatePickerCustomDay dayOfMonth={day} date={date} />}
          />
        </div>
      </div>

      {/* input:hidde */}
      <input type="hidden" name="checkin" value={startDate ? startDate.toISOString().split('T')[0] : ''} />
      <input type="hidden" name="checkout" value={endDate ? endDate.toISOString().split('T')[0] : ''} />
    </>
  )
}

export default StayDatesRangeInput
