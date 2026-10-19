import React, { useState, useEffect } from 'react';
import { X, Map, MapPin, Check, Loader2, Compass } from 'lucide-react';
import { TacticalMap, MapStatus, UserProfile } from '../../types';
import { INDONESIA_LOCATION_PRESETS, LocationPreset } from '../../constants/presets';

interface MapFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TacticalMap, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: TacticalMap | null;
  officers: UserProfile[];
  currentUserId: string;
}

export const MapFormModal: React.FC<MapFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  officers,
  currentUserId,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [centerLat, setCenterLat] = useState<string>('-6.175392');
  const [centerLng, setCenterLng] = useState<string>('106.827153');
  const [defaultZoom, setDefaultZoom] = useState<number>(15);
  const [status, setStatus] = useState<MapStatus>('active');
  const [allowedOfficerIds, setAllowedOfficerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setCenterLat(initialData.centerLat.toString());
      setCenterLng(initialData.centerLng.toString());
      setDefaultZoom(initialData.defaultZoom || 15);
      setStatus(initialData.status);
      setAllowedOfficerIds(initialData.allowedOfficerIds || []);
    } else {
      setName('');
      setDescription('');
      setCenterLat('-6.175392');
      setCenterLng('106.827153');
      setDefaultZoom(15);
      setStatus('active');
      setAllowedOfficerIds([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleApplyPreset = (preset: LocationPreset) => {
    setCenterLat(preset.lat.toString());
    setCenterLng(preset.lng.toString());
    setDefaultZoom(preset.zoom);
    if (!name) {
      setName(`Peta ${preset.name.split('(')[0].trim()}`);
    }
  };

  const handleToggleOfficer = (uid: string) => {
    setAllowedOfficerIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);

    if (!name.trim()) {
      setError('Nama peta wajib diisi.');
      return;
    }
    if (isNaN(lat) || isNaN(lng)) {
      setError('Koordinat titik tengah harus berupa angka yang valid.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        centerLat: lat,
        centerLng: lng,
        defaultZoom,
        status,
        allowedOfficerIds,
        createdBy: initialData?.createdBy || currentUserId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data peta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2.5 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl max-h-[94vh] flex flex-col bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-[#2A9D8F]" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              {initialData ? 'Edit Konfigurasi Peta Operasional' : 'Buat Peta Operasional Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/50 text-rose-300">
              {error}
            </div>
          )}

          {/* Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-semibold">Nama Peta Operasional *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Peta Kawasan Monas & Gambir"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Status Peta</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MapStatus)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              >
                <option value="active">🟢 Aktif (Operasional)</option>
                <option value="archived">⚪ Arsip (Nonaktif)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">Deskripsi Operasi / Lokasi</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="cth: Pengamanan medis dan mitigasi evakuasi rujukan ke RSCM & RSPAD..."
              className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>

          {/* Location Presets Shortcut */}
          <div className="p-3 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#2A9D8F]" />
                Preset Titik Tengah Lokasi Cepat
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INDONESIA_LOCATION_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-1 rounded bg-[#0B2342] hover:bg-[#1E3A5F] border border-[#1E3A5F] text-slate-300 text-[11px] font-medium transition-colors"
                >
                  {p.name.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Center Coordinates & Zoom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Latitude Titik Tengah *</label>
              <input
                type="text"
                required
                value={centerLat}
                onChange={(e) => setCenterLat(e.target.value)}
                placeholder="-6.175392"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Longitude Titik Tengah *</label>
              <input
                type="text"
                required
                value={centerLng}
                onChange={(e) => setCenterLng(e.target.value)}
                placeholder="106.827153"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Zoom Level</label>
                <span className="font-mono text-[#2A9D8F] font-bold">{defaultZoom}</span>
              </div>
              <input
                type="range"
                min="10"
                max="18"
                value={defaultZoom}
                onChange={(e) => setDefaultZoom(parseInt(e.target.value))}
                className="w-full mt-2 accent-[#2A9D8F]"
              />
            </div>
          </div>

          {/* Officer Permissions Checklist */}
          <div className="p-3 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">
                Otorisasi Akses Petugas ke Peta Ini
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {allowedOfficerIds.length} Petugas Dipilih
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hanya petugas yang dicentang yang dapat membuka dan melihat plotting peta ini.
            </p>

            <div className="max-h-36 overflow-y-auto space-y-1.5 mt-2 pr-1">
              {officers.length === 0 ? (
                <div className="text-slate-500 italic text-[11px] py-1">
                  Belum ada akun petugas terdaftar di sistem.
                </div>
              ) : (
                officers.map((off) => {
                  const isChecked = allowedOfficerIds.includes(off.uid);
                  return (
                    <label
                      key={off.uid}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOfficer(off.uid)}
                          className="rounded accent-[#2A9D8F] w-4 h-4"
                        />
                        <div>
                          <div className="font-medium text-white">{off.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{off.email}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          off.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {off.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
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
                  <span>{initialData ? 'Perbarui Peta' : 'Buat Peta'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
