/**
 * PropertyMapView — Airbnb-style map with price markers
 * Shows properties on a Mapbox map with clickable price pins
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDistrictLabel } from '@/lib/propertyTaxonomy';
import { cn } from '@/lib/utils';
import type { Property } from '@/hooks/useProperties';

// Phuket center
const DEFAULT_CENTER: [number, number] = [98.3381, 7.8804];
const DEFAULT_ZOOM = 10.5;
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbTlsMXlrNzIwMDhrMmpzZGVtbXhwYTdoIn0.aekxNRmnsXK-BBNQ-Cn6Xg';

interface PropertyMapViewProps {
  properties: Property[];
  hoveredProperty: string | null;
  onHover: (id: string | null) => void;
  mode?: 'rent' | 'buy';
  nights?: number;
  className?: string;
}

export function PropertyMapView({
  properties,
  hoveredProperty,
  onHover,
  mode = 'rent',
  nights,
  className,
}: PropertyMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Short price formatter for map pins
  const shortPrice = useCallback((price: number) => {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
    return `${price}`;
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validProps = properties.filter(p => p.lat && p.lng);

    validProps.forEach(property => {
      const price = mode === 'buy'
        ? ((property as any).sale_price || property.price || 0)
        : (property.price || 0);
      
      const priceLabel = `฿${shortPrice(price)}`;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'property-map-marker';
      el.innerHTML = `<span>${priceLabel}</span>`;
      el.style.cssText = `
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        font-size: 12px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 20px;
        border: 1.5px solid hsl(var(--border));
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.15s ease;
        z-index: 1;
      `;

      el.addEventListener('mouseenter', () => {
        onHover(property.id);
        el.style.transform = 'scale(1.1)';
        el.style.zIndex = '10';
        el.style.background = 'hsl(var(--primary))';
        el.style.color = 'hsl(var(--primary-foreground))';
        el.style.borderColor = 'hsl(var(--primary))';
      });

      el.addEventListener('mouseleave', () => {
        onHover(null);
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
        el.style.background = 'hsl(var(--background))';
        el.style.color = 'hsl(var(--foreground))';
        el.style.borderColor = 'hsl(var(--border))';
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(`/property/${property.id}`);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([property.lng!, property.lat!])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have properties with coordinates
    if (validProps.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validProps.forEach(p => bounds.extend([p.lng!, p.lat!]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 500 });
    }
  }, [properties, mode, shortPrice, onHover, navigate]);

  // Highlight hovered property marker
  useEffect(() => {
    markersRef.current.forEach((marker, idx) => {
      const el = marker.getElement();
      const property = properties.filter(p => p.lat && p.lng)[idx];
      if (!property) return;

      if (property.id === hoveredProperty) {
        el.style.transform = 'scale(1.15)';
        el.style.zIndex = '10';
        el.style.background = 'hsl(var(--primary))';
        el.style.color = 'hsl(var(--primary-foreground))';
        el.style.borderColor = 'hsl(var(--primary))';
      } else {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
        el.style.background = 'hsl(var(--background))';
        el.style.color = 'hsl(var(--foreground))';
        el.style.borderColor = 'hsl(var(--border))';
      }
    });
  }, [hoveredProperty, properties]);

  return (
    <div
      ref={mapContainer}
      className={cn("w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border", className)}
    />
  );
}

export default PropertyMapView;
