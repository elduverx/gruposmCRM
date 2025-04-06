'use client';

import Link from "next/link";
import { HomeIcon, BuildingOfficeIcon, UserGroupIcon, NewspaperIcon, ClipboardDocumentListIcon, MapIcon, UsersIcon } from "@heroicons/react/24/outline";
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import AuthForm from "@/components/AuthForm";

// Componente para el layout con autenticación
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const pathname = usePathname();
  
  // Si está cargando, mostrar un spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Si no está autenticado, mostrar el formulario de login
  if (!isAuthenticated) {
    return <AuthForm />;
  }
  
  const navigation = [
    { name: "Inicio", href: "/", icon: HomeIcon },
    { name: "Inmuebles", href: "/dashboard/properties", icon: BuildingOfficeIcon },
    { name: "Clientes", href: "/dashboard/clients", icon: UserGroupIcon },
    { name: "Noticias", href: "/dashboard/news", icon: NewspaperIcon },
    { name: "Encargos", href: "/dashboard/assignments", icon: ClipboardDocumentListIcon },
    { name: "Mapa de Zonas", href: "/dashboard/zones", icon: MapIcon },
    { name: "Usuarios", href: "/dashboard/users", icon: UsersIcon },
  ];
  
  // Si está autenticado, mostrar el layout normal
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <h1 className="text-2xl font-bold text-gray-900">Real Estate CRM</h1>
              </div>
              <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 flex-shrink-0 ${
                        pathname === item.href
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 px-4">
                <button
                  onClick={logout}
                  className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}
