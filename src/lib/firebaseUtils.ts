import { db } from './firebase'
import { enableNetwork, disableNetwork } from 'firebase/firestore'

export const forceReconnectFirestore = async (): Promise<boolean> => {
  try {
    console.log('Force reconnecting Firestore...')
    
    // Disable network first
    await disableNetwork(db)
    console.log('Firestore network disabled')
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Re-enable network
    await enableNetwork(db)
    console.log('Firestore network re-enabled')
    
    return true
  } catch (error) {
    console.error('Failed to reconnect Firestore:', error)
    return false
  }
}

export const checkFirestoreConnectivity = async (): Promise<boolean> => {
  try {
    // Simple connectivity test using a lightweight operation
    const { doc, getDoc } = await import('firebase/firestore')
    const testRef = doc(db, '_test_', 'connectivity')
    
    await getDoc(testRef)
    return true
  } catch (error: any) {
    console.warn('Firestore connectivity check failed:', error.code)
    return false
  }
}

export const initializeFirestoreWithRetry = async (): Promise<void> => {
  const maxRetries = 3
  let retryCount = 0
  
  while (retryCount < maxRetries) {
    try {
      const isConnected = await checkFirestoreConnectivity()
      if (isConnected) {
        console.log('Firestore connected successfully')
        return
      }
      
      // Try to reconnect
      const reconnected = await forceReconnectFirestore()
      if (reconnected) {
        return
      }
      
    } catch (error) {
      console.warn(`Firestore connection attempt ${retryCount + 1} failed:`, error)
    }
    
    retryCount++
    if (retryCount < maxRetries) {
      console.log(`Retrying Firestore connection in 2 seconds... (${retryCount}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  console.error('Failed to connect to Firestore after all retries')
}