'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../app/dashboard/context/AuthContext';
import Image from 'next/image';
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
  XMarkIcon,
  TrophyIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Navegación común para todos los usuarios
const commonNavigation = [
  { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
  { name: 'Inmuebles', href: '/dashboard/properties', icon: BuildingOfficeIcon },
  { name: 'Clientes', href: '/dashboard/clients', icon: UsersIcon },
  { name: 'Encargos', href: '/dashboard/assignments', icon: ClipboardDocumentListIcon },
  { name: 'Noticias', href: '/noticia', icon: NewspaperIcon },
  { name: 'Pedidos', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
  { name: 'Finalizar Ventas', href: '/dashboard/sales', icon: CheckCircleIcon },
];

// Navegación adicional solo para administradores
const adminNavigation = [
  { name: 'Usuarios', href: '/dashboard/users', icon: UserGroupIcon },
  { name: 'Zonas', href: '/dashboard/zones', icon: MapIcon },
  { name: 'Metas', href: '/dashboard/metas', icon: TrophyIcon },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Combinar navegación basada en el rol
  const mobileNavigation = [...commonNavigation];
  if (isAdmin) {
    mobileNavigation.push(...adminNavigation);
  }

  const renderNavLinks = (items: typeof commonNavigation, isMobile: boolean = false) => {
    return items.map((item) => {
      const isActive = pathname === item.href;
      
      if (isMobile) {
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <item.icon
              className={`h-5 w-5 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span className="mt-1 text-[10px]">{item.name}</span>
          </Link>
        );
      }

      return (
        <Link
          key={item.name}
          href={item.href}
          className={`group relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600'
          }`}
        >
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
          )}
          <item.icon
            className={`mr-3 h-5 w-5 flex-shrink-0 relative z-10 ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}
          />
          <span className="relative z-10">{item.name}</span>
          {isActive && (
            <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          )}
        </Link>
      );
    });
  };

  const renderUserProfile = () => (
    <div className="relative border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
      <div className="relative flex items-center">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <UserCircleIcon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-green-400 font-medium">En línea</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="ml-auto flex items-center rounded-xl p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200 group"
          title="Cerrar sesión"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Modernizado */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transition duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col relative">
          {/* Efectos decorativos */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-br-3xl"></div>
          <div className="absolute top-16 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-xl"></div>
          
          <div className="relative flex h-20 items-center justify-between px-6 border-b border-slate-700/50 backdrop-blur-sm">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SM</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg font-audiowide">GrupoSM</h1>
                <p className="text-slate-400 text-xs">CRM Inmobiliario</p>
              </div>
            </Link>
            <button
              className="lg:hidden -mr-1 rounded-xl p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2 px-4 py-6">
            {renderNavLinks(commonNavigation)}
            {isAdmin && (
              <>
                <div className="my-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-3 text-slate-400 font-semibold tracking-wider">Administración</span>
                  </div>
                </div>
                {renderNavLinks(adminNavigation)}
              </>
            )}
          </nav>
          {renderUserProfile()}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header solo visible en móvil */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Abrir sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">SM</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 relative">
          {/* Efectos de fondo para el contenido principal */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 to-cyan-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>

        {/* Navegación móvil inferior */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/50 bg-white/80 backdrop-blur-lg lg:hidden">
          <div className="flex w-full overflow-x-auto px-2 py-2 justify-start">
            {renderNavLinks(mobileNavigation, true)}
          </div>
        </nav>
      </div>
    </div>
  );
} 