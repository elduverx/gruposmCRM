import { useState } from 'react';

interface DPV {
  links: string[];
  realEstate: string;
  phone: string;
  currentPrice: number;
  estimatedValue: number;
}

interface DPVFormProps {
  initialData?: DPV;
  onSubmit: (data: DPV) => void;
  onCancel: () => void;
}

export default function DPVForm({ initialData, onSubmit, onCancel }: DPVFormProps) {
  const [formData, setFormData] = useState<DPV>(initialData || {
    links: [''],
    realEstate: '',
    phone: '',
    currentPrice: 0,
    estimatedValue: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Links
        </label>
        {formData.links.map((link, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="url"
              value={link}
              onChange={(e) => handleLinkChange(index, e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://"
            />
            <button
              type="button"
              onClick={() => handleRemoveLink(index)}
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Eliminar
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddLink}
          className="mt-1 text-sm text-blue-600 hover:text-blue-800"
        >
          + Añadir link
        </button>
      </div>

      <div>
        <label htmlFor="realEstate" className="block text-sm font-medium text-gray-700">
          Inmobiliaria
        </label>
        <input
          type="text"
          id="realEstate"
          value={formData.realEstate}
          onChange={(e) => setFormData(prev => ({ ...prev, realEstate: e.target.value }))}
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
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700">
            Precio Actual (€)
          </label>
          <input
            type="number"
            id="currentPrice"
            value={formData.currentPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: Number(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700">
            Valoración Estimada (€)
          </label>
          <input
            type="number"
            id="estimatedValue"
            value={formData.estimatedValue}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: Number(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
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