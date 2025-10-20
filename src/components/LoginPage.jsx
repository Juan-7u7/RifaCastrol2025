// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const CastrolLogo = 'https://logos-world.net/wp-content/uploads/2023/03/Castrol-New-Logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
    } else {
      navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '420px' }}>
      <header className="header" style={{ justifyContent: 'center' }}>
        <img src={CastrolLogo} alt="Castrol Logo" className="header-logo" />
      </header>
      <div className="main-content">
        <h2 style={{ textAlign: 'center' }}>Acceso de Administrador</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="form-button" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;