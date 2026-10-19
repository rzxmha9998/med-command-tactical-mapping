import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Loader2,
  Shield,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { uploadHeaderLogo, updateHeaderSettings } from '../../firebase/services/settingsService';

interface HeaderBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSettingsUpdated: (newSettings: AppSettings) => void;
}

// Preset Tactical Logos for immediate Indonesian medical operations
const PRESET_LOGOS = [
  {
    name: 'Palang Merah Medis',
    tag: 'PMI / Cross',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FFFFFF" stroke="%23E53935" stroke-width="6"/><rect x="42" y="22" width="16" height="56" rx="3" fill="%23E53935"/><rect x="22" y="42" width="56" height="16" rx="3" fill="%23E53935"/></svg>',
  },
  {
    name: 'Kemenkes / Dinas Kesehatan',
    tag: 'Dinkes RI',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%230F766E" stroke="%232DD4BF" stroke-width="4"/><path d="M50 20 L78 35 L78 65 L50 82 L22 65 L22 35 Z" fill="none" stroke="%23FFFFFF" stroke-width="4"/><circle cx="50" cy="50" r="14" fill="%23FFFFFF"/><path d="M46 50 L54 50 M50 46 L50 54" stroke="%230F766E" stroke-width="4" stroke-linecap="round"/></svg>',
  },
  {
    name: 'Ambulans Gawat Darurat (AGD)',
    tag: 'AGD 118 / 119',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23071629" stroke="%23F59E0B" stroke-width="5"/><path d="M50 18 L55 38 L76 38 L60 50 L66 70 L50 58 L34 70 L40 50 L24 38 L45 38 Z" fill="%23F59E0B"/><circle cx="50" cy="50" r="14" fill="%23FFFFFF"/><rect x="47" y="42" width="6" height="16" fill="%23E53935"/><rect x="42" y="47" width="16" height="6" fill="%23E53935"/></svg>',
  },
  {
    name: 'Satgas BNPB / BPBD',
    tag: 'Penanggulangan Bencana',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,15 85,78 15,78" fill="%23EA580C" stroke="%23FED7AA" stroke-width="4"/><polygon points="50,30 73,72 27,72" fill="%231E3A8A"/><circle cx="50" cy="55" r="9" fill="%23FFFFFF"/><path d="M47 55 L53 55 M50 52 L50 58" stroke="%23EA580C" stroke-width="3"/></svg>',
  },
];

