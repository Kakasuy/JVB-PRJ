'use client'

import { Description, Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Textarea from '@/shared/Textarea'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { MasterCardIcon, PaypalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import React from 'react'

const COUNTRIES = [
  { code: '+1', name: 'United States', iso: 'US' },
  { code: '+44', name: 'United Kingdom', iso: 'GB' },
  { code: '+49', name: 'Germany', iso: 'DE' },
  { code: '+33', name: 'France', iso: 'FR' },
  { code: '+84', name: 'Vietnam', iso: 'VN' },
  { code: '+86', name: 'China', iso: 'CN' },
  { code: '+81', name: 'Japan', iso: 'JP' },
  { code: '+82', name: 'South Korea', iso: 'KR' },
]

const TITLES = [
  { value: 'MR', label: 'Mr.' },
  { value: 'MRS', label: 'Mrs.' },
  { value: 'MS', label: 'Ms.' },
]

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  cvv?: string
}

const PayWith = () => {
  const [paymentMethod, setPaymentMethod] = React.useState('creditCard')
  
  // User Information
  const [title, setTitle] = React.useState('MR')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [countryCode, setCountryCode] = React.useState('+1')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  
  // Credit Card Information
  const [cardNumber, setCardNumber] = React.useState('')
  const [cardHolder, setCardHolder] = React.useState('')
  const [expiryDate, setExpiryDate] = React.useState('')
  const [cvv, setCvv] = React.useState('')
  
  // Validation
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isValidating, setIsValidating] = React.useState(false)
  
  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '')
  }
  
  const formatCardNumber = (card: string) => {
    const cleaned = card.replace(/\s/g, '')
    const match = cleaned.match(/.{1,4}/g)
    return match ? match.join(' ') : cleaned
  }
  
  const getCardVendor = (cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, '')
    if (num.startsWith('4')) return 'VISA'
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MASTERCARD'
    if (/^3[47]/.test(num)) return 'AMEX'
    if (/^6/.test(num)) return 'DISCOVER'
    return 'UNKNOWN'
  }
  
  const validateForm = () => {
    const newErrors: FormErrors = {}
    
    // User Information Validation
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    // Credit Card Validation
    if (paymentMethod === 'creditCard') {
      const cleanCard = cardNumber.replace(/\s/g, '')
      if (!cleanCard) {
        newErrors.cardNumber = 'Card number is required'
      } else if (cleanCard.length < 13 || cleanCard.length > 19) {
        newErrors.cardNumber = 'Please enter a valid card number'
      }
      
      if (!cardHolder.trim()) newErrors.cardHolder = 'Cardholder name is required'
      if (!expiryDate) {
        newErrors.expiryDate = 'Expiry date is required'
      } else {
        const today = new Date()
        const expiry = new Date(expiryDate)
        if (expiry <= today) {
          newErrors.expiryDate = 'Card has expired'
        }
      }
      if (!cvv.trim()) {
        newErrors.cvv = 'CVV is required'
      } else if (cvv.length < 3 || cvv.length > 4) {
        newErrors.cvv = 'Please enter a valid CVV'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setPhoneNumber(formatted)
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }))
    }
  }
  
  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value)
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardNumber(formatted)
      if (errors.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: undefined }))
      }
    }
  }
  
  React.useEffect(() => {
    if (firstName && lastName && !cardHolder) {
      setCardHolder(`${firstName} ${lastName}`.toUpperCase())
    }
  }, [firstName, lastName, cardHolder])

  return (
    <div className="pt-5">
      <h3 className="text-2xl font-semibold">Pay with</h3>
      <div className="my-5 w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

      <TabGroup
        className="mt-6"
        defaultIndex={1}
        onChange={(index) => {
          setPaymentMethod(index === 0 ? 'paypal' : 'creditCard')
        }}
      >
        <TabList className="my-5 flex gap-1 text-sm">
          <Tab className="flex items-center gap-x-2 rounded-full px-4 py-2.5 leading-none font-medium data-hover:bg-black/5 data-selected:bg-neutral-900 data-selected:text-white sm:px-6 dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900">
            Paypal
            <HugeiconsIcon icon={PaypalIcon} size={20} strokeWidth={1.5} />
          </Tab>
          <Tab className="flex items-center gap-x-2 rounded-full px-4 py-2.5 leading-none font-medium data-hover:bg-black/5 data-selected:bg-neutral-900 data-selected:text-white sm:px-6 dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900">
            <div className="flex items-center gap-x-2">
              Credit card
              <HugeiconsIcon icon={MasterCardIcon} size={20} strokeWidth={1.5} />
            </div>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel className="flex flex-col gap-y-5">
            <p className="text-neutral-500 dark:text-neutral-400">
              PayPal integration will be implemented in the next phase.
            </p>
          </TabPanel>
          
          <TabPanel className="flex flex-col gap-y-5">
            {/* User Information Section */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4">Contact Information</h4>
              
              {/* Title, First Name, Last Name */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-3">
                  <Field>
                    <Label>Title</Label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800"
                    >
                      {TITLES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="col-span-4">
                  <Field>
                    <Label>First Name *</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value)
                        if (errors.firstName) {
                          setErrors(prev => ({ ...prev, firstName: undefined }))
                        }
                      }}
                      className={`mt-1.5 ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </Field>
                </div>
                <div className="col-span-5">
                  <Field>
                    <Label>Last Name *</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value)
                        if (errors.lastName) {
                          setErrors(prev => ({ ...prev, lastName: undefined }))
                        }
                      }}
                      className={`mt-1.5 ${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </Field>
                </div>
              </div>

              {/* Email */}
              <Field>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }))
                    }
                  }}
                  className={`mt-1.5 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </Field>

              {/* Phone Number */}
              <Field>
                <Label>Phone Number *</Label>
                <div className="flex gap-2 mt-1.5">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="block w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.iso} value={country.code}>
                        {country.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`flex-1 ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="5551234567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </Field>
            </div>

            {/* Payment Information Section */}
            <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
              <h4 className="text-lg font-medium mb-4">Payment Information</h4>
              
              {/* Card Number */}
              <Field>
                <Label>Card Number *</Label>
                <div className="relative">
                  <Input
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className={`mt-1.5 pr-20 ${errors.cardNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={23}
                  />
                  {cardNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-neutral-500">
                      {getCardVendor(cardNumber)}
                    </div>
                  )}
                </div>
                {errors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                )}
              </Field>

              {/* Card Holder */}
              <Field>
                <Label>Cardholder Name *</Label>
                <Input
                  value={cardHolder}
                  onChange={(e) => {
                    setCardHolder(e.target.value)
                    if (errors.cardHolder) {
                      setErrors(prev => ({ ...prev, cardHolder: undefined }))
                    }
                  }}
                  className={`mt-1.5 ${errors.cardHolder ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="JOHN DOE"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.cardHolder && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>
                )}
              </Field>

              {/* Expiry Date and CVV */}
              <div className="flex gap-x-5">
                <Field>
                  <Label>Expiry Date *</Label>
                  <Input
                    type="month"
                    value={expiryDate}
                    onChange={(e) => {
                      setExpiryDate(e.target.value)
                      if (errors.expiryDate) {
                        setErrors(prev => ({ ...prev, expiryDate: undefined }))
                      }
                    }}
                    className={`mt-1.5 ${errors.expiryDate ? 'border-red-500 focus:border-red-500' : ''}`}
                    min={new Date().toISOString().slice(0, 7)}
                  />
                  {errors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                  )}
                </Field>
                <Field>
                  <Label>CVV *</Label>
                  <Input
                    type="password"
                    value={cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 4) {
                        setCvv(value)
                        if (errors.cvv) {
                          setErrors(prev => ({ ...prev, cvv: undefined }))
                        }
                      }
                    }}
                    className={`mt-1.5 ${errors.cvv ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="123"
                    maxLength={4}
                  />
                  {errors.cvv && (
                    <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                  )}
                </Field>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="firstName" value={firstName} />
      <input type="hidden" name="lastName" value={lastName} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={`${countryCode}${phoneNumber}`} />
      <input type="hidden" name="cardNumber" value={cardNumber.replace(/\s/g, '')} />
      <input type="hidden" name="cardHolder" value={cardHolder} />
      <input type="hidden" name="expiryDate" value={expiryDate} />
      <input type="hidden" name="cvv" value={cvv} />
      <input type="hidden" name="cardVendor" value={getCardVendor(cardNumber)} />
      
      {/* Expose validation function */}
      <input type="hidden" name="validatePaymentForm" value={JSON.stringify({ validateForm })} />
    </div>
  )
}

export default PayWith
