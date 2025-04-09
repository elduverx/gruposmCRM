'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  MapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  NewspaperIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Navegación común para todos los usuarios
const commonNavigation = [
  { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
  { name: 'Propiedades', href: '/dashboard/properties', icon: BuildingOfficeIcon },
  { name: 'Clientes', href: '/dashboard/clients', icon: UsersIcon },
  { name: 'Encargos', href: '/dashboard/assignments', icon: ClipboardDocumentListIcon },
  { name: 'Noticias', href: '/noticia', icon: NewspaperIcon },
  { name: 'Pedidos', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
];

// Navegación adicional solo para administradores
const adminNavigation = [
  { name: 'Usuarios', href: '/dashboard/users', icon: UserGroupIcon },
  { name: 'Zonas', href: '/dashboard/zones', icon: MapIcon },
];

const AppName = "Grupo SM";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Combinar navegación basada en el rol
  const mobileNavigation = [...commonNavigation];
  if (isAdmin) {
    mobileNavigation.push({ name: 'Usuarios', href: '/dashboard/users', icon: UserGroupIcon });
  }

  const renderNavLinks = (items: typeof commonNavigation, isMobile: boolean = false) => {
    return items.map((item) => {
      const isActive = pathname === item.href;
      
      if (isMobile) {
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center px-2 py-2 text-xs font-medium ${
              isActive
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <item.icon
              className={`h-6 w-6 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span className="mt-1">{item.name}</span>
          </Link>
        );
      }

      return (
        <Link
          key={item.name}
          href={item.href}
          className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            isActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <item.icon
            className={`mr-3 h-5 w-5 flex-shrink-0 ${
              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
            }`}
          />
          {item.name}
        </Link>
      );
    });
  };

  const renderUserProfile = () => (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="ml-auto flex items-center rounded-md p-2 text-gray-400 hover:bg-white hover:text-gray-500"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-white transition duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">{AppName}</span>
            </Link>
            <button
              className="lg:hidden -mr-1 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {renderNavLinks(commonNavigation)}
            {isAdmin && (
              <>
                <div className="my-4 h-px bg-gray-200" />
                {renderNavLinks(adminNavigation)}
              </>
            )}
          </nav>
          {renderUserProfile()}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex min-h-screen flex-col lg:pl-24">
        {/* Header unificado */}
       

        <main className="flex-1 pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Navegación móvil inferior */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
          <div className="mx-auto grid h-16 w-full grid-cols-5 items-center px-2">
            {renderNavLinks(mobileNavigation, true)}
          </div>
        </nav>
      </div>
    </div>
  );
} 