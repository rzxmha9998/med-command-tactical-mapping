import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Edit,
  Trash2,
  Layers,
  Plus,
  X,
} from 'lucide-react';
import { RiskZone, ZoneType } from '../../types';
import { ZONE_CONFIG } from '../../constants/presets';

interface ZoneListPanelProps {
  zones: RiskZone[];
  onSelectZone: (zone: RiskZone) => void;
  onAddNewZone?: () => void;
  onEditZone?: (zone: RiskZone) => void;
  onDeleteZone?: (zone: RiskZone) => void;
  isAdmin?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ZoneListPanel: React.FC<ZoneListPanelProps> = ({
  zones,
  onSelectZone,
  onAddNewZone,
  onEditZone,
  onDeleteZone,
  isAdmin = false,
  isOpen,
  onToggleOpen,
}) => {
  const [filterType, setFilterType] = useState<ZoneType | 'all'>('all');

  const filteredZones = zones.filter((z) => filterType === 'all' || z.zoneType === filterType);

  const getZoneIcon = (type: ZoneType) => {
    switch (type) {
      case 'red':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'yellow':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'green':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleSelectZone = (zone: RiskZone) => {
    onSelectZone(zone);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE LEFT DRAWER (< 768px): 80vw (max 320px) with Backdrop & Close Button */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[650] md:hidden animate-in fade-in duration-200 cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Container */}
      <div
        className={`fixed inset-y-0 left-0 z-[660] w-[82vw] max-w-[320px] bg-[#071629]/98 backdrop-blur-xl border-r border-[#1E3A5F] shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Mobile Header with 44x44px Close Button */}
        <div className="p-3.5 border-b border-[#1E3A5F] flex items-center justify-between shrink-0 bg-[#0B2342]/70">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2A9D8F]" />
            <h2 className="font-bold text-white text-xs uppercase tracking-wider">
              Zona Risiko
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#2A9D8F] font-mono text-xs font-bold">
              {zones.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onAddNewZone && (
              <button
                type="button"
                onClick={() => {
                  onToggleOpen();
                  onAddNewZone();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                title="Gambar Zona Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Zona</span>
              </button>
            )}

            {/* Prominent 44x44 Touch Target Close Button */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#0B2342] text-slate-300 hover:text-white border border-[#1E3A5F] active:scale-95 transition-all cursor-pointer"
              title="Tutup Menu Zona"
              aria-label="Tutup Menu Zona"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter by zone color */}
        <div className="p-3 border-b border-[#1E3A5F] shrink-0 bg-[#071629]">
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#1E3A5F] text-white font-bold'
                  : 'bg-[#0B2342] text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('red')}
              className={`py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                filterType === 'red'
                  ? 'bg-red-950/80 text-red-400 border border-red-500/50 font-bold'
                  : 'bg-[#0B2342] text-red-400/70'
              }`}
            >
              Merah
            </button>
            <button
              onClick={() => setFilterType('yellow')}
              className={`py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                filterType === 'yellow'
                  ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/50 font-bold'
                  : 'bg-[#0B2342] text-yellow-400/70'
              }`}
            >
              Kuning
            </button>
            <button
              onClick={() => setFilterType('green')}
              className={`py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                filterType === 'green'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 font-bold'
                  : 'bg-[#0B2342] text-emerald-400/70'
              }`}
            >
              Hijau
            </button>
          </div>
        </div>

        {/* Mobile Scrollable Zones List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-safe">
          {filteredZones.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <div className="text-slate-400 font-medium text-xs">Belum ada zona risiko</div>
            </div>
          ) : (
            filteredZones.map((zone) => {
              const cfg = ZONE_CONFIG[zone.zoneType];
              return (
                <div
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  className="p-3 rounded-xl bg-[#0B2342] border border-[#1E3A5F] hover:border-[#2A9D8F]/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cfg.fillColor}25` }}
                      >
                        {getZoneIcon(zone.zoneType)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs leading-snug">{zone.name}</h4>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: cfg.fillColor }}
                        >
                          {cfg.label} &bull; {zone.geometryType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {zone.riskLevel && (
                    <div className="text-[11px] text-slate-300 font-medium mb-1">
                      {zone.riskLevel}
                    </div>
                  )}

                  {zone.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {zone.description}
                    </p>
                  )}

                  {isAdmin && (
                    <div className="pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-500">
                        {zone.radius
                          ? `R: ${zone.radius}m${zone.innerRadius ? ` (Hole: ${zone.innerRadius}m)` : ''}`
                          : zone.geometryType}
                      </span>
                      <div className="flex items-center gap-2">
                        {onEditZone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleOpen();
                              onEditZone(zone);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E3A5F] cursor-pointer"
                            title="Edit Zona"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteZone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteZone(zone);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus Zona"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP PERMANENT SIDEBAR (>= 768px): w-80 / md:w-88                      */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:flex fixed top-14 bottom-0 left-0 z-[420] w-80 md:w-88 bg-[#071629]/98 backdrop-blur-lg border-r border-[#1E3A5F] flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Desktop Header */}
        <div className="p-4 border-b border-[#1E3A5F] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2A9D8F]" />
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">
                Zona Risiko
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#2A9D8F] font-mono text-xs font-bold">
                {zones.length}
              </span>
            </div>

            {isAdmin && onAddNewZone && (
              <button
                onClick={onAddNewZone}
                className="px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Gambar Zona</span>
              </button>
            )}
          </div>

          {/* Quick Zone Creation Buttons */}
          {isAdmin && (
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              <button
                onClick={onAddNewZone}
                className="py-1 px-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 text-red-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Gambar Zona Risiko Tinggi (Merah)"
              >
                <ShieldAlert className="w-3 h-3 text-red-500" />
                <span>+ Merah</span>
              </button>
              <button
                onClick={onAddNewZone}
                className="py-1 px-1.5 rounded-lg bg-yellow-950/60 hover:bg-yellow-900/60 border border-yellow-500/50 text-yellow-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Gambar Zona Risiko Sedang (Kuning)"
              >
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span>+ Kuning</span>
              </button>
              <button
                onClick={onAddNewZone}
                className="py-1 px-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Gambar Zona Aman / Pos Medis (Hijau)"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>+ Hijau</span>
              </button>
            </div>
          )}

          {/* Filter by zone color */}
          <div className="grid grid-cols-4 gap-1 text-[11px]">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#1E3A5F] text-white font-bold'
                  : 'bg-[#0B2342] text-slate-400 hover:text-white'
              }`}
            >
              Semua ({zones.length})
            </button>
            <button
              onClick={() => setFilterType('red')}
              className={`py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                filterType === 'red'
                  ? 'bg-red-950/80 text-red-400 border border-red-500/50 font-bold'
                  : 'bg-[#0B2342] text-red-400/70 hover:text-red-400'
              }`}
            >
              Merah ({zones.filter((z) => z.zoneType === 'red').length})
            </button>
            <button
              onClick={() => setFilterType('yellow')}
              className={`py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                filterType === 'yellow'
                  ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/50 font-bold'
                  : 'bg-[#0B2342] text-yellow-400/70 hover:text-yellow-400'
              }`}
            >
              Kuning ({zones.filter((z) => z.zoneType === 'yellow').length})
            </button>
            <button
              onClick={() => setFilterType('green')}
              className={`py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                filterType === 'green'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 font-bold'
                  : 'bg-[#0B2342] text-emerald-400/70 hover:text-emerald-400'
              }`}
            >
              Hijau ({zones.filter((z) => z.zoneType === 'green').length})
            </button>
          </div>
        </div>

        {/* Zones List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredZones.length === 0 ? (
            <div className="text-center py-10 px-4">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <div className="text-slate-400 font-medium text-xs">Belum ada zona risiko</div>
              {isAdmin && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Klik "+ Gambar Zona" di atas untuk menggambar polygon, radius lingkaran, atau persegi.
                </p>
              )}
            </div>
          ) : (
            filteredZones.map((zone) => {
              const cfg = ZONE_CONFIG[zone.zoneType];
              return (
                <div
                  key={zone.id}
                  onClick={() => onSelectZone(zone)}
                  className="p-3 rounded-xl bg-[#0B2342] border border-[#1E3A5F] hover:border-[#2A9D8F]/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cfg.fillColor}25` }}
                      >
                        {getZoneIcon(zone.zoneType)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs leading-snug">{zone.name}</h4>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: cfg.fillColor }}
                        >
                          {cfg.label} &bull; {zone.geometryType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {zone.riskLevel && (
                    <div className="text-[11px] text-slate-300 font-medium mb-1">
                      {zone.riskLevel}
                    </div>
                  )}

                  {zone.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {zone.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-500">
                      {zone.radius
                        ? `R: ${zone.radius}m${zone.innerRadius ? ` (Hole: ${zone.innerRadius}m)` : ''}`
                        : zone.geometryType}
                    </span>

                    <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectZone(zone);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E3A5F] transition-colors cursor-pointer"
                        title="Fokus ke Zona"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-[#2A9D8F]" />
                      </button>

                      {isAdmin && onEditZone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditZone(zone);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E3A5F] transition-colors cursor-pointer"
                          title="Edit Zona"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdmin && onDeleteZone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteZone(zone);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-[#1E3A5F] transition-colors cursor-pointer"
                          title="Hapus Zona"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Toggle Tab Button (Desktop Only) */}
      <button
        onClick={onToggleOpen}
        title={isOpen ? 'Tutup Panel Zona' : 'Buka Panel Zona'}
        className={`hidden md:flex fixed top-32 z-[430] bg-[#071629] border border-[#1E3A5F] rounded-r-xl p-2 text-slate-300 hover:text-white shadow-xl transition-all duration-300 items-center gap-1 cursor-pointer ${
          isOpen ? 'left-80 md:left-88' : 'left-0'
        }`}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {!isOpen && (
          <span className="text-[11px] font-bold text-amber-400 font-mono tracking-wider px-1">
            ZONA ({zones.length})
          </span>
        )}
      </button>
    </>
  );
};
