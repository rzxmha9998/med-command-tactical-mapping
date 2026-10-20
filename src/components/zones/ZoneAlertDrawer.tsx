import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Hospital,
  Navigation,
  Phone,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
  Edit,
  Trash2,
  Radio,
  Layers,
  Info,
} from 'lucide-react';
import { RiskZone, ZoneType } from '../../types';
import { ZONE_CONFIG } from '../../constants/presets';
import {
  searchNearestReferralHospitals,
  HospitalSearchResult,
  getZoneCenterCoordinates,
} from '../../firebase/services/referralHospitalService';

interface ZoneAlertDrawerProps {
  zone: RiskZone | null;
  mapId: string;
  onClose: () => void;
  onEditZone?: (zone: RiskZone) => void;
  onDeleteZone?: (zone: RiskZone) => void;
  isAdmin?: boolean;
}

export const ZoneAlertDrawer: React.FC<ZoneAlertDrawerProps> = ({
  zone,
  mapId,
  onClose,
  onEditZone,
  onDeleteZone,
  isAdmin = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<HospitalSearchResult | null>(null);

  // Fetch or retrieve cached referral hospitals for current zone
  const fetchHospitals = useCallback(
    async (targetZone: RiskZone, radius: number, forceRefresh: boolean = false) => {
      setLoading(true);
      try {
        const result = await searchNearestReferralHospitals(
          mapId,
          targetZone,
          radius,
          forceRefresh
        );
        setSearchResult(result);
      } catch (err) {
        console.error('Error fetching nearest referral hospitals:', err);
      } finally {
        setLoading(false);
      }
    },
    [mapId]
  );

  // Trigger search whenever selected zone or radius changes
  useEffect(() => {
    if (zone) {
      fetchHospitals(zone, radiusKm, false);
    } else {
      setSearchResult(null);
    }
  }, [zone, radiusKm, fetchHospitals]);

  if (!zone) return null;

  const cfg = ZONE_CONFIG[zone.zoneType] || ZONE_CONFIG.red;
  const center = getZoneCenterCoordinates(zone);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getZoneIcon = (type: ZoneType) => {
    switch (type) {
      case 'red':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'yellow':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'green':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop (dismisses on tap) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[550] sm:hidden animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Main Drawer Container */}
      <div className="fixed inset-x-0 bottom-0 z-[560] max-h-[82vh] sm:max-h-none w-full rounded-t-2xl sm:rounded-none sm:inset-auto sm:top-14 sm:bottom-0 sm:right-0 sm:w-96 bg-[#071629]/98 backdrop-blur-md border-t sm:border-t-0 sm:border-l border-[#1E3A5F] flex flex-col shadow-2xl overflow-hidden pb-safe animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Mobile Pull Handle */}
        <div
          onClick={onClose}
          className="w-12 h-1.5 rounded-full bg-slate-600/70 hover:bg-slate-500 mx-auto mt-2.5 mb-1 sm:hidden cursor-pointer shrink-0"
          title="Tarik atau ketuk untuk menutup"
        />

        {/* Tactical Header */}
        <div className="p-3.5 sm:p-4 bg-[#0B2342] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${cfg.fillColor}22`,
                borderColor: `${cfg.borderColor}66`,
              }}
            >
              {getZoneIcon(zone.zoneType)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${cfg.fillColor}25`,
                    color: cfg.fillColor,
                    border: `1px solid ${cfg.borderColor}40`,
                  }}
                >
                  {cfg.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {zone.geometryType.toUpperCase()}
                </span>
              </div>
              <h2 className="font-bold text-white text-sm truncate leading-snug">
                {zone.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && onEditZone && (
              <button
                onClick={() => {
                  onClose();
                  onEditZone(zone);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Edit Zona"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {isAdmin && onDeleteZone && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteZone(zone);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Hapus Zona"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
          {/* Risk Level & Tactical Geometry Banner */}
          <div
            className="p-3 rounded-xl border relative overflow-hidden"
            style={{
              backgroundColor: `${cfg.fillColor}10`,
              borderColor: `${cfg.borderColor}50`,
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold" style={{ color: cfg.fillColor }}>
                {zone.riskLevel || cfg.subLabel}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
                <Radio className="w-3 h-3 text-[#2A9D8F] animate-pulse" />
                <span>Radar Aktif</span>
              </div>
            </div>

            {zone.description && (
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                {zone.description}
              </p>
            )}

            {/* Geometry stats */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-300">
              {zone.geometryType === 'circle' && (
                <>
                  <div className="bg-[#071629] px-2 py-0.5 rounded border border-[#1E3A5F]">
                    Radius Luar:{' '}
                    <strong className="text-white">{zone.radius || 300} m</strong>
                  </div>
                  <div className="bg-[#071629] px-2 py-0.5 rounded border border-[#1E3A5F]">
                    Lubang Tengah:{' '}
                    <strong className="text-emerald-400">
                      {zone.innerRadius || Math.round((zone.radius || 300) * 0.55)} m
                    </strong>
                  </div>
                </>
              )}
              {zone.notes && (
                <div className="w-full text-[10px] text-slate-400 italic">
                  Catatan: {zone.notes}
                </div>
              )}
            </div>
          </div>

          {/* Center Coordinates Card */}
          <div className="p-2.5 rounded-xl bg-[#0B2342] border border-[#1E3A5F] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-[#2A9D8F] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Koordinat Pusat Zona
                </div>
                <div className="font-mono text-xs text-white truncate">
                  {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                </div>
              </div>
            </div>
            <button
              onClick={handleCopyCoords}
              className="px-2.5 py-1 rounded bg-[#071629] hover:bg-[#14365f] text-slate-300 hover:text-white border border-[#1E3A5F] text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Salin Koordinat"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          {/* Referral Hospital Candidate Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hospital className="w-4 h-4 text-[#2A9D8F]" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  RS Rujukan Terdekat
                </h3>
              </div>

              {/* Force Refresh Button */}
              <button
                onClick={() => fetchHospitals(zone, radiusKm, true)}
                disabled={loading}
                className="px-2 py-1 rounded bg-[#0B2342] hover:bg-[#14365f] text-slate-300 hover:text-white border border-[#1E3A5F] text-[10px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                title="Cari Ulang Data Rumah Sakit Terkini"
              >
                <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#2A9D8F]' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* Radius Filter & Data Status Bar */}
            <div className="p-2.5 rounded-xl bg-[#0B2342]/70 border border-[#1E3A5F] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">Radius:</span>
                {[5, 10, 15, 25].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      radiusKm === r
                        ? 'bg-[#2A9D8F] text-[#071629]'
                        : 'bg-[#071629] text-slate-300 hover:bg-[#14365f]'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>

              {/* Status Badge */}
              {searchResult && (
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      searchResult.status === 'fresh'
                        ? 'bg-emerald-400 animate-pulse'
                        : searchResult.status === 'cached'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold ${
                      searchResult.status === 'fresh'
                        ? 'text-emerald-400'
                        : searchResult.status === 'cached'
                        ? 'text-cyan-300'
                        : 'text-amber-400'
                    }`}
                  >
                    {searchResult.status === 'fresh'
                      ? 'Terbaru'
                      : searchResult.status === 'cached'
                      ? 'Cache'
                      : 'Belum Tersedia'}
                  </span>
                </div>
              )}
            </div>

            {/* Honest Disclaimer: Straight-line distance */}
            <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#071629] border border-[#1E3A5F]/60 text-[10px] text-slate-400 leading-tight">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Jarak dihitung berdasarkan <strong>garis lurus (geometris)</strong> dari koordinat pusat
                zona, bukan rute jalan raya atau perkiraan durasi lalu lintas.
              </span>
            </div>

            {/* Hospital List or States */}
            {loading ? (
              <div className="p-6 rounded-xl bg-[#0B2342]/40 border border-[#1E3A5F] flex flex-col items-center justify-center text-center">
                <RotateCw className="w-6 h-6 text-[#2A9D8F] animate-spin mb-2" />
                <div className="text-xs font-bold text-white mb-0.5">
                  Mencari Rumah Sakit Rujukan...
                </div>
                <div className="text-[10px] text-slate-400">
                  Memeriksa Firestore dan OpenStreetMap dalam radius {radiusKm} km
                </div>
              </div>
            ) : searchResult && searchResult.hospitals.length > 0 ? (
              <div className="space-y-2.5">
                {searchResult.hospitals.map((hospital, idx) => (
                  <div
                    key={hospital.id}
                    className="p-3 rounded-xl bg-[#0B2342] border border-[#1E3A5F] hover:border-[#2A9D8F]/60 transition-all shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            idx === 0
                              ? 'bg-[#2A9D8F] text-[#071629]'
                              : 'bg-[#14365f] text-slate-300'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-xs truncate group-hover:text-[#2A9D8F] transition-colors">
                          {hospital.name}
                        </h4>
                      </div>

                      {/* Straight Line Distance Tag */}
                      <span className="font-mono text-xs font-bold text-cyan-300 shrink-0 bg-[#071629] px-2 py-0.5 rounded border border-[#1E3A5F]">
                        {hospital.distanceFormatted}
                      </span>
                    </div>

                    {/* Address if available */}
                    {hospital.address && (
                      <p className="text-[11px] text-slate-300 mb-2 line-clamp-2 pl-6">
                        {hospital.address}
                      </p>
                    )}

                    {/* Phone & Navigation Row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1E3A5F]/60 pl-6 text-xs">
                      {hospital.phone ? (
                        <a
                          href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{hospital.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Telp belum terdata
                        </span>
                      )}

                      <a
                        href={hospital.navigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-[10px] shadow-sm transition-colors cursor-pointer ml-auto"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Navigasi</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    </div>
                  </div>
                ))}

                {/* Source attribution footer */}
                <div className="text-[10px] text-slate-400 text-center italic pt-1">
                  Sumber: {searchResult.sourceSummary}
                </div>
              </div>
            ) : (
              /* Honest Unavailable / Zero Hospital State */
              <div className="p-4 rounded-xl bg-[#0B2342]/40 border border-[#1E3A5F] text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <div className="text-xs font-bold text-white">
                  {searchResult?.status === 'unavailable'
                    ? 'Layanan Pencarian Terkendala'
                    : 'Tidak Ada RS Dalam Radius'}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs mx-auto">
                  {searchResult?.message ||
                    `Tidak ditemukan rumah sakit rujukan terverifikasi dalam radius cakupan ${radiusKm} km. Sistem tidak memunculkan data fiktif.`}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setRadiusKm(25)}
                    className="px-3 py-1.5 rounded-lg bg-[#14365f] hover:bg-[#1E3A5F] text-xs text-white font-medium transition-colors cursor-pointer"
                  >
                    Perluas Radius ke 25 km
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Footer / Quick Actions */}
        <div className="p-3 bg-[#0B2342] border-t border-[#1E3A5F] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px]">
            <Layers className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span>Zona {zone.zoneType.toUpperCase()}</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#071629] text-slate-300 hover:text-white border border-[#1E3A5F] text-xs cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </>
  );
};
