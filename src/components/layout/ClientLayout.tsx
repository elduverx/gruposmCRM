'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from './MainLayout';

// Rutas que requieren permisos de administrador
const adminRoutes = ['/dashboard/settings'];

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/register', '/forgot-password'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        // Si es una ruta pública, permitir el acceso
        if (pathname && publicRoutes.includes(pathname)) {
          return;
        }

        // Si no hay usuario, redirigir a login
        if (!user) {
          router.push('/login');
          return;
        }

        // Verificar acceso a rutas de administrador
        if (pathname && adminRoutes.includes(pathname) && user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
      }
    };

    checkAuth();
  }, [user, loading, router, pathname]);

  // Mostrar spinner de carga
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  // Si es una ruta pública, mostrar el contenido directamente
  if (pathname && publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Si no hay usuario y no es una ruta pública, no mostrar nada
  if (!user) {
    return null;
  }

  // Para rutas protegidas, mostrar el MainLayout
  return <MainLayout>{children}</MainLayout>;
} 