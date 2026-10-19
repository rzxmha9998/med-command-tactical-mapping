import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Clock,
} from 'lucide-react';
import { MedicalUnit, UnitType, UnitStatus, LatLngPoint, RiskZone } from '../../types';
import { TacticalVehicleCardIcon } from '../common/TacticalVehicleIcon';
import {
  uploadVehicleImage,
  validateVehicleImageFile,
  VehicleImageUploadResult,
} from '../../firebase/services/storageService';
import { validateMedicalUnitPayload } from '../../firebase/utils/sanitize';

export type SaveStep = 'idle' | 'validating' | 'uploading' | 'saving' | 'success' | 'error';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: MedicalUnit | null;
  draftFormData?: Partial<MedicalUnit> | null;
  currentCoords?: LatLngPoint | null;
  availableZones?: RiskZone[];
  onStartPlottingOnMap: (existingCoords?: LatLngPoint, currentFormState?: Partial<MedicalUnit>) => void;
  isAdmin?: boolean;
}

export const UnitFormModal: React.FC<UnitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  draftFormData,
  currentCoords,
  availableZones = [],
  onStartPlottingOnMap,
  isAdmin = false,
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
  const [heading, setHeading] = useState<string>('');

  // Image & upload state
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageExplicitlyRemoved, setIsImageExplicitlyRemoved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadBytesTransferred, setUploadBytesTransferred] = useState<number>(0);
  const [uploadTotalBytes, setUploadTotalBytes] = useState<number>(0);

  // Status & timing metrics
  const [saveStep, setSaveStep] = useState<SaveStep>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [profilingLog, setProfilingLog] = useState<string | null>(null);

  // Refs for race-condition prevention & memory management
  const isSubmittingLock = useRef(false);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Helper to format bytes nicely
  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Cleanup object URLs on unmount or file replacement
  const revokeActiveBlob = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokeActiveBlob();
    };
  }, []);

  // Sync initial data, draft data, or map coords
  useEffect(() => {
    if (saveStep === 'saving' || saveStep === 'success') {
      return;
    }
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
      setHeading(initialData.heading !== undefined && initialData.heading !== null ? initialData.heading.toString() : '');
      setPreviewUrl(initialData.imageUrl || '');
      setImageFile(null); // CRITICAL: Reset new image file when loading existing unit
      setIsImageExplicitlyRemoved(false);
    } else if (draftFormData) {
      if (draftFormData.name !== undefined) setName(draftFormData.name);
      if (draftFormData.unitCode !== undefined) setUnitCode(draftFormData.unitCode);
      if (draftFormData.callsign !== undefined) setCallsign(draftFormData.callsign);
      if (draftFormData.type !== undefined) setType(draftFormData.type);
      if (draftFormData.status !== undefined) setStatus(draftFormData.status);
      if (draftFormData.zoneId !== undefined) setZoneId(draftFormData.zoneId);
      if (draftFormData.crewNames !== undefined) setCrewNames(draftFormData.crewNames);
      if (draftFormData.hospitalReferral !== undefined) setHospitalReferral(draftFormData.hospitalReferral);
      if (draftFormData.notes !== undefined) setNotes(draftFormData.notes);
      if (draftFormData.heading !== undefined && draftFormData.heading !== null) setHeading(draftFormData.heading.toString());
      if (draftFormData.imageUrl !== undefined) {
        setPreviewUrl(draftFormData.imageUrl);
      }
      if (currentCoords) {
        setLat(currentCoords.lat.toFixed(6));
        setLng(currentCoords.lng.toFixed(6));
      }
    } else if (isOpen) {
      if (currentCoords) {
        setLat(currentCoords.lat.toFixed(6));
        setLng(currentCoords.lng.toFixed(6));
      } else if (!lat && !lng) {
        setLat('-6.175392');
        setLng('106.827153');
      }
      setImageFile(null);
      setIsImageExplicitlyRemoved(false);
    }

    setFormError(null);
    setSaveStep('idle');
    setUploadProgress(0);
    setProfilingLog(null);
    isSubmittingLock.current = false;
  }, [initialData, draftFormData, isOpen]);

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
      const previewStart = performance.now();

      // Validate format and size immediately
      const validation = validateVehicleImageFile(file);
      if (!validation.isValid) {
        setFormError(validation.error || 'File gambar tidak valid.');
        e.target.value = '';
        return;
      }

      revokeActiveBlob();
      const objectUrl = URL.createObjectURL(file);
      activeBlobUrlRef.current = objectUrl;

      setImageFile(file);
      setPreviewUrl(objectUrl);
      setIsImageExplicitlyRemoved(false);
      setFormError(null);

      const previewDuration = performance.now() - previewStart;
      console.info(
        `[MED-COMMAND Profiler] File preview generated in ${previewDuration.toFixed(2)} ms (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB, ${file.type})`
      );
    }
  };

  const handleRemovePhoto = () => {
    revokeActiveBlob();
    setImageFile(null);
    setPreviewUrl('');
    setIsImageExplicitlyRemoved(true);
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submission re-entry
    if (isSubmittingLock.current) {
      console.warn('[MED-COMMAND] Submit blocked: operation already in progress.');
      return;
    }
    isSubmittingLock.current = true;
    setFormError(null);

    const totalStartTime = performance.now();
    let validationDurationMs = 0;
    let uploadDurationMs = 0;
    let downloadUrlDurationMs = 0;
    let firestoreDurationMs = 0;

    try {
      // ==========================================
      // STAGE 1: FORM VALIDATION
      // ==========================================
      setSaveStep('validating');
      const valStart = performance.now();

      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (!name.trim()) {
        throw new Error('Nama unit wajib diisi.');
      }
      if (!unitCode.trim()) {
        throw new Error('Kode unit / Callsign wajib diisi.');
      }

      const validation = validateMedicalUnitPayload({
        name: name.trim(),
        unitCode: unitCode.trim(),
        lat: parsedLat,
        lng: parsedLng,
      });

      if (!validation.isValid) {
        throw new Error(validation.error || 'Data unit medis tidak valid.');
      }

      validationDurationMs = performance.now() - valStart;

      // ==========================================
      // STAGE 2: PHOTO UPLOAD (Only if new file chosen!)
      // ==========================================
      let finalImageUrl: string | undefined = undefined;

      if (imageFile) {
        setSaveStep('uploading');
        setUploadProgress(0);

        try {
          const uploadResult: VehicleImageUploadResult = await uploadVehicleImage(
            imageFile,
            unitCode.trim(),
            (progress, transferred, total) => {
              setUploadProgress(progress);
              setUploadBytesTransferred(transferred);
              setUploadTotalBytes(total);
            },
            { timeoutMs: 35000 }
          );

          finalImageUrl = uploadResult.downloadUrl;
          uploadDurationMs = uploadResult.metrics.uploadDurationMs;
          downloadUrlDurationMs = uploadResult.metrics.downloadUrlDurationMs;

          console.info(
            `[MED-COMMAND Profiler] Upload finished: ${(uploadResult.metrics.fileSizeBytes / 1024).toFixed(
              1
            )} KB | Upload: ${uploadDurationMs.toFixed(2)} ms | DownloadURL: ${downloadUrlDurationMs.toFixed(2)} ms`
          );
        } catch (uploadError: any) {
          // If upload fails, retain old photo if exists, do NOT overwrite with empty value, DO NOT silently continue
          console.error('[MED-COMMAND Storage] Photo upload failed:', uploadError);
          throw new Error(
            `Gagal mengunggah foto kendaraan (${uploadError.message}). Data lama tetap aman. Silakan coba simpan kembali.`
          );
        }
      } else if (previewUrl && !previewUrl.startsWith('blob:')) {
        // Retain existing remote URL
        finalImageUrl = previewUrl;
      } else if (!isImageExplicitlyRemoved && initialData?.imageUrl) {
        // Retain old image
        finalImageUrl = initialData.imageUrl;
      }

      // ==========================================
      // STAGE 3: BUILD PAYLOAD (Strict, No undefined)
      // ==========================================
      const assignedZone = availableZones.find((z) => z.id === zoneId);

      const unitPayload: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        unitCode: unitCode.trim().toUpperCase(),
        type,
        status,
        lat: parsedLat,
        lng: parsedLng,
      };

      if (callsign.trim()) unitPayload.callsign = callsign.trim();
      if (zoneId) {
        unitPayload.zoneId = zoneId;
        if (assignedZone?.name) unitPayload.zoneName = assignedZone.name;
      }
      if (crewNames.trim()) unitPayload.crewNames = crewNames.trim();
      if (hospitalReferral.trim()) unitPayload.hospitalReferral = hospitalReferral.trim();
      if (notes.trim()) unitPayload.notes = notes.trim();
      const parsedHeading = heading.trim() ? parseFloat(heading) : undefined;
      if (parsedHeading !== undefined && !isNaN(parsedHeading)) {
        unitPayload.heading = ((parsedHeading % 360) + 360) % 360;
      }
      if (finalImageUrl) unitPayload.imageUrl = finalImageUrl;

      // ==========================================
      // STAGE 4: FIRESTORE SAVE / UPDATE
      // ==========================================
      setSaveStep('saving');
      const firestoreStart = performance.now();

      await onSubmit(unitPayload);

      firestoreDurationMs = performance.now() - firestoreStart;
      const totalDurationMs = performance.now() - totalStartTime;

      const profileSummary = `Validasi: ${validationDurationMs.toFixed(1)}ms | Upload: ${
        imageFile ? `${uploadDurationMs.toFixed(0)}ms` : 'dilewati'
      } | getDownloadURL: ${
        imageFile ? `${downloadUrlDurationMs.toFixed(0)}ms` : 'dilewati'
      } | Firestore: ${firestoreDurationMs.toFixed(0)}ms | Total: ${totalDurationMs.toFixed(0)}ms`;

      setProfilingLog(profileSummary);
      console.info(`[MED-COMMAND Profiler] Save Unit Complete: ${profileSummary}`);

      // ==========================================
      // STAGE 5: SUCCESS & MODAL CLOSE
      // ==========================================
      setSaveStep('success');

      // Brief delay so user sees confirmed success state before closing
      setTimeout(() => {
        revokeActiveBlob();
        if (!initialData) {
          setName('');
          setUnitCode('');
          setCallsign('');
          setCrewNames('');
          setHospitalReferral('');
          setNotes('');
          setPreviewUrl('');
          setImageFile(null);
        }
        isSubmittingLock.current = false;
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('[MED-COMMAND] Unit submit failed:', err);
      setSaveStep('error');
      setFormError(err.message || 'Gagal menyimpan data unit medis.');
      isSubmittingLock.current = false;
    }
  };

  const isFormDisabled =
    saveStep === 'validating' || saveStep === 'uploading' || saveStep === 'saving' || saveStep === 'success';

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2.5 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl max-h-[94vh] flex flex-col bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              {initialData ? 'Edit Data Unit Medis' : 'Tambah & Plot Unit Medis'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isFormDisabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/60 text-rose-200 flex items-start justify-between gap-2 shadow-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="font-medium leading-relaxed">{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-white p-0.5 transition-colors"
                title="Tutup pesan error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Profiling Metrics Badge */}
          {profilingLog && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{profilingLog}</span>
            </div>
          )}

          {/* Unit Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-semibold">Nama Unit Medis *</label>
              <input
                type="text"
                required
                disabled={isFormDisabled}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Ambulans AGD Cipto 01"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Kode / Nomor Unit *</label>
              <input
                type="text"
                required
                disabled={isFormDisabled}
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="cth: AMB-01"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white uppercase font-mono focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Callsign & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Callsign Radio / Taktis</label>
              <input
                type="text"
                disabled={isFormDisabled}
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="cth: ALPHA-MED-1"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white uppercase font-mono focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Jenis Kendaraan Medis</label>
              <select
                disabled={isFormDisabled}
                value={type}
                onChange={(e) => setType(e.target.value as UnitType)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              >
                <option value="ambulance">🚑 Ambulans Gawat Darurat (AGD)</option>
                <option value="ambulance_referral">🚑 Ambulans Rujukan</option>
                <option value="medical_bike">🏍️ Motor Medis Reaksi Cepat</option>
                <option value="response_bike">⚡ Motor Respons Triase</option>
                <option value="other">🏥 Pos Medis Bergerak</option>
              </select>
            </div>
          </div>

          {/* Built-in Tactical SVG Vehicle & Rotator Live Preview */}
          <div className="p-3 rounded-xl bg-[#071629] border border-[#1E3A5F] flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <TacticalVehicleCardIcon
                type={type}
                status={status}
                size="md"
                heading={heading ? parseFloat(heading) : undefined}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Ikon Kendaraan & Rotator Taktis</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase">
                    SVG Bawaan
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Unit otomatis tampil di peta dan panel dengan ikon taktis & lampu rotator merah-biru aktif. Tidak memerlukan upload foto.
                </p>
              </div>
            </div>
          </div>

          {/* Status, Direction/Heading & Assigned Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Status Operasional</label>
              <select
                disabled={isFormDisabled}
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              >
                <option value="standby">🟢 Siaga (Standby)</option>
                <option value="on_duty">🟡 Bertugas (On Duty)</option>
                <option value="en_route">🔵 Dalam Perjalanan (En Route)</option>
                <option value="inactive">⚪ Tidak Aktif (Inactive)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Arah / Heading GPS</span>
                <span className="text-[10px] text-slate-400 font-mono">0°-360°</span>
              </label>
              <input
                type="number"
                min="0"
                max="360"
                disabled={isFormDisabled}
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="cth: 90 (Timur)"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Zona Tugas</label>
              <select
                disabled={isFormDisabled}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
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
                disabled={isFormDisabled}
                onClick={() => {
                  const parsedLat = parseFloat(lat);
                  const parsedLng = parseFloat(lng);
                  const coords = !isNaN(parsedLat) && !isNaN(parsedLng) ? { lat: parsedLat, lng: parsedLng } : undefined;
                  onStartPlottingOnMap(coords, {
                    name,
                    unitCode,
                    callsign,
                    type,
                    status,
                    zoneId,
                    crewNames,
                    hospitalReferral,
                    notes,
                    imageUrl: previewUrl,
                  });
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-[#2A9D8F]/20 text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-[#071629] border border-[#2A9D8F]/50 font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
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
                  disabled={isFormDisabled}
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="-6.175392"
                  className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Longitude</label>
                <input
                  type="text"
                  required
                  disabled={isFormDisabled}
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="106.827153"
                  className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
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
                disabled={isFormDisabled}
                value={crewNames}
                onChange={(e) => setCrewNames(e.target.value)}
                placeholder="cth: Dr. Rian & Ns. Sarah"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Rumah Sakit Rujukan / Pos</label>
              <input
                type="text"
                disabled={isFormDisabled}
                value={hospitalReferral}
                onChange={(e) => setHospitalReferral(e.target.value)}
                placeholder="cth: RSUP Dr. Cipto Mangunkusumo"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Vehicle Image Upload (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">
                Foto Tambahan Kendaraan <span className="text-slate-400 font-normal text-[11px]">(Opsional — Unit otomatis memiliki ikon SVG & rotator di atas)</span>
              </label>
              {previewUrl && (
                <span className="text-[11px] text-slate-400">
                  {imageFile ? `File baru: ${(imageFile.size / 1024).toFixed(0)} KB` : 'Foto tersimpan aktif'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label
                className={`flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors ${
                  isFormDisabled
                    ? 'opacity-50 cursor-not-allowed border-[#1E3A5F] bg-[#071629]'
                    : 'border-[#1E3A5F] hover:border-[#2A9D8F] cursor-pointer bg-[#071629]'
                }`}
              >
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-slate-300 font-medium text-xs">Pilih Foto Kendaraan</span>
                <span className="text-[10px] text-slate-500">Maks. 5 MB (JPEG, PNG, WebP)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isFormDisabled}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previewUrl && (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-[#071629] border border-[#1E3A5F] shrink-0 shadow-md">
                  <img src={previewUrl} alt="Preview Kendaraan" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    disabled={isFormDisabled}
                    onClick={handleRemovePhoto}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-rose-600 transition-colors disabled:opacity-40"
                    title="Hapus foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Upload Progress Bar and Status */}
            {saveStep === 'uploading' && (
              <div className="space-y-1.5 p-3 rounded-lg bg-[#071629] border border-[#2A9D8F]/40">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#2A9D8F] font-semibold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mengunggah foto ke Firebase Storage...
                  </span>
                  <span className="font-mono text-white font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#0B2342] rounded-full h-2 overflow-hidden border border-[#1E3A5F]">
                  <div
                    className="bg-[#2A9D8F] h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadTotalBytes > 0 && (
                  <div className="text-[10px] text-slate-400 text-right font-mono">
                    {formatBytes(uploadBytesTransferred)} / {formatBytes(uploadTotalBytes)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Operational Notes */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">Catatan Operasional / Kelengkapan</label>
            <textarea
              rows={2}
              disabled={isFormDisabled}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="cth: Dilengkapi ventilator portable & AED, siap rujukan trauma mayor..."
              className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {saveStep === 'saving' && <span className="text-amber-400 font-mono">Menyimpan ke Firestore...</span>}
              {saveStep === 'uploading' && <span className="text-[#2A9D8F] font-mono">Mengunggah gambar...</span>}
              {saveStep === 'validating' && <span className="text-cyan-400 font-mono">Memvalidasi data...</span>}
              {saveStep === 'success' && <span className="text-emerald-400 font-mono font-bold">✓ Tersimpan!</span>}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isFormDisabled}
                className="px-4 py-2 rounded-lg bg-[#14365f] text-slate-300 hover:text-white transition-colors disabled:opacity-40"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isFormDisabled}
                className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg ${
                  saveStep === 'success'
                    ? 'bg-emerald-600 text-white'
                    : saveStep === 'error'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] disabled:opacity-60'
                }`}
              >
                {saveStep === 'validating' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#071629]" />
                    <span>Memvalidasi data...</span>
                  </>
                )}
                {saveStep === 'uploading' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#071629]" />
                    <span>Mengunggah foto ({uploadProgress}%)...</span>
                  </>
                )}
                {saveStep === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#071629]" />
                    <span>Menyimpan data unit...</span>
                  </>
                )}
                {saveStep === 'success' && (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Berhasil!</span>
                  </>
                )}
                {saveStep === 'error' && (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Coba Simpan Lagi</span>
                  </>
                )}
                {saveStep === 'idle' && (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{initialData ? 'Perbarui Unit' : 'Simpan Unit ke Peta'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