export const HeaderBrandingModal: React.FC<HeaderBrandingModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsUpdated,
}) => {
  const [leftLogoUrl, setLeftLogoUrl] = useState(currentSettings.leftLogoUrl || '');
  const [rightLogoUrl, setRightLogoUrl] = useState(currentSettings.rightLogoUrl || '');
  const [agencyName, setAgencyName] = useState(currentSettings.agencyName || 'MED-COMMAND');
  const [operationTitle, setOperationTitle] = useState(
    currentSettings.operationTitle || 'TACTICAL MEDICAL MAPPING'
  );

  const [leftUploading, setLeftUploading] = useState(false);
  const [rightUploading, setRightUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setErrorMsg(null);
    setSuccessMsg(null);

    if (side === 'left') setLeftUploading(true);
    else setRightUploading(true);

    try {
      const url = await uploadHeaderLogo(file, side);
      if (side === 'left') setLeftLogoUrl(url);
      else setRightLogoUrl(url);
      setSuccessMsg(`Logo sisi ${side === 'left' ? 'kiri' : 'kanan'} berhasil diunggah!`);
    } catch (err: any) {
      console.warn(`Upload ${side} logo failed, falling back to local base64:`, err);
      // Fallback to data URL if Storage rules reject during setup
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (side === 'left') setLeftLogoUrl(reader.result);
          else setRightLogoUrl(reader.result);
          setSuccessMsg(`Logo sisi ${side === 'left' ? 'kiri' : 'kanan'} siap disimpan.`);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (side === 'left') setLeftUploading(false);
      else setRightUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const updatedData: AppSettings = {
      leftLogoUrl: leftLogoUrl.trim() || undefined,
      rightLogoUrl: rightLogoUrl.trim() || undefined,
      agencyName: agencyName.trim() || 'MED-COMMAND',
      operationTitle: operationTitle.trim() || 'TACTICAL MEDICAL MAPPING',
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateHeaderSettings(updatedData);
      onSettingsUpdated(updatedData);
      setSuccessMsg('Pengaturan logo header berhasil disimpan ke Firebase!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan logo header ke Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0B2342] border border-[#2A9D8F]/60 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2A9D8F]/20 text-[#2A9D8F] border border-[#2A9D8F]/40 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Konfigurasi Logo & Branding Header</h3>
              <p className="text-[11px] text-slate-400">
                Unggah logo instansi pada sisi kiri & kanan header (Tersinkronisasi Real-time)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1E3A5F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="bg-[#071629]/90 border-b border-[#1E3A5F] p-3 px-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 font-bold">
            PREVIEW TAMPILAN HEADER:
          </span>
          <div className="h-12 bg-[#0B2342] border border-[#1E3A5F] rounded-xl px-4 flex items-center justify-between shadow-inner">
            {/* Left Preview */}
            <div className="flex items-center gap-2.5">
              {leftLogoUrl ? (
                <div className="w-8 h-8 rounded-lg bg-[#071629] border border-[#2A9D8F]/60 overflow-hidden flex items-center justify-center p-0.5">
                  <img src={leftLogoUrl} alt="Left Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#14365f] border border-[#1E3A5F] flex items-center justify-center text-slate-400">
                  <Shield className="w-4 h-4 text-[#2A9D8F]" />
                </div>
              )}
              <div>
                <div className="font-mono font-bold text-white text-xs">{agencyName || 'MED-COMMAND'}</div>
                <div className="text-[9px] font-mono text-[#2A9D8F]">
                  {operationTitle || 'TACTICAL MEDICAL MAPPING'}
                </div>
              </div>
            </div>

            {/* Right Preview */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase">KANAN:</span>
              {rightLogoUrl ? (
                <div className="w-8 h-8 rounded-lg bg-[#071629] border border-[#2A9D8F]/60 overflow-hidden flex items-center justify-center p-0.5">
                  <img src={rightLogoUrl} alt="Right Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg border border-dashed border-[#1E3A5F] flex items-center justify-center text-slate-500 text-[9px] font-mono">
                  Kosong
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sisi Kiri & Kanan Upload Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Sisi Kiri Header */}
            <div className="p-4 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                  Logo Sisi Kiri Header
                </span>
                {leftLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setLeftLogoUrl('')}
                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#0B2342] border border-[#1E3A5F] overflow-hidden flex items-center justify-center shrink-0 p-1">
                  {leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Left" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="block w-full py-2 px-3 rounded-lg bg-[#14365f] hover:bg-[#1E3A5F] border border-[#2A9D8F]/40 text-center font-bold text-white cursor-pointer transition-colors text-xs">
                    {leftUploading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunggah...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#2A9D8F]" />
                        <span>Unggah Logo Kiri</span>
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'left')}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 block text-center">
                    PNG, JPG, WebP, SVG (Maks. 5 MB)
                  </span>
                </div>
              </div>

              {/* Direct URL input */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] text-slate-400">Atau tautan URL gambar:</label>
                <input
                  type="text"
                  value={leftLogoUrl}
                  onChange={(e) => setLeftLogoUrl(e.target.value)}
                  placeholder="https://... atau data:image/..."
                  className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>
            </div>

            {/* 2. Sisi Kanan Header */}
            <div className="p-4 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Logo Sisi Kanan Header
                </span>
                {rightLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setRightLogoUrl('')}
                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#0B2342] border border-[#1E3A5F] overflow-hidden flex items-center justify-center shrink-0 p-1">
                  {rightLogoUrl ? (
                    <img src={rightLogoUrl} alt="Right" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="block w-full py-2 px-3 rounded-lg bg-[#14365f] hover:bg-[#1E3A5F] border border-amber-500/40 text-center font-bold text-white cursor-pointer transition-colors text-xs">
                    {rightUploading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunggah...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unggah Logo Kanan</span>
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'right')}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 block text-center">
                    PNG, JPG, WebP, SVG (Maks. 5 MB)
                  </span>
                </div>
              </div>

              {/* Direct URL input */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] text-slate-400">Atau tautan URL gambar:</label>
                <input
                  type="text"
                  value={rightLogoUrl}
                  onChange={(e) => setRightLogoUrl(e.target.value)}
                  placeholder="https://... atau data:image/..."
                  className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>
            </div>
          </div>

          {/* Preset Logo Cepat */}
          <div className="p-3.5 bg-[#071629] rounded-xl border border-[#1E3A5F] space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gunakan Logo Preset Taktis Medis:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_LOGOS.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[#0B2342] border border-[#1E3A5F] hover:border-[#2A9D8F] flex flex-col items-center text-center gap-1 group"
                >
                  <img src={p.url} alt={p.name} className="w-10 h-10 object-contain my-1" />
                  <span className="font-bold text-white text-[11px] leading-tight">{p.name}</span>
                  <div className="flex gap-1 mt-1 w-full">
                    <button
                      type="button"
                      onClick={() => setLeftLogoUrl(p.url)}
                      className="flex-1 py-1 rounded bg-[#14365f] hover:bg-[#2A9D8F] hover:text-[#071629] text-[9px] font-mono text-slate-300 transition-colors"
                    >
                      Pasang Kiri
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightLogoUrl(p.url)}
                      className="flex-1 py-1 rounded bg-[#14365f] hover:bg-amber-500 hover:text-[#071629] text-[9px] font-mono text-slate-300 transition-colors"
                    >
                      Pasang Kanan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Header Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Nama Instansi / Pusat Komando</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="MED-COMMAND"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Subjudul Operasi Medis</label>
              <input
                type="text"
                value={operationTitle}
                onChange={(e) => setOperationTitle(e.target.value)}
                placeholder="TACTICAL MEDICAL MAPPING"
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#14365f] text-slate-300 hover:text-white transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSaving || leftUploading || rightUploading}
              className="px-5 py-2 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Firebase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Terapkan Logo Header</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
