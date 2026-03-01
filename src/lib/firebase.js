// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCYTcCKMuFc2pCVwYiEyFIV-8RdyC89Me8",
  authDomain: "issuetrackingsystem-e9412.firebaseapp.com",
  projectId: "issuetrackingsystem-e9412",
  storageBucket: "issuetrackingsystem-e9412.firebasestorage.app",
  messagingSenderId: "118575131425",
  appId: "1:118575131425:web:aeaf8c012b39d6cf5aac60",
  measurementId: "G-53S6J7ZNGE"
};

// ⚠️ 登入後到 Firebase Console → Authentication → Users → 複製你的 UID 填在這
export const ADMIN_UID = "YOUR_GOOGLE_UID";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
