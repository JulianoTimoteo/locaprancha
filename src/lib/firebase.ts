import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const requiredKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = requiredKeys.filter((key) => !import.meta.env[key]);
if (missing.length > 0) {
  console.error("[FIREBASE] Missing required env vars:", missing);
}

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"],
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: import.meta.env["VITE_FIREBASE_APP_ID"],
  measurementId: import.meta.env["VITE_FIREBASE_MEASUREMENT_ID"],
};

console.log("[FIREBASE] apiKey usada:", firebaseConfig.apiKey);

const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuth");

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
