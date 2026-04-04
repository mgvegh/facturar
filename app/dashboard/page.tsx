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
      <div style={{
        background: 'linear-gradient(135deg, #242c4f 0%, #15192e 100%)',
        borderRadius: '24px',
        padding: '40px 32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Elementos decorativos */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: -100, left: '20%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-1px', color: 'white', lineHeight: 1.2 }}>Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: 0, fontWeight: 400 }}>Bienvenido, aquí tenés el resumen de tu actividad.</p>
          </div>
          <Link href="/factura/nueva" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '14px', background: 'white', color: '#242c4f', fontWeight: 700, fontSize: '15px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', transition: 'transform 0.2s, box-shadow 0.2s', textDecoration: 'none' }}>
            <span style={{ fontSize: '18px' }}>➕</span> Nueva Factura
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        
        {/* Card Ingresos */}
        <div style={{ background: '#242c4f', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(36, 44, 79, 0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', borderRadius: '50%', transform: 'translate(40%, -40%)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', backdropFilter: 'blur(10px)' }}>💰</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ingresos Totales</div>
          </div>
          <div style={{ fontSize: totals.monto > 999999 ? '34px' : '40px', fontWeight: 800, letterSpacing: '-1px', color: 'white' }}>
            ${fmt(totals.monto)}
          </div>
        </div>

        {/* Card Mes */}
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <div style={{ width: '42px', height: '42px', background: 'var(--success-dim)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📅</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '1px' }}>Facturado Este Mes</div>
          </div>
          <div style={{ fontSize: totals.mes > 999999 ? '34px' : '40px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--success)' }}>
            ${fmt(totals.mes)}
          </div>
        </div>

        {/* Card Cantidad */}
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧾</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '1px' }}>Facturas Emitidas</div>
          </div>
          <div style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text)' }}>
            {totals.cantidad}
          </div>
        </div>
      </div>

      {/* Historial */}
      <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Últimos Comprobantes</h2>
        </div>
        
        {loading ? (
          <div style={{ padding: '80px', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#242c4f', width: '24px', height: '24px' }}></div>
          </div>
        ) : facturas.length === 0 ? (
           <div className="empty-state" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#242c4f', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px auto', boxShadow: '0 12px 24px rgba(36, 44, 79, 0.3)' }}>📄</div>
            <p style={{ fontWeight: 700, fontSize: '20px', marginBottom: '8px', color: 'white' }}>Sin comprobantes</p>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', marginBottom: '28px', maxWidth: '300px', margin: '0 auto 28px auto' }}>Creá tu primer factura electrónica rápidamente para verla aquí reflejada.</p>
            <Link href="/factura/nueva" style={{ display: 'inline-flex', background: '#242c4f', color: 'white', borderRadius: '12px', padding: '12px 24px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 8px 16px rgba(36, 44, 79, 0.2)' }}>Comenzar a Facturar</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comprobante</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                  <th style={{ padding: '18px 24px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i === facturas.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 24px', color: 'white', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(36, 44, 79, 0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: '15px', fontWeight: 600 }}>
                          FC
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px' }}>C-0002-{String(f.numero).padStart(8, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '15px', color: 'var(--text)' }}>{f.cliente_nombre || 'Consumidor Final'}</td>
                    <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-soft)' }}>
                      {new Date(f.fecha_emision + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: 'white' }}>
                      ${fmt(f.monto)}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--success-dim)', color: 'var(--success)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
                         Emitida
                      </div>
                    </td>
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

