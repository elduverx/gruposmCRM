'use client';

import { useState } from 'react';
import { NewspaperIcon } from '@heroicons/react/24/outline';

export default function NewsPage() {
  const [news, setNews] = useState([]);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Noticias</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todas las noticias y actualizaciones del sistema.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Agregar Noticia
          </button>
        </div>
      </div>
      
      {news.length === 0 ? (
        <div className="text-center mt-16">
          <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay noticias</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza agregando una nueva noticia al sistema.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* News cards will go here */}
        </div>
      )}
    </div>
  );
} 