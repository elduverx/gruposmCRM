'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Import Map component dynamically to avoid SSR issues with leaflet
const CatastroMap = dynamic(() => import('./components/CatastroMap'), {
  loading: () => <div className="flex items-center justify-center h-[500px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>,
  ssr: false
});

interface Property {
  reference: string;
  owner: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  postal_code: string;
  cadastral_use: string;
  surface: string;
  property_type: string;
  year_built: string;
}

export default function CatastroPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage('Procesando archivo CSV...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/catastro', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setProperties(result.data);
        setMessage(`${result.data.length} propiedades cargadas correctamente`);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = async () => {
    setIsLoading(true);
    setMessage('Cargando datos de ejemplo...');

    try {
      const response = await fetch('/api/catastro');
      const result = await response.json();
      
      if (result.success) {
        setProperties(result.data);
        setMessage('Datos de ejemplo cargados correctamente');
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Catastro de Catarroja</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cargar datos catastrales</CardTitle>
          <CardDescription>
            Sube un archivo CSV con los datos del catastro o carga datos de ejemplo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>
            <Button onClick={loadSampleData} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                'Cargar datos de ejemplo'
              )}
            </Button>
          </div>
          {message && (
            <p className={`mt-2 ${message.includes('Error') ? 'text-destructive' : 'text-primary'}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="w-full">
            <Card>
              <CardContent className="pt-6">
                <CatastroMap properties={properties} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {properties.map((property, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h3 className="font-bold">{property.address}</h3>
                        <p className="text-sm text-muted-foreground">Referencia: {property.reference}</p>
                        <p className="text-sm">Propietario: {property.owner}</p>
                        <p className="text-sm">Superficie: {property.surface} m²</p>
                        <p className="text-sm">Tipo: {property.property_type}</p>
                        <p className="text-sm">Año construcción: {property.year_built}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 