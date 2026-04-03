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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login');
      else setUserEmail(data.user.email || '');
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
        <span style={{ fontWeight: 700, fontSize: 16 }}>Factur<span style={{ color: 'var(--primary)' }}>AR</span></span>
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

        <div className="sidebar-footer">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 12px', marginBottom: 10, wordBreak: 'break-all' }}>
            {userEmail}
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
