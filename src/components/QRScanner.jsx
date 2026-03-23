import { useState, useEffect, useRef } from 'react';
import { api, getToken, clearToken } from '../lib/api';

const API = 'https://lajarana-api.luminari.agency/api';

export default function QRScanner() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', message, detail }
  const [scanCount, setScanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const lastScannedRef = useRef('');
  const resultTimeoutRef = useRef(null);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    Promise.all([api.me(), api.getMyEvents()])
      .then(([u, evts]) => {
        setUser(u.user || u);
        const list = Array.isArray(evts) ? evts : evts.events || evts.data || [];
        const published = list.filter(e => e.status === 'PUBLISHED');
        setEvents(published);
        if (published.length === 1) setSelectedEvent(published[0].id);
        setLoading(false);
      })
      .catch(() => { clearToken(); window.location.href = '/login'; });
  }, []);

  async function startScanner() {
    if (!selectedEvent) return;
    setScanning(true);
    setResult(null);

    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('qr-reader');
    html5QrRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        onScanSuccess,
        () => {}
      );
    } catch (err) {
      setResult({ type: 'error', message: 'No se pudo acceder a la cámara', detail: err.message });
      setScanning(false);
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  }

  async function onScanSuccess(decodedText) {
    if (processing) return;
    if (decodedText === lastScannedRef.current) return;
    lastScannedRef.current = decodedText;

    let data;
    try {
      data = JSON.parse(decodedText);
    } catch {
      showResult('error', 'QR no válido', 'El código no contiene datos de ticket');
      return;
    }

    if (!data.ticketId || !data.qrCode || !data.qrToken) {
      showResult('error', 'QR no válido', 'Faltan datos en el código QR');
      return;
    }

    setProcessing(true);

    try {
      const token = getToken();
      const res = await fetch(`${API}/tickets/${data.ticketId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ qrCode: data.qrCode, qrToken: data.qrToken }),
      });
      const body = await res.json();

      if (res.ok && body.valid) {
        const t = body.ticket;
        const name = t.buyer?.name || t.buyer?.email || 'Asistente';
        const type = t.ticketType?.name || 'Entrada';
        showResult('success', `✅ ${name}`, `${type}`);
        setScanCount(c => c + 1);
      } else {
        const errorMsg = body.error || 'Ticket no válido';
        let detail = '';
        if (errorMsg.includes('already used') || errorMsg.includes('Ticket already used')) detail = 'Ticket ya usado';
        else if (errorMsg.includes('expired') || errorMsg.includes('QR token expired')) detail = 'QR expirado — el asistente debe actualizar su QR';
        else if (errorMsg.includes('Invalid QR')) detail = 'Código QR no válido';
        else if (errorMsg.includes('Not your event')) detail = 'Este ticket no es de tu evento';
        else detail = errorMsg;
        showResult('error', '❌ No válido', detail);
      }
    } catch (err) {
      showResult('error', 'Error de conexión', 'No se pudo validar el ticket');
    }

    setProcessing(false);
  }

  function showResult(type, message, detail) {
    setResult({ type, message, detail });
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setResult(null);
      lastScannedRef.current = '';
    }, 3000);
  }

  function logout() { clearToken(); window.location.href = '/login'; }

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try { html5QrRef.current.stop(); } catch {}
      }
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  if (loading) return <div className="dash-layout"><div className="loading">Cargando...</div></div>;

  return (
    <div className="scanner-layout">
      <header className="scanner-header">
        <a href="/dashboard" className="scanner-back">← Dashboard</a>
        <span className="scanner-title">📷 Scanner</span>
        <button className="dash-logout" onClick={logout}>Salir</button>
      </header>

      <div className="scanner-content">
        {!scanning ? (
          <div className="scanner-setup">
            <div className="scanner-icon">📱</div>
            <h1>Scanner de Entradas</h1>
            <p className="scanner-desc">Escanea los códigos QR de los asistentes en la puerta</p>

            {events.length === 0 ? (
              <div className="scanner-no-events">
                <p>No tienes eventos publicados</p>
                <a href="/dashboard/events/new" className="btn-primary">Crear evento</a>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ width: '100%', maxWidth: 400 }}>
                  <label>Selecciona el evento</label>
                  <select
                    className="form-input"
                    value={selectedEvent}
                    onChange={e => setSelectedEvent(e.target.value)}
                  >
                    <option value="">— Elige un evento —</option>
                    {events.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} {evt.startDate ? `(${new Date(evt.startDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn-primary scanner-start-btn"
                  onClick={startScanner}
                  disabled={!selectedEvent}
                >
                  📷 Iniciar Scanner
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="scanner-active">
            <div className="scanner-counter">
              <span className="scanner-counter-num">{scanCount}</span>
              <span className="scanner-counter-label">entradas validadas</span>
            </div>

            <div className="scanner-camera-wrapper">
              <div id="qr-reader" ref={scannerRef} className="scanner-camera" />

              {/* Result overlay */}
              {result && (
                <div className={`scanner-result scanner-result--${result.type}`}>
                  <div className="scanner-result-icon">
                    {result.type === 'success' ? '✅' : '❌'}
                  </div>
                  <div className="scanner-result-message">{result.message}</div>
                  <div className="scanner-result-detail">{result.detail}</div>
                </div>
              )}

              {processing && (
                <div className="scanner-processing">
                  <div className="scanner-spinner" />
                  <span>Validando...</span>
                </div>
              )}
            </div>

            <button className="btn-secondary scanner-stop-btn" onClick={stopScanner}>
              ⏹️ Detener Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
