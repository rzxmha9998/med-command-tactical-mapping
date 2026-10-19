import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  X,
  Check,
  Shield,
  ShieldAlert,
  MapPin,
  Lock,
  Mail,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { UserProfile, TacticalMap } from '../../types';
import {
  createOfficerProfile,
  toggleOfficerActive,
  updateOfficerMapAccess,
} from '../../firebase/services/userService';

interface OfficerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  officers: UserProfile[];
  maps: TacticalMap[];
  onRefresh: () => void;
}

export const OfficerManagementModal: React.FC<OfficerManagementModalProps> = ({
  isOpen,
  onClose,
  officers,
  maps,
  onRefresh,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newUid, setNewUid] = useState('');
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) {
      setMessage({ text: 'Email dan Nama petugas wajib diisi.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Clean UID derived from email or custom ID
      const uid = newUid.trim() || `officer_${newEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      await createOfficerProfile(uid, newEmail.trim().toLowerCase(), newName.trim(), selectedMapIds);

      setMessage({ text: `Akun petugas ${newName} berhasil didaftarkan.`, type: 'success' });
      setNewEmail('');
      setNewName('');
      setNewUid('');
      setSelectedMapIds([]);
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menambahkan akun petugas.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (officer: UserProfile) => {
    setActionLoadingUid(officer.uid);
    setMessage(null);
    try {
      await toggleOfficerActive(officer.uid, !officer.isActive);
      onRefresh();
    } catch (err: any) {
      setMessage({ text: `Gagal mengubah status: ${err.message}`, type: 'error' });
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleToggleMapForOfficer = async (officer: UserProfile, mapId: string) => {
    setActionLoadingUid(officer.uid);
    setMessage(null);
    try {
      const current = officer.allowedMapIds || [];
      const updated = current.includes(mapId)
        ? current.filter((id) => id !== mapId)
        : [...current, mapId];

      await updateOfficerMapAccess(officer.uid, updated);
      onRefresh();
    } catch (err: any) {
      setMessage({ text: `Gagal memperbarui izin peta: ${err.message}`, type: 'error' });
    } finally {
      setActionLoadingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-[#071629] border-b border-[#1E3A5F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2A9D8F]" />
            <div>
              <h3 className="font-bold text-white text-base">Manajemen Akun & Otorisasi Petugas</h3>
              <p className="text-[11px] text-slate-400">
                Atur status akun petugas dan hak akses pembacaan peta operasional
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-current hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Subheader & Add Officer Trigger */}
        <div className="px-6 py-3 bg-[#071629]/50 border-b border-[#1E3A5F] flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300">
            Total Terdaftar: {officers.length} Petugas
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Tutup Formulir' : '+ Tambah Akun Petugas'}</span>
          </button>
        </div>

        {/* Add Officer Collapsible Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateOfficer}
            className="p-6 bg-[#071629]/80 border-b border-[#1E3A5F] space-y-3 text-xs"
          >
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
              Formulir Pendaftaran Profil Petugas
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nama Lengkap Petugas *</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="cth: Bripka Dedi Pratama"
                    className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Alamat Email Petugas *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="cth: petugas.medis01@gmail.com"
                    className="w-full bg-[#0B2342] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Pilih Peta yang Diizinkan Langsung</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {maps.map((m) => (
                  <label
                    key={m.id}
                    className="p-2 rounded bg-[#0B2342] border border-[#1E3A5F] flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMapIds.includes(m.id)}
                      onChange={() => {
                        setSelectedMapIds((prev) =>
                          prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                        );
                      }}
                      className="rounded accent-[#2A9D8F]"
                    />
                    <span className="text-slate-200 truncate">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded bg-[#14365f] text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded bg-[#2A9D8F] text-[#071629] font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Daftarkan Petugas</span>
              </button>
            </div>
          </form>
        )}

        {/* Officers List Table */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-3 text-xs">
          {officers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
              <p>Belum ada petugas terdaftar.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Petugas yang mendaftar atau dibuat melalui form di atas akan muncul di sini.
              </p>
            </div>
          ) : (
            officers.map((officer) => (
              <div
                key={officer.uid}
                className="p-4 rounded-xl bg-[#071629] border border-[#1E3A5F] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1E3A5F]/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E3A5F] flex items-center justify-center font-bold text-white text-sm">
                      {officer.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{officer.displayName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{officer.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(officer)}
                      disabled={actionLoadingUid === officer.uid}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        officer.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      {actionLoadingUid === officer.uid ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : officer.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{officer.isActive ? 'Akun Aktif' : 'Dinonaktifkan'}</span>
                    </button>
                  </div>
                </div>

                {/* Map Access Checklist */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>Izin Akses Peta Operasional Petugas Ini:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {maps.map((m) => {
                      const hasAccess = officer.allowedMapIds?.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMapForOfficer(officer, m.id)}
                          className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                            hasAccess
                              ? 'bg-[#2A9D8F]/15 border-[#2A9D8F]/60 text-white'
                              : 'bg-[#0B2342] border-[#1E3A5F] text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={hasAccess}
                            readOnly
                            className="rounded accent-[#2A9D8F] pointer-events-none"
                          />
                          <span className="truncate text-[11px] font-medium">{m.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#071629] border-t border-[#1E3A5F] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#14365f] text-slate-300 hover:text-white text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
