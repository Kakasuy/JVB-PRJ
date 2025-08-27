'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserService, UserProfile } from '@/services/UserService'
import { ProfileService, UploadProgress } from '@/services/ProfileService'
import { forceReconnectFirestore } from '@/lib/firebaseUtils'

export const useUserProfile = () => {
  const { currentUser, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<UploadProgress | null>(null)

  // Load user profile from Firestore with retry logic
  const loadProfile = async (retryCount = 0) => {
    if (!currentUser) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      let userProfile = await UserService.getUserProfile(currentUser.uid)
      
      // If profile doesn't exist, create it
      if (!userProfile) {
        await UserService.createUserProfile(currentUser)
        userProfile = await UserService.getUserProfile(currentUser.uid)
      }
      
      setProfile(userProfile)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      
      // If offline error and haven't retried yet, try to reconnect
      if ((err.code === 'unavailable' || err.message.includes('offline')) && retryCount < 2) {
        console.log(`Attempting to reconnect Firestore... (attempt ${retryCount + 1})`)
        
        const reconnected = await forceReconnectFirestore()
        if (reconnected) {
          // Wait a moment and retry
          setTimeout(() => loadProfile(retryCount + 1), 1000)
          return
        }
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      if (retryCount === 0) { // Only set loading false on initial attempt
        setLoading(false)
      }
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !profile) return

    try {
      setUpdating(true)
      setError(null)
      
      await UserService.updateUserProfile(currentUser.uid, updates)
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      return { success: true }
    } catch (err) {
      console.error('Error updating profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setUpdating(false)
    }
  }

  // Update complete profile with avatar
  const updateCompleteProfile = async (profileData: Partial<UserProfile>, avatarFile?: File) => {
    if (!currentUser) return { success: false, errors: ['User not authenticated'] }

    try {
      setUpdating(true)
      setError(null)
      setAvatarUploadProgress(null)

      const result = await ProfileService.updateCompleteProfile(
        currentUser.uid,
        profileData,
        avatarFile,
        (progress) => setAvatarUploadProgress(progress)
      )

      if (result.success) {
        // Reload profile to get updated data
        await loadProfile()
        setAvatarUploadProgress(null)
      } else {
        setError(result.errors?.join(', ') || 'Update failed')
      }

      return result
    } catch (err) {
      console.error('Error updating complete profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { success: false, errors: [errorMessage] }
    } finally {
      setUpdating(false)
    }
  }

  // Get profile completion percentage
  const getProfileCompletion = () => {
    if (!profile) return 0
    return ProfileService.calculateProfileCompletion(profile)
  }

  // Load profile when user changes
  useEffect(() => {
    if (!authLoading) {
      loadProfile()
    }
  }, [currentUser, authLoading])

  // Simple field update method
  const updateSingleField = async (field: keyof UserProfile, value: any) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' }

    try {
      setError(null)
      await UserService.updateUserProfile(currentUser.uid, { [field]: value })
      
      // Update local state
      setProfile(prev => prev ? { ...prev, [field]: value } : null)
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return {
    profile,
    loading: loading || authLoading,
    error,
    updating,
    avatarUploadProgress,
    updateProfile,
    updateSingleField,
    updateCompleteProfile,
    refreshProfile: loadProfile,
    profileCompletion: getProfileCompletion(),
  }
}