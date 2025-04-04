'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPropertyNews } from './actions';
import { getProperties } from './actions';
import { Property } from '@/types/property';

interface PropertyNewsFormProps {
  propertyId?: string;
  dpvValue?: number;
  onSuccess?: () => void;
}

export function PropertyNewsForm({ propertyId, dpvValue, onSuccess }: PropertyNewsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState({
    type: 'DPV',
    action: 'SALE',
    valuation: 'PRECIOSM',
    priority: 'LOW',
    responsible: '',
    value: dpvValue || 0,
    precioSM: 0,
    precioCliente: 0,
    propertyId: propertyId || ''
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Error al cargar las propiedades');
      }
    };

    if (!propertyId) {
      fetchProperties();
    }
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId) {
      toast.error('Debes seleccionar una propiedad');
      return;
    }
    
    setIsLoading(true);

    try {
      const newsData = {
        type: formData.type,
        action: formData.action,
        valuation: formData.valuation,
        priority: formData.priority,
        responsible: formData.responsible,
        value: showPrices ? parseFloat(formData.precioCliente.toString()) : parseFloat(formData.value.toString()),
        propertyId: formData.propertyId
      };

      await createPropertyNews(newsData);
      toast.success('Noticia creada correctamente');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('Error al crear la noticia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setShowPrices(checkbox.checked);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const beneficio = showPrices ? formData.precioCliente - formData.precioSM : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!propertyId && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Propiedad</label>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="">Selecciona una propiedad</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.address} - {property.population}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="DPV">DPV</option>
          <option value="PVA">PVA</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Acción</label>
        <select
          name="action"
          value={formData.action}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="SALE">Venta</option>
          <option value="RENT">Alquiler</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Valoración</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPrices"
              checked={showPrices}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
        <select
          name="valuation"
          value={formData.valuation}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="PRECIOSM">Precio SM</option>
          <option value="PRECIOCLIENTE">Precio Cliente</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Prioridad</label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Responsable</label>
        <input
          type="text"
          name="responsible"
          value={formData.responsible}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      {!showPrices ? (
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor</label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio SM</label>
            <input
              type="number"
              name="precioSM"
              value={formData.precioSM}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Cliente</label>
            <input
              type="number"
              name="precioCliente"
              value={formData.precioCliente}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Beneficio: <span className="text-green-600 font-bold">€{beneficio.toLocaleString('es-ES')}</span></p>
          </div>
        </>
      )}

      <div className="pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creando...' : 'Crear Noticia'}
        </Button>
      </div>
    </form>
  );
} 