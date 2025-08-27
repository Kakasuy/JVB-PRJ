import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  // TODO: Replace with your Firebase project config
  // Get these from Firebase Console > Project Settings > General > Your apps
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service  
export const db = getFirestore(app)

// Configure Firestore settings for better connectivity
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(async ({ initializeFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork }) => {
    try {
      // Try to enable network first
      await enableNetwork(db)
      console.log('Firestore network enabled successfully')
    } catch (error) {
      console.warn('Failed to enable Firestore network:', error)
      
      // Try to disable and re-enable network as fallback
      try {
        await disableNetwork(db)
        await enableNetwork(db)
        console.log('Firestore network reset successfully')
      } catch (resetError) {
        console.error('Failed to reset Firestore network:', resetError)
      }
    }
  })
}

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app)

export default app