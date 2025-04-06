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
}

export default function UserList({ users, onUsersChange }: UserListProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario');
      }

      onUsersChange(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const handleFormSubmit = async (formData: Partial<User>) => {
    try {
      const token = localStorage.getItem('authToken');
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

      if (response.status === 401) {
        // Intentar refrescar el token
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (refreshResponse.ok) {
          const { token: newToken } = await refreshResponse.json();
          localStorage.setItem('authToken', newToken);

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
            throw new Error('Error al procesar la solicitud después de refrescar el token');
          }

          const data = await retryResponse.json();
          handleSuccess(data);
          return;
        } else {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          router.push('/login');
          return;
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al procesar la solicitud');
      }

      const data = await response.json();
      console.log('Usuario creado/actualizado:', data);
      handleSuccess(data);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    }
  };

  const handleSuccess = (data: User) => {
    console.log('Manejando éxito con datos:', data);
    // Actualizar la lista de usuarios
    if (selectedUser) {
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? data : user
      );
      console.log('Usuarios actualizados (edición):', updatedUsers);
      onUsersChange(updatedUsers);
    } else {
      const updatedUsers = [...users, data];
      console.log('Usuarios actualizados (creación):', updatedUsers);
      onUsersChange(updatedUsers);
    }

    // Limpiar el formulario
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER'
    });
    setSelectedUser(null);
    setShowForm(false);
  };

  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Lista de Usuarios</h2>
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Agregar Usuario
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Nombre
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Email
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Rol
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron usuarios que coincidan con la búsqueda
          </div>
        )}
      </div>

      {showForm && (
        <UserForm
          user={selectedUser}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
} 