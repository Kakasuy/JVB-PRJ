import { UserService, UserProfile } from './UserService'

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export class ProfileService {

  // Upload avatar as Base64 và cập nhật user profile
  static async uploadAvatar(
    uid: string, 
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Validate file
      const validation = this.validateAvatarFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      onProgress?.({ progress: 10, status: 'uploading' })

      // Resize image before converting to Base64
      const resizedFile = await this.resizeImage(file, 200, 200, 0.8)
      
      onProgress?.({ progress: 40, status: 'uploading' })

      // Convert to Base64
      const base64String = await this.fileToBase64(resizedFile)
      
      onProgress?.({ progress: 70, status: 'uploading' })

      // Update user profile with Base64 avatar
      await UserService.updateUserProfile(uid, { 
        photoURL: base64String 
      })
      
      onProgress?.({ progress: 100, status: 'completed' })
      
      return base64String
    } catch (error) {
      console.error('Error uploading avatar:', error)
      onProgress?.({
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      })
      throw error
    }
  }

  // Convert file to Base64
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to Base64'))
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Validate avatar file
  static validateAvatarFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 2MB for Base64)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 2MB for Base64 storage' }
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, and WebP files are allowed' }
    }

    return { isValid: true }
  }

  // Delete old avatar (Base64 - no action needed)
  static async deleteAvatar(uid: string, avatarUrl: string): Promise<void> {
    // Base64 avatars are stored in Firestore, no separate deletion needed
    console.log('Base64 avatar will be replaced automatically')
  }

  // Resize image before upload (client-side)
  static async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(resizedFile)
            } else {
              resolve(file) // Fallback to original file
            }
          },
          file.type,
          quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Comprehensive profile update with validation
  static async updateCompleteProfile(
    uid: string, 
    profileData: Partial<UserProfile>,
    avatarFile?: File,
    onAvatarProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Validate profile data
      const validation = UserService.validateUserProfile(profileData)
      if (!validation.isValid) {
        return { success: false, errors: validation.errors }
      }

      let photoURL = profileData.photoURL

      // Upload new avatar if provided
      if (avatarFile) {
        // Upload new avatar (Base64)
        photoURL = await this.uploadAvatar(uid, avatarFile, onAvatarProgress)
      }

      // Update profile with new data
      await UserService.updateUserProfile(uid, {
        ...profileData,
        photoURL
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating complete profile:', error)
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      }
    }
  }

  // Generate profile completion percentage
  static calculateProfileCompletion(profile: UserProfile): number {
    const requiredFields = [
      'displayName', 'email', 'photoURL', 'phone', 
      'address', 'bio', 'gender', 'dateOfBirth'
    ]
    
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof UserProfile]
      return value && value !== ''
    })
    
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }
}