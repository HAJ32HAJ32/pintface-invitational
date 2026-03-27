import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD8mdR38nVRcWxhUQu8LGTfCOon9hrXGjI",
  authDomain: "pintface-invitational.firebaseapp.com",
  projectId: "pintface-invitational",
  storageBucket: "pintface-invitational.firebasestorage.app",
  messagingSenderId: "399330171672",
  appId: "1:399330171672:web:6e4ddfa3a13f0138e11c6d",
  measurementId: "G-E056RMFQ9N"
}

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const db = getFirestore(app)
export default app
