import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Navigation,
  Layers,
  RotateCcw,
  Info,
  Check,
} from 'lucide-react';
import { BaseMapLayer } from '../../types';

interface MapControlsProps {
  currentLayer: BaseMapLayer;
  onLayerChange: (layer: BaseMapLayer) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onLocateMe: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onToggleLegend: () => void;
  isLegendOpen: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  currentLayer,
  onLayerChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onLocateMe,
  onToggleFullscreen,
  isFullscreen,
  onToggleLegend,
  isLegendOpen,
}) => {
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const layers: { id: BaseMapLayer; name: string; desc: string }[] = [
    { id: 'osm', name: 'OpenStreetMap Standard', desc: 'Peta jalan umum & gedung resmi (Default)' },
    { id: 'night', name: 'Tactical Night Ops', desc: 'Filter kontras gelap taktis untuk command center' },
    { id: 'satellite', name: 'Esri Satellite', desc: 'Citra satelit resolusi tinggi' },
    { id: 'humanitarian', name: 'Humanitarian / HOT', desc: 'Peta tanggap darurat & rumah sakit' },
  ];

  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[500] flex flex-col items-end gap-2">
      {/* Primary Toolbar Group */}
      <div className="flex flex-col bg-[#071629]/95 backdrop-blur-md border border-[#1E3A5F] rounded-xl sm:rounded-lg shadow-2xl p-1 gap-1">
        {/* Zoom Controls */}
        <button
          onClick={onZoomIn}
          title="Perbesar Peta (+)"
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded text-slate-300 hover:text-white hover:bg-[#14365f] transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Perkecil Peta (-)"
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded text-slate-300 hover:text-white hover:bg-[#14365f] transition-colors cursor-pointer"
        >
          <Minus className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-px bg-[#1E3A5F] my-0.5 mx-1" />

        {/* Reset View */}
        <button
          onClick={onResetView}
          title="Kembali ke Titik Awal Peta"
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded text-slate-300 hover:text-[#2A9D8F] hover:bg-[#14365f] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Geolocation */}
        <button
          onClick={onLocateMe}
          title="Lokasi Saya (GPS)"
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded text-slate-300 hover:text-[#2A9D8F] hover:bg-[#14365f] transition-colors cursor-pointer"
        >
          <Navigation className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded text-slate-300 hover:text-white hover:bg-[#14365f] transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-5 h-5 sm:w-4 sm:h-4" />}
        </button>

        <div className="h-px bg-[#1E3A5F] my-0.5 mx-1" />

        {/* Layer Selector Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Ganti Lapisan Peta"
            className={`w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded transition-colors cursor-pointer ${
              showLayerMenu
                ? 'bg-[#2A9D8F] text-[#071629]'
                : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
            }`}
          >
            <Layers className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>

          {/* Layer Flyout Menu */}
          {showLayerMenu && (
            <div className="absolute right-0 sm:right-full top-full sm:top-0 mt-2 sm:mt-0 sm:mr-2 w-64 max-w-[calc(100vw-32px)] bg-[#0B2342] border border-[#1E3A5F] rounded-lg shadow-2xl p-2 text-xs z-[550]">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 px-2">
                Pilih Lapisan Peta Dasar
              </div>
              {layers.map((l) => (
                <div
                  key={l.id}
                  onClick={() => {
                    onLayerChange(l.id);
                    setShowLayerMenu(false);
                  }}
                  className={`p-2 rounded cursor-pointer flex items-start gap-2.5 transition-colors ${
                    currentLayer === l.id
                      ? 'bg-[#2A9D8F]/20 border border-[#2A9D8F]/50 text-white'
                      : 'hover:bg-[#14365f] text-slate-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center mt-0.5 shrink-0">
                    {currentLayer === l.id && <Check className="w-3 h-3 text-[#2A9D8F]" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">{l.name}</div>
                    <div className="text-[10px] text-slate-400">{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend Toggle */}
        <button
          onClick={onToggleLegend}
          title="Legenda Peta Taktis"
          className={`w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded transition-colors cursor-pointer ${
            isLegendOpen
              ? 'bg-[#2A9D8F] text-[#071629]'
              : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
          }`}
        >
          <Info className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};
