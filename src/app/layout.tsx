import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './dashboard/context/AuthContext';
import LeafletStyles from '@/components/map/LeafletStyles';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM Grupo SM',
  description: 'Sistema de gestión inmobiliaria',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Toaster position="top-right" />
        <LeafletStyles />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 