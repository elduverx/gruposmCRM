/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */

'use client';

import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Importar leaflet-draw de manera segura
import 'leaflet-draw';

// Definir tipos para los módulos dinámicos
declare global {
  interface Window {
    L: typeof L;
  }
}

// Este componente se encarga de inicializar Leaflet en el lado del cliente
const LeafletInit: React.FC = () => {
  useEffect(() => {
    // Este código solo se ejecuta en el cliente
    if (typeof window === 'undefined') return;

    // Verificar si ya hemos inicializado Leaflet
    const isInitialized = window.document.getElementById('leaflet-initialized');
    if (isInitialized) return;

    // Marcar como inicializado
    const marker = document.createElement('div');
    marker.id = 'leaflet-initialized';
    marker.style.display = 'none';
    document.body.appendChild(marker);

    // Función para establecer los iconos por defecto de Leaflet
    const setDefaultIcon = () => {
      try {
        // Importar L dinámicamente para evitar errores de SSR
        const L = require('leaflet');
        
        delete L.Icon.Default.prototype._getIconUrl;
        
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        console.log('Iconos por defecto de Leaflet configurados');
      } catch (error) {
        console.error('Error configurando iconos por defecto de Leaflet:', error);
      }
    };
    
    // Función para verificar si los estilos de Leaflet Draw están cargados
    const ensureLeafletDrawStyles = (): void => {
      const existingStyles = document.querySelectorAll('link[href*="leaflet.draw"]');
      if (existingStyles.length === 0) {
        const styleLinks = [
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css',
          'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css'
        ];

        styleLinks.forEach(link => {
          const styleElement = document.createElement('link');
          styleElement.rel = 'stylesheet';
          styleElement.href = link;
          document.head.appendChild(styleElement);
        });
      }
    };

    // Función para agregar estilos inline para asegurar la visibilidad
    const addInlineStyles = (): void => {
      const styleId = 'leaflet-draw-styles-aggressive';
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
          .leaflet-draw-toolbar a {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: white !important;
            border: 2px solid rgba(0,0,0,0.2) !important;
            border-radius: 4px !important;
            margin: 2px !important;
            padding: 4px !important;
          }
          .leaflet-draw-toolbar {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: white !important;
            border: 2px solid rgba(0,0,0,0.2) !important;
            border-radius: 4px !important;
            margin: 10px !important;
            padding: 4px !important;
          }
          .leaflet-draw-actions {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: white !important;
            border: 2px solid rgba(0,0,0,0.2) !important;
            border-radius: 4px !important;
            margin: 10px !important;
            padding: 4px !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
    };

    // Función para verificar si Leaflet Draw está disponible
    const checkLeafletDraw = (): boolean => {
      return typeof window !== 'undefined' && 
             window.L && 
             'Draw' in window.L && 
             'Control' in window.L && 
             'Draw' in window.L.Control;
    };

    // Función para inicializar Leaflet Draw
    const initLeafletDraw = (): void => {
      if (typeof window === 'undefined') return;

      // Asegurarse de que los estilos estén cargados
      ensureLeafletDrawStyles();
      addInlineStyles();

      // Verificar si Leaflet Draw está disponible
      if (!checkLeafletDraw()) {
        console.warn('Leaflet Draw no está disponible. Intentando cargar desde CDN...');
        
        // Cargar Leaflet Draw desde CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
        script.async = true;
        script.onload = () => {
          console.log('Leaflet Draw cargado desde CDN');
          // Verificar nuevamente después de cargar
          if (checkLeafletDraw()) {
            console.log('Leaflet Draw está disponible después de cargar desde CDN');
          } else {
            console.error('Leaflet Draw no está disponible después de cargar desde CDN');
          }
        };
        document.head.appendChild(script);
      } else {
        console.log('Leaflet Draw está disponible');
      }
    };

    // Establecer los iconos por defecto
    setDefaultIcon();
    
    // Inicializar Leaflet Draw
    initLeafletDraw();

    // Verificar periódicamente si Leaflet Draw está disponible
    const checkInterval = setInterval(() => {
      if (checkLeafletDraw()) {
        console.log('Leaflet Draw está disponible en la verificación periódica');
        clearInterval(checkInterval);
      }
    }, 1000);

    // Limpiar al desmontar
    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // Este componente no renderiza nada en el DOM
  return null;
};

export default LeafletInit; 