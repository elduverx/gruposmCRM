'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DPV {
  id: string;
  links: string[];
  realEstate: string | null;
  phone: string | null;
  currentPrice: number | null;
  estimatedValue: number | null;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

interface DPVFormProps {
  initialData: DPV | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function DPVForm({ initialData, onSubmit, isLoading }: DPVFormProps) {
  const [formData, setFormData] = useState({
    links: initialData?.links || [''],
    realEstate: initialData?.realEstate || '',
    phone: initialData?.phone || '',
    currentPrice: initialData?.currentPrice || '',
    estimatedValue: initialData?.estimatedValue || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      links: formData.links.filter(link => link.trim() !== ''),
      currentPrice: formData.currentPrice ? Number(formData.currentPrice) : null,
      estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : null,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link),
    }));
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, ''],
    }));
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Links</label>
        <div className="space-y-2">
          {formData.links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeLink(index)}
                className="px-2"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addLink}
            className="mt-2"
          >
            Agregar Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Inmobiliaria</label>
          <input
            type="text"
            name="realEstate"
            value={formData.realEstate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Precio Actual</label>
          <input
            type="number"
            name="currentPrice"
            value={formData.currentPrice}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Valor Estimado</label>
          <input
            type="number"
            name="estimatedValue"
            value={formData.estimatedValue}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
} 