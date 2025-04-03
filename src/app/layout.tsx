import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { HomeIcon, BuildingOfficeIcon, UserGroupIcon, NewspaperIcon, ClipboardDocumentListIcon, MapIcon } from "@heroicons/react/24/outline";
import 'leaflet/dist/leaflet.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real Estate CRM",
  description: "CRM system for real estate management",
};

const navigation = [
  { name: "Inicio", href: "/", icon: HomeIcon },
  { name: "Inmuebles", href: "/dashboard/properties", icon: BuildingOfficeIcon },
  { name: "Clientes", href: "/dashboard/clients", icon: UserGroupIcon },
  { name: "Noticias", href: "/dashboard/news", icon: NewspaperIcon },
  { name: "Encargos", href: "/dashboard/assignments", icon: ClipboardDocumentListIcon },
  { name: "Mapa de Zonas", href: "/dashboard/zones", icon: MapIcon },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
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
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <item.icon
                          className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
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
      </body>
    </html>
  );
}
