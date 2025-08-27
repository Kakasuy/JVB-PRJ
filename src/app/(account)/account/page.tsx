'use client'

import { ImageAdd02Icon } from '@/components/Icons'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useAuth } from '@/contexts/AuthContext'
import Avatar from '@/shared/Avatar'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Divider } from '@/shared/divider'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import T from '@/utils/getT'
import { useState, useRef } from 'react'
import { UserProfile } from '@/services/UserService'
import { testFirebaseConnection } from '@/lib/firebaseTest'
import { forceReconnectFirestore } from '@/lib/firebaseUtils'
import { testStorageConnection } from '@/lib/storageTest'
import FieldWithSaveButton from '@/components/FieldWithSaveButton'
import clsx from 'clsx'

const AccountPage = () => {
  const { currentUser } = useAuth()
  const { 
    profile, 
    loading, 
    error, 
    updating, 
    avatarUploadProgress, 
    updateSingleField,
    updateCompleteProfile,
    profileCompletion 
  } = useUserProfile()
  
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [fieldValues, setFieldValues] = useState<Partial<UserProfile>>({})
  const [fieldUpdating, setFieldUpdating] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [fieldSuccess, setFieldSuccess] = useState<Record<string, boolean>>({})
  const [avatarError, setAvatarError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle avatar selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedAvatar(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Handle field input changes
  const handleFieldChange = (field: keyof UserProfile, value: any) => {
    setFieldValues(prev => ({ ...prev, [field]: value }))
    // Clear previous error/success for this field
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setFieldSuccess(prev => ({ ...prev, [field]: false }))
  }

  // Check if field has been modified
  const isFieldModified = (field: keyof UserProfile, currentValue: any) => {
    const profileValue = profile?.[field]
    const fieldValue = fieldValues[field] !== undefined ? fieldValues[field] : currentValue
    return fieldValue !== profileValue
  }

  // Update single field
  const updateField = async (field: keyof UserProfile, value: any) => {
    if (!currentUser) return

    setFieldUpdating(prev => ({ ...prev, [field]: true }))
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setFieldSuccess(prev => ({ ...prev, [field]: false }))

    try {
      const result = await updateSingleField(field, value)
      
      if (result.success) {
        setFieldSuccess(prev => ({ ...prev, [field]: true }))
        setFieldValues(prev => ({ ...prev, [field]: undefined })) // Clear modified state
        
        // Clear success indicator after 2 seconds
        setTimeout(() => {
          setFieldSuccess(prev => ({ ...prev, [field]: false }))
        }, 2000)
      } else {
        setFieldErrors(prev => ({ 
          ...prev, 
          [field]: result.error || 'Update failed' 
        }))
      }
    } catch (err) {
      setFieldErrors(prev => ({ 
        ...prev, 
        [field]: err instanceof Error ? err.message : 'Update failed' 
      }))
    } finally {
      setFieldUpdating(prev => ({ ...prev, [field]: false }))
    }
  }

  // Handle avatar update
  const handleAvatarUpdate = async () => {
    if (!currentUser || !selectedAvatar) return

    setAvatarError('')

    try {
      const result = await updateCompleteProfile({}, selectedAvatar)
      
      if (result.success) {
        setSelectedAvatar(null)
        setPreviewUrl('')
        setAvatarError('')
      } else {
        setAvatarError(result.errors?.join(', ') || 'Avatar upload failed')
      }
    } catch (err: any) {
      console.error('Avatar update failed:', err)
      setAvatarError(err.message || 'Avatar upload failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold">Error loading profile:</h3>
          <p>{error}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-3">Try these fixes:</h4>
          <div className="space-x-2">
            <button 
              onClick={async () => {
                const result = await forceReconnectFirestore()
                if (result) {
                  alert('Reconnected successfully! Refreshing page...')
                  window.location.reload()
                } else {
                  alert('Failed to reconnect. Please refresh the page manually.')
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Force Reconnect
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Refresh Page
            </button>
            
            <button 
              onClick={async () => {
                const result = await testFirebaseConnection()
                console.log('Firebase test result:', result)
                alert(JSON.stringify(result, null, 2))
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Test Firestore
            </button>
            
            <button 
              onClick={async () => {
                const result = await testStorageConnection()
                console.log('Storage test result:', result)
                alert(JSON.stringify(result, null, 2))
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test Storage
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentAvatar = previewUrl || profile?.photoURL || ''
  const displayName = fieldValues.displayName ?? profile?.displayName ?? ''
  const email = fieldValues.email ?? profile?.email ?? currentUser?.email ?? ''
  const phone = fieldValues.phone ?? profile?.phone ?? ''
  const address = fieldValues.address ?? profile?.address ?? ''
  const bio = fieldValues.bio ?? profile?.bio ?? ''
  const gender = fieldValues.gender ?? profile?.gender ?? ''
  const dateOfBirth = fieldValues.dateOfBirth ?? profile?.dateOfBirth ?? ''

  return (
    <div>
      {/* HEADING */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{T['accountPage']['Account information']}</h1>
        <div className="text-sm text-neutral-600">
          Profile completion: <span className="font-semibold text-primary-600">{profileCompletion}%</span>
        </div>
      </div>

      <Divider className="my-8 w-14!" />

      <div className="flex flex-col md:flex-row">
        <div className="flex shrink-0 items-start">
          <div className="relative flex overflow-hidden rounded-full">
            <Avatar src={currentAvatar} className="h-32 w-32" />
            <div 
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 text-neutral-50 hover:bg-black/70 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageAdd02Icon className="h-6 w-6" />
              <span className="mt-1 text-xs">{T['accountPage']['Change Image']}</span>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden" 
              onChange={handleAvatarSelect}
            />
          </div>
          
          {/* Avatar Upload Progress & Save Button */}
          {avatarUploadProgress && (
            <div className="mt-2 w-32">
              <div className="text-xs text-center mb-1">
                {avatarUploadProgress.status === 'uploading' && `Uploading... ${Math.round(avatarUploadProgress.progress)}%`}
                {avatarUploadProgress.status === 'completed' && 'Upload completed!'}
                {avatarUploadProgress.status === 'error' && 'Upload failed'}
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1">
                <div 
                  className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${avatarUploadProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Save Avatar Button - show when image is selected */}
          {selectedAvatar && (
            <div className="mt-3 space-y-2">
              <button
                onClick={handleAvatarUpdate}
                disabled={updating}
                className={clsx(
                  'w-32 px-3 py-2 text-sm rounded-md transition-colors',
                  updating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                )}
              >
                {updating ? 'Saving...' : 'Save Avatar'}
              </button>
              
              {avatarError && (
                <div className="w-full text-xs text-red-600 bg-red-50 p-2 rounded">
                  {avatarError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 max-w-3xl grow space-y-6 md:mt-0 md:ps-16">
          <FieldWithSaveButton
            label={T['accountPage']['Name']}
            isModified={isFieldModified('displayName', displayName)}
            isUpdating={fieldUpdating.displayName || false}
            hasError={!!fieldErrors.displayName}
            hasSuccess={fieldSuccess.displayName || false}
            errorMessage={fieldErrors.displayName}
            onSave={() => updateField('displayName', displayName)}
          >
            <Input 
              value={displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFieldModified('displayName', displayName)) {
                  updateField('displayName', displayName)
                }
              }}
              placeholder="Enter your name"
            />
          </FieldWithSaveButton>

          <FieldWithSaveButton
            label={T['accountPage']['Gender']}
            isModified={isFieldModified('gender', gender)}
            isUpdating={fieldUpdating.gender || false}
            hasError={!!fieldErrors.gender}
            hasSuccess={fieldSuccess.gender || false}
            errorMessage={fieldErrors.gender}
            onSave={() => updateField('gender', gender)}
          >
            <Select 
              value={gender}
              onChange={(e) => {
                const newValue = e.target.value as 'Male' | 'Female' | 'Other'
                handleFieldChange('gender', newValue)
              }}
            >
              <option value="">Select Gender</option>
              <option value="Male">{T['accountPage']['Male']}</option>
              <option value="Female">{T['accountPage']['Female']}</option>
              <option value="Other">{T['accountPage']['Other']}</option>
            </Select>
          </FieldWithSaveButton>

          <FieldWithSaveButton
            label={T['accountPage']['Email']}
            isModified={isFieldModified('email', email)}
            isUpdating={fieldUpdating.email || false}
            hasError={!!fieldErrors.email}
            hasSuccess={fieldSuccess.email || false}
            errorMessage={fieldErrors.email}
            onSave={() => updateField('email', email)}
          >
            <Input 
              type="email"
              value={email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFieldModified('email', email)) {
                  updateField('email', email)
                }
              }}
              placeholder="Enter your email"
            />
          </FieldWithSaveButton>

          <div className="max-w-lg">
            <FieldWithSaveButton
              label={T['accountPage']['Date of birth']}
              isModified={isFieldModified('dateOfBirth', dateOfBirth)}
              isUpdating={fieldUpdating.dateOfBirth || false}
              hasError={!!fieldErrors.dateOfBirth}
              hasSuccess={fieldSuccess.dateOfBirth || false}
              errorMessage={fieldErrors.dateOfBirth}
              onSave={() => updateField('dateOfBirth', dateOfBirth)}
            >
              <Input 
                type="date" 
                value={dateOfBirth}
                onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
              />
            </FieldWithSaveButton>
          </div>

          <FieldWithSaveButton
            label={T['accountPage']['Addess']}
            isModified={isFieldModified('address', address)}
            isUpdating={fieldUpdating.address || false}
            hasError={!!fieldErrors.address}
            hasSuccess={fieldSuccess.address || false}
            errorMessage={fieldErrors.address}
            onSave={() => updateField('address', address)}
          >
            <Input 
              value={address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFieldModified('address', address)) {
                  updateField('address', address)
                }
              }}
              placeholder="Enter your address"
            />
          </FieldWithSaveButton>

          <FieldWithSaveButton
            label={T['accountPage']['Phone number']}
            isModified={isFieldModified('phone', phone)}
            isUpdating={fieldUpdating.phone || false}
            hasError={!!fieldErrors.phone}
            hasSuccess={fieldSuccess.phone || false}
            errorMessage={fieldErrors.phone}
            onSave={() => updateField('phone', phone)}
          >
            <Input 
              type="tel"
              value={phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFieldModified('phone', phone)) {
                  updateField('phone', phone)
                }
              }}
              placeholder="Enter your phone number"
            />
          </FieldWithSaveButton>

          <FieldWithSaveButton
            label={T['accountPage']['About you']}
            isModified={isFieldModified('bio', bio)}
            isUpdating={fieldUpdating.bio || false}
            hasError={!!fieldErrors.bio}
            hasSuccess={fieldSuccess.bio || false}
            errorMessage={fieldErrors.bio}
            onSave={() => updateField('bio', bio)}
          >
            <Textarea 
              value={bio}
              onChange={(e) => handleFieldChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </FieldWithSaveButton>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
