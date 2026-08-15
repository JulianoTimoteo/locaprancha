import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration for Web SDK
// Usa variáveis de ambiente (VITE_*) quando disponíveis (GitHub Actions),
// com fallback para valores diretos para desenvolvimento local.
const requiredEnv = (key: string) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const isDev = import.meta.env.DEV;

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID"),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (isDev) {
  console.warn(
    "[FIREBASE] Usando configuração do .env. Se a API key for inválida, gere uma nova no Firebase Console.",
  );
}

export const DEV_MOCK_API_KEY =
  "BJlogN89e6jT7Yf87ZuU5qGsoFL0xhx8J9attfodSIMLML30pvmiE-K4VFfdgfrC20Kwlr8mhxNJOeYXnHoQ8LU";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuth");

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
