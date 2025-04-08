'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

interface DrawControlProps {
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  editableLayers?: L.FeatureGroup | null;
  polygonColor?: string;
}

export default function DrawControl({ 
  onCreated, 
  onEdited, 
  onDeleted,
  editableLayers: externalEditableLayers,
  polygonColor = '#FF0000'
}: DrawControlProps) {
  const map = useMap();
  const editableLayersRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!map) return;

    // Usar el FeatureGroup externo si se proporciona, o crear uno nuevo
    const editableLayers = externalEditableLayers || new L.FeatureGroup();
    editableLayersRef.current = editableLayers;
    
    // Si no se proporciona un FeatureGroup externo, añadirlo al mapa
    if (!externalEditableLayers) {
      map.addLayer(editableLayers);
    }

    // Crear el control de dibujo
    const drawControl = new L.Control.Draw({
      draw: {
        // Deshabilitar todas las herramientas excepto polígonos
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Los polígonos no pueden intersectarse!'
          },
          shapeOptions: {
            color: polygonColor,
            fillColor: polygonColor
          }
        }
      },
      edit: {
        featureGroup: editableLayers,
        remove: true
      }
    });
    
    drawControlRef.current = drawControl;

    // Agregar el control al mapa
    map.addControl(drawControl);

    // Eventos de dibujo
    map.on('draw:created', (e: any) => {
      const layer = e.layer;
      editableLayers.addLayer(layer);
      if (onCreated) onCreated(e);
    });

    map.on('draw:edited', (e: any) => {
      if (onEdited) onEdited(e);
    });

    map.on('draw:deleted', (e: any) => {
      if (onDeleted) onDeleted(e);
    });

    // Limpieza al desmontar
    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      
      if (!externalEditableLayers && editableLayersRef.current) {
        map.removeLayer(editableLayersRef.current);
      }
      
      map.off('draw:created');
      map.off('draw:edited');
      map.off('draw:deleted');
    };
  }, [map, onCreated, onEdited, onDeleted, externalEditableLayers, polygonColor]);

  return null;
} 