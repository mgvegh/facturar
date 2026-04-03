import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FacturAR — Facturación Electrónica AFIP',
  description: 'Emitá facturas electrónicas ante AFIP de forma rápida, simple y profesional.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
