'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { clients } from '@/lib/data/clients';

export default function ClientsMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    // Check if Leaflet is available
    if (typeof window === 'undefined' || !(window as any).L) {
      return;
    }

    const L = (window as any).L;

      // Fix for default marker icons in Next.js
      const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
      const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
      const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
      });

      // Calculate center point (average of all coordinates)
      const centerLat = clients.reduce((sum, client) => sum + client.lat, 0) / clients.length;
      const centerLng = clients.reduce((sum, client) => sum + client.lng, 0) / clients.length;

      try {
        // Initialize map
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 5,
          scrollWheelZoom: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Add markers for each client
        clients.forEach((client) => {
          const marker = L.marker([client.lat, client.lng]).addTo(map);
          marker.bindPopup(`
            <div style="text-align: center;">
              <strong style="font-weight: 600;">${client.name}</strong><br>
              <span style="color: #666; font-size: 0.875rem;">${client.location}</span>
            </div>
          `);
        });

        // Fit bounds to show all markers
        const bounds = L.latLngBounds(
          clients.map((client) => [client.lat, client.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });

        mapInstanceRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
  };

  useEffect(() => {
    if (!isMounted || !scriptLoaded || mapInstanceRef.current) {
      return;
    }

    // Small delay to ensure everything is ready
    const timer = setTimeout(initMap, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Map might already be removed
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, scriptLoaded]);

  if (!isMounted) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Error loading map: {mapError}</p>
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        strategy="lazyOnload"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          setMapError('Failed to load Leaflet library');
        }}
      />
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] rounded-lg overflow-hidden border border-border"
        style={{ zIndex: 0 }}
      />
    </>
  );
}
