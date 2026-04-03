'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">🧾</div>
          <h1>FacturAR</h1>
          <p>Facturación electrónica ante AFIP de forma simple y profesional.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Crear cuenta</h2>
          <p className="auth-subtitle">Ingresá tus datos para registrarte</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><span>⚠️</span> {error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 20 }}><span>✓</span> Cuenta creada. Redirigiendo...</div>}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input type="email" className="form-input" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-input" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Creando cuenta...</> : 'Crear cuenta'}
            </button>
          </form>

          <div className="auth-switch">
            ¿Ya tenés cuenta? <Link href="/login" className="auth-link">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
