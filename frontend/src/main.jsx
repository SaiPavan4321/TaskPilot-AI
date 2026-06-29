import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

const initApp = async () => {
  let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        clientId = config.GOOGLE_CLIENT_ID;
      }
    } catch (error) {
      console.error('Failed to fetch runtime config:', error);
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={clientId || ""}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

initApp();
