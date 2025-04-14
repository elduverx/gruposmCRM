'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/dashboard/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';

// Rutas que requieren permisos de administrador
const adminRoutes = ['/dashboard/settings'];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    if (user && adminRoutes.includes(pathname || '') && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
} 