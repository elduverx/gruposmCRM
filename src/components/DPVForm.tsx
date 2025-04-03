'use client';

import { useState } from 'react';
import { DPV } from '@/types/property';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DPVFormProps {
  initialData: Omit<DPV, 'id' | 'createdAt' | 'updatedAt'>;
  onSubmit: (data: Omit<DPV, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function DPVForm({ initialData, onSubmit, onCancel }: DPVFormProps) {
  const [links, setLinks] = useState<string[]>(initialData.links);
  const [newLink, setNewLink] = useState('');
  const [realEstate, setRealEstate] = useState(initialData.realEstate);
  const [phone, setPhone] = useState(initialData.phone);
  const [currentPrice, setCurrentPrice] = useState(initialData.currentPrice);
  const [estimatedValue, setEstimatedValue] = useState(initialData.estimatedValue);

  const handleAddLink = () => {
    if (newLink.trim()) {
      setLinks([...links, newLink.trim()]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      links,
      realEstate,
      phone,
      currentPrice,
      estimatedValue,
      propertyId: initialData.propertyId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Links
        </label>
        <div className="mt-1 space-y-2">
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <a href={link} className="text-blue-600 hover:underline flex-1" target="_blank" rel="noopener noreferrer">
                {link}
              </a>
              <button
                type="button"
                onClick={() => handleRemoveLink(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="inline-flex items-center justify-center p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="realEstate" className="block text-sm font-medium text-gray-700">
          Inmobiliaria
        </label>
        <input
          type="text"
          id="realEstate"
          value={realEstate}
          onChange={(e) => setRealEstate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700">
          Precio Actual
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            id="currentPrice"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">€</span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700">
          Valoración Estimada
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            id="estimatedValue"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">€</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </form>
  );
} 