'use client';

import { useEffect } from 'react';

export default function LeafletStyles() {
  useEffect(() => {
    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Add Leaflet Draw CSS
    const drawLink = document.createElement('link');
    drawLink.rel = 'stylesheet';
    drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
    document.head.appendChild(drawLink);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(drawLink);
    };
  }, []);

  return null;
} 