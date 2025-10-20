// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtenemos la sesión la primera vez que carga la app
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Escuchamos cualquier cambio en la sesión (login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Limpiamos el listener cuando el componente se desmonta
        return () => subscription.unsubscribe();
    }, []);

    const value = { session, loading };

    // Si aún está cargando, no mostramos nada para evitar parpadeos
    if (loading) {
        return <div>Cargando sesión...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Un "hook" personalizado para usar fácilmente el contexto en otros componentes
export function useAuth() {
    return useContext(AuthContext);
}