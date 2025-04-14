/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
// Importaciones de leaflet-draw
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawControlProps {
  editableLayers?: L.FeatureGroup | null;
  onCreated: (e: { layer: L.Layer & { getLatLngs: () => L.LatLng[][] } }) => void;
}

const DrawControl: React.FC<DrawControlProps> = ({ editableLayers, onCreated }) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      console.log('Inicializando DrawControl...');
      
      // Asegurarse de que tenemos un FeatureGroup válido
      if (!featureGroupRef.current) {
        featureGroupRef.current = editableLayers || new L.FeatureGroup();
        
        if (!editableLayers) {
          map.addLayer(featureGroupRef.current);
        }
      }

      // Limpiar controles existentes para evitar duplicados
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }

      // Obtener el FeatureGroup
      const featureGroup = featureGroupRef.current;
      
      if (!featureGroup) {
        console.error('No se pudo crear el FeatureGroup');
        return;
      }

      // Configurar opciones simplificadas para el control de dibujo
      const drawOptions: L.Control.DrawConstructorOptions = {
        position: 'topright' as L.ControlPosition,
        draw: {
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'Los polígonos no pueden intersectarse'
            },
            shapeOptions: {
              color: '#3388ff',
              weight: 2
            }
          }
        },
        edit: {
          featureGroup: featureGroup,
          remove: true
        }
      };

      console.log('Configuración de dibujo:', drawOptions);
      
      // Crear el control de dibujo
      try {
        drawControlRef.current = new L.Control.Draw(drawOptions);
        map.addControl(drawControlRef.current);
        console.log('Control de dibujo añadido al mapa');
      } catch (error) {
        console.error('Error al crear el control de dibujo:', error);
      }

      // Agregar los manejadores de eventos para el dibujo
      // Primero eliminamos cualquier handler existente para evitar duplicados
      map.off('draw:created');
      map.off('draw:edited');
      map.off('draw:deleted');

      // Manejador para cuando se crea un polígono
      map.on('draw:created', (e: { layer: L.Layer & { getLatLngs: () => L.LatLng[][] } }) => {
        console.log('Polígono creado:', e);
        featureGroup.addLayer(e.layer);
        onCreated(e);
      });

      // Manejador para cuando se edita un polígono
      map.on('draw:edited', (e: { layers: L.FeatureGroup }) => {
        console.log('Polígono editado:', e);
        const layers = e.layers;
        
        layers.eachLayer((layer: L.Layer) => {
          if ('getLatLngs' in layer) {
            const typedLayer = layer as L.Layer & { getLatLngs: () => L.LatLng[][] };
            onCreated({ layer: typedLayer });
          }
        });
      });

      // Manejador para cuando se elimina un polígono
      map.on('draw:deleted', (e: { layers: L.FeatureGroup }) => {
        console.log('Polígono eliminado:', e);
      });

      // Comprobar que estamos en un entorno con Leaflet Draw
      console.log('¿Está disponible L.Draw?', !!L.Draw);
      console.log('¿Está disponible L.Control.Draw?', !!L.Control.Draw);

    } catch (error) {
      console.error('Error al inicializar DrawControl:', error);
    }

    // Limpiar al desmontar
    return () => {
      try {
        if (map && drawControlRef.current) {
          map.removeControl(drawControlRef.current);
          map.off('draw:created');
          map.off('draw:edited');
          map.off('draw:deleted');
        }
      } catch (error) {
        console.error('Error al limpiar DrawControl:', error);
      }
    };
  }, [map, editableLayers, onCreated]);

  return null;
};

DrawControl.displayName = 'DrawControl';

export default DrawControl; 