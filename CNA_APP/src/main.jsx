import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/style.css';

// 🔍 RUNTIME ENVIRONMENT DIAGNOSTICS - Show what was embedded during build
console.log('🔍 FRONTEND RUNTIME ENVIRONMENT DIAGNOSTICS');
console.log('==========================================');
console.log('📅 Runtime:', new Date().toISOString());
console.log('🌍 MODE:', import.meta.env.MODE);
console.log('🏗️ PROD:', import.meta.env.PROD);
console.log('🛠️ DEV:', import.meta.env.DEV);
console.log('');
console.log('🔧 VITE ENVIRONMENT VARIABLES (embedded at build time):');
console.log('-------------------------------------------------------');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_ENV:', import.meta.env.VITE_ENV);
console.log('');
console.log('🌐 ALL IMPORT.META.ENV VARIABLES:');
console.log('--------------------------------');
console.log(import.meta.env);
console.log('==========================================');

// This is the injection:
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
