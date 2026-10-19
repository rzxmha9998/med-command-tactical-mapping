import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MedicalUnit,
  RiskZone,
  TacticalMap as ITacticalMap,
  BaseMapLayer,
  GeometryType,
  ZoneType,
  LatLngPoint,
  UnitStatus,
  OfficerLocation,
} from '../../types';
import { ZONE_CONFIG } from '../../constants/presets';
import {
  createTacticalMarkerIcon,
  createDraftPlottingIcon,
  createOfficerGPSMarkerIcon,
} from './markerIcons';
import { isLocationStale } from '../../firebase/services/officerLocationService';
import { MapControls } from './MapControls';
import { LocationSearch } from './LocationSearch';
import { MapLegend } from './MapLegend';
import { ZoneDrawingToolbar } from './ZoneDrawingToolbar';
import { MapPin, ShieldAlert } from 'lucide-react';
import { createDonutPolygonRings } from '../../utils/geoDonut';

interface TacticalMapProps {
  currentMap: ITacticalMap;
  units: MedicalUnit[];
  riskZones: RiskZone[];
  selectedUnit: MedicalUnit | null;
  onSelectUnit: (unit: MedicalUnit | null) => void;
  onSelectZone?: (zone: RiskZone | null) => void;
  officerLocations?: OfficerLocation[];
  // Unit plotting mode
  isPlottingMode?: boolean;
  onTogglePlottingMode?: () => void;
  draftUnitCoords?: LatLngPoint | null;
  onUpdateDraftCoords?: (coords: LatLngPoint) => void;
  onConfirmPlotUnit?: (coords: LatLngPoint) => void;
  // Zone drawing mode
  isDrawingMode?: boolean;
  onToggleDrawingMode?: () => void;
  onSaveDrawnZone?: (
    geomType: GeometryType,
    coordsStr: string,
    radius?: number,
    zoneType?: ZoneType
  ) => void;
  onCancelDrawing?: () => void;
  isAdmin?: boolean;
  isUnitPanelOpen?: boolean;
  isZonePanelOpen?: boolean;
}

const TILE_LAYERS: Record<BaseMapLayer, { url: string; attribution: string; subdomains?: string[]; className?: string }> = {
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  night: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'tactical-night-tiles',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  },
  humanitarian: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
  },
};

