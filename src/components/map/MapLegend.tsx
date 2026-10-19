import React from 'react';
import { X, ShieldAlert, AlertTriangle, ShieldCheck, Ambulance, Bike, Zap, PlusCircle } from 'lucide-react';
import { ZONE_CONFIG, UNIT_TYPES, UNIT_STATUSES } from '../../constants/presets';

interface MapLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-6 right-4 z-[500] w-80 bg-[#071629]/95 backdrop-blur-md border border-[#1E3A5F] rounded-xl shadow-2xl p-4 text-xs">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1E3A5F]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-pulse" />
          <h4 className="font-bold text-white tracking-wider uppercase text-[11px]">
            Legenda Peta Operasional
          </h4>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Risk Zones Section */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Zona Risiko Medis
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 p-1.5 rounded bg-red-950/30 border border-red-500/30">
            <div className="w-4 h-4 rounded bg-[#E53935] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-2.5 h-2.5 text-white" />
            </div>
            <div>
              <div className="font-bold text-red-400 text-[11px]">ZONA MERAH (Risiko Tinggi)</div>
              <div className="text-[10px] text-slate-300">Area bahaya kritis / insiden langsung. Evakuasi darurat prioritas utama.</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-1.5 rounded bg-yellow-950/30 border border-yellow-500/30">
            <div className="w-4 h-4 rounded bg-[#F9C74F] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-2.5 h-2.5 text-black" />
            </div>
            <div>
              <div className="font-bold text-yellow-400 text-[11px]">ZONA KUNING (Risiko Sedang)</div>
              <div className="text-[10px] text-slate-300">Area dekontaminasi / perimeter triase sekunder / kewaspadaan.</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-1.5 rounded bg-emerald-950/30 border border-emerald-500/30">
            <div className="w-4 h-4 rounded bg-[#2EAD65] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
            <div>
              <div className="font-bold text-emerald-400 text-[11px]">ZONA HIJAU (Area Aman)</div>
              <div className="text-[10px] text-slate-300">Pos komando utama, zona evakuasi akhir, staging ambulans rujukan.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Types */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Jenis Unit Kendaraan
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-1.5 rounded bg-[#0B2342] border border-[#1E3A5F]">
            <div className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center shrink-0">
              <Ambulance className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-200 text-[11px] font-medium">Ambulans AGD</span>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded bg-[#0B2342] border border-[#1E3A5F]">
            <div className="w-5 h-5 rounded bg-cyan-600 flex items-center justify-center shrink-0">
              <Bike className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-200 text-[11px] font-medium">Motor Medis</span>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded bg-[#0B2342] border border-[#1E3A5F]">
            <div className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-200 text-[11px] font-medium">Motor Respons</span>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded bg-[#0B2342] border border-[#1E3A5F]">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center shrink-0">
              <PlusCircle className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-200 text-[11px] font-medium">Pos Medis</span>
          </div>
        </div>
      </div>

      {/* Unit Status */}
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Status Operasional Unit
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 text-[11px]">Siaga</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-slate-300 text-[11px]">Bertugas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-300 text-[11px]">Tidak Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};
