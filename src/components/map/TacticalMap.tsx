import React, { useEffect, useRef, useState } from 'react';
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
} from '../../types';
import { ZONE_CONFIG } from '../../constants/presets';
import { createTacticalMarkerIcon, createDraftPlottingIcon } from './markerIcons';
import { MapControls } from './MapControls';
import { LocationSearch } from './LocationSearch';
import { MapLegend } from './MapLegend';
import { ZoneDrawingToolbar } from './ZoneDrawingToolbar';
import { MapPin, Plus, Radio, ShieldAlert } from 'lucide-react';

interface TacticalMapProps {
  currentMap: ITacticalMap;
  units: MedicalUnit[];
  riskZones: RiskZone[];
  selectedUnit: MedicalUnit | null;
  onSelectUnit: (unit: MedicalUnit | null) => void;
  onSelectZone?: (zone: RiskZone | null) => void;
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
}

const TILE_LAYERS: Record<BaseMapLayer, { url: string; attribution: string; className?: string }> = {
  night: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'tactical-night-tiles',
  },
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  },
  humanitarian: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

export const TacticalMapComponent: React.FC<TacticalMapProps> = ({
  currentMap,
  units,
  riskZones,
  selectedUnit,
  onSelectUnit,
  onSelectZone,
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layers for markers and vectors
  const unitsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const draftPlotMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);

  // Drawing state
  const [activeGeometry, setActiveGeometry] = useState<GeometryType>('polygon');
  const [activeZoneType, setActiveZoneType] = useState<ZoneType>('red');
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);
  const drawingTempLayerRef = useRef<L.LayerGroup | null>(null);

  // UI state
  const [currentBaseLayer, setCurrentBaseLayer] = useState<BaseMapLayer>('night');
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

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentMap.centerLat, currentMap.centerLng],
        zoom: currentMap.defaultZoom || 15,
        zoomControl: false,
      });

      // Default Tile Layer (Night Ops)
      const tileConfig = TILE_LAYERS[currentBaseLayer];
      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
        className: tileConfig.className || '',
      }).addTo(map);

      // Create layer groups
      zonesLayerGroupRef.current = L.layerGroup().addTo(map);
      unitsLayerGroupRef.current = L.layerGroup().addTo(map);
      drawingTempLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. React to map ID / center changes
  useEffect(() => {
    if (mapInstanceRef.current && currentMap) {
      mapInstanceRef.current.setView(
        [currentMap.centerLat, currentMap.centerLng],
        currentMap.defaultZoom || 15
      );
    }
  }, [currentMap.id, currentMap.centerLat, currentMap.centerLng, currentMap.defaultZoom]);

  // 3. Tile Layer Switching
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const tileConfig = TILE_LAYERS[currentBaseLayer];
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
      className: tileConfig.className || '',
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current.bringToBack();
  }, [currentBaseLayer]);

  // Disable double click zoom during drawing mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (isDrawingMode) {
      mapInstanceRef.current.doubleClickZoom.disable();
    } else {
      mapInstanceRef.current.doubleClickZoom.enable();
    }
  }, [isDrawingMode]);

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
          layer = L.circle([center.lat, center.lng], {
            radius,
            color: cfg.borderColor,
            weight: 3,
            fillColor: cfg.fillColor,
            fillOpacity: 0.32,
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
              className: 'bg-[#071629] text-white border border-[#1E3A5F] px-2 py-1 text-xs rounded font-sans',
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
  }, [riskZones]);

  // 5. Render Units
  useEffect(() => {
    if (!unitsLayerGroupRef.current || !mapInstanceRef.current) return;
    unitsLayerGroupRef.current.clearLayers();

    units.forEach((unit) => {
      const isSelected = selectedUnit?.id === unit.id;
      const icon = createTacticalMarkerIcon(unit.type, unit.status, unit.unitCode, isSelected);

      const marker = L.marker([unit.lat, unit.lng], { icon });

      // Tactical Popup
      const statusLabels: Record<UnitStatus, string> = {
        standby: 'Siaga',
        on_duty: 'Bertugas',
        en_route: 'Dalam Perjalanan',
        inactive: 'Tidak Aktif',
      };
      const statusColors: Record<UnitStatus, string> = {
        standby: '#10B981',
        on_duty: '#F59E0B',
        en_route: '#38BDF8',
        inactive: '#64748B',
      };

      const popupHtml = `
        <div class="p-3 w-64 text-xs font-sans">
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
  }, [units, selectedUnit]);

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
  }, [isPlottingMode, draftUnitCoords]);

  // 8. Map Click & Context Menu Handlers (Plotting or Drawing Mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      setContextPopup(null);

      if (isPlottingMode) {
        onUpdateDraftCoords?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        return;
      }

      if (isDrawingMode) {
        setDrawingPoints((prev) => {
          if (activeGeometry === 'circle') {
            if (prev.length === 0) {
              return [e.latlng];
            } else {
              // Second click defines radius
              const center = prev[0];
              const dist = center.distanceTo(e.latlng);
              const radius = Math.max(50, Math.round(dist));
              const centerPt: LatLngPoint = { lat: center.lat, lng: center.lng };
              onSaveDrawnZone?.('circle', JSON.stringify(centerPt), radius, activeZoneType);
              return [];
            }
          } else if (activeGeometry === 'rectangle') {
            if (prev.length === 0) {
              return [e.latlng];
            } else {
              // Second click completes rectangle
              const p1 = prev[0];
              const p2 = e.latlng;
              const bounds = L.latLngBounds(p1, p2);
              const rectPoints: LatLngPoint[] = [
                { lat: bounds.getNorthWest().lat, lng: bounds.getNorthWest().lng },
                { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
                { lat: bounds.getSouthEast().lat, lng: bounds.getSouthEast().lng },
                { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
              ];
              onSaveDrawnZone?.('rectangle', JSON.stringify(rectPoints), undefined, activeZoneType);
              return [];
            }
          } else {
            // Polygon: append vertex
            return [...prev, e.latlng];
          }
        });
      }
    };

    const handleMapDblClick = (e: L.LeafletMouseEvent) => {
      if (isDrawingMode && activeGeometry === 'polygon' && drawingPoints.length >= 3) {
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        const points: LatLngPoint[] = drawingPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
        onSaveDrawnZone?.('polygon', JSON.stringify(points), undefined, activeZoneType);
        setDrawingPoints([]);
      }
    };

    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      if (e.originalEvent) L.DomEvent.preventDefault(e.originalEvent);
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
    drawingPoints,
    onUpdateDraftCoords,
    onSaveDrawnZone,
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
          className: 'bg-[#071629] text-white border border-[#1E3A5F] px-1 text-[9px] rounded',
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
      const circle = L.circle(center, {
        radius,
        color: cfg.borderColor,
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: cfg.fillColor,
        fillOpacity: 0.35,
      });
      drawingTempLayerRef.current?.addLayer(circle);
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
          className: 'bg-[#071629] text-white border border-[#1E3A5F] px-1 text-[9px] rounded',
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
  const handleFinishDrawing = () => {
    if (activeGeometry === 'polygon' && drawingPoints.length >= 3) {
      const points: LatLngPoint[] = drawingPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
      onSaveDrawnZone?.('polygon', JSON.stringify(points), undefined, activeZoneType);
      setDrawingPoints([]);
    } else if (activeGeometry === 'circle' && drawingPoints.length >= 1) {
      const center: LatLngPoint = { lat: drawingPoints[0].lat, lng: drawingPoints[0].lng };
      onSaveDrawnZone?.('circle', JSON.stringify(center), 300, activeZoneType);
      setDrawingPoints([]);
    } else if (activeGeometry === 'rectangle' && drawingPoints.length >= 2) {
      const bounds = L.latLngBounds(drawingPoints[0], drawingPoints[1]);
      const rectPoints: LatLngPoint[] = [
        { lat: bounds.getNorthWest().lat, lng: bounds.getNorthWest().lng },
        { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
        { lat: bounds.getSouthEast().lat, lng: bounds.getSouthEast().lng },
        { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
      ];
      onSaveDrawnZone?.('rectangle', JSON.stringify(rectPoints), undefined, activeZoneType);
      setDrawingPoints([]);
    }
  };

  const handleCancelDrawingInternal = () => {
    setDrawingPoints([]);
    onCancelDrawing?.();
  };

  const handleUndoPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

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
    <div className="relative w-full h-full overflow-hidden bg-[#071629]">
      {/* Top Left: Search & Quick Plot Action */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col sm:flex-row items-start gap-2">
        <LocationSearch
          onSelectLocation={(lat, lng, zoom = 16) => {
            mapInstanceRef.current?.flyTo([lat, lng], zoom);
          }}
        />

        {/* Quick Plot Unit Button directly on map (For Admin and Petugas) */}
        <button
          type="button"
          onClick={onTogglePlottingMode}
          className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold shadow-xl transition-all ${
            isPlottingMode
              ? 'bg-[#2A9D8F] text-[#071629] border-[#2A9D8F] ring-2 ring-[#2A9D8F]/50 animate-pulse'
              : 'bg-[#071629]/95 text-white border-[#1E3A5F] hover:border-[#2A9D8F] hover:bg-[#14365f]'
          }`}
          title="Klik untuk memilih titik unit medis langsung pada peta"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>{isPlottingMode ? 'Klik Peta untuk Plot' : '+ Plot Unit di Peta'}</span>
        </button>

        {/* Quick Draw Zone Button for Admin */}
        {isAdmin && (
          <button
            type="button"
            onClick={onToggleDrawingMode}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold shadow-xl transition-all ${
              isDrawingMode
                ? 'bg-[#E53935] text-white border-[#E53935] ring-2 ring-red-500/50'
                : 'bg-[#071629]/95 text-white border-[#1E3A5F] hover:border-amber-400 hover:bg-[#14365f]'
            }`}
            title="Klik untuk menggambar zona risiko merah, kuning, atau hijau"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDrawingMode ? 'Mode Gambar Aktif' : '+ Gambar Zona'}</span>
          </button>
        )}
      </div>

      {/* Top Center: Drawing Toolbar (Admin Mode) */}
      {isDrawingMode && (
        <ZoneDrawingToolbar
          activeGeometry={activeGeometry}
          activeZoneType={activeZoneType}
          pointCount={drawingPoints.length}
          onSelectGeometry={setActiveGeometry}
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

      {/* Tactical Right-Click Context Menu */}
      {contextPopup && (
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
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-left flex items-center gap-2 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-[#071629]" />
            <span>Plot Unit Medis di Titik Ini</span>
          </button>
          <button
            type="button"
            onClick={() => setContextPopup(null)}
            className="w-full px-2 py-1 text-slate-400 hover:text-white text-left text-[11px]"
          >
            Batal
          </button>
        </div>
      )}

      {/* Bottom Right: Map Legend */}
      <MapLegend isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />

      {/* The Leaflet Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${
          isPlottingMode || isDrawingMode ? 'cursor-crosshair' : 'cursor-grab'
        }`}
      />
    </div>
  );
};
