'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Rutas que requieren permisos de administrador
const adminRoutes = [
  '/dashboard/zones',
  '/dashboard/calendar',
  '/dashboard/activities',
  '/dashboard/stats'
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Determinar si el usuario es administrador
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem('token');
      
      // Verificar si el usuario está intentando acceder a una ruta de administrador sin ser admin
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
      
      if (!isAuthenticated && pathname !== '/login' && !token) {
        setShouldRedirect(true);
      } else if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
        setShouldRedirect(true);
      } else if (isAuthenticated && isAdminRoute && !isAdmin) {
        // Redirigir a dashboard si un usuario normal intenta acceder a una ruta de admin
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, pathname, isAdmin, router]);

  useEffect(() => {
    if (shouldRedirect) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
        router.push('/dashboard');
      }
      setShouldRedirect(false);
    }
  }, [shouldRedirect, isAuthenticated, pathname, router]);

  // Si está cargando, mostrar un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  // Si no está autenticado y no está en la página de login, no mostrar nada
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
} 