// src/components/ClientePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import QRCode from "react-qr-code";

const CastrolLogo = 'https://logos-world.net/wp-content/uploads/2023/03/Castrol-New-Logo.png';

function ClientePage() {
  const [loading, setLoading] = useState(true);
  const [userUUID, setUserUUID] = useState(null);
  const [premio, setPremio] = useState(null);
  const [yaFueCanjeado, setYaFueCanjeado] = useState(false);

  useEffect(() => {
    async function setupRifa() {
      let currentUUID = localStorage.getItem('userUUID');
      if (!currentUUID) {
        currentUUID = uuidv4();
        localStorage.setItem('userUUID', currentUUID);
      }
      setUserUUID(currentUUID);

      const { data: registroExistente } = await supabase
        .from('codigos_canjeados')
        .select(`*, canjeado_en, premios ( nombre, descripcion )`)
        .eq('id', currentUUID)
        .single();

      if (registroExistente) {
        setPremio(registroExistente.premios);
        if (registroExistente.canjeado_en) {
          setYaFueCanjeado(true);
        }
      } else {
        const { data: premiosDisponibles, error: disponiblesError } = await supabase
          .from('premios')
          .select('id, nombre, descripcion, cantidad')
          .gt('cantidad', 0);

        if (disponiblesError) {
          console.error("Error obteniendo premios disponibles:", disponiblesError);
          setPremio({ nombre: "Error", descripcion: "No se pudieron cargar los premios. Intenta más tarde." });
          setLoading(false);
          return;
        }
        
        if (premiosDisponibles && premiosDisponibles.length > 0) {
          const premioAleatorio = premiosDisponibles[Math.floor(Math.random() * premiosDisponibles.length)];
          setPremio(premioAleatorio);
          const { error: insertError } = await supabase
            .from('codigos_canjeados')
            .insert({ id: currentUUID, id_premio: premioAleatorio.id });
          if (insertError) {
              console.error("Error al guardar el registro:", insertError);
              setPremio({ nombre: "Error", descripcion: "Hubo un problema al asignar tu premio. Intenta recargar la pagina." });
          }
        } else {
          setPremio({ nombre: "¡Lo sentimos!", descripcion: "Todos los premios de esta rifa han sido canjeados ¡Gracias por participar!" });
        }
      }
      setLoading(false);
    }
    setupRifa();
  }, []);

  if (loading) {
    return (
      <div className="container cliente-page">
        <div className="main-content" style={{ textAlign: 'center' }}>
          <h1>Cargando...</h1>
          <div style={{width: '80px', margin: '20px auto'}}><div className="skeleton skeleton-list-item"></div></div>
        </div>
      </div>
    );
  }

  if (yaFueCanjeado) {
    return (
      <div className="container cliente-page">
        <header className="header" style={{ justifyContent: 'center' }}>
          <img src={CastrolLogo} alt="Logo" className="header-logo" />
        </header>
        <div className="main-content" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🎉</div>
          <h1 style={{ color: 'var(--color-secondary)' }}>¡Premio Reclamado!</h1>
          <div className="premio-card">
            <h2>{premio?.nombre}</h2>
            <p>{premio?.descripcion}</p>
          </div>
          <p>¡Esperamos que disfrutes tu premio!</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>Te invitamos a seguir siendo nuestro cliente y participar en futuras promociones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container cliente-page">
      <header className="header" style={{ justifyContent: 'center' }}>
        <img src={CastrolLogo} alt="Logo" className="header-logo" />
      </header>
      <div className="main-content" style={{ textAlign: 'center' }}>
        {premio?.nombre === "¡Lo sentimos!" ? (
            <>
              <div style={{ fontSize: '3rem' }}>🙁</div>
              <h1 style={{ color: 'var(--color-text-secondary)' }}>¡Lo sentimos!</h1>
              <p>{premio.descripcion}</p>
            </>
        ) : (
          <>
            <h1 style={{ color: 'var(--color-primary)' }}>¡Felicidades!</h1>
            <p className="color-text-secondary">Has ganado:</p>
            <div className="premio-card">
              <h2>{premio?.nombre}</h2>
              <p>{premio?.descripcion}</p>
            </div>
            
            {premio && premio.nombre !== "Error" && (
                <>
                    <p>Presenta este código QR para canjearlo:</p>
                    <div className="qr-container">
                        {userUUID && <QRCode value={userUUID} size={300} />} {/* <-- CAMBIO AQUÍ: size={300} */}
                    </div>

                    <div className="aviso-canje" style={{
                      margin: '2rem auto',
                      padding: '1rem',
                      maxWidth: '400px',
                      border: `1px solid var(--color-border)`,
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-background)',
                      textAlign: 'left',
                      fontSize: '0.9em',
                      color: 'var(--color-text-secondary)'
                    }}>
                      <h3 style={{ textAlign: 'center', color: 'var(--color-text-primary)', marginTop: '0' }}>¡Reclama tu premio Castrol!</h3>
                      <p>Para recibir tu premio presenta:</p>
                      <ul style={{ paddingLeft: '20px', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        <li>Ticket de compra de cualquier producto Castrol</li>
                        <li>Tu INE</li>
                        <li>Tu QR generado</li>
                      </ul>
                      <p style={{ fontWeight: 'bold' }}>El premio es totalmente al azar y no se puede cambiar.</p>
                      <p style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Sin estos requisitos no se entregará el premio.</p>
                    </div>
                </>
            )}
            {premio && premio.nombre === "Error" && (
                <p style={{color: 'var(--color-primary)'}}>{premio.descripcion}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ClientePage;