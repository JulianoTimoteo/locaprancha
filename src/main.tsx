import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthContext";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { initAppPersistence } from "./lib/utils/storage";
import "./styles.css";


// Iniciar persistência e limpar dados antigos se necessário
try {
  initAppPersistence();
} catch (e) {
  console.error("Persistence init failed:", e);
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary area="Root">
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  
  // Ocultar loader de emergência após renderização bem-sucedida
  const loader = document.getElementById('emergency-loader');
  if (loader) loader.style.display = 'none';
}
