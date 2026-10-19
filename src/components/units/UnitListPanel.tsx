import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Ambulance,
  Bike,
  Zap,
  PlusCircle,
  Crosshair,
  Trash2,
  Edit,
  Radio,
  X,
} from 'lucide-react';
import { MedicalUnit, UnitType, UnitStatus } from '../../types';
import { UNIT_TYPES, UNIT_STATUSES } from '../../constants/presets';
import { TacticalVehicleCardIcon } from '../common/TacticalVehicleIcon';

interface UnitListPanelProps {
  units: MedicalUnit[];
  selectedUnit: MedicalUnit | null;
  onSelectUnit: (unit: MedicalUnit) => void;
  onAddNewUnit?: () => void;
  onEditUnit?: (unit: MedicalUnit) => void;
  onDeleteUnit?: (unit: MedicalUnit) => void;
  isAdmin?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const UnitListPanel: React.FC<UnitListPanelProps> = ({
  units,
  selectedUnit,
  onSelectUnit,
  onAddNewUnit,
  onEditUnit,
  onDeleteUnit,
  isAdmin = false,
  isOpen,
  onToggleOpen,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<UnitType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'all'>('all');

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.unitCode.toLowerCase().includes(search.toLowerCase()) ||
        (u.crewNames && u.crewNames.toLowerCase().includes(search.toLowerCase()));

      const matchType = filterType === 'all' || u.type === filterType;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [units, search, filterType, filterStatus]);

  const handleSelectUnit = (u: MedicalUnit) => {
    onSelectUnit(u);
    // Auto dismiss drawer on mobile after selection
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  const getStatusDot = (status: UnitStatus) => {
    switch (status) {
      case 'standby':
        return 'bg-emerald-500';
      case 'on_duty':
        return 'bg-amber-500';
      default:
        return 'bg-slate-500';
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
            <Radio className="w-4 h-4 text-[#2A9D8F] animate-pulse" />
            <h2 className="font-bold text-white text-xs uppercase tracking-wider">
              Unit Medis Terplot
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#2A9D8F] font-mono text-xs font-bold">
              {units.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onAddNewUnit && (
              <button
                type="button"
                onClick={() => {
                  onToggleOpen();
                  onAddNewUnit();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                title="Plot Unit Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Plot</span>
              </button>
            )}

            {/* Prominent 44x44 Touch Target Close Button */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#0B2342] text-slate-300 hover:text-white border border-[#1E3A5F] active:scale-95 transition-all cursor-pointer"
              title="Tutup Menu Unit"
              aria-label="Tutup Menu Unit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search & Filter */}
        <div className="p-3 border-b border-[#1E3A5F] shrink-0 bg-[#071629]">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama, kru..."
              className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#2A9D8F] text-[#071629] font-bold'
                  : 'bg-[#0B2342] text-slate-400 hover:text-white'
              }`}
            >
              Semua Tipe
            </button>
            {UNIT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                  filterType === t.id
                    ? 'bg-[#2A9D8F] text-[#071629] font-bold'
                    : 'bg-[#0B2342] text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Scrollable Unit List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-safe">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Ambulance className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="text-xs">Tidak ada unit yang cocok</p>
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isSelected = selectedUnit?.id === u.id;
              const statusCfg = UNIT_STATUSES.find((s) => s.id === u.status);

              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUnit(u)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#14365f] border-[#2A9D8F] shadow-lg shadow-[#2A9D8F]/10'
                      : 'bg-[#0B2342] border-[#1E3A5F] hover:border-slate-500 hover:bg-[#0d2c54]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TacticalVehicleCardIcon type={u.type} status={u.status} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            {u.unitCode}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(u.status)}`} />
                        </div>
                        <h3 className="font-bold text-white text-xs truncate leading-tight">
                          {u.name}
                        </h3>
                        {u.crewNames && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            Kru: {u.crewNames}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                        u.status === 'standby'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : u.status === 'on_duty'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {statusCfg?.label || u.status}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="mt-2.5 pt-2 border-t border-[#1E3A5F] flex items-center justify-between text-[11px]">
                      <div className="font-mono text-[10px] text-slate-400">
                        {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-2">
                        {onEditUnit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleOpen();
                              onEditUnit(u);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E3A5F] cursor-pointer"
                            title="Edit Unit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteUnit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteUnit(u);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus Unit"
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
      {/* DESKTOP PERMANENT SIDEBAR (>= 768px): w-80 / md:w-92                      */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:flex fixed top-14 bottom-0 left-0 z-[420] w-80 md:w-92 bg-[#071629]/98 backdrop-blur-lg border-r border-[#1E3A5F] flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Desktop Header */}
        <div className="p-4 border-b border-[#1E3A5F] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#2A9D8F] animate-pulse" />
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">
                Unit Medis Terplot
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#2A9D8F] font-mono text-xs font-bold">
                {units.length}
              </span>
            </div>

            {isAdmin && onAddNewUnit && (
              <button
                onClick={onAddNewUnit}
                className="px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Plot Unit</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kode unit, kru..."
              className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>

          {/* Type Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#2A9D8F] text-[#071629] font-bold'
                  : 'bg-[#0B2342] text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            {UNIT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                  filterType === t.id
                    ? 'bg-[#2A9D8F] text-[#071629] font-bold'
                    : 'bg-[#0B2342] text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Unit Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Ambulance className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="text-xs">Tidak ada unit medis yang terplot</p>
              {isAdmin && onAddNewUnit && (
                <button
                  onClick={onAddNewUnit}
                  className="mt-3 text-xs text-[#2A9D8F] hover:underline font-semibold cursor-pointer"
                >
                  + Plot Unit Medis Sekarang
                </button>
              )}
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isSelected = selectedUnit?.id === u.id;
              const statusCfg = UNIT_STATUSES.find((s) => s.id === u.status);

              return (
                <div
                  key={u.id}
                  onClick={() => onSelectUnit(u)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#14365f] border-[#2A9D8F] shadow-lg shadow-[#2A9D8F]/10'
                      : 'bg-[#0B2342] border-[#1E3A5F] hover:border-slate-500 hover:bg-[#0d2c54]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TacticalVehicleCardIcon type={u.type} status={u.status} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            {u.unitCode}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(u.status)}`} />
                        </div>
                        <h3 className="font-bold text-white text-xs truncate leading-tight">
                          {u.name}
                        </h3>
                        {u.crewNames && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            Kru: {u.crewNames}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                        u.status === 'standby'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : u.status === 'on_duty'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {statusCfg?.label || u.status}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#1E3A5F] flex items-center justify-between text-[11px]">
                    <div className="font-mono text-[10px] text-slate-400">
                      {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAdmin && onEditUnit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditUnit(u);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E3A5F] cursor-pointer"
                          title="Edit Unit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdmin && onDeleteUnit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUnit(u);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                          title="Hapus Unit"
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
        title={isOpen ? 'Tutup Panel Unit' : 'Buka Panel Unit'}
        className={`hidden md:flex fixed top-20 z-[430] bg-[#071629] border border-[#1E3A5F] rounded-r-xl p-2 text-slate-300 hover:text-white shadow-xl transition-all duration-300 items-center gap-1 cursor-pointer ${
          isOpen ? 'left-80 md:left-92' : 'left-0'
        }`}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {!isOpen && (
          <span className="text-[11px] font-bold text-[#2A9D8F] font-mono tracking-wider px-1">
            UNIT ({units.length})
          </span>
        )}
      </button>
    </>
  );
};
