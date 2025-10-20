// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './AuthContext.jsx'; // <-- 1. Importa el proveedor

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- 2. Envuelve tu App con el proveedor */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)