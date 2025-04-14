'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { MapWithDrawProps } from './MapWithDraw';
import L from 'leaflet';

// Importar MapWithDraw dinámicamente con SSR deshabilitado
const MapWithDrawComponent = dynamic(() => import('./MapWithDraw'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
    </div>
  ),
});

// Crear un componente que use forwardRef correctamente
const DynamicMap = React.forwardRef<L.Map, MapWithDrawProps>((props, ref) => {
  return <MapWithDrawComponent {...props} ref={ref} />;
});

DynamicMap.displayName = 'DynamicMap';

export default DynamicMap; 