import { Map as LeafletMap } from 'leaflet';

declare module 'react-leaflet' {
  interface MapContainerProps {
    ref?: React.RefObject<LeafletMap>;
  }
} 