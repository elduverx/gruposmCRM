'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  NewspaperIcon, 
  UsersIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { useAuth } from '@/hooks/useAuth';

// Opciones de navegación para usuarios normales
const userNavigation = [
  { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
  { name: 'Inmuebles', href: '/dashboard/properties', icon: BuildingOfficeIcon },
  { name: 'Clientes', href: '/dashboard/clients', icon: UsersIcon },
  { name: 'Encargos', href: '/dashboard/assignments', icon: ClipboardDocumentListIcon },
  { name: 'Noticias', href: '/noticia', icon: NewspaperIcon },
];

// Opciones adicionales para administradores
const adminNavigation = [
  { name: 'Zonas', href: '/dashboard/zones', icon: MapIcon },
  { name: 'Usuarios', href: '/dashboard/users', icon: UsersIcon },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determinar si el usuario es administrador
  const isAdmin = user?.role === 'ADMIN';
  
  // Combinar las opciones de navegación según el rol
  const navigation = isAdmin 
    ? [...userNavigation, ...adminNavigation] 
    : userNavigation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil - Parte inferior */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {userNavigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sidebar para desktop - Parte izquierda */}
      <div 
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className={`text-xl font-bold text-primary-600 transition-opacity duration-300 ${
              isCollapsed ? 'opacity-0' : 'opacity-100'
            }`}>
              Grupo SM
            </h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span className={`ml-3 transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className={`ml-3 flex-1 transition-opacity duration-300 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            }`}>
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Usuario'}</p>
              <button
                onClick={logout}
                className="mt-1 w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`lg:flex lg:flex-col lg:flex-1 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Contenido */}
        <main className="flex-1 pb-16 lg:pb-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 