import { db } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore'
import { User } from 'firebase/auth'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phone?: string
  address?: string
  bio?: string
  gender?: 'Male' | 'Female' | 'Other'
  dateOfBirth?: string
  languages?: string[]
  handle?: string // Unique handle for author profile URL
  preferences?: {
    currency: string
    language: string
    notifications: boolean
  }
  createdAt?: any
  updatedAt?: any
}

export class UserService {
  // Tạo user profile mới từ Firebase Auth user
  static async createUserProfile(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid)
      
      // Check if user already exists
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        return // User already exists, no need to create
      }

      // Generate unique handle from displayName or email
      const handle = await this.generateUniqueHandle(
        user.displayName || user.email?.split('@')[0] || user.uid
      )

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        handle,
        preferences: {
          currency: 'USD',
          language: 'en',
          notifications: true
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await setDoc(userRef, userProfile)
      console.log('User profile created successfully')
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  // Lấy user profile từ Firestore
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile
      } else {
        console.log('No user profile found')
        return null
      }
    } catch (error: any) {
      console.error('Error getting user profile:', error)
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
      }
      
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please make sure you are logged in.')
      }
      
      throw error
    }
  }

  // Cập nhật user profile
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid)
      
      // Remove uid from updates to avoid overwriting
      const { uid: _, createdAt, ...safeUpdates } = updates
      
      await updateDoc(userRef, {
        ...safeUpdates,
        updatedAt: serverTimestamp()
      })
      
      console.log('User profile updated successfully')
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  // Tạo unique handle cho author profile URL
  static async generateUniqueHandle(baseName: string): Promise<string> {
    try {
      // Clean the base name
      let handle = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      if (!handle) handle = 'user'
      
      let suffix = 0
      let finalHandle = handle
      
      // Check if handle exists, if yes, add suffix
      while (await this.handleExists(finalHandle)) {
        suffix++
        finalHandle = `${handle}-${suffix}`
      }
      
      return finalHandle
    } catch (error) {
      console.error('Error generating unique handle:', error)
      return `user-${Date.now()}`
    }
  }

  // Kiểm tra handle đã tồn tại chưa
  static async handleExists(handle: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('handle', '==', handle))
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking handle existence:', error)
      return true // Return true to be safe
    }
  }

  // Lấy user profile bằng handle (cho author page)
  static async getUserByHandle(handle: string): Promise<UserProfile | null> {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('handle', '==', handle))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return doc.data() as UserProfile
      }
      
      return null
    } catch (error) {
      console.error('Error getting user by handle:', error)
      throw error
    }
  }

  // Validate user profile data
  static validateUserProfile(profile: Partial<UserProfile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.push('Invalid email format')
    }
    
    if (profile.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(profile.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid phone number format')
    }
    
    if (profile.displayName && (profile.displayName.length < 2 || profile.displayName.length > 50)) {
      errors.push('Display name must be between 2 and 50 characters')
    }
    
    if (profile.bio && profile.bio.length > 500) {
      errors.push('Bio must not exceed 500 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}