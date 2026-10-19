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
} from 'lucide-react';
import { MedicalUnit, UnitType, UnitStatus } from '../../types';
import { UNIT_TYPES, UNIT_STATUSES } from '../../constants/presets';

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

  const getVehicleIcon = (type: UnitType) => {
    switch (type) {
      case 'ambulance':
        return <Ambulance className="w-4 h-4 text-rose-400" />;
      case 'medical_bike':
        return <Bike className="w-4 h-4 text-cyan-400" />;
      case 'response_bike':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
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
      {/* Sidebar Container */}
      <div
        className={`fixed top-14 bottom-0 left-0 z-[400] w-80 md:w-92 bg-[#071629]/95 backdrop-blur-md border-r border-[#1E3A5F] flex flex-col transition-transform duration-300 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1E3A5F]">
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

            {onAddNewUnit && (
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

          {/* Type & Status Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-[#0B2342] border border-[#1E3A5F] rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:border-[#2A9D8F] text-[11px]"
            >
              <option value="all">Semua Tipe Kendaraan</option>
              <option value="ambulance">Ambulans AGD</option>
              <option value="medical_bike">Motor Medis</option>
              <option value="response_bike">Motor Respons</option>
              <option value="other">Unit Lain</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-[#0B2342] border border-[#1E3A5F] rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:border-[#2A9D8F] text-[11px]"
            >
              <option value="all">Semua Status</option>
              <option value="standby">Siaga (Standby)</option>
              <option value="on_duty">Bertugas (On Duty)</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* Units List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Ambulance className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <div className="text-slate-400 font-medium text-xs">Belum ada unit medis terplot</div>
              {isAdmin && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Klik tombol "+ Plot Unit" di atas untuk menambahkan ambulans atau motor medis.
                </p>
              )}
            </div>
          ) : (
            filteredUnits.map((unit) => {
              const isSelected = selectedUnit?.id === unit.id;
              return (
                <div
                  key={unit.id}
                  onClick={() => onSelectUnit(unit)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#14365f] border-[#2A9D8F] shadow-[0_0_15px_rgba(42,157,143,0.3)]'
                      : 'bg-[#0B2342] border-[#1E3A5F] hover:border-[#2A9D8F]/60 hover:bg-[#0f2c52]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail or Icon */}
                    <div className="w-12 h-12 rounded-lg bg-[#071629] border border-[#1E3A5F] overflow-hidden shrink-0 flex items-center justify-center relative">
                      {unit.imageUrl ? (
                        <img
                          src={unit.imageUrl}
                          alt={unit.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getVehicleIcon(unit.type)
                      )}
                      <span
                        className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getStatusDot(
                          unit.status
                        )}`}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-[#2A9D8F]">
                          {unit.unitCode}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {unit.lat.toFixed(4)}, {unit.lng.toFixed(4)}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs truncate leading-snug">
                        {unit.name}
                      </h4>
                      {unit.hospitalReferral && (
                        <div className="text-[10px] text-slate-400 truncate">
                          RS: {unit.hospitalReferral}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action hover buttons for admin */}
                  <div className="mt-2 pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between text-[10px]">
                    <span className="capitalize text-slate-400 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(unit.status)}`} />
                      {unit.status.replace('_', ' ')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUnit(unit);
                        }}
                        className="px-2 py-0.5 rounded bg-[#1E3A5F] hover:bg-[#2A9D8F] hover:text-[#071629] text-slate-300 font-semibold transition-colors flex items-center gap-1"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>Fokus</span>
                      </button>

                      {isAdmin && onEditUnit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditUnit(unit);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E3A5F] transition-colors"
                          title="Edit Unit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}

                      {isAdmin && onDeleteUnit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUnit(unit);
                          }}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                          title="Hapus Unit"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Floating Toggle Tab Button */}
      <button
        onClick={onToggleOpen}
        title={isOpen ? 'Tutup Panel Unit' : 'Buka Panel Unit'}
        className={`fixed top-20 z-[410] bg-[#071629] border border-[#1E3A5F] rounded-r-lg p-2 text-slate-300 hover:text-white shadow-xl transition-all duration-300 flex items-center gap-1 ${
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
