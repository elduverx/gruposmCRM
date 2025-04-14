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
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Usuarios
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Lista de usuarios del sistema
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-b border-gray-200 sm:px-6">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ul className="divide-y divide-gray-200">
        {filteredUsers.map((user) => (
          <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-indigo-600 truncate">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-gray-400">
                  Rol: {user.role} | Creado: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
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
      )}
    </div>
  );
} 