import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { paramByKey } from '../../constants/paramDefs.js';
import { INDIA_STATES_GEO } from '../../constants/indiaGeo.js';
import { drawWeatherField } from '../../utils/kernelInterp.js';

export default function HeatMap({ rows, filters, data, onZoom, onFieldRange }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const stateBoundaryRef = useRef(null);
  const fieldCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Debounced window resize handler
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize map synchronously with local Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
      wheelPxPerZoomLevel: 120,
    }).setView([22.5, 80.5], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    map.createPane('statesPane'); map.getPane('statesPane').style.zIndex = 300;
    map.createPane('interpPane'); map.getPane('interpPane').style.zIndex = 350;
    map.createPane('bordersPane'); map.getPane('bordersPane').style.zIndex = 380;

    const stateLayer = L.geoJSON(INDIA_STATES_GEO, {
      pane: 'bordersPane',
      style: () => ({ color: '#5A1530', weight: 1.3, opacity: 0.85, fillOpacity: 0 }),
    }).addTo(map);
    stateBoundaryRef.current = stateLayer;

    const canvas = L.DomUtil.create('canvas', 'weather-field');
    canvas.style.cssText = 'position:absolute;pointer-events:none;';
    map.getPane('interpPane').appendChild(canvas);
    fieldCanvasRef.current = canvas;

    leafletMapRef.current = map;
    onZoom(map.getZoom());
    setReady(true);
    setMapLoading(false);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        stateBoundaryRef.current = null;
        fieldCanvasRef.current = null;
      }
    };
  }, [onZoom]);

  // Check if rows have valid GPS
  const hasValidGPS = rows && rows.length > 0 && rows.some(r =>
    r[0] != null && r[1] != null && !isNaN(r[0]) && !isNaN(r[1])
  );

  // High performance redraw scheduled on next animation frame
  const triggerDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!fieldCanvasRef.current || !leafletMapRef.current) return;
      if (!rows || !rows.length || !data) {
        const ctx = fieldCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, fieldCanvasRef.current.width, fieldCanvasRef.current.height);
        return;
      }

      const meta = paramByKey(filters.param);
      const isCat = !!(meta && meta.categorical);
      const pool = isCat ? (meta.pool === 'DOSHA_LABELS' ? data.doshaLabels : data.issues) : null;
      const targetIdx = isCat && pool ? pool.indexOf(filters.catValue) : -1;

      try {
        const fieldRange = drawWeatherField(
          fieldCanvasRef.current, leafletMapRef.current,
          rows, meta.idx, isCat, targetIdx, data.states, data.cities
        );
        onFieldRange(fieldRange);
      } catch (e) {
        console.warn('Weather field draw error:', e);
      }
    });
  }, [rows, filters, data, onFieldRange]);

  // Re-draw on data/filter updates
  useEffect(() => {
    if (!ready) return;
    triggerDraw();
  }, [ready, triggerDraw]);

  // Re-draw smoothly on map move or zoom
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !ready) return;

    const handleMapMovement = () => {
      onZoom(map.getZoom());
      triggerDraw();
    };

    map.on('zoomend moveend', handleMapMovement);
    return () => {
      if (map) map.off('zoomend moveend', handleMapMovement);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, onZoom, triggerDraw]);

  return (
    <div style={{ position: 'relative' }}>
      <div id="map-container" ref={mapContainerRef}></div>
      {mapLoading && (
        <div className="map-loading">
          <div className="map-spinner"></div>
          <span>Initializing map…</span>
        </div>
      )}
      {ready && !mapLoading && !hasValidGPS && rows && rows.length > 0 && (
        <div className="map-no-data">
          <span className="empty-icon">🗺️</span>
          <h4>No GPS Data Available</h4>
          <p>The current filter selection has no rows with valid geographic coordinates to plot.</p>
        </div>
      )}
    </div>
  );
}
