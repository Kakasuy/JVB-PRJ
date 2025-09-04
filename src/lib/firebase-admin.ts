import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Check if we have service account key
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  
  if (serviceAccount) {
    // Use service account key
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    })
  } else {
    // Fallback to default credentials (Google Cloud environment)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    })
  }
}

export const adminDb = admin.firestore()
export const adminAuth = admin.auth()

export default admin