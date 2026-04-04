'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  cuit?: string;
  condicion_iva?: string;
  total_facturado?: number;
  cantidad_facturas?: number;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [cuit, setCuit] = useState('');
  const [condicion, setCondicion] = useState('Consumidor Final');
  const [saving, setSaving] = useState(false);
  const [searchingCuit, setSearchingCuit] = useState(false);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre');
    if (data) setClientes(data);
    setLoading(false);
  };

  const buscarCuit = async () => {
    const cleanCuit = cuit.replace(/\D/g, '');
    if (cleanCuit.length !== 11) {
      alert('Ingresá un CUIT válido de 11 números');
      return;
    }
    setSearchingCuit(true);
    try {
      const res = await fetch(`/api/contribuyente/${cleanCuit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se encontró el CUIT');
      
      setNombre(data.razonSocial);
      if (data.condicionIva?.toLowerCase().includes('inscripto')) setCondicion('Responsable Inscripto');
      else if (data.condicionIva?.toLowerCase().includes('monotribut')) setCondicion('Monotributista');
      else if (data.condicionIva?.toLowerCase().includes('exento')) setCondicion('Exento');
    } catch (err: any) {
      alert(err.message);
    }
    setSearchingCuit(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('clientes').insert({ user_id: user.id, nombre, cuit, condicion_iva: condicion });
    setNombre(''); setCuit(''); setCondicion('Consumidor Final');
    setShowForm(false);
    loadClientes();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar cliente?')) return;
    await supabase.from('clientes').delete().eq('id', id);
    loadClientes();
  };

  const filtered = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.cuit?.includes(search)
  );

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Administrá tu cartera de clientes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nuevo cliente'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Agregar cliente</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre / Razón Social *</label>
                <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">CUIT</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={cuit} onChange={e => setCuit(e.target.value)} placeholder="20-12345678-9" style={{ flex: 1 }} />
                  <button type="button" className="btn btn-ghost" onClick={buscarCuit} disabled={searchingCuit} style={{ padding: '0 12px' }}>
                    {searchingCuit ? '...' : '🔍 ARCA'}
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Condición IVA</label>
              <select className="form-input" value={condicion} onChange={e => setCondicion(e.target.value)}>
                <option>Consumidor Final</option>
                <option>Responsable Inscripto</option>
                <option>Monotributista</option>
                <option>Exento</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="form-input search-input"
            placeholder="Buscar por nombre o CUIT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p style={{ fontWeight: 500 }}>{search ? 'Sin resultados' : 'Sin clientes todavía'}</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>CUIT</th>
                  <th>Condición IVA</th>
                  <th>Facturado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>{c.nombre}</td>
                    <td>{c.cuit || '—'}</td>
                    <td><span className="badge badge-primary">{c.condicion_iva || '—'}</span></td>
                    <td style={{ fontWeight: 600 }}>
                      {c.total_facturado ? `$${c.total_facturado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Eliminar</button>
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