export const TacticalMapComponent: React.FC<TacticalMapProps> = ({
  currentMap,
  units,
  riskZones,
  selectedUnit,
  onSelectUnit,
  onSelectZone,
  officerLocations = [],
  isPlottingMode = false,
  onTogglePlottingMode,
  draftUnitCoords,
  onUpdateDraftCoords,
  onConfirmPlotUnit,
  isDrawingMode = false,
  onToggleDrawingMode,
  onSaveDrawnZone,
  onCancelDrawing,
  isAdmin = false,
  isUnitPanelOpen = false,
  isZonePanelOpen = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const activeBaseLayerRef = useRef<BaseMapLayer | null>(null);
  const lastMapIdRef = useRef<string | null>(null);

  // Invalidate map size after drawer transitions complete
  useEffect(() => {
    const t1 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 50);
    const t2 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isUnitPanelOpen, isZonePanelOpen]);

  // Layers for markers and vectors
  const unitsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const officersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const officerMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const draftPlotMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);

  // Drawing state
  const [activeGeometry, setActiveGeometry] = useState<GeometryType>('polygon');
  const [activeZoneType, setActiveZoneType] = useState<ZoneType>('red');
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);
  const drawingPointsRef = useRef<L.LatLng[]>([]);
  drawingPointsRef.current = drawingPoints;
  const drawingTempLayerRef = useRef<L.LayerGroup | null>(null);

  // UI state
  const [currentBaseLayer, setCurrentBaseLayer] = useState<BaseMapLayer>('osm');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [userLocating, setUserLocating] = useState(false);

  // Context menu position for right click
  const [contextPopup, setContextPopup] = useState<{
    lat: number;
    lng: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Clear any dangling leaflet id if previous instance was terminated abruptly
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentMap.centerLat, currentMap.centerLng],
        zoom: currentMap.defaultZoom || 15,
        zoomControl: false,
      });

      // Single active Tile Layer
      const tileConfig = TILE_LAYERS[currentBaseLayer];
      const layer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
        subdomains: tileConfig.subdomains || 'abc',
        className: tileConfig.className || '',
      }).addTo(map);
      layer.bringToBack();
      tileLayerRef.current = layer;
      activeBaseLayerRef.current = currentBaseLayer;

      // Create layer groups for units, officers, zones, and drawing
      zonesLayerGroupRef.current = L.layerGroup().addTo(map);
      unitsLayerGroupRef.current = L.layerGroup().addTo(map);
      officersLayerGroupRef.current = L.layerGroup().addTo(map);
      drawingTempLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      lastMapIdRef.current = currentMap.id;

      // Invalidate size immediately once rendered in DOM
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        activeBaseLayerRef.current = null;
        zonesLayerGroupRef.current = null;
        unitsLayerGroupRef.current = null;
        officersLayerGroupRef.current = null;
        officerMarkersMapRef.current.clear();
        drawingTempLayerRef.current = null;
        draftPlotMarkerRef.current = null;
        userLocationMarkerRef.current = null;
      }
    };
  }, []);

  // 1b. Dedicated ResizeObserver to handle panel toggles or viewport changes without re-initializing map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 2. React to map ID switch (only pan/zoom when switching to a different map)
  useEffect(() => {
    if (mapInstanceRef.current && currentMap) {
      if (lastMapIdRef.current !== currentMap.id) {
        lastMapIdRef.current = currentMap.id;
        mapInstanceRef.current.setView(
          [currentMap.centerLat, currentMap.centerLng],
          currentMap.defaultZoom || 15
        );
      }
    }
  }, [currentMap?.id, currentMap?.centerLat, currentMap?.centerLng, currentMap?.defaultZoom]);

  // 3. Tile Layer Switching (only recreate if layer actually changed)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (activeBaseLayerRef.current === currentBaseLayer && tileLayerRef.current) {
      return;
    }
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    const tileConfig = TILE_LAYERS[currentBaseLayer];
    const layer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
      subdomains: tileConfig.subdomains || 'abc',
      className: tileConfig.className || '',
    }).addTo(mapInstanceRef.current);
    layer.bringToBack();
    tileLayerRef.current = layer;
    activeBaseLayerRef.current = currentBaseLayer;
  }, [currentBaseLayer]);

  // 4. Cursor & Double Click Zoom handling without altering DOM className
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isDrawingMode) {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }

    const container = map.getContainer();
    if (container) {
      if (isPlottingMode || isDrawingMode) {
        container.style.cursor = 'crosshair';
      } else {
        container.style.cursor = '';
      }
    }
  }, [isDrawingMode, isPlottingMode]);

  // 4. Render Risk Zones (Red, Yellow, Green)
  useEffect(() => {
    if (!zonesLayerGroupRef.current || !mapInstanceRef.current) return;
    zonesLayerGroupRef.current.clearLayers();

    riskZones.forEach((zone) => {
      const cfg = ZONE_CONFIG[zone.zoneType] || ZONE_CONFIG.red;
      let layer: L.Polygon | L.Circle | L.Rectangle | null = null;

      try {
        if (zone.geometryType === 'circle') {
          const center = JSON.parse(zone.coordinates) as LatLngPoint;
          const radius = zone.radius || 300;
          const innerRadius = zone.innerRadius;
          const rings = createDonutPolygonRings(center, radius, innerRadius);
          layer = L.polygon(rings, {
            color: cfg.borderColor,
            weight: 3,
            fillColor: cfg.fillColor,
            fillOpacity: 0.35,
          });
        } else if (zone.geometryType === 'rectangle' || zone.geometryType === 'polygon') {
          const points = JSON.parse(zone.coordinates) as LatLngPoint[];
          const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
          layer = L.polygon(latLngs, {
            color: cfg.borderColor,
            weight: 3,
            fillColor: cfg.fillColor,
            fillOpacity: 0.32,
          });
        }

        if (layer) {
          // Tooltip on hover
          layer.bindTooltip(
            `<b>${zone.name}</b><br/><span style="color:${cfg.fillColor};">${cfg.label}</span>`,
            {
              sticky: true,
              className: 'bg-[#071629] text-white border border-[#1E3A5F] px-2 py-1 text-xs rounded font-sans shadow-lg',
            }
          );

          // Popup on click
          const popupHtml = `
            <div class="p-3 max-w-xs text-xs font-sans">
              <div class="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1" style="color: ${cfg.fillColor};">
                <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${cfg.fillColor};"></span>
                <span>${cfg.label}</span>
              </div>
              <h3 class="font-bold text-white text-sm mb-1">${zone.name}</h3>
              <div class="text-slate-300 mb-2 font-medium">${zone.riskLevel || cfg.subLabel}</div>
              ${
                zone.description
                  ? `<p class="text-slate-300 text-[11px] mb-2 p-1.5 bg-[#071629] rounded border border-[#1E3A5F]">${zone.description}</p>`
                  : ''
              }
              ${zone.notes ? `<div class="text-[10px] text-slate-400 italic">Catatan: ${zone.notes}</div>` : ''}
            </div>
          `;
          layer.bindPopup(popupHtml);

          layer.on('click', () => {
            onSelectZone?.(zone);
          });

          zonesLayerGroupRef.current?.addLayer(layer);
        }
      } catch (e) {
        console.warn('Failed to parse zone coordinates for zone:', zone.id, e);
      }
    });
  }, [riskZones, onSelectZone]);

  // 5. Render Units
  useEffect(() => {
    if (!unitsLayerGroupRef.current || !mapInstanceRef.current) return;
    unitsLayerGroupRef.current.clearLayers();

    units.forEach((unit) => {
      const isSelected = selectedUnit?.id === unit.id;
      const icon = createTacticalMarkerIcon(unit.type, unit.status, unit.unitCode, isSelected, unit.heading);

      const marker = L.marker([unit.lat, unit.lng], { icon });

      // Tactical Popup
      const statusLabels: Record<UnitStatus, string> = {
        standby: 'Siaga (Standby)',
        on_duty: 'Bertugas (On Duty)',
        en_route: 'Dalam Perjalanan (En Route)',
        inactive: 'Tidak Aktif (Inactive)',
      };
      const statusColors: Record<UnitStatus, string> = {
        standby: '#10B981',
        on_duty: '#F59E0B',
        en_route: '#38BDF8',
        inactive: '#64748B',
      };

      const popupHtml = `
        <div class="p-3 w-68 text-xs font-sans">
          ${
            unit.imageUrl
              ? `
            <div class="w-full h-28 rounded-lg overflow-hidden mb-2.5 bg-[#071629] border border-[#1E3A5F]">
              <img src="${unit.imageUrl}" alt="${unit.name}" class="w-full h-full object-cover" />
            </div>
          `
              : ''
          }
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#071629] text-[#2A9D8F] border border-[#1E3A5F]">
              ${unit.unitCode}
            </span>
            <span class="inline-flex items-center gap-1 text-[10px] font-bold" style="color: ${
              statusColors[unit.status]
            };">
              <span class="w-1.5 h-1.5 rounded-full inline-block" style="background-color: ${
                statusColors[unit.status]
              };"></span>
              ${statusLabels[unit.status] || unit.status}
            </span>
          </div>
          <h3 class="font-bold text-white text-sm leading-snug mb-1">${unit.name}</h3>
          
          <div class="space-y-1 my-2 text-[11px] text-slate-300">
            ${unit.crewNames ? `<div><strong class="text-slate-400">Kru:</strong> ${unit.crewNames}</div>` : ''}
            ${unit.hospitalReferral ? `<div><strong class="text-slate-400">RS Rujukan:</strong> ${unit.hospitalReferral}</div>` : ''}
            ${unit.heading !== undefined && unit.heading !== null ? `<div><strong class="text-slate-400">Heading GPS:</strong> <span class="font-mono text-cyan-300">${Math.round(unit.heading)}°</span></div>` : ''}
            ${unit.speed !== undefined && unit.speed !== null ? `<div><strong class="text-slate-400">Kecepatan:</strong> <span class="font-mono text-white">${unit.speed.toFixed(1)} km/h</span></div>` : ''}
          </div>

          <div class="pt-1.5 pb-2 text-[9px] text-slate-400 border-t border-[#1E3A5F]/60 italic leading-tight">
            * Lampu rotator adalah indikator visual status unit. Pergerakan aktual ditentukan koordinat GPS.
          </div>

          <div class="pt-2 border-t border-[#1E3A5F] flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>${unit.lat.toFixed(5)}, ${unit.lng.toFixed(5)}</span>
            <button id="btn-inspect-unit-${unit.id}" class="px-2 py-1 rounded bg-[#2A9D8F] text-[#071629] font-bold hover:bg-[#238276] transition-colors cursor-pointer">
              Detail Unit
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-unit-${unit.id}`);
        if (btn) {
          btn.onclick = () => onSelectUnit(unit);
        }
      });

      marker.on('click', () => {
        onSelectUnit(unit);
      });

      unitsLayerGroupRef.current?.addLayer(marker);
    });
  }, [units, selectedUnit, onSelectUnit]);

  // 5b. Render & Smoothly Update Live Officer GPS Markers (Admin & Multi-officer Awareness)
  useEffect(() => {
    if (!officersLayerGroupRef.current || !mapInstanceRef.current) return;

    const layerGroup = officersLayerGroupRef.current;
    const markersMap = officerMarkersMapRef.current;
    const activeUids = new Set<string>();

    officerLocations.forEach((loc) => {
      activeUids.add(loc.officerUid);
      const isStale = isLocationStale(loc.updatedAt);
      const icon = createOfficerGPSMarkerIcon(loc.officerName, isStale, loc.heading);
      const latLng: [number, number] = [loc.latitude, loc.longitude];

      const popupHtml = `
        <div class="p-3 w-64 text-xs font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#071629] text-cyan-400 border border-[#1E3A5F]">
              PETUGAS MEDIS
            </span>
            <span class="inline-flex items-center gap-1 text-[10px] font-bold ${isStale ? 'text-slate-400' : 'text-cyan-400'}">
              <span class="w-1.5 h-1.5 rounded-full inline-block ${isStale ? 'bg-slate-400' : 'bg-cyan-400 animate-pulse'}"></span>
              ${isStale ? 'Lokasi Lama (Offline)' : 'GPS Aktif'}
            </span>
          </div>

          <h3 class="font-bold text-white text-sm leading-snug mb-0.5">${loc.officerName}</h3>
          <p class="text-[11px] font-mono text-slate-400 mb-2">${loc.officerEmail}</p>

          <div class="p-2 rounded-lg bg-[#071629] border border-[#1E3A5F] space-y-1 mb-2 font-mono text-[11px] text-slate-300">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Akurasi GPS:</span>
              <strong class="text-white">±${Math.round(loc.accuracy)} meter</strong>
            </div>
            ${loc.speed !== null ? `
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Kecepatan:</span>
                <span class="text-white">${(loc.speed * 3.6).toFixed(1)} km/h</span>
              </div>
            ` : ''}
            ${loc.heading !== null ? `
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Arah:</span>
                <span class="text-white">${Math.round(loc.heading)}°</span>
              </div>
            ` : ''}
            <div class="flex items-center justify-between pt-1 border-t border-[#1E3A5F]/60">
              <span class="text-slate-500">Koordinat:</span>
              <span class="text-cyan-300">${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</span>
            </div>
          </div>

          <div class="text-[10px] text-slate-500 font-mono">
            ${isStale ? '⚠️ Lokasi belum diperbarui > 5 menit' : '🟢 Posisi GPS disinkronkan secara realtime'}
          </div>
        </div>
      `;

      let marker = markersMap.get(loc.officerUid);
      if (marker) {
        // Update position smoothly without recreating marker instance
        marker.setLatLng(latLng);
        marker.setIcon(icon);
        marker.setPopupContent(popupHtml);
      } else {
        // Create new marker instance
        marker = L.marker(latLng, { icon, zIndexOffset: 800 });
        marker.bindPopup(popupHtml);
        layerGroup.addLayer(marker);
        markersMap.set(loc.officerUid, marker);
      }
    });

    // Remove stale markers for officers no longer in this map's location stream
    markersMap.forEach((marker, uid) => {
      if (!activeUids.has(uid)) {
        layerGroup.removeLayer(marker);
        markersMap.delete(uid);
      }
    });
  }, [officerLocations]);

  // 6. Smooth Pan to Selected Unit
  useEffect(() => {
    if (selectedUnit && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedUnit.lat, selectedUnit.lng], 17, {
        duration: 1.2,
      });
    }
  }, [selectedUnit]);

  // 7. Plotting Mode: Draggable Draft Pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (isPlottingMode && draftUnitCoords) {
      if (!draftPlotMarkerRef.current) {
        const marker = L.marker([draftUnitCoords.lat, draftUnitCoords.lng], {
          icon: createDraftPlottingIcon(),
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);

        marker.on('dragend', () => {
          const latLng = marker.getLatLng();
          onUpdateDraftCoords?.({ lat: latLng.lat, lng: latLng.lng });
        });

        draftPlotMarkerRef.current = marker;
      } else {
        draftPlotMarkerRef.current.setLatLng([draftUnitCoords.lat, draftUnitCoords.lng]);
      }
    } else {
      if (draftPlotMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(draftPlotMarkerRef.current);
        draftPlotMarkerRef.current = null;
      }
    }
  }, [isPlottingMode, draftUnitCoords, onUpdateDraftCoords]);

  // 8. Map Click & Context Menu Handlers (Plotting or Drawing Mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      setContextPopup(null);

      if (isPlottingMode && isAdmin) {
        onUpdateDraftCoords?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        return;
      }

      if (isDrawingMode && isAdmin) {
        const currentPoints = drawingPointsRef.current;

        if (activeGeometry === 'circle') {
          if (currentPoints.length === 0) {
            setDrawingPoints([e.latlng]);
          } else {
            // Second click completes circle
            const center = currentPoints[0];
            const dist = center.distanceTo(e.latlng);
            const radius = Math.max(50, Math.round(dist));
            const centerPt: LatLngPoint = { lat: center.lat, lng: center.lng };
            setDrawingPoints([]);
            // Call outside setState updater
            onSaveDrawnZone?.('circle', JSON.stringify(centerPt), radius, activeZoneType);
          }
        } else if (activeGeometry === 'rectangle') {
          if (currentPoints.length === 0) {
            setDrawingPoints([e.latlng]);
          } else {
            // Second click completes rectangle
            const p1 = currentPoints[0];
            const p2 = e.latlng;
            const bounds = L.latLngBounds(p1, p2);
            const rectPoints: LatLngPoint[] = [
              { lat: bounds.getNorthWest().lat, lng: bounds.getNorthWest().lng },
              { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
              { lat: bounds.getSouthEast().lat, lng: bounds.getSouthEast().lng },
              { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
            ];
            setDrawingPoints([]);
            // Call outside setState updater
            onSaveDrawnZone?.('rectangle', JSON.stringify(rectPoints), undefined, activeZoneType);
          }
        } else {
          // Polygon: append vertex
          setDrawingPoints([...currentPoints, e.latlng]);
        }
      }
    };

    const handleMapDblClick = (e: L.LeafletMouseEvent) => {
      if (isDrawingMode && activeGeometry === 'polygon' && drawingPointsRef.current.length >= 3) {
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        const points: LatLngPoint[] = drawingPointsRef.current.map((p) => ({ lat: p.lat, lng: p.lng }));
        setDrawingPoints([]);
        onSaveDrawnZone?.('polygon', JSON.stringify(points), undefined, activeZoneType);
      }
    };

    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      if (e.originalEvent) L.DomEvent.preventDefault(e.originalEvent);
      if (!isAdmin) return; // Disallow manual context plotting for Officers
      setContextPopup({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        x: e.containerPoint.x,
        y: e.containerPoint.y,
      });
    };

    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDblClick);
    map.on('contextmenu', handleContextMenu);

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDblClick);
      map.off('contextmenu', handleContextMenu);
    };
  }, [
    isPlottingMode,
    isDrawingMode,
    activeGeometry,
    activeZoneType,
    onUpdateDraftCoords,
    onSaveDrawnZone,
    isAdmin,
  ]);

  // 9. Update Live Drawing Layer Preview
  useEffect(() => {
    if (!drawingTempLayerRef.current || !mapInstanceRef.current) return;
    drawingTempLayerRef.current.clearLayers();

    if (!isDrawingMode || drawingPoints.length === 0) return;

    const cfg = ZONE_CONFIG[activeZoneType] || ZONE_CONFIG.red;

    if (activeGeometry === 'polygon') {
      drawingPoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 6,
          color: '#FFFFFF',
          fillColor: cfg.fillColor,
          fillOpacity: 1,
          weight: 2,
        });
        marker.bindTooltip(`Titik ${idx + 1}`, {
          permanent: true,
          direction: 'top',
          className: 'bg-[#071629] text-white border border-[#1E3A5F] px-1 text-[9px] rounded font-mono',
        });
        drawingTempLayerRef.current?.addLayer(marker);
      });

      if (drawingPoints.length > 1) {
        const line = L.polyline(drawingPoints, {
          color: cfg.borderColor,
          weight: 3.5,
          dashArray: '6, 6',
        });
        drawingTempLayerRef.current?.addLayer(line);
      }
    } else if (activeGeometry === 'circle' && drawingPoints.length > 0) {
      const center = drawingPoints[0];
      const radius = 250;
      const rings = createDonutPolygonRings({ lat: center.lat, lng: center.lng }, radius, Math.round(radius * 0.55));
      const donut = L.polygon(rings, {
        color: cfg.borderColor,
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: cfg.fillColor,
        fillOpacity: 0.35,
      });
      drawingTempLayerRef.current?.addLayer(donut);
    } else if (activeGeometry === 'rectangle') {
      drawingPoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 6,
          color: '#FFFFFF',
          fillColor: cfg.fillColor,
          fillOpacity: 1,
          weight: 2,
        });
        marker.bindTooltip(`Sudut ${idx + 1}`, {
          permanent: true,
          direction: 'top',
          className: 'bg-[#071629] text-white border border-[#1E3A5F] px-1 text-[9px] rounded font-mono',
        });
        drawingTempLayerRef.current?.addLayer(marker);
      });

      if (drawingPoints.length >= 2) {
        const bounds = L.latLngBounds(drawingPoints[0], drawingPoints[1]);
        const rect = L.rectangle(bounds, {
          color: cfg.borderColor,
          weight: 3.5,
          dashArray: '6, 6',
          fillColor: cfg.fillColor,
          fillOpacity: 0.35,
        });
        drawingTempLayerRef.current?.addLayer(rect);
      }
    }
  }, [drawingPoints, isDrawingMode, activeGeometry, activeZoneType]);

  // Complete Drawing callback from toolbar button
  const handleFinishDrawing = useCallback(() => {
    const currentPoints = drawingPointsRef.current;
    if (activeGeometry === 'polygon' && currentPoints.length >= 3) {
      const points: LatLngPoint[] = currentPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
      setDrawingPoints([]);
      onSaveDrawnZone?.('polygon', JSON.stringify(points), undefined, activeZoneType);
    } else if (activeGeometry === 'circle' && currentPoints.length >= 1) {
      const center: LatLngPoint = { lat: currentPoints[0].lat, lng: currentPoints[0].lng };
      setDrawingPoints([]);
      onSaveDrawnZone?.('circle', JSON.stringify(center), 300, activeZoneType);
    } else if (activeGeometry === 'rectangle' && currentPoints.length >= 2) {
      const bounds = L.latLngBounds(currentPoints[0], currentPoints[1]);
      const rectPoints: LatLngPoint[] = [
        { lat: bounds.getNorthWest().lat, lng: bounds.getNorthWest().lng },
        { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
        { lat: bounds.getSouthEast().lat, lng: bounds.getSouthEast().lng },
        { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
      ];
      setDrawingPoints([]);
      onSaveDrawnZone?.('rectangle', JSON.stringify(rectPoints), undefined, activeZoneType);
    }
  }, [activeGeometry, activeZoneType, onSaveDrawnZone]);

  const handleCancelDrawingInternal = useCallback(() => {
    setDrawingPoints([]);
    if (drawingTempLayerRef.current) {
      drawingTempLayerRef.current.clearLayers();
    }
    onCancelDrawing?.();
  }, [onCancelDrawing]);

  const handleUndoPoint = useCallback(() => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  }, []);

  // Map Controls Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    mapInstanceRef.current?.setView([currentMap.centerLat, currentMap.centerLng], currentMap.defaultZoom || 15);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser ini.');
      return;
    }
    setUserLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17);

          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userLocationMarkerRef.current = L.circleMarker([latitude, longitude], {
              radius: 9,
              color: '#38BDF8',
              fillColor: '#0284C7',
              fillOpacity: 0.9,
              weight: 3,
            }).addTo(mapInstanceRef.current);
            userLocationMarkerRef.current.bindTooltip(
              `<b>Posisi Anda Sekarang</b><br/>Akurasi: ±${Math.round(accuracy)}m`,
              {
                className: 'bg-[#071629] text-white border border-[#1E3A5F] px-2 py-1 text-xs rounded',
              }
            );
          }
        }
      },
      (err) => {
        setUserLocating(false);
        alert(`Gagal membaca GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#071629] ${
      isPlottingMode || isDrawingMode ? 'tactical-crosshair-active' : ''
    }`}>
      {/* Top Left: Floating Location Search */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[500]">
        <LocationSearch
          onSelectLocation={(lat, lng, zoom = 16) => {
            mapInstanceRef.current?.flyTo([lat, lng], zoom);
          }}
        />
      </div>

      {/* Admin Action Toolbar (Plot Unit & Gambar Zona) - Separated from search */}
      {isAdmin && (
        <div className="absolute top-15 left-3 sm:top-16 sm:left-4 z-[480] flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlottingMode}
            className={`min-h-[40px] px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold shadow-xl transition-all cursor-pointer ${
              isPlottingMode
                ? 'bg-[#2A9D8F] text-[#071629] border-[#2A9D8F] ring-2 ring-[#2A9D8F]/50 animate-pulse'
                : 'bg-[#071629]/95 text-white border-[#1E3A5F] hover:border-[#2A9D8F] hover:bg-[#14365f]'
            }`}
            title="Klik untuk memilih titik unit medis langsung pada peta"
          >
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{isPlottingMode ? 'Klik Peta untuk Plot' : '+ Plot Unit'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDrawingMode}
            className={`min-h-[40px] px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold shadow-xl transition-all cursor-pointer ${
              isDrawingMode
                ? 'bg-[#E53935] text-white border-[#E53935] ring-2 ring-red-500/50'
                : 'bg-[#071629]/95 text-white border-[#1E3A5F] hover:border-amber-400 hover:bg-[#14365f]'
            }`}
            title="Klik untuk menggambar zona risiko merah, kuning, atau hijau"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{isDrawingMode ? 'Mode Gambar Aktif' : '+ Gambar Zona'}</span>
          </button>
        </div>
      )}

      {/* Top Center: Drawing Toolbar (Admin Mode) */}
      {isDrawingMode && (
        <ZoneDrawingToolbar
          activeGeometry={activeGeometry}
          activeZoneType={activeZoneType}
          pointCount={drawingPoints.length}
          onSelectGeometry={(geom) => {
            setActiveGeometry(geom);
            setDrawingPoints([]);
          }}
          onSelectZoneType={setActiveZoneType}
          onComplete={handleFinishDrawing}
          onCancel={handleCancelDrawingInternal}
          onUndoPoint={handleUndoPoint}
        />
      )}

      {/* Top Right: Tactical Map Controls */}
      <MapControls
        currentLayer={currentBaseLayer}
        onLayerChange={setCurrentBaseLayer}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onLocateMe={handleLocateMe}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onToggleLegend={() => setIsLegendOpen(!isLegendOpen)}
        isLegendOpen={isLegendOpen}
      />

      {/* Tactical Right-Click Context Menu (Admin Only) */}
      {isAdmin && contextPopup && (
        <div
          className="absolute z-[600] bg-[#071629]/95 backdrop-blur-md border border-[#2A9D8F] rounded-xl shadow-2xl p-2 text-xs flex flex-col gap-1 min-w-[200px]"
          style={{ top: contextPopup.y + 10, left: contextPopup.x + 10 }}
        >
          <div className="px-2 py-1 border-b border-[#1E3A5F] text-[10px] font-mono text-slate-400">
            {contextPopup.lat.toFixed(5)}, {contextPopup.lng.toFixed(5)}
          </div>
          <button
            type="button"
            onClick={() => {
              onConfirmPlotUnit?.({ lat: contextPopup.lat, lng: contextPopup.lng });
              setContextPopup(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-left flex items-center gap-2 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#071629]" />
            <span>Plot Unit Medis di Titik Ini</span>
          </button>
          <button
            type="button"
            onClick={() => setContextPopup(null)}
            className="w-full px-2 py-1 text-slate-400 hover:text-white text-left text-[11px] cursor-pointer"
          >
            Batal
          </button>
        </div>
      )}

      {/* Bottom Right: Map Legend */}
      <MapLegend isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />

      {/* The Leaflet Canvas Container: STATIC className ensures React NEVER strips Leaflet classes */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%' }}
        className="w-full h-full z-0 leaflet-container"
      />
    </div>
  );
};
