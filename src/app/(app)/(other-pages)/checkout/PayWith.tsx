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
  { value: 'DR', label: 'Dr.' },
]

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
}

interface ValidationState {
  firstName: 'valid' | 'invalid' | 'initial'
  lastName: 'valid' | 'invalid' | 'initial'
  email: 'valid' | 'invalid' | 'initial'
  phone: 'valid' | 'invalid' | 'initial'
  cardNumber: 'valid' | 'invalid' | 'initial'
  cardHolder: 'valid' | 'invalid' | 'initial'
  expiryDate: 'valid' | 'invalid' | 'initial'
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
  
  // Validation
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [validationStates, setValidationStates] = React.useState<ValidationState>({
    firstName: 'initial',
    lastName: 'initial',
    email: 'initial',
    phone: 'initial',
    cardNumber: 'initial',
    cardHolder: 'initial',
    expiryDate: 'initial'
  })
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
    if (num.startsWith('4')) return 'VI' // Visa
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MC' // Mastercard
    if (/^3[47]/.test(num)) return 'AX' // American Express
    if (/^6/.test(num)) return 'DC' // Discover
    return 'VI' // Default to Visa for Amadeus compatibility
  }

  // Luhn Algorithm for credit card validation
  const validateCardLuhn = (cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, '')
    if (num.length < 13 || num.length > 19) return false
    
    const digits = num.split('').map(Number)
    let sum = 0
    let isEven = false
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i]
      
      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }

  // Enhanced email validation
  const validateEmail = (email: string) => {
    if (!email.trim()) return false
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  // Enhanced phone validation
  const validatePhoneNumber = (phone: string, countryCode: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned) return false
    
    // Basic length validation based on country
    switch (countryCode) {
      case '+1': // US/Canada
        return cleaned.length === 10
      case '+44': // UK
        return cleaned.length >= 10 && cleaned.length <= 11
      case '+84': // Vietnam
        return cleaned.length >= 9 && cleaned.length <= 11
      default:
        return cleaned.length >= 8 && cleaned.length <= 15
    }
  }

  // Real-time field validation
  const validateField = (fieldName: keyof ValidationState, value: string, additionalParam?: string) => {
    let isValid = false
    let errorMessage = ''

    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        isValid = value.trim().length >= 1
        errorMessage = isValid ? '' : `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`
        break
      
      case 'email':
        isValid = validateEmail(value)
        errorMessage = !value.trim() ? 'Email is required' : 
                     isValid ? '' : 'Please enter a valid email address'
        break
      
      case 'phone':
        isValid = validatePhoneNumber(value, additionalParam || '+1')
        errorMessage = !value.trim() ? 'Phone number is required' : 
                     isValid ? '' : 'Please enter a valid phone number'
        break
      
      case 'cardNumber':
        isValid = validateCardLuhn(value)
        errorMessage = !value.trim() ? 'Card number is required' : 
                     isValid ? '' : 'Please enter a valid card number'
        break
      
      case 'cardHolder':
        isValid = value.trim().length >= 2
        errorMessage = isValid ? '' : 'Cardholder name is required'
        break
      
      case 'expiryDate':
        if (!value) {
          errorMessage = 'Expiry date is required'
        } else {
          const today = new Date()
          const expiry = new Date(value + '-01')
          isValid = expiry > today
          errorMessage = isValid ? '' : 'Card has expired'
        }
        break
    }

    return { isValid, errorMessage }
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
        const expiry = new Date(expiryDate + '-01') // Add day to make valid date
        if (expiry <= today) {
          newErrors.expiryDate = 'Card has expired'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Real-time validation handlers
  const handleFieldValidation = (fieldName: keyof ValidationState, value: string, additionalParam?: string) => {
    const { isValid, errorMessage } = validateField(fieldName, value, additionalParam)
    
    setValidationStates(prev => ({
      ...prev,
      [fieldName]: isValid ? 'valid' : 'invalid'
    }))
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }))
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setPhoneNumber(formatted)
  }
  
  const handlePhoneBlur = () => {
    handleFieldValidation('phone', phoneNumber, countryCode)
  }
  
  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value)
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardNumber(formatted)
    }
  }
  
  const handleCardNumberBlur = () => {
    handleFieldValidation('cardNumber', cardNumber)
  }
  
  // Helper function to get input CSS classes based on validation state
  const getInputClasses = (fieldName: keyof ValidationState, hasError: boolean) => {
    const baseClasses = 'mt-1.5'
    const state = validationStates[fieldName]
    
    if (hasError || state === 'invalid') {
      return `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500`
    } else if (state === 'valid') {
      return `${baseClasses} border-green-500 focus:border-green-500 focus:ring-green-500`
    }
    
    return baseClasses
  }

  // Validation icon component
  const ValidationIcon = ({ fieldName }: { fieldName: keyof ValidationState }) => {
    const state = validationStates[fieldName]
    
    if (state === 'valid') {
      return (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )
    } else if (state === 'invalid') {
      return (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    
    return null
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
                    <div className="relative">
                      <Input
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value)
                          if (errors.firstName) {
                            setErrors(prev => ({ ...prev, firstName: undefined }))
                          }
                        }}
                        onBlur={() => handleFieldValidation('firstName', firstName)}
                        className={getInputClasses('firstName', !!errors.firstName)}
                        placeholder="John"
                      />
                      <ValidationIcon fieldName="firstName" />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </Field>
                </div>
                <div className="col-span-5">
                  <Field>
                    <Label>Last Name *</Label>
                    <div className="relative">
                      <Input
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value)
                          if (errors.lastName) {
                            setErrors(prev => ({ ...prev, lastName: undefined }))
                          }
                        }}
                        onBlur={() => handleFieldValidation('lastName', lastName)}
                        className={getInputClasses('lastName', !!errors.lastName)}
                        placeholder="Doe"
                      />
                      <ValidationIcon fieldName="lastName" />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </Field>
                </div>
              </div>

              {/* Email */}
              <Field>
                <Label>Email Address *</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: undefined }))
                      }
                    }}
                    onBlur={() => handleFieldValidation('email', email)}
                    className={getInputClasses('email', !!errors.email)}
                    placeholder="john.doe@example.com"
                  />
                  <ValidationIcon fieldName="email" />
                </div>
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
                  <div className="relative flex-1">
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      className={getInputClasses('phone', !!errors.phone)}
                      placeholder="5551234567"
                    />
                    <ValidationIcon fieldName="phone" />
                  </div>
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
                    onBlur={handleCardNumberBlur}
                    className={`${getInputClasses('cardNumber', !!errors.cardNumber)} pr-20`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={23}
                  />
                  {cardNumber && validationStates.cardNumber !== 'valid' && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs font-medium text-neutral-500">
                      {getCardVendor(cardNumber)}
                    </div>
                  )}
                  {cardNumber && validationStates.cardNumber === 'valid' && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs font-medium text-green-600">
                      {getCardVendor(cardNumber)} ✓
                    </div>
                  )}
                  <ValidationIcon fieldName="cardNumber" />
                </div>
                {errors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                )}
              </Field>

              {/* Card Holder */}
              <Field>
                <Label>Cardholder Name *</Label>
                <div className="relative">
                  <Input
                    value={cardHolder}
                    onChange={(e) => {
                      setCardHolder(e.target.value)
                      if (errors.cardHolder) {
                        setErrors(prev => ({ ...prev, cardHolder: undefined }))
                      }
                    }}
                    onBlur={() => handleFieldValidation('cardHolder', cardHolder)}
                    className={getInputClasses('cardHolder', !!errors.cardHolder)}
                    placeholder="JOHN DOE"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <ValidationIcon fieldName="cardHolder" />
                </div>
                {errors.cardHolder && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>
                )}
              </Field>

              {/* Expiry Date */}
              <div className="max-w-xs">
                <Field>
                  <Label>Expiry Date *</Label>
                  <div className="relative">
                    <Input
                      type="month"
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value)
                        if (errors.expiryDate) {
                          setErrors(prev => ({ ...prev, expiryDate: undefined }))
                        }
                      }}
                      onBlur={() => handleFieldValidation('expiryDate', expiryDate)}
                      className={getInputClasses('expiryDate', !!errors.expiryDate)}
                      min={new Date().toISOString().slice(0, 7)}
                    />
                    <ValidationIcon fieldName="expiryDate" />
                  </div>
                  {errors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                  )}
                  <Description className="mt-1.5">
                    CVV not required - secure processing through Amadeus
                  </Description>
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
      <input type="hidden" name="cardVendor" value={getCardVendor(cardNumber)} />
      
      {/* Expose validation function */}
      <input type="hidden" name="validatePaymentForm" value={JSON.stringify({ validateForm })} />
    </div>
  )
}

export default PayWith
