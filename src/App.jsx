// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import ClientePage from './components/ClientePage';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import ProtectedRoute from './components/ProtectedRoute'; // <-- 1. Importa el guardia
import { SpeedInsights } from "@vercel/speed-insights/react"
function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<ClientePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta protegida */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>  {/* <-- 2. Usa el guardia para proteger la puerta */}
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;