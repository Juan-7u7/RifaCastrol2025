// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './AuthContext.jsx';
import { SpeedInsights } from "@vercel/speed-insights/react" 
import { Analytics } from "@vercel/analytics/react"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <SpeedInsights /> {/* <-- Colócalo aquí, junto a App */}
        <Analytics/>
      </AuthProvider>
    </BrowserRouter>
    {/* <SpeedInsights/> Quítalo de aquí fuera */}
  </React.StrictMode>,
)