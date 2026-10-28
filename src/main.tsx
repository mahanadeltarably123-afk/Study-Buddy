import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

// Polyfill for process.env to prevent crashes in browser environments
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.process) window.process = { env: {} };
  // @ts-ignore
  if (!window.process.env) window.process.env = {};
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID"}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element");
}