// src/components/CustomSelect.jsx
import React, { useState, useEffect, useRef } from 'react';
import './CustomSelect.css'; // Crearemos este archivo CSS a continuación

function CustomSelect({ options, value, onChange, placeholder = "Seleccionar..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedOption = options.find(option => option.value === value) || { label: placeholder };

  // Cierra el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container" ref={ref}>
      <div className="custom-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        {selectedOption.label}
        <div className={`custom-arrow ${isOpen ? 'open' : ''}`}></div>
      </div>
      {isOpen && (
        <div className="custom-options">
          {options.map(option => (
            <div
              key={option.value}
              className={`custom-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;