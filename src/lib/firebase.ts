import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration for Web SDK
// Usa variáveis de ambiente (VITE_*) quando disponíveis (GitHub Actions),
// com fallback para valores diretos para desenvolvimento local.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REMOVED_SECRET",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "locaprancha.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "locaprancha",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "locaprancha.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "779406680946",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:779406680946:web:f8a3286f6da76d7ab473eb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-491BHV18M6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuth");

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
