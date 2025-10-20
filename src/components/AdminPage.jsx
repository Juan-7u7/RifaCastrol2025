// src/components/AdminPage.jsx
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import CustomSelect from './CustomSelect';
import Acordeon from './Acordeon';
import Modal from './Modal';
import { FaGift, FaCheckCircle, FaChartPie, FaDownload } from 'react-icons/fa';
import ExcelJS from 'exceljs'; // <-- CORRECCIÓN: Usa exceljs
import { saveAs } from 'file-saver'; // <-- Necesario para exceljs

// Asegúrate de usar la URL correcta del logo
const CastrolLogo = 'https://logos-world.net/wp-content/uploads/2023/03/Castrol-New-Logo.png';

// Componente para mostrar esqueletos mientras cargan los datos
const SkeletonLoader = () => (
  <div className="list">
    <div className="skeleton skeleton-list-item"></div>
    <div className="skeleton skeleton-list-item"></div>
    <div className="skeleton skeleton-list-item"></div>
  </div>
);

function AdminPage() {
  const navigate = useNavigate();
  const [vista, setVista] = useState('disponibles');
  const [datos, setDatos] = useState({ disponibles: [], historial: [] });
  const [stats, setStats] = useState({ totalStock: 0, canjeados: 0 });
  const [cargando, setCargando] = useState(true);
  const scannerRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const [showConfirmationForm, setShowConfirmationForm] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [folioTicket, setFolioTicket] = useState('');
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  const opcionesDeVista = [
    { value: 'disponibles', label: 'Premios Disponibles' },
    { value: 'historial', label: 'Premios Canjeados' }
  ];

  // Función para cargar/actualizar los datos del panel desde Supabase
  async function actualizarDatos() {
    const { data: historialData } = await supabase
        .from('codigos_canjeados')
        .select(`*, canjeado_en, nombre_cliente, folio_ticket, premios ( nombre )`)
        .order('created_at', { ascending: false });

    const { data: disponiblesData, error: dispError } = await supabase
      .from('premios')
      .select('id, nombre, descripcion, cantidad')
      .gt('cantidad', 0)
      .order('nombre');

    if (dispError) console.error("Error cargando disponibles:", dispError);

    const canjeadosCount = (historialData || []).filter(h => h.canjeado_en).length;
    const totalStockActual = (disponiblesData || []).reduce((sum, p) => sum + p.cantidad, 0);

    setDatos({ disponibles: disponiblesData || [], historial: historialData || [] });
    setStats({ totalStock: totalStockActual, canjeados: canjeadosCount });
    setCargando(false);
  }

  // useEffect se ejecuta al montar el componente
  useEffect(() => {
    actualizarDatos(); // Carga los datos iniciales

    // Inicializa el escáner QR solo si no existe ya una instancia
    if (!scannerRef.current) {
      const config = {
        fps: 5,
        qrbox: { width: 250, height: 250 },
        facingMode: "environment",
        disableFlip: false,
      };

      const scanner = new Html5QrcodeScanner('qr-reader', config, false);

      const onScanSuccess = async (decodedText) => {
        scanner.pause();
        setShowConfirmationForm(false);
        setNombreCliente('');
        setFolioTicket('');
        setScannedData(null);

        const { data: registro, error: searchError } = await supabase
            .from('codigos_canjeados')
            .select(`*, id_premio, canjeado_en, premios ( nombre, descripcion )`)
            .eq('id', decodedText)
            .single();

        if (searchError || !registro) {
          setModalContent({ status: 'error', mensaje: 'Código QR no válido o no existe.' });
          setIsModalOpen(true);
        } else if (registro.canjeado_en) {
          setModalContent({ status: 'canjeado', premio: registro.premios.nombre, fecha: new Date(registro.canjeado_en).toLocaleString() });
          setIsModalOpen(true);
        } else {
          setScannedData({ decodedText: decodedText, premio: registro.premios, id_premio: registro.id_premio });
          setShowConfirmationForm(true);
        }
      };

      scanner.render(onScanSuccess);
      scannerRef.current = scanner;
    }

    // Función de limpieza al desmontar
    return () => {
      if (scannerRef.current && scannerRef.current.getState() !== 1) {
        scannerRef.current.clear().catch(error => console.error("Fallo al limpiar el scanner.", error));
        scannerRef.current = null;
      }
    };
  }, []); // El array vacío asegura que este useEffect se ejecute solo al montar

   // Función para confirmar el canje desde el formulario
   const handleConfirmCanje = async () => {
    if (!nombreCliente.trim() || !folioTicket.trim()) {
      alert("Por favor, ingresa el nombre y el folio del ticket.");
      return;
    }
    setConfirmProcessing(true);

    const { data: existingRedemption, error: checkError } = await supabase
      .from('codigos_canjeados')
      .select('id, premios (nombre)')
      .or(`nombre_cliente.ilike.%${nombreCliente.trim()}%,folio_ticket.eq.${folioTicket.trim()}`)
      .not('id', 'eq', scannedData.decodedText)
      .not('canjeado_en', 'is', null) // Usa 'is not null'
      .limit(1);

    if (checkError) {
       console.error("Error verificando duplicados:", checkError);
       setModalContent({status: 'error', mensaje: 'Error al verificar los datos. Intenta de nuevo.'});
       setIsModalOpen(true);
       setConfirmProcessing(false);
       return;
    }

    if (existingRedemption && existingRedemption.length > 0) {
       setModalContent({status: 'error', mensaje: `Esta persona o ticket ya canjeó un premio (${existingRedemption[0].premios.nombre}) anteriormente.`});
       setIsModalOpen(true);
       setShowConfirmationForm(false);
       setNombreCliente('');
       setFolioTicket('');
       setConfirmProcessing(false);
       return;
    }

    const { error: updateError } = await supabase
      .from('codigos_canjeados')
      .update({
        canjeado_en: new Date(),
        nombre_cliente: nombreCliente.trim(),
        folio_ticket: folioTicket.trim()
      })
      .eq('id', scannedData.decodedText);

    if (updateError) {
      setModalContent({ status: 'error', mensaje: 'Error al marcar el premio como canjeado.' });
    } else {
      const { error: decrementError } = await supabase.rpc('decrement_premio_cantidad', {
        premio_id: scannedData.id_premio
      });

      if (decrementError) {
        console.error("Error al decrementar:", decrementError);
        setModalContent({ status: 'error', mensaje: 'Premio validado, pero error al actualizar stock.' });
        actualizarDatos();
      } else {
        setModalContent({ status: 'exito', premio: scannedData.premio.nombre, descripcion: scannedData.premio.descripcion });
        actualizarDatos();
      }
    }

    setIsModalOpen(true);
    setShowConfirmationForm(false);
    setNombreCliente('');
    setFolioTicket('');
    setConfirmProcessing(false);
  };

  // Función para cancelar el canje y volver a escanear
  const handleCancelCanje = () => {
      setShowConfirmationForm(false);
      setNombreCliente('');
      setFolioTicket('');
      if (scannerRef.current && scannerRef.current.getState() === 2) {
          scannerRef.current.resume();
      }
  };


  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Función para cerrar el modal y reanudar el escáner si es necesario
  const closeModalAndResumeScanner = () => {
    setIsModalOpen(false);
    if (!showConfirmationForm && scannerRef.current && scannerRef.current.getState() === 2) {
        scannerRef.current.resume();
    }
  };

  // --- FUNCIÓN ACTUALIZADA PARA DESCARGAR CON EXCELJS ---
  const handleDownloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'App Rifa Castrol';
    workbook.lastModifiedBy = 'App Rifa Castrol';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Hoja "Premios Disponibles"
    const wsDisponibles = workbook.addWorksheet('Premios Disponibles');
    wsDisponibles.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Descripción', key: 'descripcion', width: 50 },
      { header: 'Cantidad Restante', key: 'cantidad', width: 20 }
    ];
    datos.disponibles.forEach(p => {
      wsDisponibles.addRow({ nombre: p.nombre, descripcion: p.descripcion, cantidad: p.cantidad });
    });
    wsDisponibles.getRow(1).font = { bold: true };

    // Hoja "Premios Canjeados"
    const wsCanjeados = workbook.addWorksheet('Premios Canjeados');
    wsCanjeados.columns = [
      { header: 'Premio', key: 'premio', width: 30 },
      { header: 'Fecha de Canje', key: 'fecha', width: 25 },
      { header: 'Nombre Cliente', key: 'cliente', width: 30 },
      { header: 'Folio Ticket', key: 'folio', width: 20 }
    ];
    datos.historial
      .filter(r => r.canjeado_en)
      .forEach(r => {
        wsCanjeados.addRow({
          premio: r.premios.nombre,
          fecha: new Date(r.canjeado_en).toLocaleString(),
          cliente: r.nombre_cliente || 'No registrado',
          folio: r.folio_ticket || 'No registrado'
        });
      });
    wsCanjeados.getRow(1).font = { bold: true };

    // Genera el archivo y descarga
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Reporte_Rifa_Castrol.xlsx');
  };

  // Renderizado del componente
  return (
    <>
      <Modal isOpen={isModalOpen} onClose={closeModalAndResumeScanner}>
        {/* Contenido dinámico del modal */}
        {modalContent?.status === 'exito' && (
          <>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <h2>¡Premio Validado!</h2>
            <p>El código ha sido canjeado por:</p>
            <div className="premio-card" style={{margin: '1rem 0', border: 'none', background: 'var(--color-background)'}}>
              <strong>{modalContent.premio}</strong>
              <p style={{color: 'var(--color-text-secondary)', fontSize: '0.9em'}}>{modalContent.descripcion}</p>
            </div>
          </>
        )}
        {modalContent?.status === 'canjeado' && (
          <>
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <h2>Premio ya Reclamado</h2>
            <p>Este código para <strong>"{modalContent.premio}"</strong> ya fue canjeado el {modalContent.fecha}.</p>
          </>
        )}
        {modalContent?.status === 'error' && (
            <>
              <div style={{ fontSize: '3rem' }}>❌</div>
              <h2>Error</h2>
              <p>{modalContent.mensaje}</p>
            </>
        )}
      </Modal>

      <div className="container">
        <header className="header">
          <img src={CastrolLogo} alt="Logo" className="header-logo" />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Botón de Descarga Excel */}
            <button onClick={handleDownloadExcel} title="Descargar Reporte Excel" style={{ padding: '8px 12px', background: 'var(--color-secondary)' }}>
                <FaDownload /> Excel
            </button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </header>
        <div className="main-content">
          <div className="stats-bar">
            {/* Estadísticas */}
            <div className="stats-item">
              <FaGift className="stats-icon" />
              <span>Stock Restante</span><strong>{cargando ? '-' : stats.totalStock}</strong>
            </div>
            <div className="stats-item">
              <FaCheckCircle className="stats-icon" />
              <span>Canjeados</span><strong>{cargando ? '-' : stats.canjeados}</strong>
            </div>
             {/* Se quitó el total */}
          </div>
          <div className="admin-layout">
            {/* Columna del Escáner y Formulario */}
            <div style={{ flex: 1 }}>
              <h3>Escanear Código</h3>
              <div id="qr-reader"></div>

              {/* Formulario de Confirmación (se muestra condicionalmente) */}
              {showConfirmationForm && (
                <div className="confirmation-form" style={{ marginTop: '20px', padding: '15px', border: `1px solid var(--color-border)`, borderRadius: '8px', backgroundColor: 'var(--color-background)' }}>
                  <h4>Confirmar Canje del Premio:</h4>
                  <p><strong>{scannedData?.premio?.nombre}</strong></p>
                  <p style={{fontSize: '0.9em', color: 'var(--color-text-secondary)'}}>{scannedData?.premio?.descripcion}</p>
                  <div className="form-group">
                    <label className="form-label" htmlFor="nombreCliente">Nombre (INE)</label>
                    <input type="text" id="nombreCliente" className="form-input" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="folioTicket">Folio del Ticket</label>
                    <input type="text" id="folioTicket" className="form-input" value={folioTicket} onChange={(e) => setFolioTicket(e.target.value)} required />
                  </div>
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <button onClick={handleConfirmCanje} disabled={confirmProcessing} style={{flex: 1}}> {confirmProcessing ? 'Procesando...' : 'Confirmar Canje'} </button>
                    <button onClick={handleCancelCanje} disabled={confirmProcessing} style={{flex: 1, background: 'var(--color-text-secondary)'}}> Cancelar </button>
                  </div>
                </div>
              )}
            </div>
            {/* Columna de Listas/Tabla */}
            <div style={{ flex: 1 }} className="vista-container">
              <CustomSelect
                options={opcionesDeVista}
                value={vista}
                onChange={(selectedValue) => setVista(selectedValue)}
              />
              
              {cargando ? <SkeletonLoader /> : (
                vista === 'disponibles' ? (
                  // Lista de premios disponibles (acordeón)
                  <div className="list">
                    {datos.disponibles.length > 0 ? (
                      datos.disponibles.map((p) => (
                        <Acordeon
                            key={p.id} // Usa el ID del premio como key para React
                            titulo={`${p.nombre} (Quedan: ${p.cantidad})`}
                            contenido={p.descripcion}
                        />
                      ))
                    ) : (
                      <p style={{textAlign: 'center', marginTop: '20px'}}>¡No quedan premios disponibles!</p>
                    )}
                  </div>
                ) : (
                  // Tabla de premios canjeados
                  <div className="table">
                    <table>
                      <thead><tr><th>Premio</th><th>Fecha de Canje</th></tr></thead>
                      <tbody>
                        {datos.historial
                          .filter(r => r.canjeado_en) // Muestra solo los canjeados
                          .map(r => (
                            <tr key={r.id}>
                              <td>{r.premios.nombre}</td>
                              <td>{new Date(r.canjeado_en).toLocaleString()}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminPage;