import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration for Web SDK
const firebaseConfig = {
  apiKey: "REMOVED_SECRET",
  authDomain: "locaprancha.firebaseapp.com",
  projectId: "locaprancha",
  storageBucket: "locaprancha.firebasestorage.app",
  messagingSenderId: "779406680946",
  appId: "1:779406680946:web:f8a3286f6da76d7ab473eb",
  measurementId: "G-491BHV18M6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuth');

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
