'use client';

import { useState, useEffect } from 'react';
import { getPropertyNews, createPropertyNews, deletePropertyNews } from './actions';
import { PropertyNews } from '@/types/property';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PropertyNewsForm } from '../properties/PropertyNewsForm';

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState<PropertyNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadNews = async () => {
    try {
      const data = await getPropertyNews();
      setNews(data);
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Error al cargar las noticias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
      const success = await deletePropertyNews(id);
      if (success) {
        toast.success('Noticia eliminada correctamente');
        loadNews();
      } else {
        toast.error('Error al eliminar la noticia');
      }
    }
  };

  const handleNewsClick = (newsItem: PropertyNews) => {
    if (newsItem.type === 'DPV' && newsItem.propertyId) {
      router.push(`/dashboard/properties/${newsItem.propertyId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Noticias de Propiedades</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nueva Noticia
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay noticias registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valoración</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {news.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 ${item.type === 'DPV' ? 'cursor-pointer' : ''}`}
                  onClick={() => handleNewsClick(item)}
                >
                  <td className="py-3 px-4">
                    {item.property?.address || 'Sin dirección'} - {item.property?.population || 'Sin población'}
                  </td>
                  <td className="py-3 px-4">
                    {item.type === 'DPV' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        DPV
                      </span>
                    ) : (
                      item.type
                    )}
                  </td>
                  <td className="py-3 px-4">{item.action}</td>
                  <td className="py-3 px-4">{item.valuation}</td>
                  <td className="py-3 px-4">{item.priority}</td>
                  <td className="py-3 px-4">{item.responsible}</td>
                  <td className="py-3 px-4">{item.value ? `€${item.value.toLocaleString('es-ES')}` : '-'}</td>
                  <td className="py-3 px-4">{new Date(item.createdAt).toLocaleDateString('es-ES')}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nueva Noticia</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PropertyNewsForm
              onSuccess={() => {
                setIsModalOpen(false);
                loadNews();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 