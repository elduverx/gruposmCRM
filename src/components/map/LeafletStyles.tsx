'use client';

import { useEffect, useState } from 'react';

export default function LeafletStyles() {
  const [stylesLoaded, setStylesLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadStyles = async () => {
      try {
        // Add Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Add Leaflet Draw CSS
        const drawLink = document.createElement('link');
        drawLink.rel = 'stylesheet';
        drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
        document.head.appendChild(drawLink);

        // Add custom Leaflet styles
        const style = document.createElement('style');
        style.textContent = `
          .leaflet-default-icon-path {
            background-image: url('/images/marker-icon.png');
          }
          .leaflet-default-shadow-path {
            background-image: url('/images/marker-shadow.png');
          }
          .leaflet-control-layers-toggle {
            background-image: url('/images/layers.png');
          }
          .leaflet-retina .leaflet-control-layers-toggle {
            background-image: url('/images/layers-2x.png');
          }
        `;
        document.head.appendChild(style);

        setStylesLoaded(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading Leaflet styles:', error);
      }
    };

    loadStyles();

    return () => {
      const links = document.querySelectorAll('link[href*="leaflet"]');
      const styles = document.querySelectorAll('style');
      links.forEach(link => link.remove());
      styles.forEach(style => style.remove());
    };
  }, []);

  if (!stylesLoaded) {
    return null;
  }

  return null;
} 