'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/factura/nueva', icon: '➕', label: 'Nueva Factura' },
  { href: '/clientes', icon: '👥', label: 'Clientes' },
];

const ACCOUNT_ITEMS = [
  { href: '/perfil', icon: '👤', label: 'Mi perfil' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [initials, setInitials] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserEmail(data.user.email || '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, apellido')
        .eq('id', data.user.id)
        .single();
      if (profile?.nombre || profile?.apellido) {
        setInitials(`${profile.nombre?.[0] || ''}${profile.apellido?.[0] || ''}`.toUpperCase());
      } else {
        setInitials((data.user.email?.[0] || 'U').toUpperCase());
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div className={`mobile-overlay${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <header className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>Factur<span style={{ color: 'var(--primary)' }}>AR</span></span>
        <Link
          href="/perfil"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--primary-dim)', border: '1px solid var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
          }}
        >
          {initials || '👤'}
        </Link>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🧾</div>
          <div className="sidebar-logo-text">Factur<span>AR</span></div>
        </div>

        <div className="nav-section-label">Principal</div>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname === item.href ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Cuenta</div>
        {ACCOUNT_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname === item.href ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary-dim)', border: '1px solid var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
            }}>
              {initials || '👤'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all', minWidth: 0 }}>
              {userEmail}
            </div>
          </div>
          <button className="nav-link btn-ghost" style={{ width: '100%', border: 'none' }} onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
