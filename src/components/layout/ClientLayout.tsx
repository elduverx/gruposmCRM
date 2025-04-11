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
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si está cargando, no hacer nada todavía
    if (loading) return;

    // Si es una ruta pública, permitir el acceso sin importar el estado de autenticación
    if (pathname && publicRoutes.includes(pathname)) {
      // Si el usuario está autenticado y trata de acceder a una ruta pública, redirigir al dashboard
      if (user && pathname === '/login') {
        router.push('/dashboard');
      }
      return;
    }

    // Para rutas protegidas, verificar autenticación
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar acceso a rutas de administrador
    if (pathname && adminRoutes.includes(pathname) && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
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

  // Si no hay usuario y no es una ruta pública, no mostrar nada mientras se redirige
  if (!user) {
    return null;
  }

  // Para rutas protegidas, mostrar el MainLayout
  return <MainLayout>{children}</MainLayout>;
} 