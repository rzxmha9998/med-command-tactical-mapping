import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, AlertTriangle, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { RiskZone, ZoneType, GeometryType } from '../../types';
import { ZONE_CONFIG } from '../../constants/presets';
import { validateRiskZonePayload } from '../../firebase/utils/sanitize';

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<RiskZone, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: RiskZone | null;
  geometryType: GeometryType;
  coordinates: string;
  radius?: number;
  initialZoneType?: ZoneType;
}

export const ZoneFormModal: React.FC<ZoneFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  geometryType,
  coordinates,
  radius: initialRadius,
  initialZoneType = 'red',
}) => {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>(initialZoneType);
  const [riskLevel, setRiskLevel] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [radius, setRadius] = useState<number>(initialRadius || 300);
  const [innerRadius, setInnerRadius] = useState<number>(
    initialData?.innerRadius || Math.max(10, Math.round((initialRadius || 300) * 0.55))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setZoneType(initialData.zoneType);
      setRiskLevel(initialData.riskLevel || '');
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      const r = initialData.radius || 300;
      setRadius(r);
      setInnerRadius(initialData.innerRadius || Math.max(10, Math.round(r * 0.55)));
    } else {
      const selectedType = initialZoneType || 'red';
      setName('');
      setZoneType(selectedType);
      if (selectedType === 'red') {
        setRiskLevel('Risiko Tinggi - Area Bahaya & Evakuasi Cepat');
      } else if (selectedType === 'yellow') {
        setRiskLevel('Risiko Sedang - Siaga & Pos Triase Terbatas');
      } else {
        setRiskLevel('Risiko Rendah - Pos Medis Utama / Sektor Aman');
      }
      setDescription('');
      setNotes('');
      const r = initialRadius || 300;
      setRadius(r);
      setInnerRadius(Math.max(10, Math.round(r * 0.55)));
    }
    setError(null);
  }, [initialData, isOpen, initialRadius, initialZoneType]);

  // Adjust default risk level when zone type changes
  const handleZoneTypeChange = (type: ZoneType) => {
    setZoneType(type);
    if (!riskLevel || riskLevel.includes('Risiko')) {
      if (type === 'red') setRiskLevel('Risiko Tinggi - Area Bahaya & Evakuasi Cepat');
      if (type === 'yellow') setRiskLevel('Risiko Sedang - Siaga & Pos Triase Terbatas');
      if (type === 'green') setRiskLevel('Risiko Rendah - Pos Medis Utama / Sektor Aman');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama zona wajib diisi.');
      return;
    }

    const finalGeomType = initialData?.geometryType || geometryType;
    const finalCoords = initialData?.coordinates || coordinates;
    const finalRadius = finalGeomType === 'circle' ? radius : undefined;
    const safeInner = finalGeomType === 'circle' ? Math.min(innerRadius, (finalRadius || 300) - 10) : undefined;

    // Pre-validate geometry and parameters
    const validation = validateRiskZonePayload({
      name: name.trim(),
      zoneType,
      geometryType: finalGeomType,
      coordinates: finalCoords,
      radius: finalRadius,
      innerRadius: safeInner,
    });

    if (!validation.isValid) {
      setError(validation.error || 'Data zona risiko tidak lengkap atau tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Build explicit payload with only valid defined properties
    const zonePayload: Omit<RiskZone, 'id' | 'mapId' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      zoneType,
      geometryType: finalGeomType,
      coordinates: finalCoords,
      riskLevel: riskLevel.trim() || ZONE_CONFIG[zoneType].label,
    };

    if (finalGeomType === 'circle' && typeof finalRadius === 'number' && finalRadius > 0) {
      zonePayload.radius = finalRadius;
      if (typeof safeInner === 'number' && safeInner > 0) {
        zonePayload.innerRadius = safeInner;
      }
    }
    if (description.trim()) {
      zonePayload.description = description.trim();
    }
    if (notes.trim()) {
      zonePayload.notes = notes.trim();
    }

    try {
      await onSubmit(zonePayload);
      onClose();
    } catch (err: any) {
      console.error('Zone save failed:', err);
      setError(err.message || 'Gagal menyimpan zona risiko ke Firestore. Pastikan koneksi aktif.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-lg"
              style={{ backgroundColor: ZONE_CONFIG[zoneType].fillColor }}
            />
            <h3 className="font-bold text-white text-sm sm:text-base">
              {initialData ? 'Edit Data Zona Risiko' : 'Simpan Zona Risiko ke Peta'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable on mobile */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/50 text-rose-300">
              {error}
            </div>
          )}

          {/* Zone Type Selection Buttons (Red, Yellow, Green) */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Tingkat Risiko & Warna Zona *</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                Tipe: {geometryType === 'circle' ? 'CINCIN / DONAT' : geometryType.toUpperCase()}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleZoneTypeChange('red')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  zoneType === 'red'
                    ? 'bg-red-950/70 border-red-500 text-red-300 ring-2 ring-red-500/50 shadow-lg'
                    : 'bg-[#071629] border-[#1E3A5F] text-slate-400 hover:border-red-500/50'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="font-bold text-xs">ZONA MERAH</span>
                <span className="text-[10px] text-slate-400">Risiko Tinggi</span>
              </button>

              <button
                type="button"
                onClick={() => handleZoneTypeChange('yellow')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  zoneType === 'yellow'
                    ? 'bg-yellow-950/70 border-yellow-500 text-yellow-300 ring-2 ring-yellow-500/50 shadow-lg'
                    : 'bg-[#071629] border-[#1E3A5F] text-slate-400 hover:border-yellow-500/50'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-xs">ZONA KUNING</span>
                <span className="text-[10px] text-slate-400">Risiko Sedang</span>
              </button>

              <button
                type="button"
                onClick={() => handleZoneTypeChange('green')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  zoneType === 'green'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg'
                    : 'bg-[#071629] border-[#1E3A5F] text-slate-400 hover:border-emerald-500/50'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-xs">ZONA HIJAU</span>
                <span className="text-[10px] text-slate-400">Area Aman</span>
              </button>
            </div>
          </div>

          {/* Zone Name */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">Nama Zona *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Zona Perimeter Pintu 1 Monas"
              className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>

          {/* Risk Level Description */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">Label Status / Instruksi Triase</label>
            <input
              type="text"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              placeholder="cth: Risiko Tinggi - Evakuasi Segera"
              className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>

          {/* Donut / Ring radius controls if geometry is circle */}
          {(initialData?.geometryType || geometryType) === 'circle' && (
            <div className="p-3 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E3A5F]/60 pb-2">
                <span className="font-semibold text-slate-200">Konfigurasi Donat / Cincin Risiko</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#102a4e] text-[#2A9D8F] font-mono font-bold">
                  Lebar Cincin: {Math.max(10, radius - innerRadius)} m
                </span>
              </div>

              {/* Outer Radius */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Batas Luar (Radius Luar)</span>
                  <span className="font-mono text-[#2A9D8F] font-bold">{radius} m</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="25"
                  value={radius}
                  onChange={(e) => {
                    const newR = parseInt(e.target.value);
                    setRadius(newR);
                    if (innerRadius >= newR) {
                      setInnerRadius(Math.max(10, Math.round(newR * 0.55)));
                    }
                  }}
                  className="w-full accent-[#2A9D8F]"
                />
              </div>

              {/* Inner Radius (Hole) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-medium">Lubang Tengah Transparan (Radius Dalam)</span>
                    <span className="text-[9px] text-slate-500 font-normal">(Basemap terlihat)</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">{innerRadius} m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max={Math.max(20, radius - 20)}
                  step="10"
                  value={innerRadius}
                  onChange={(e) => setInnerRadius(parseInt(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          )}

          {/* Description & Notes */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">Deskripsi Area & Catatan Taktis</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="cth: Area paparan massa padat, akses jalan ambulans terhambat, prioritas motor medis..."
              className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#14365f] text-slate-300 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Firestore...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Perbarui Zona' : 'Simpan Zona ke Peta'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
