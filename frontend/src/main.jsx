import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#064e3b', color: 'white' },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
