import React, { useState, useEffect } from 'react';
import {
  Shield,
  X,
  Check,
  XCircle,
  Clock,
  User,
  MapPin,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Filter,
  Search,
  MessageSquare,
} from 'lucide-react';
import { TacticalMap, MapAccessRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeAllAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  formatFirestoreDate,
} from '../../firebase/services/accessRequestService';

interface AccessRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maps: TacticalMap[];
}

export const AccessRequestsModal: React.FC<AccessRequestsModalProps> = ({
  isOpen,
  onClose,
  maps,
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MapAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedMapOverrides, setSelectedMapOverrides] = useState<Record<string, string>>({});
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');

  // Real-time subscription to access requests
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const unsubscribe = subscribeAllAccessRequests(
      (allRequests) => {
        setRequests(allRequests);
        setLoading(false);
      },
      (err: any) => {
        console.error('Failed to subscribe access requests:', err?.code, err?.message);
        const codeInfo = err?.code ? ` (${err.code})` : '';
        setMessage({
          text: `Gagal memuat permintaan akses${codeInfo}. Periksa izin keamanan atau koneksi internet.`,
          type: 'error',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const filteredRequests = requests
    .filter((r) => {
      if (filterTab === 'pending') return r.status === 'pending';
      if (filterTab === 'approved') return r.status === 'approved';
      if (filterTab === 'rejected') return r.status === 'rejected';
      return true;
    })
    .filter((r) => {
      const matchSearch =
        r.userName.toLowerCase().includes(search.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        r.mapName.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });

  const handleApprove = async (req: MapAccessRequest) => {
    if (!user) return;
    setActionLoadingId(req.id);
    setMessage(null);

    const targetMapId = selectedMapOverrides[req.id] || req.mapId;
    const targetMap = maps.find((m) => m.id === targetMapId);

    try {
      await approveAccessRequest(
        req,
        { uid: user.uid, email: user.email },
        targetMapId
      );
      setMessage({
        text: `Akses sektor "${targetMap?.name || req.mapName}" berhasil diberikan kepada ${req.userName}.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: `Gagal menyetujui akses: ${err.message}`,
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req: MapAccessRequest) => {
    if (!user) return;
    setActionLoadingId(req.id);
    setMessage(null);

    const reason = rejectReasonMap[req.id] || '';

    try {
      await rejectAccessRequest(
        req.id,
        { uid: user.uid, email: user.email },
        reason
      );
      setMessage({
        text: `Permintaan akses dari ${req.userName} berhasil ditolak.`,
        type: 'success',
      });
      setRejectingId(null);
    } catch (err: any) {
      setMessage({
        text: `Gagal menolak akses: ${err.message}`,
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B2342] border border-[#2A9D8F]/60 flex items-center justify-center text-[#2A9D8F] shadow-[0_0_15px_rgba(42,157,143,0.3)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Permintaan Akses Peta Petugas</h3>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold">
                    {pendingRequests.length} Menunggu
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Tinjau, validasi sektor penugasan, dan berikan otorisasi akses peta operasional kepada petugas medis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between shadow-lg shrink-0 ${
              message.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/70 border border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-current hover:opacity-75 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs & Search Filter */}
        <div className="px-6 py-3 bg-[#071629]/60 border-b border-[#1E3A5F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterTab === 'pending'
                  ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#14365f]'
              }`}
            >
              <span>Menunggu</span>
              <span className="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">
                {pendingRequests.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterTab === 'approved'
                  ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#14365f]'
              }`}
            >
              <span>Disetujui</span>
              <span className="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">
                {approvedRequests.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterTab === 'rejected'
                  ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#14365f]'
              }`}
            >
              <span>Ditolak</span>
              <span className="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">
                {rejectedRequests.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterTab === 'all'
                  ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#14365f]'
              }`}
            >
              <span>Semua Riwayat</span>
              <span className="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">
                {requests.length}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari petugas atau peta..."
              className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2A9D8F]"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-[#2A9D8F] animate-spin mb-3" />
              <p className="text-xs font-mono">Memuat daftar permintaan akses...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
              <div className="text-sm font-bold text-white">Tidak Ada Permintaan Akses</div>
              <p className="text-xs max-w-sm mx-auto">
                {filterTab === 'pending'
                  ? 'Seluruh permintaan akses petugas telah diproses. Tidak ada permintaan yang tertunda.'
                  : 'Tidak ada data permintaan pada kategori filter ini.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isLoading = actionLoadingId === req.id;
              const isRejecting = rejectingId === req.id;
              const isPending = req.status === 'pending';

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl bg-[#071629] border transition-all shadow-md ${
                    isPending
                      ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                      : req.status === 'approved'
                      ? 'border-emerald-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Officer & Request Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#2A9D8F]" />
                          {req.officerName || req.userName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {req.officerEmail || req.userEmail}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {req.status === 'pending'
                            ? 'Menunggu'
                            : req.status === 'approved'
                            ? 'Disetujui'
                            : 'Ditolak'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>Peta Diminta:</span>
                          <strong className="text-white">{req.mapName}</strong>
                        </span>

                        <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {formatFirestoreDate(req.createdAt)}
                        </span>
                      </div>

                      {req.requestNote && (
                        <div className="text-[11px] text-slate-400 bg-[#0B2342] p-2 rounded-lg border border-[#1E3A5F] flex items-start gap-1.5 mt-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-300">Catatan Petugas:</strong> {req.requestNote}
                          </span>
                        </div>
                      )}

                      {/* Review details for approved/rejected */}
                      {req.reviewedAt && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Ditinjau oleh {req.reviewedByEmail || 'Admin'} pada{' '}
                          {formatFirestoreDate(req.reviewedAt)}
                        </div>
                      )}
                    </div>

                    {/* Pending Actions & Map Selection */}
                    {isPending && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1E3A5F]">
                        {/* Map Selector Confirmation */}
                        <div className="min-w-[180px]">
                          <select
                            disabled={isLoading}
                            value={selectedMapOverrides[req.id] || req.mapId}
                            onChange={(e) =>
                              setSelectedMapOverrides((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#2A9D8F] disabled:opacity-50"
                          >
                            {maps.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} {m.id === req.mapId ? '(Permintaan Asli)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Approve Button */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleApprove(req)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Setujui Akses</span>
                        </button>

                        {/* Reject Button Trigger */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setRejectingId(isRejecting ? null : req.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Reject Form */}
                  {isRejecting && (
                    <div className="mt-3 pt-3 border-t border-[#1E3A5F] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={rejectReasonMap[req.id] || ''}
                        onChange={(e) =>
                          setRejectReasonMap((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        placeholder="Alasan penolakan (opsional, cth: Belum ada jadwal penugasan di sektor ini)..."
                        className="flex-1 bg-[#0B2342] border border-rose-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleReject(req)}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Konfirmasi Tolak</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#14365f] text-slate-300 hover:text-white text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
