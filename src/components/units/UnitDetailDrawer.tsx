import React from 'react';
import {
  X,
  MapPin,
  Ambulance,
  Bike,
  Zap,
  PlusCircle,
  Copy,
  Check,
  Edit,
  Trash2,
  PhoneCall,
  Clock,
  Shield,
} from 'lucide-react';
import { MedicalUnit, UnitType, UnitStatus } from '../../types';
import { UNIT_TYPES, UNIT_STATUSES } from '../../constants/presets';
import { TacticalVehicleCardIcon } from '../common/TacticalVehicleIcon';

interface UnitDetailDrawerProps {
  unit: MedicalUnit | null;
  onClose: () => void;
  onEdit?: (unit: MedicalUnit) => void;
  onDelete?: (unit: MedicalUnit) => void;
  isAdmin?: boolean;
}

export const UnitDetailDrawer: React.FC<UnitDetailDrawerProps> = ({
  unit,
  onClose,
  onEdit,
  onDelete,
  isAdmin = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!unit) return null;

  const typeConfig = UNIT_TYPES.find((t) => t.id === unit.type) || UNIT_TYPES[0];
  const statusConfig = UNIT_STATUSES.find((s) => s.id === unit.status) || UNIT_STATUSES[0];

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${unit.lat.toFixed(6)}, ${unit.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[550] sm:hidden animate-in fade-in duration-200"
      />

      <div className="fixed inset-x-0 bottom-0 z-[560] max-h-[85vh] w-full rounded-t-2xl sm:rounded-none sm:inset-auto sm:top-14 sm:bottom-0 sm:right-0 sm:w-96 bg-[#071629]/98 backdrop-blur-md border-t sm:border-t-0 sm:border-l border-[#1E3A5F] flex flex-col shadow-2xl overflow-y-auto pb-safe animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Mobile Pull Handle */}
        <div
          onClick={onClose}
          className="w-12 h-1.5 rounded-full bg-slate-600/70 hover:bg-slate-500 mx-auto mt-2.5 mb-1 sm:hidden cursor-pointer shrink-0"
          title="Tarik atau ketuk untuk menutup"
        />

        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#0B2342] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#071629] text-[#2A9D8F] border border-[#1E3A5F]">
              {unit.unitCode}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Tutup Rincian Unit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Hero Image or Built-in Tactical Vehicle Icon Banner */}
      <div className="relative w-full h-48 bg-[#071629] border-b border-[#1E3A5F] overflow-hidden flex items-center justify-center">
        {unit.imageUrl ? (
          <>
            <img src={unit.imageUrl} alt={unit.name} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3">
              <TacticalVehicleCardIcon
                type={unit.type}
                status={unit.status}
                size="sm"
                heading={unit.heading}
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0B2342] to-[#071629]">
            <TacticalVehicleCardIcon
              type={unit.type}
              status={unit.status}
              size="lg"
              heading={unit.heading}
              className="mb-2 scale-125"
            />
            <span className="text-xs font-semibold text-slate-300 mt-2">{typeConfig.label}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071629] via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4">
          <h2 className="text-lg font-bold text-white drop-shadow-md">{unit.name}</h2>
          <p className="text-xs text-[#2A9D8F] font-medium">{typeConfig.shortLabel}</p>
        </div>
      </div>

      {/* Body Information */}
      <div className="p-4 space-y-4 text-xs flex-1">
        {/* Coordinates Block */}
        <div className="p-3 bg-[#0B2342] rounded-xl border border-[#1E3A5F]">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2A9D8F]" />
              Koordinat Lokasi
            </span>
            <button
              onClick={handleCopyCoords}
              className="text-[#2A9D8F] hover:text-white flex items-center gap-1 normal-case font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-sm font-bold text-white mb-1.5">
            {unit.lat.toFixed(6)}, {unit.lng.toFixed(6)}
          </div>

          {(unit.heading !== undefined && unit.heading !== null) || (unit.speed !== undefined && unit.speed !== null) ? (
            <div className="pt-2 mt-1 border-t border-[#1E3A5F] flex items-center justify-between text-[11px] font-mono">
              {unit.heading !== undefined && unit.heading !== null && (
                <div className="flex items-center gap-1 text-cyan-300">
                  <span className="text-slate-400">Heading:</span>
                  <span className="font-bold">{Math.round(unit.heading)}°</span>
                </div>
              )}
              {unit.speed !== undefined && unit.speed !== null && (
                <div className="flex items-center gap-1 text-slate-300">
                  <span className="text-slate-400">Kecepatan:</span>
                  <span className="font-bold text-white">{unit.speed.toFixed(1)} km/h</span>
                </div>
              )}
            </div>
          ) : null}

          <div className="pt-2 mt-1 border-t border-[#1E3A5F]/60 text-[10px] text-slate-400 italic leading-snug">
            * Lampu rotator merah-biru menunjukkan status operasional unit. Pergerakan aktual ditentukan koordinat GPS.
          </div>
        </div>

        {/* Crew & Referral Hospital */}
        <div className="space-y-3">
          <div className="p-3 bg-[#0B2342] rounded-xl border border-[#1E3A5F]">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Personel & Petugas Medis
            </div>
            <div className="font-semibold text-white">
              {unit.crewNames || 'Belum ada data personel kru'}
            </div>
          </div>

          <div className="p-3 bg-[#0B2342] rounded-xl border border-[#1E3A5F]">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Rumah Sakit Rujukan / Pos Medis
            </div>
            <div className="font-semibold text-white">
              {unit.hospitalReferral || 'Sesuai instruksi Posko Triase'}
            </div>
          </div>
        </div>

        {/* Operational Notes */}
        {unit.notes && (
          <div className="p-3 bg-[#0B2342] rounded-xl border border-[#1E3A5F]">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Catatan Taktis & Perlengkapan
            </div>
            <p className="text-slate-300 leading-relaxed">{unit.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-[10px] text-slate-500 font-mono space-y-0.5 pt-2 border-t border-[#1E3A5F]">
          <div>Diplot: {new Date(unit.createdAt).toLocaleString('id-ID')}</div>
          {unit.updatedAt && (
            <div>Pembaruan: {new Date(unit.updatedAt).toLocaleString('id-ID')}</div>
          )}
        </div>
      </div>

      {/* Admin Actions Footer */}
      {isAdmin && (
        <div className="p-4 bg-[#0B2342] border-t border-[#1E3A5F] flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(unit)}
              className="flex-1 py-2 px-3 rounded-lg bg-[#1E3A5F] hover:bg-[#2A9D8F] hover:text-[#071629] text-white font-bold transition-colors flex items-center justify-center gap-1.5 text-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Unit</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(unit)}
              className="py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold transition-colors flex items-center justify-center gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      )}
    </div>
  </>
  );
};
