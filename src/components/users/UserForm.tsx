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
  const [generatedPassword, setGeneratedPassword] = useState('');

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div className="group relative">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          👤 Nombre completo
        </label>
        <div className="relative">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 pl-12 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-lg transition-all duration-300 group-hover:shadow-xl"
            placeholder="Ingresa el nombre completo"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Email Field */}
      <div className="group relative">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📧 Correo electrónico
        </label>
        <div className="relative">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 pl-12 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-lg transition-all duration-300 group-hover:shadow-xl"
            placeholder="usuario@ejemplo.com"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Role Field */}
      <div className="group relative">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          🏷️ Rol del usuario
        </label>
        <div className="relative">
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 pl-12 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-lg transition-all duration-300 group-hover:shadow-xl appearance-none"
          >
            <option value="USER">👤 Usuario</option>
            <option value="ADMIN">👑 Administrador</option>
          </select>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Password Field */}
      <div className="group relative">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            🔒 {user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          </label>
          {user && (
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
              onClick={() => {
                const newPass = Math.random().toString(36).slice(-12) + '!';
                setFormData(prev => ({ ...prev, password: newPass }));
                setGeneratedPassword(newPass);
              }}
            >
              Generar temporal
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!user}
            className="w-full px-4 py-3 pl-12 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-lg transition-all duration-300 group-hover:shadow-xl"
            placeholder={user ? "Dejar en blanco para mantener la actual" : "Ingresa una contraseña segura"}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        {user && (
          <p className="text-xs text-slate-500 mt-1 ml-1">
            💡 Deja este campo vacío para mantener la contraseña actual
          </p>
        )}
        {generatedPassword && (
          <p className="text-xs text-green-600 mt-1 ml-1 break-all">
            Contraseña temporal: <span className="font-semibold text-slate-800">{generatedPassword}</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="group relative px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 font-medium"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>❌ Cancelar</span>
          </span>
        </button>
        <button
          type="submit"
          className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{user ? '💾 Guardar Cambios' : '🆕 Crear Usuario'}</span>
          </span>
        </button>
      </div>
    </form>
  );
} 
