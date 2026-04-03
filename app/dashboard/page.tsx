'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';

interface Factura {
  id: string;
  numero: number;
  cliente_nombre: string;
  monto: number;
  fecha_emision: string;
  cae: string;
  estado: string;
  tipo: string;
}

export default function DashboardPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [totals, setTotals] = useState({ cantidad: 0, monto: 0, mes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('facturas')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha_emision', { ascending: false })
      .limit(20);

    if (data) {
      setFacturas(data);
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      const totalMes = data
        .filter(f => f.fecha_emision?.startsWith(mesActual))
        .reduce((acc, f) => acc + (f.monto || 0), 0);
      setTotals({
        cantidad: data.length,
        monto: data.reduce((acc, f) => acc + (f.monto || 0), 0),
        mes: totalMes,
      });
    }
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen de tu actividad de facturación</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">FACTURAS EMITIDAS</div>
          <div className="stat-value">{totals.cantidad}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">INGRESOS TOTALES</div>
          <div className="stat-value" style={{ fontSize: totals.monto > 999999 ? '20px' : '28px' }}>
            ${fmt(totals.monto)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-label">FACTURADO ESTE MES</div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: totals.mes > 999999 ? '20px' : '28px' }}>
            ${fmt(totals.mes)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Últimas facturas</h2>
        <Link href="/factura/nueva" className="btn btn-primary btn-sm">
          ➕ Nueva Factura
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><div className="spinner" /><span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando...</span></div>
        ) : facturas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p style={{ fontWeight: 500 }}>Sin facturas todavía</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Emití tu primera factura para comenzar</p>
            <Link href="/factura/nueva" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Emitir ahora</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Comprobante</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>FC C-0002-{String(f.numero).padStart(8, '0')}</td>
                    <td>{f.cliente_nombre || 'Consumidor Final'}</td>
                    <td>{f.fecha_emision}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>${fmt(f.monto)}</td>
                    <td><span className="badge badge-success">✓ Emitida</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
