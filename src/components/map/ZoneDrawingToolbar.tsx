import React from 'react';
import {
  Hexagon,
  Square,
  Circle as CircleIcon,
  Check,
  X,
  Undo2,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { GeometryType, ZoneType } from '../../types';

interface ZoneDrawingToolbarProps {
  activeGeometry: GeometryType | null;
  activeZoneType: ZoneType;
  pointCount: number;
  onSelectGeometry: (geom: GeometryType) => void;
  onSelectZoneType: (type: ZoneType) => void;
  onComplete: () => void;
  onCancel: () => void;
  onUndoPoint?: () => void;
}

export const ZoneDrawingToolbar: React.FC<ZoneDrawingToolbarProps> = ({
  activeGeometry,
  activeZoneType,
  pointCount,
  onSelectGeometry,
  onSelectZoneType,
  onComplete,
  onCancel,
  onUndoPoint,
}) => {
  return (
    <div className="absolute top-16 sm:top-4 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-1.5 w-[calc(100vw-24px)] max-w-2xl px-1">
      <div className="bg-[#071629]/95 backdrop-blur-md border border-[#2A9D8F] rounded-xl shadow-2xl p-2 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-center gap-2 w-full overflow-x-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-[#1E3A5F] shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white uppercase tracking-wider">
            GAMBAR ZONA
          </span>
        </div>

        {/* Geometry selection */}
        <div className="flex items-center gap-1 bg-[#0B2342] p-1 rounded-lg border border-[#1E3A5F]">
          <button
            type="button"
            onClick={() => onSelectGeometry('polygon')}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded flex items-center gap-1 text-[11px] sm:text-xs font-semibold transition-all ${
              activeGeometry === 'polygon'
                ? 'bg-[#2A9D8F] text-[#071629]'
                : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
            }`}
            title="Polygon Banyak Titik"
          >
            <Hexagon className="w-3.5 h-3.5" />
            <span>Polygon</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectGeometry('circle')}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded flex items-center gap-1 text-[11px] sm:text-xs font-semibold transition-all ${
              activeGeometry === 'circle'
                ? 'bg-[#2A9D8F] text-[#071629]'
                : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
            }`}
            title="Donat Cincin / Lubang Transparan"
          >
            <CircleIcon className="w-3.5 h-3.5" />
            <span>Donat</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectGeometry('rectangle')}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded flex items-center gap-1 text-[11px] sm:text-xs font-semibold transition-all ${
              activeGeometry === 'rectangle'
                ? 'bg-[#2A9D8F] text-[#071629]'
                : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
            }`}
            title="Persegi Panjang"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Persegi</span>
          </button>
        </div>

        {/* Zone Type Selection */}
        <div className="flex items-center gap-1 bg-[#0B2342] p-1 rounded-lg border border-[#1E3A5F]">
          <button
            type="button"
            onClick={() => onSelectZoneType('red')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeZoneType === 'red'
                ? 'bg-[#E53935] text-white shadow-md'
                : 'text-red-400 hover:bg-red-950/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Merah</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectZoneType('yellow')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeZoneType === 'yellow'
                ? 'bg-[#F9C74F] text-slate-900 shadow-md'
                : 'text-yellow-400 hover:bg-yellow-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kuning</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectZoneType('green')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeZoneType === 'green'
                ? 'bg-[#2EAD65] text-white shadow-md'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hijau</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pl-2 border-l border-[#1E3A5F]">
          {activeGeometry === 'polygon' && onUndoPoint && pointCount > 0 && (
            <button
              type="button"
              onClick={onUndoPoint}
              title="Batalkan Titik Terakhir"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#14365f] transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onComplete}
            disabled={
              (activeGeometry === 'polygon' && pointCount < 3) ||
              (activeGeometry === 'rectangle' && pointCount < 2) ||
              (activeGeometry === 'circle' && pointCount < 1)
            }
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Selesai</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            title="Batalkan Gambar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Helper text banner */}
      <div className="px-3 py-1 rounded-full bg-[#071629]/90 border border-[#1E3A5F] text-[11px] text-slate-300 font-mono shadow-lg">
        {activeGeometry === 'polygon' && (
          <span>
            Klik pada peta untuk menambah titik ({pointCount} titik dibuat). Minimal 3 titik lalu klik Selesai.
          </span>
        )}
        {activeGeometry === 'circle' && (
          <span>Klik titik pusat lingkaran pada peta, lalu tentukan radius.</span>
        )}
        {activeGeometry === 'rectangle' && (
          <span>Klik 2 titik berseberangan (sudut barat laut & tenggara) untuk membuat kotak.</span>
        )}
      </div>
    </div>
  );
};
