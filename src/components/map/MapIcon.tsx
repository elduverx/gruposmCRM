'use client';

import L from 'leaflet';

// Fix for default marker icons in Next.js
let icon: L.Icon | undefined = undefined;

// Only create the icon on the client side
if (typeof window !== 'undefined') {
  icon = L.icon({
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

export default icon; 