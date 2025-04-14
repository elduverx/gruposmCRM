import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './dashboard/context/AuthContext';
import LeafletStyles from '@/components/map/LeafletStyles';

export const metadata: Metadata = {
  title: 'Grupo SM - CRM',
  description: 'Sistema de gestión de relaciones con clientes para Grupo SM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        <LeafletStyles />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 