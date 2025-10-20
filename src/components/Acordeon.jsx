// src/components/Acordeon.jsx
import React, { useState } from 'react';
import './Acordeon.css'; // Crearemos este CSS

function Acordeon({ titulo, contenido }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="acordeon-item">
      <button className="acordeon-titulo" onClick={() => setIsOpen(!isOpen)}>
        <span>{titulo}</span>
        <span className={`acordeon-icono ${isOpen ? 'open' : ''}`}></span>
      </button>
      {isOpen && (
        <div className="acordeon-contenido">
          {contenido}
        </div>
      )}
    </div>
  );
}
export default Acordeon;