import { Map as LeafletMap, Marker, FeatureGroup, LatLng, LeafletMouseEvent } from 'leaflet';

declare module 'react-leaflet' {
  interface MapContainerProps {
    ref?: React.RefObject<LeafletMap>;
  }
  
  interface MarkerProps {
    ref?: (ref: Marker | null) => void;
  }
  
  interface PolygonProps {
    eventHandlers?: {
      click?: (e: LeafletMouseEvent) => void;
      dblclick?: (e: LeafletMouseEvent) => void;
    };
  }
}

// Extender los tipos de Leaflet para evitar errores
declare module 'leaflet' {
  interface FeatureGroup {
    getLatLngs(): LatLng[][];
  }
  
  interface Control {
    Draw: any;
  }
  
  interface DrawEvents {
    created: any;
    edited: any;
    deleted: any;
  }
  
  interface Map {
    on(type: 'draw:created' | 'draw:edited' | 'draw:deleted' | 'click', fn: (e: any) => void): this;
    off(type: 'draw:created' | 'draw:edited' | 'draw:deleted' | 'click'): this;
  }
} 