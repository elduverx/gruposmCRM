import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Grupo SM - CRM',
  description: 'Sistema de gestión de relaciones con clientes para Grupo SM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 