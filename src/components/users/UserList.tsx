'use client';

import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import UserForm from './UserForm';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserListProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  isAdmin: boolean;
}

export default function UserList({ users, onUsersChange, isAdmin }: UserListProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  const handleEdit = (user: User) => {
    if (!isAdmin) return;
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!isAdmin) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No estás autenticado');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario');
      }

      onUsersChange(users.filter(user => user.id !== userId));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const handleFormSubmit = async (formData: Partial<User>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No estás autenticado');
        router.push('/login');
        return;
      }

      const url = selectedUser 
        ? `/api/users/${selectedUser.id}` 
        : '/api/users';
      
      const method = selectedUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      // Si el token ha expirado, intentar refrescarlo
      if (response.status === 401) {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json() as { token: string };
          const newToken = refreshData.token;
          localStorage.setItem('token', newToken);

          // Reintentar la operación original con el nuevo token
          const retryResponse = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify(formData)
          });

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json() as { message?: string };
            throw new Error(errorData.message || 'Error al procesar la solicitud después de refrescar el token');
          }

          const data = await retryResponse.json() as User;
          handleSuccess(data);
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Error al procesar la solicitud');
      }

      const data = await response.json() as User;
      // eslint-disable-next-line no-console
      console.log('Usuario creado/actualizado:', data);
      handleSuccess(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    }
  };

  const handleSuccess = (data: User) => {
    // eslint-disable-next-line no-console
    console.log('Manejando éxito con datos:', data);
    // Actualizar la lista de usuarios
    if (selectedUser) {
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? data : user
      );
      // eslint-disable-next-line no-console
      console.log('Usuarios actualizados (edición):', updatedUsers);
      onUsersChange(updatedUsers);
    } else {
      const updatedUsers = [...users, data];
      // eslint-disable-next-line no-console
      console.log('Usuarios actualizados (creación):', updatedUsers);
      onUsersChange(updatedUsers);
    }

    // Limpiar el formulario
    setSelectedUser(null);
    setShowForm(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrar y ordenar usuarios
  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">👥</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-audiowide">
                  👥 Administrar Usuarios
                </h3>
                <p className="text-slate-600 mt-1">
                  {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} 
                  {filteredUsers.length !== users.length && ` de ${users.length} total`}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowForm(true);
                }}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>🆕 Nuevo Usuario</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-blue-50/50 rounded-2xl blur-sm"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Buscar usuarios por nombre, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 pr-12 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-lg transition-all duration-300"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                <span className="text-blue-700 font-medium text-sm">
                  📊 {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-blue-50/50 rounded-3xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-12">
              <div className="text-6xl mb-6">👥</div>
              <h3 className="text-xl font-bold text-slate-700 mb-3">
                {users.length === 0 ? 'No hay usuarios disponibles' : 'No se encontraron usuarios'}
              </h3>
              <p className="text-slate-500 mb-6">
                {users.length === 0 
                  ? 'Los usuarios aparecerán aquí una vez que se registren' 
                  : 'Prueba con otros términos de búsqueda'}
              </p>
              {isAdmin && users.length === 0 && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  🆕 Crear primer usuario
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 border-b border-white/20">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 font-audiowide group-hover:text-blue-700 transition-colors line-clamp-1">
                            👤 {user.name}
                          </h3>
                          <p className="text-slate-600 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                          user.role === 'ADMIN' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        }`}>
                          {user.role === 'ADMIN' ? '👑 Administrador' : '👤 Usuario'}
                        </span>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          title="Editar usuario"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          title="Eliminar usuario"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-slate-500 to-blue-600 p-2 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 4v6m-4-6h8m-8 0H4a1 1 0 00-1 1v8a1 1 0 001 1h16a1 1 0 001-1v-8a1 1 0 00-1-1H4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">📅 Fecha de registro</p>
                        <p className="font-semibold text-slate-800">
                          {new Date(user.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      👤 Ver Perfil
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/users/${user.id}?tab=goals`)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      🎯 Ver Metas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-sm"></div>
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 max-w-md w-full">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                    {selectedUser ? '✏️ Editar Usuario' : '🆕 Nuevo Usuario'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                <UserForm
                  user={selectedUser}
                  onSubmit={handleFormSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 