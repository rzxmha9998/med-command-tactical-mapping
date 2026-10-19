import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  MapPin,
  Ambulance,
  Bike,
  Zap,
  PlusCircle,
  AlertCircle,
  Loader2,
  Check,
  Shield,
  Navigation,
} from 'lucide-react';
import { MedicalUnit, UnitType, UnitStatus, LatLngPoint, RiskZone } from '../../types';
import { uploadVehicleImage } from '../../firebase/services/storageService';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: MedicalUnit | null;
  currentCoords?: LatLngPoint | null;
  availableZones?: RiskZone[];
  onStartPlottingOnMap: (existingCoords?: LatLngPoint) => void;
}

export const UnitFormModal: React.FC<UnitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentCoords,
  availableZones = [],
  onStartPlottingOnMap,
}) => {
  const [name, setName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [callsign, setCallsign] = useState('');
  const [type, setType] = useState<UnitType>('ambulance');
  const [status, setStatus] = useState<UnitStatus>('standby');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [zoneId, setZoneId] = useState<string>('');
  const [crewNames, setCrewNames] = useState('');
  const [hospitalReferral, setHospitalReferral] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync initial data or map coords
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUnitCode(initialData.unitCode);
      setCallsign(initialData.callsign || '');
      setType(initialData.type);
      setStatus(initialData.status);
      setLat(initialData.lat.toString());
      setLng(initialData.lng.toString());
      setZoneId(initialData.zoneId || '');
      setCrewNames(initialData.crewNames || '');
      setHospitalReferral(initialData.hospitalReferral || '');
      setNotes(initialData.notes || '');
      setImageUrl(initialData.imageUrl || '');
    } else if (isOpen) {
      if (currentCoords) {
        setLat(currentCoords.lat.toFixed(6));
        setLng(currentCoords.lng.toFixed(6));
      } else if (!lat && !lng) {
        setLat('-6.175392');
        setLng('106.827153');
      }
    }
    setFormError(null);
  }, [initialData, isOpen]);

  // Update lat/lng if user plotted on map
  useEffect(() => {
    if (currentCoords) {
      setLat(currentCoords.lat.toFixed(6));
      setLng(currentCoords.lng.toFixed(6));
    }
  }, [currentCoords]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Ukuran file maksimal 5 MB.');
        return;
      }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!name.trim()) {
      setFormError('Nama unit wajib diisi.');
      return;
    }
    if (!unitCode.trim()) {
      setFormError('Kode unit / Callsign wajib diisi.');
      return;
    }
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setFormError('Koordinat Latitude dan Longitude harus berupa angka yang valid.');
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = imageUrl;

    if (imageFile) {
      try {
        setIsUploading(true);
        finalImageUrl = await uploadVehicleImage(imageFile, unitCode, (progress) => {
          setUploadProgress(progress);
        });
      } catch (err: any) {
        console.warn('Image upload failed, continuing with unit saving:', err);
        setFormError(`Catatan: Gagal mengunggah foto (${err.message}), unit tetap akan disimpan.`);
      } finally {
        setIsUploading(false);
      }
    }

    const assignedZone = availableZones.find((z) => z.id === zoneId);

    try {
      await onSubmit({
        name: name.trim(),
        unitCode: unitCode.trim().toUpperCase(),
        callsign: callsign.trim() || undefined,
        type,
        status,
        lat: parsedLat,
        lng: parsedLng,
        zoneId: zoneId || undefined,
        zoneName: assignedZone?.name || undefined,
        crewNames: crewNames.trim() || undefined,
        hospitalReferral: hospitalReferral.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (!initialData) {
        setName('');
        setUnitCode('');
        setCallsign('');
        setCrewNames('');
        setHospitalReferral('');
        setNotes('');
        setImageUrl('');
        setImageFile(null);
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan unit medis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
            <h3 className="font-bold text-white text-base">
              {initialData ? 'Edit Data Unit Medis' : 'Tambah & Plot Unit Medis'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/50 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Unit Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-semibold">Nama Unit Medis *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Ambulans AGD Cipto 01"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Kode / Nomor Unit *</label>
              <input
                type="text"
                required
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="cth: AMB-01"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white uppercase font-mono focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>
          </div>

          {/* Callsign & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Callsign Radio / Taktis</label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="cth: ALPHA-MED-1"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white uppercase font-mono focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Jenis Kendaraan</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as UnitType)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              >
                <option value="ambulance">🚑 Ambulans Gawat Darurat (AGD)</option>
                <option value="medical_bike">🏍️ Motor Medis Reaksi Cepat</option>
                <option value="response_bike">⚡ Motor Respons Triase Lapangan</option>
                <option value="other">🏥 Pos Medis Bergerak / Unit Lain</option>
              </select>
            </div>
          </div>

          {/* Status & Assigned Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Status Operasional</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              >
                <option value="standby">🟢 Siaga (Standby)</option>
                <option value="on_duty">🟡 Bertugas (On Duty)</option>
                <option value="en_route">🔵 Dalam Perjalanan (En Route)</option>
                <option value="inactive">⚪ Tidak Aktif (Inactive)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Zona Tugas Operasional</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              >
                <option value="">-- Tanpa Zona / Bebas Sektor --</option>
                {availableZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    [{z.zoneType.toUpperCase()}] {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates & Plot on Map Button */}
          <div className="p-3 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2A9D8F]" />
                Koordinat Plotting Peta
              </span>
              <button
                type="button"
                onClick={() => {
                  const parsedLat = parseFloat(lat);
                  const parsedLng = parseFloat(lng);
                  const coords = !isNaN(parsedLat) && !isNaN(parsedLng) ? { lat: parsedLat, lng: parsedLng } : undefined;
                  onStartPlottingOnMap(coords);
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-[#2A9D8F]/20 text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-[#071629] border border-[#2A9D8F]/50 font-bold transition-all flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                <span>Pilih / Geser Pin di Peta</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Latitude</label>
                <input
                  type="text"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="-6.175392"
                  className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Longitude</label>
                <input
                  type="text"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="106.827153"
                  className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>
            </div>
          </div>

          {/* Crew & Hospital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Nama Petugas / Kru Medis</label>
              <input
                type="text"
                value={crewNames}
                onChange={(e) => setCrewNames(e.target.value)}
                placeholder="cth: Dr. Rian & Ns. Sarah"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Rumah Sakit Rujukan / Pos</label>
              <input
                type="text"
                value={hospitalReferral}
                onChange={(e) => setHospitalReferral(e.target.value)}
                placeholder="cth: RSUP Dr. Cipto Mangunkusumo"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>
          </div>

          {/* Vehicle Image Upload */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">
              Foto Kendaraan Medis (Firebase Storage)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#1E3A5F] hover:border-[#2A9D8F] rounded-xl cursor-pointer bg-[#071629] transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-slate-300 font-medium text-xs">Pilih Foto Kendaraan</span>
                <span className="text-[10px] text-slate-500">Maks. 5 MB (JPEG, PNG, WebP)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {imageUrl && (
                <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-[#071629] border border-[#1E3A5F] shrink-0">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImageUrl('');
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {isUploading && uploadProgress !== null && (
              <div className="w-full bg-[#071629] rounded-full h-2 overflow-hidden border border-[#1E3A5F] mt-1.5">
                <div
                  className="bg-[#2A9D8F] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Operational Notes */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">Catatan Operasional / Kelengkapan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="cth: Dilengkapi ventilator portable & AED, siap rujukan trauma mayor..."
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
                  <span>{initialData ? 'Perbarui Unit' : 'Simpan Unit ke Peta'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
