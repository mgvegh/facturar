'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">🧾</div>
          <h1>FacturAR</h1>
          <p>Facturación electrónica ante AFIP de forma simple y profesional.</p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['✓ Emisión de facturas CAE al instante', '✓ Historial completo de comprobantes', '✓ Generación de PDF oficial', '✓ Gestión de clientes'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Bienvenido de vuelta</h2>
          <p className="auth-subtitle">Ingresá a tu cuenta para continuar</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-input"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <div className="auth-switch">
            ¿No tenés cuenta? <Link href="/register" className="auth-link">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
