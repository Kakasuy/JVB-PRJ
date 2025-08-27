import { db, auth } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...')
    
    // Test Authentication
    const currentUser = auth.currentUser
    console.log('Current user:', currentUser?.email || 'Not authenticated')
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    // Test Firestore read
    const testDoc = doc(db, 'test', 'connection')
    console.log('Testing Firestore read...')
    
    try {
      const docSnap = await getDoc(testDoc)
      console.log('Firestore read test:', docSnap.exists() ? 'Success' : 'Document not found (normal)')
    } catch (readError: any) {
      console.error('Firestore read error:', readError)
      throw readError
    }
    
    // Test Firestore write
    console.log('Testing Firestore write...')
    try {
      await setDoc(testDoc, { 
        timestamp: new Date().toISOString(),
        uid: currentUser.uid 
      })
      console.log('Firestore write test: Success')
    } catch (writeError: any) {
      console.error('Firestore write error:', writeError)
      throw writeError
    }
    
    return { success: true, message: 'All Firebase tests passed' }
  } catch (error: any) {
    console.error('Firebase test failed:', error)
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    }
  }
}