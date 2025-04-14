import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { AuthProvider } from './dashboard/context/AuthContext';
import LeafletStyles from '@/components/map/LeafletStyles';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

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
    <html lang="es" className={inter.className}>
      <body className="antialiased">
        <LeafletStyles />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 