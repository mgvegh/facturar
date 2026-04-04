'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 3;

interface ContribData { cuit: string; razonSocial: string; condicionIva: string; }

// Fecha de hoy en formato YYYY-MM-DD respetando timezone local (no UTC)
function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function NuevaFacturaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Cliente
  const [cuitInput, setCuitInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [contrib, setContrib] = useState<ContribData | null>(null);
  const [searchError, setSearchError] = useState('');
  const [esConsumidorFinal, setEsConsumidorFinal] = useState(false);
  const [clienteManual, setClienteManual] = useState('');

  // Step 2 — Factura
  const [concepto, setConcepto] = useState(2);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [formaPago, setFormaPago] = useState('Contado');
  const [periodoDesde, setPeriodoDesde] = useState(hoyLocal);
  const [periodoHasta, setPeriodoHasta] = useState(hoyLocal);
  const [fechaVencPago, setFechaVencPago] = useState(hoyLocal);

  // Step 3 — Loading / Result
  const [emitting, setEmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const buscarCuit = useCallback(async () => {
    if (!cuitInput || cuitInput.length < 10) return;
    setSearching(true);
    setSearchError('');
    setContrib(null);
    try {
      const res = await fetch(`/api/contribuyente/${cuitInput.replace(/-/g, '')}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'CUIT no encontrado');
      } else {
        setContrib(data);
      }
    } catch {
      setSearchError('Error de conexión, intentá de nuevo.');
    }
    setSearching(false);
  }, [cuitInput]);

  const handleEmitir = async () => {
    setEmitting(true);
    setError('');
    try {
      const hoy = hoyLocal();
      const res = await fetch('/api/factura/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoComprobante: 11,
          docTipo: 80,
          docNro: esConsumidorFinal ? '0' : contrib?.cuit,
          importeTotal: parseFloat(monto),
          concepto,
          fechaDesde: periodoDesde || hoy,
          fechaHasta: periodoHasta || hoy,
          fechaVtoPago: fechaVencPago || hoy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Guardar en Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('facturas').insert({
          user_id: user.id,
          cliente_nombre: esConsumidorFinal ? 'Consumidor Final' : (contrib?.razonSocial || clienteManual),
          numero: data.numero,
          tipo: 'Factura C',
          concepto: concepto === 1 ? 'Productos' : concepto === 2 ? 'Servicios' : 'Productos y servicios',
          descripcion,
          monto: parseFloat(monto),
          fecha_emision: new Date().toISOString().slice(0, 10),
          periodo_desde: periodoDesde || null,
          periodo_hasta: periodoHasta || null,
          cae: data.cae,
          cae_vencimiento: data.vencimientoCAE || null,
          estado: 'emitida',
        });
      }

      setResult(data);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error al emitir la factura.');
    }
    setEmitting(false);
  };

  const handleDescargarPDF = async () => {
    if (!result) return;
    setGeneratingPdf(true);
    try {
      const hoy = new Date();
      const dd = String(hoy.getDate()).padStart(2, '0');
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const yyyy = hoy.getFullYear();
      const res = await fetch('/api/factura/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: result.numero,
          cae: result.cae,
          caeVencimiento: result.vencimientoCAE,
          fechaEmision: `${dd}/${mm}/${yyyy}`,
          importeTotal: parseFloat(monto),
          clienteNombre: esConsumidorFinal ? 'CONSUMIDOR FINAL' : (contrib?.razonSocial || clienteManual),
          clienteCuit: esConsumidorFinal ? '' : contrib?.cuit,
          clienteCondicionIva: esConsumidorFinal ? 'Consumidor Final' : (contrib?.condicionIva || 'Responsable Inscripto'),
          concepto,
          descripcion,
          formaPago,
          periodoDesde,
          periodoHasta,
        }),
      });
      const data = await res.json();
      if (data.pdf?.file) window.open(data.pdf.file, '_blank');
      else throw new Error(data.error || 'No se pudo generar el PDF');
    } catch (err: any) {
      alert(err.message);
    }
    setGeneratingPdf(false);
  };

  const clienteNombreDisplay = esConsumidorFinal ? 'Consumidor Final' : (contrib?.razonSocial || clienteManual || '—');
  const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Nueva Factura</h1>
        <p className="page-subtitle">Emitir comprobante electrónico ante AFIP/ARCA</p>
      </div>

      {/* Steps bar */}
      <div className="steps-bar">
        {[{ n: 1, label: 'Cliente' }, { n: 2, label: 'Concepto' }, { n: 3, label: 'Éxito' }].map((s, i) => (
          <div key={s.n} className="step-item" style={{ flex: i < 2 ? 1 : 'unset' }}>
            <div className={`step-circle ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`step-label ${step === s.n ? 'active' : ''}`}>{s.label}</span>
            {i < 2 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Cliente ─────────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Datos del receptor</h2>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={esConsumidorFinal}
                onChange={e => { setEsConsumidorFinal(e.target.checked); setContrib(null); setSearchError(''); }}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
              />
              <span style={{ color: 'var(--text-soft)' }}>Consumidor Final (sin CUIT)</span>
            </label>
          </div>

          {!esConsumidorFinal && (
            <>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">CUIT del cliente</label>
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    className="form-input search-input"
                    placeholder="ej: 20-12345678-9 (o 11111111111 para prueba)"
                    value={cuitInput}
                    onChange={e => { setCuitInput(e.target.value); setContrib(null); setSearchError(''); }}
                    onKeyDown={e => e.key === 'Enter' && buscarCuit()}
                  />
                  {searching && <div className="search-spinner"><div className="spinner" /></div>}
                  {contrib && !searching && <div className="search-spinner" style={{ color: 'var(--success)' }}>✓</div>}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={buscarCuit}
                  disabled={searching || cuitInput.length < 10}
                  style={{ marginTop: 8, width: 'fit-content' }}
                >
                  {searching ? 'Buscando...' : 'Buscar en AFIP'}
                </button>
              </div>

              {searchError && <div className="alert alert-error" style={{ marginBottom: 16 }}><span>⚠️</span> {searchError}</div>}

              {contrib && (
                <div className="autocomplete-result" style={{ position: 'relative', top: 0, marginBottom: 16 }}>
                  <div className="autocomplete-name">✓ {contrib.razonSocial}</div>
                  <div className="autocomplete-meta">CUIT: {contrib.cuit} · {contrib.condicionIva}</div>
                </div>
              )}

              {!contrib && !searching && (
                <div className="form-group" style={{ marginTop: 4 }}>
                  <label className="form-label">O ingresá el nombre manualmente</label>
                  <input className="form-input" placeholder="Nombre o razón social" value={clienteManual} onChange={e => setClienteManual(e.target.value)} />
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={() => setStep(2)}
              disabled={!esConsumidorFinal && !contrib && !clienteManual}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Concepto & Monto ─────────────────────────── */}
      {step === 2 && (
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Concepto y monto</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Tipo de concepto</label>
              <select className="form-input" value={concepto} onChange={e => setConcepto(parseInt(e.target.value))}>
                <option value={1}>1 — Productos</option>
                <option value={2}>2 — Servicios</option>
                <option value={3}>3 — Productos y servicios</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" placeholder="ej: Desarrollo web mes de marzo" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Forma de pago</label>
              <select className="form-input" value={formaPago} onChange={e => setFormaPago(e.target.value)}>
                <option>Contado</option>
                <option>Transferencia bancaria</option>
                <option>Cheque</option>
                <option>Mercado Pago</option>
                <option>Cuenta corriente</option>
                <option>Otro</option>
              </select>
            </div>

            {(concepto === 2 || concepto === 3) && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Período desde</label>
                  <input type="date" className="form-input" value={periodoDesde} onChange={e => setPeriodoDesde(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Período hasta</label>
                  <input type="date" className="form-input" value={periodoHasta} onChange={e => setPeriodoHasta(e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Fecha de vencimiento de pago</label>
              <input type="date" className="form-input" value={fechaVencPago} onChange={e => setFechaVencPago(e.target.value)} min={hoyLocal()} />
            </div>

            <div className="form-group">
              <label className="form-label">Importe total (ARS)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                style={{ fontSize: 20, fontWeight: 600 }}
                min={0}
              />
            </div>

            {/* Resumen */}
            {monto && parseFloat(monto) > 0 && (
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Receptor</span>
                  <span style={{ fontWeight: 500 }}>{clienteNombreDisplay}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 18 }}>$ {fmt(parseFloat(monto))}</span>
                </div>
              </div>
            )}

            {error && <div className="alert alert-error"><span>⚠️</span> {error}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Volver</button>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 2 }}
                onClick={handleEmitir}
                disabled={!monto || parseFloat(monto) <= 0 || emitting}
              >
                {emitting ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Emitiendo...</> : '🚀 Emitir Factura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Éxito ─────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="card">
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>¡Factura emitida!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>CAE asignado por ARCA</p>
            <div className="success-cae">{result.cae}</div>
            {result.vencimientoCAE && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Vence: {result.vencimientoCAE}</p>
            )}

            <div style={{ width: '100%', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Comprobante</span>
                <span style={{ fontWeight: 600 }}>FC C-0002-{String(result.numero).padStart(8, '0')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cliente</span>
                <span>{clienteNombreDisplay}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>$ {fmt(parseFloat(monto))}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => router.push('/dashboard')}>Ir al inicio</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleDescargarPDF}
                disabled={generatingPdf}
              >
                {generatingPdf ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Generando...</> : '📄 Descargar PDF'}
              </button>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setResult(null); setCuitInput(''); setContrib(null); setMonto(''); setDescripcion(''); }}>
              ➕ Nueva factura
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
