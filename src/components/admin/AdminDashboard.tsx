import React, { useState } from 'react';
import {
  Map as MapIcon,
  Ambulance,
  Bike,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Users,
  Plus,
  Copy,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Zap,
} from 'lucide-react';
import { TacticalMap, MedicalUnit, RiskZone, UserProfile } from '../../types';

interface AdminDashboardProps {
  maps: TacticalMap[];
  units: MedicalUnit[];
  riskZones: RiskZone[];
  officers: UserProfile[];
  onOpenMap: (map: TacticalMap) => void;
  onCreateMap: () => void;
  onEditMap: (map: TacticalMap) => void;
  onDuplicateMap: (map: TacticalMap) => void;
  onToggleArchiveMap: (map: TacticalMap) => void;
  onDeleteMap: (map: TacticalMap) => void;
  onOpenOfficerManagement: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  maps,
  units,
  riskZones,
  officers,
  onOpenMap,
  onCreateMap,
  onEditMap,
  onDuplicateMap,
  onToggleArchiveMap,
  onDeleteMap,
  onOpenOfficerManagement,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // KPI Calculations
  const totalMaps = maps.length;
  const activeMaps = maps.filter((m) => m.status === 'active').length;
  const totalAmbulances = units.filter((u) => u.type === 'ambulance').length;
  const totalMedicalBikes = units.filter((u) => u.type === 'medical_bike').length;
  const totalResponseUnits = units.filter((u) => u.type === 'response_bike' || u.type === 'other').length;
  const totalRedZones = riskZones.filter((z) => z.zoneType === 'red').length;
  const totalYellowZones = riskZones.filter((z) => z.zoneType === 'yellow').length;
  const totalGreenZones = riskZones.filter((z) => z.zoneType === 'green').length;
  const activeOfficers = officers.filter((o) => o.isActive).length;

  // Filtered maps
  const filteredMaps = maps.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#071629] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A5F]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Pusat Komando Administrasi Operasional
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Kelola multiple peta operasional medis, plotting armada ambulans, zona bahaya, dan hak akses petugas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenOfficerManagement}
            className="px-3.5 py-2 rounded-xl bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-md"
          >
            <Users className="w-4 h-4 text-[#2A9D8F]" />
            <span>Kelola Petugas ({officers.length})</span>
          </button>

          <button
            onClick={onCreateMap}
            className="px-4 py-2 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#2A9D8F]/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Peta Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Maps */}
        <div className="p-3.5 rounded-xl bg-[#0B2342] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Peta</span>
            <MapIcon className="w-4 h-4 text-[#2A9D8F]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{totalMaps}</div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1">{activeMaps} Aktif</div>
        </div>

        {/* Ambulances */}
        <div className="p-3.5 rounded-xl bg-[#0B2342] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ambulans AGD</span>
            <Ambulance className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{totalAmbulances}</div>
          <div className="text-[10px] text-slate-400 mt-1">Gawat Darurat</div>
        </div>

        {/* Medical Bikes */}
        <div className="p-3.5 rounded-xl bg-[#0B2342] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Motor Medis</span>
            <Bike className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{totalMedicalBikes}</div>
          <div className="text-[10px] text-slate-400 mt-1">Reaksi Cepat</div>
        </div>

        {/* Response Units */}
        <div className="p-3.5 rounded-xl bg-[#0B2342] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Unit Respons</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{totalResponseUnits}</div>
          <div className="text-[10px] text-slate-400 mt-1">Triase Lapangan</div>
        </div>

        {/* Red Zones */}
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Zona Merah</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-red-400">{totalRedZones}</div>
          <div className="text-[10px] text-red-300 mt-1">Risiko Tinggi</div>
        </div>

        {/* Yellow Zones */}
        <div className="p-3.5 rounded-xl bg-yellow-950/30 border border-yellow-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-yellow-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Zona Kuning</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-yellow-400">{totalYellowZones}</div>
          <div className="text-[10px] text-yellow-300 mt-1">Risiko Sedang</div>
        </div>

        {/* Green Zones */}
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Zona Hijau</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">{totalGreenZones}</div>
          <div className="text-[10px] text-emerald-300 mt-1">Area Aman</div>
        </div>

        {/* Officers */}
        <div className="p-3.5 rounded-xl bg-[#0B2342] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Petugas Aktif</span>
            <Users className="w-4 h-4 text-[#2A9D8F]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{activeOfficers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Personel Sistem</div>
        </div>
      </div>

      {/* Maps Management Section */}
      <div className="bg-[#0B2342] border border-[#1E3A5F] rounded-2xl shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-[#1E3A5F] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2A9D8F]" />
            <h2 className="font-bold text-white text-sm sm:text-base">
              Daftar Seluruh Peta Operasional
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#2A9D8F] font-mono text-xs font-bold">
              {filteredMaps.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau deskripsi peta..."
                className="w-full bg-[#071629] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2A9D8F]"
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#071629] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#2A9D8F]"
            >
              <option value="all">Semua Status</option>
              <option value="active">Peta Aktif</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>
        </div>

        {/* Maps Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071629] text-slate-400 font-mono text-[10px] uppercase border-b border-[#1E3A5F]">
              <tr>
                <th className="py-3 px-4">Nama & Deskripsi Peta</th>
                <th className="py-3 px-4">Titik Pusat & Zoom</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Otorisasi Petugas</th>
                <th className="py-3 px-4">Dibuat Pada</th>
                <th className="py-3 px-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5F]/60">
              {filteredMaps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <MapIcon className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-xs">Tidak ada peta yang cocok dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredMaps.map((map) => {
                  const allowedCount = map.allowedOfficerIds?.length || 0;
                  return (
                    <tr
                      key={map.id}
                      className="hover:bg-[#14365f]/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm leading-tight mb-0.5">
                          {map.name}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {map.description || 'Tidak ada catatan deskripsi'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div>
                          {map.centerLat.toFixed(4)}, {map.centerLng.toFixed(4)}
                        </div>
                        <div className="text-[10px] text-slate-500">Zoom: {map.defaultZoom}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${
                            map.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              map.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'
                            }`}
                          />
                          {map.status === 'active' ? 'Operasional' : 'Diarsipkan'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#2A9D8F]" />
                          <span className="font-semibold text-white">{allowedCount} Petugas</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {allowedCount > 0 ? 'Akses Terbatas' : 'Belum Ditugaskan'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[10px] text-slate-400 font-mono">
                        {new Date(map.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenMap(map)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-1 transition-colors shadow"
                            title="Buka Peta Taktis"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka</span>
                          </button>

                          <button
                            onClick={() => onEditMap(map)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1E3A5F] transition-colors"
                            title="Edit Konfigurasi Peta"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateMap(map)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1E3A5F] transition-colors"
                            title="Duplikasi Peta Ini Beserta Seluruh Unit & Zona"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onToggleArchiveMap(map)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1E3A5F] transition-colors"
                            title={map.status === 'active' ? 'Arsipkan Peta' : 'Aktifkan Kembali'}
                          >
                            {map.status === 'active' ? (
                              <Archive className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>

                          <button
                            onClick={() => onDeleteMap(map)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                            title="Hapus Peta Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
