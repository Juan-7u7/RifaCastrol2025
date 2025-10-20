// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // <-- Importa el hook para escuchar

function ProtectedRoute({ children }) {
    const { session, loading } = useAuth(); // <-- Obtiene la info del locutor central

    if (loading) {
        return <div>Verificando sesión...</div>; // Muestra esto mientras se confirma la sesión
    }

    if (!session) {
        // Si no hay sesión, redirige al login
        return <Navigate to="/login" replace />;
    }

    // Si hay sesión, deja pasar
    return children;
}

export default ProtectedRoute;