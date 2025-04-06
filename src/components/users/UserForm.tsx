'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserFormProps {
  user?: User | null;
  onSubmit: (formData: Partial<User>) => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">
          {user ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {user ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {user ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 