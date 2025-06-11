'use client';

import { useState, useEffect } from 'react';
import { PropertyNews } from '@/types/property';
import { NewspaperIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import SearchBar from '@/components/common/SearchBar';

export default function NewsPage() {
  const [news, setNews] = useState<PropertyNews[]>([]);
  const [filteredNews, setFilteredNews] = useState<PropertyNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    // Filtrar noticias cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredNews(news);
    } else {
      const filtered = news.filter(item => 
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.property.population.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNews(filtered);
    }
  }, [searchTerm, news]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json() as PropertyNews[];
        setNews(data);
        setFilteredNews(data);
      } else {
        // eslint-disable-next-line no-console
        console.error('Error fetching news:', response.statusText);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      try {
        const response = await fetch(`/api/news/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setNews(news.filter(item => item.id !== id));
          setFilteredNews(filteredNews.filter(item => item.id !== id));
        } else {
          // eslint-disable-next-line no-console
          console.error('Error deleting news:', response.statusText);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting news:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <NewspaperIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                  📰 Gestión de Noticias
                </h1>
                <p className="text-slate-600 mt-1">Administra noticias de propiedades y actividades</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-xl border border-green-200">
                <span className="text-green-700 font-medium text-sm">📊 {filteredNews.length} noticias</span>
              </div>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 font-medium">
                <NewspaperIcon className="h-5 w-5" />
                <span>🆕 Nueva Noticia</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <SearchBar 
                placeholder="🔍 Buscar noticias por tipo, acción, prioridad, dirección o población..." 
                onSearch={setSearchTerm}
              />
            </div>
            {searchTerm && (
              <div className="bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                <span className="text-blue-700 font-medium text-sm">
                  📋 {filteredNews.length} resultados encontrados
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
              </div>
              <p className="text-slate-700 text-lg font-medium">📰 Cargando noticias...</p>
              <p className="text-slate-500 text-sm mt-2">Obteniendo la información más reciente</p>
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="text-6xl mb-6">📰</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">
              {searchTerm ? 'No se encontraron noticias' : 'No hay noticias disponibles'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm 
                ? 'Prueba con otros términos de búsqueda' 
                : 'Comienza creando tu primera noticia'}
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium">
              🆕 Crear primera noticia
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Modern Table Header */}
            <div className="bg-gradient-to-r from-slate-100 to-blue-100 px-6 py-4 border-b border-slate-200">
              <div className="grid grid-cols-6 gap-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <span>🏠</span>
                  <span>Propiedad</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📋</span>
                  <span>Tipo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Acción</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🚨</span>
                  <span>Prioridad</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>Fecha</span>
                </div>
                <div className="text-right">
                  <span>🔧 Acciones</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced News List */}
            <div className="divide-y divide-slate-100">
              {filteredNews.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`group p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-6 gap-4 items-center">
                    {/* Property Address */}
                    <div>
                      <div className="font-bold text-slate-800 font-audiowide group-hover:text-blue-800 transition-colors">
                        {item.property.address}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {item.property.population}
                      </div>
                    </div>
                    
                    {/* Type */}
                    <div>
                      <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.type}
                      </span>
                    </div>
                    
                    {/* Action */}
                    <div>
                      <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.action}
                      </span>
                    </div>
                    
                    {/* Priority */}
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                        item.priority === 'HIGH' 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                          : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                      }`}>
                        {item.priority === 'HIGH' ? '🔴 Alta' : '🟡 Baja'}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <div className="text-sm text-slate-600">
                      📅 {new Date(item.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 