import { storage, auth } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const testStorageConnection = async () => {
  try {
    console.log('Testing Firebase Storage connection...')
    
    // Test Authentication
    const currentUser = auth.currentUser
    console.log('Current user:', currentUser?.email || 'Not authenticated')
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    // Create a test file
    const testData = new Blob(['Hello, Firebase Storage!'], { type: 'text/plain' })
    const testRef = ref(storage, `test/${currentUser.uid}/test.txt`)
    
    console.log('Testing Storage upload...')
    
    try {
      await uploadBytes(testRef, testData)
      console.log('Storage upload test: Success')
      
      // Test download URL
      const downloadURL = await getDownloadURL(testRef)
      console.log('Storage download URL test: Success', downloadURL)
      
      return { 
        success: true, 
        message: 'Firebase Storage test passed',
        downloadURL 
      }
    } catch (storageError: any) {
      console.error('Storage test error:', storageError)
      throw storageError
    }
  } catch (error: any) {
    console.error('Storage test failed:', error)
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    }
  }
}