'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';

const CATEGORIAS = ['A','B','C','D','E','F','G','H','I','J','K'];

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cuit, setCuit] = useState('');
  const [categoria, setCategoria] = useState('D');
  const [puntoVenta, setPuntoVenta] = useState('2');
  const [original, setOriginal] = useState<any>({});

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userEmail = user.email || '';
      setEmail(userEmail);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setNombre(data.nombre || '');
        setApellido(data.apellido || '');
        setCuit(data.cuit || '');
        setCategoria(data.categoria_monotributo || 'D');
        setPuntoVenta(String(data.punto_venta || '2'));
        setOriginal({ ...data, email: userEmail });
      } else {
        setOriginal({ email: userEmail });
      }
    }
    setLoading(false);
  };

  const handleCancelar = () => {
    setNombre(original.nombre || '');
    setApellido(original.apellido || '');
    setCuit(original.cuit || '');
    setCategoria(original.categoria_monotributo || 'D');
    setPuntoVenta(String(original.punto_venta || '2'));
    setEmail(original.email || '');
    setEditando(false);
    setMsg(null);
  };

  const guardar = async () => {
    if (!nombre || !apellido || !cuit) {
      setMsg({ type: 'error', text: 'Completá nombre, apellido y CUIT' });
      return;
    }
    setSaving(true);
    setMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Cambio de email
    if (email !== original.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setMsg({ type: 'error', text: 'No se pudo actualizar el email: ' + emailError.message });
        setSaving(false);
        return;
      }
      setMsg({ type: 'success', text: `Te enviamos un email de confirmación a ${email}. Confirmalo para que el cambio tome efecto.` });
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      nombre,
      apellido,
      cuit,
      categoria_monotributo: categoria,
      punto_venta: parseInt(puntoVenta),
    });

    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setOriginal({ nombre, apellido, cuit, categoria_monotributo: categoria, punto_venta: parseInt(puntoVenta), email });
      setEditando(false);
      if (!msg) setMsg({ type: 'success', text: 'Perfil actualizado correctamente' });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const iniciales = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase() || email?.[0]?.toUpperCase() || 'U';

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-subtitle">Administrá tus datos personales y fiscales</p>
        </div>
        {!editando ? (
          <button className="btn btn-ghost" onClick={() => setEditando(true)}>✏️ Editar</button>
        ) : (
          <button className="btn btn-ghost" onClick={handleCancelar}>✕ Cancelar</button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary-dim)', border: '2px solid var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'var(--primary)',
            }}>
              {iniciales}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {nombre && apellido ? `${nombre} ${apellido}` : email}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{email}</div>
              {cuit && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>CUIT {cuit} · Cat. {categoria}</div>}
            </div>
          </div>

          {/* Mensaje */}
          {msg && (
            <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
            </div>
          )}

          {/* Datos personales */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos personales</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={!editando}
                  style={{ opacity: editando ? 1 : 0.6 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input
                  className="form-input"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  placeholder="Tu apellido"
                  disabled={!editando}
                  style={{ opacity: editando ? 1 : 0.6 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={!editando}
                style={{ opacity: editando ? 1 : 0.6 }}
              />
              {editando && email !== original.email && (
                <span style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
                  ⚠️ Se enviará un email de verificación al guardar
                </span>
              )}
            </div>
          </div>

          {/* Datos fiscales */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos fiscales</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">CUIT</label>
                <input
                  className="form-input"
                  value={cuit}
                  onChange={e => setCuit(e.target.value)}
                  placeholder="20-12345678-9"
                  disabled={!editando}
                  style={{ opacity: editando ? 1 : 0.6 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Punto de venta</label>
                <input
                  className="form-input"
                  type="number"
                  value={puntoVenta}
                  onChange={e => setPuntoVenta(e.target.value)}
                  disabled={!editando}
                  style={{ opacity: editando ? 1 : 0.6 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Categoría monotributo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, opacity: editando ? 1 : 0.6 }}>
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    disabled={!editando}
                    onClick={() => setCategoria(cat)}
                    style={{
                      width: 44, height: 44, borderRadius: 8, border: 'none',
                      background: categoria === cat ? 'var(--primary)' : 'var(--surface2)',
                      color: categoria === cat ? 'white' : 'var(--text-soft)',
                      fontWeight: 600, fontSize: 14,
                      cursor: editando ? 'pointer' : 'default',
                      boxShadow: categoria === cat ? '0 0 12px var(--primary-glow)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          {editando && (
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={guardar}
              disabled={saving}
            >
              {saving ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Guardando...</> : '💾 Guardar cambios'}
            </button>
          )}

          {/* Cerrar sesión */}
          <button
            className="btn btn-danger btn-lg btn-full"
            onClick={handleLogout}
            style={{ marginTop: editando ? 0 : 8 }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </AppLayout>
  );
}
