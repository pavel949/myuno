import { useEffect, useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import maplibregl, { Map as MlMap, MapGeoJSONFeature, StyleSpecification } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { Crosshair, Loader2 } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import phuketPmtilesAsset from '@/assets/map/phuket.pmtiles.asset.json';


// ---------- pmtiles protocol registration (once per page) ----------
let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  protocolRegistered = true;
}

// ---------- Style resolution ----------
// Priority:
//   1. VITE_PHUKET_PMTILES_URL override (custom self-hosted)
//   2. Bundled CDN asset (Lovable assets-v1 — works offline once cached)
//   3. OpenFreeMap public vector tiles (network fallback)
const PHUKET_PMTILES_URL =
  (import.meta.env.VITE_PHUKET_PMTILES_URL as string | undefined) ||
  (phuketPmtilesAsset?.url ?? '');
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function buildPmtilesStyle(pmtilesUrl: string): StyleSpecification {
  // Minimal dark style consuming OpenMapTiles schema from a local pmtiles archive.
  // tilemaker --output phuket.mbtiles (default profile) produces this schema.
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: {
        type: 'vector',
        url: `pmtiles://${pmtilesUrl}`,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#08101E' } },
      {
        id: 'water',
        type: 'fill',
        source: 'omt',
        'source-layer': 'water',
        paint: { 'fill-color': '#0a1a30' },
      },
      {
        id: 'landcover',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        paint: { 'fill-color': '#0d1a26', 'fill-opacity': 0.6 },
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        paint: { 'fill-color': '#0e1f2e', 'fill-opacity': 0.5 },
      },
      {
        id: 'roads',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#2a3a52',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 2, 18, 6],
        },
      },
      {
        id: 'buildings',
        type: 'fill',
        source: 'omt',
        'source-layer': 'building',
        minzoom: 13,
        paint: { 'fill-color': '#13243a', 'fill-outline-color': '#1c2f48' },
      },
      {
        id: 'place-labels',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'place',
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
        },
        paint: { 'text-color': '#c8d2e0', 'text-halo-color': '#08101E', 'text-halo-width': 1.2 },
      },
    ],
  };
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Hex color for marker fill */
  color?: string;
  /** Emoji or short text rendered as marker label */
  icon?: string;
  /** Used for accessibility / title */
  title?: string;
  /** Free-form payload returned in onMarkerClick */
  data?: unknown;
}

export interface MapLibreMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  /** Fit bounds to markers when they change. Default true. */
  fitToMarkers?: boolean;
  className?: string;
  /** Disable controls (zoom, geolocate). Default false. */
  minimal?: boolean;
  /** Show large floating "Find me" button (bottom-right). Default true. */
  showLocateButton?: boolean;
  /** Localized label for the locate button. */
  locateLabel?: string;
  /** Id of the currently active marker — visually highlighted with a ring + scale. */
  activeMarkerId?: string;
}

export interface MapLibreMapHandle {
  locate: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

export const MapLibreMap = forwardRef<MapLibreMapHandle, MapLibreMapProps>(function MapLibreMap(
  {
    center,
    zoom = 11,
    markers = [],
    onMarkerClick,
    fitToMarkers = true,
    className,
    minimal = false,
    showLocateButton = true,
    locateLabel = 'Найти меня',
    activeMarkerId,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const style = useMemo<string | StyleSpecification>(() => {
    if (PHUKET_PMTILES_URL) {
      ensurePmtilesProtocol();
      return buildPmtilesStyle(PHUKET_PMTILES_URL);
    }
    return OPENFREEMAP_STYLE;
  }, []);

  const showUserPosition = (lat: number, lng: number, accuracy?: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 18px; height: 18px; border-radius: 9999px;
        background: #1a73e8; border: 3px solid #fff;
        box-shadow: 0 0 0 4px rgba(26,115,232,0.25), 0 2px 6px rgba(0,0,0,0.4);
      `;
      el.setAttribute('aria-label', 'Your location');
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }
    const targetZoom = accuracy && accuracy > 500 ? 13 : 15;
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), targetZoom), duration: 700 });
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocateError('Геолокация недоступна');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        showUserPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        setLocating(false);
        setLocateError(err.code === err.PERMISSION_DENIED ? 'Доступ запрещён' : 'Не удалось определить');
        setTimeout(() => setLocateError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  useImperativeHandle(ref, () => ({
    locate,
    flyTo: (lat, lng, z) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 600 });
    },
  }));

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: { compact: true },
    });

    if (!minimal) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    }

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  // Sync markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((m) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', m.title || m.id);
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 9999px; cursor: pointer;
        background: ${m.color || '#00D68F'}; color: #08101E; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid rgba(255,255,255,0.85); box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        padding: 0; line-height: 1;
      `;
      el.textContent = m.icon || '•';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick?.(m);
      });
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (fitToMarkers && markers.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
    } else if (fitToMarkers && markers.length === 1) {
      map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 14, duration: 600 });
    }
  }, [markers, fitToMarkers, onMarkerClick]);

  // React to center prop changes when no markers drive the view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || markers.length > 0) return;
    map.flyTo({ center: [center.lng, center.lat], zoom, duration: 400 });
  }, [center.lat, center.lng, zoom, markers.length]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {showLocateButton && !minimal && (
        <div className="absolute right-3 bottom-20 z-10 flex flex-col items-end gap-2 pointer-events-none">
          {locateError && (
            <div className="pointer-events-auto bg-card text-foreground text-xs px-3 py-1.5 rounded-md border border-border shadow-md">
              {locateError}
            </div>
          )}
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            aria-label={locateLabel}
            title={locateLabel}
            className="pointer-events-auto h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background flex items-center justify-center hover:brightness-110 active:scale-95 transition disabled:opacity-70"
          >
            {locating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Crosshair className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
});


export type { MapGeoJSONFeature };
