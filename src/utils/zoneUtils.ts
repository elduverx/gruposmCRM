import { Zone } from '@/app/dashboard/zones/actions';

/**
 * Determina si un punto está dentro de un polígono usando el algoritmo de ray casting
 * @param point Coordenadas del punto a verificar
 * @param polygon Array de coordenadas que forman el polígono
 * @returns true si el punto está dentro del polígono, false en caso contrario
 */
export function isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Encuentra la zona a la que pertenece una propiedad basándose en sus coordenadas
 * @param point Coordenadas de la propiedad
 * @param zones Array de zonas disponibles
 * @returns La zona a la que pertenece la propiedad o null si no pertenece a ninguna
 */
export function findZoneForCoordinates(point: { lat: number; lng: number }, zones: Zone[]): Zone | null {
  for (const zone of zones) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return zone;
    }
  }
  
  return null;
} 