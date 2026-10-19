import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { TacticalMap, MapAccessRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeAvailableMaps,
  subscribeOfficerRequests,
  createAccessRequest,
  reRequestAccess,
  formatFirestoreDate,
} from '../../firebase/services/accessRequestService';

interface OfficerMapAccessViewProps {
  onSelectMap?: (map: TacticalMap) => void;
}

export const OfficerMapAccessView: React.FC<OfficerMapAccessViewProps> = ({ onSelectMap }) => {
  const { user } = useAuth();
  const [availableMaps, setAvailableMaps] = useState<TacticalMap[]>([]);
  const [myRequests, setMyRequests] = useState<MapAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingMapId, setSubmittingMapId] = useState<string | null>(null);
  const [requestNoteMapId, setRequestNoteMapId] = useState<string | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // 1. Subscribe to active maps
  useEffect(() => {
    const unsubMaps = subscribeAvailableMaps(
      (maps) => {
        setAvailableMaps(maps);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load available maps:', err);
        setErrorMessage('Gagal mengambil daftar peta operasional. Periksa koneksi Anda.');
        setLoading(false);
      }
    );

    return () => unsubMaps();
  }, []);

  // 2. Subscribe to officer's own requests
  useEffect(() => {
    if (!user) return;
    const unsubRequests = subscribeOfficerRequests(
      user.uid,
      (requests) => {
        setMyRequests(requests);
      },
      (err) => {
        console.error('Failed to load access requests:', err);
      }
    );

    return () => unsubRequests();
  }, [user?.uid]);

  const handleOpenRequestModal = (mapId: string) => {
    setRequestNoteMapId(mapId);
    setRequestNote('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmitRequest = async (targetMap: TacticalMap) => {
    if (!user) return;
    setSubmittingMapId(targetMap.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const existingReq = myRequests.find((r) => r.mapId === targetMap.id);
      if (existingReq && existingReq.status === 'rejected') {
        await reRequestAccess(existingReq.id, requestNote);
        setSuccessMessage(`Permintaan akses ke "${targetMap.name}" berhasil diajukan ulang.`);
      } else {
        await createAccessRequest({
          mapId: targetMap.id,
          mapName: targetMap.name,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          },
          requestNote,
        });
        setSuccessMessage(`Permintaan akses ke "${targetMap.name}" berhasil dikirimkan ke Administrator.`);
      }
      setRequestNoteMapId(null);
      setRequestNote('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengajukan permintaan akses.');
    } finally {
      setSubmittingMapId(null);
    }
  };

  const filteredMaps = availableMaps.filter((m) => {
    return (
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#071629] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A5F]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Akses Peta Operasional Medis
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Pilih sektor peta penugasan Anda dan ajukan izin akses kepada Administrator medis.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari sektor peta..."
            className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2A9D8F]"
          />
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#2A9D8F] animate-spin mb-3" />
          <p className="text-xs font-mono">Memuat sektor peta operasional...</p>
        </div>
      ) : availableMaps.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#0B2342] border border-[#1E3A5F] text-center max-w-xl mx-auto shadow-2xl">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-2">
            Belum Ada Peta Operasional Aktif
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Administrator medis belum mempublikasikan sektor peta penugasan. Harap menunggu hingga Administrator membuat peta operasional baru.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071629] border border-[#1E3A5F] text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span>Sistem akan otomatis memperbarui saat peta dibuat</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaps.map((map) => {
            const hasAccess = user && map.allowedOfficerIds?.includes(user.uid);
            const request = myRequests.find((r) => r.mapId === map.id);
            const isPending = request?.status === 'pending';
            const isRejected = request?.status === 'rejected';

            return (
              <div
                key={map.id}
                className={`flex flex-col justify-between p-5 rounded-2xl bg-[#0B2342] border transition-all duration-300 shadow-xl ${
                  hasAccess
                    ? 'border-[#2A9D8F]/60 shadow-[0_0_20px_rgba(42,157,143,0.15)]'
                    : isPending
                    ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'border-[#1E3A5F] hover:border-slate-600'
                }`}
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#071629] border border-[#1E3A5F] flex items-center justify-center text-[#2A9D8F] shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>

                    <div>
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Akses Aktif
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          Menunggu Persetujuan
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-rose-300">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Ditolak Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-500/40 text-[10px] font-mono text-slate-400">
                          Perlu Izin Akses
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1">
                    {map.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {map.description || 'Sektor operasional tanggap medis dan evakuasi darurat.'}
                  </p>
                </div>

                {/* Footer Status & Actions */}
                <div className="pt-4 border-t border-[#1E3A5F]/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#2A9D8F]" />
                      Zoom {map.defaultZoom || 16}
                    </span>
                    <span>
                      {map.allowedOfficerIds?.length || 0} Petugas Diizinkan
                    </span>
                  </div>

                  {/* Actions */}
                  {hasAccess ? (
                    <button
                      type="button"
                      onClick={() => onSelectMap?.(map)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <span>Buka Peta Operasional</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : isPending ? (
                    <div className="p-2.5 rounded-xl bg-[#071629] border border-amber-500/30 text-amber-200/90 text-[11px] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Diajukan pada {formatFirestoreDate(request.createdAt)}
                      </span>
                    </div>
                  ) : isRejected ? (
                    <button
                      type="button"
                      onClick={() => handleOpenRequestModal(map.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Ajukan Ulang Permintaan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenRequestModal(map.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#071629] hover:bg-[#2A9D8F] hover:text-[#071629] border border-[#2A9D8F]/60 text-[#2A9D8F] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Minta Akses Sektor Peta</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal Dialog */}
      {requestNoteMapId && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#2A9D8F]" />
                <h3 className="font-bold text-white text-sm">
                  Ajukan Akses Peta Operasional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestNoteMapId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Target Map Name */}
            {(() => {
              const target = availableMaps.find((m) => m.id === requestNoteMapId);
              return target ? (
                <div className="p-3 rounded-xl bg-[#071629] border border-[#1E3A5F] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    Sektor Operasional
                  </span>
                  <div className="font-bold text-white text-xs">{target.name}</div>
                  {target.description && (
                    <div className="text-[11px] text-slate-400">{target.description}</div>
                  )}
                </div>
              ) : null;
            })()}

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold text-xs flex items-center justify-between">
                <span>Catatan Penugasan / Unit (Opsional)</span>
                <span className="text-[10px] text-slate-500">Maks. 200 karakter</span>
              </label>
              <textarea
                rows={3}
                value={requestNote}
                maxLength={200}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="cth: Kru Ambulans AGD 01 ditugaskan siaga ring 1..."
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRequestNoteMapId(null)}
                disabled={submittingMapId !== null}
                className="px-4 py-2 rounded-xl bg-[#14365f] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={submittingMapId !== null}
                onClick={() => {
                  const target = availableMaps.find((m) => m.id === requestNoteMapId);
                  if (target) handleSubmitRequest(target);
                }}
                className="px-5 py-2 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                {submittingMapId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#071629]" />
                    <span>Mengirimkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Permintaan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
