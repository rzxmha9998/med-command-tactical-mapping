import React, { useEffect, useState, useRef } from 'react';
import {
  Navigation,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Compass,
  Gauge,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  updateOfficerLocation,
  removeOfficerLocation,
  calculateDistanceMeters,
} from '../../firebase/services/officerLocationService';
import { GPSStatus } from '../../types';

interface OfficerGPSBarProps {
  mapId: string;
  mapName?: string;
}

export const OfficerGPSBar: React.FC<OfficerGPSBarProps> = ({ mapId, mapName }) => {
  const { user, profile } = useAuth();
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('prompting');
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    heading: number | null;
    speed: number | null;
  } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // References for throttling and watch cleanup
  const watchIdRef = useRef<number | null>(null);
  const lastWrittenCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastWriteTimestampRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Minimum threshold: 3 meters displacement OR 20 seconds elapsed to write to Firestore
  const MIN_DISPLACEMENT_METERS = 3;
  const MIN_INTERVAL_MS = 5000; // Never write faster than once every 5s
  const MAX_STALE_INTERVAL_MS = 25000; // Heartbeat write if stationary for 25s

  const syncToFirestore = async (
    positionData: {
      latitude: number;
      longitude: number;
      accuracy: number;
      heading: number | null;
      speed: number | null;
    },
    force: boolean = false
  ) => {
    if (!user || !mapId) return;

    const now = Date.now();
    const timeSinceLastWrite = now - lastWriteTimestampRef.current;

    if (!force && timeSinceLastWrite < MIN_INTERVAL_MS) {
      return;
    }

    if (!force && lastWrittenCoordsRef.current) {
      const distance = calculateDistanceMeters(
        lastWrittenCoordsRef.current.lat,
        lastWrittenCoordsRef.current.lng,
        positionData.latitude,
        positionData.longitude
      );

      // Skip if position moved less than threshold and heartbeat hasn't expired
      if (distance < MIN_DISPLACEMENT_METERS && timeSinceLastWrite < MAX_STALE_INTERVAL_MS) {
        return;
      }
    }

    try {
      setIsSyncing(true);
      await updateOfficerLocation({
        officerUid: user.uid,
        officerName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Petugas Medis',
        officerEmail: user.email || '',
        mapId,
        latitude: positionData.latitude,
        longitude: positionData.longitude,
        accuracy: positionData.accuracy,
        heading: positionData.heading,
        speed: positionData.speed,
        status: 'active',
      });

      lastWrittenCoordsRef.current = { lat: positionData.latitude, lng: positionData.longitude };
      lastWriteTimestampRef.current = now;
      if (isMountedRef.current) {
        setLastSyncTime(new Date());
      }
    } catch (err: any) {
      console.warn('[MED-COMMAND GPS] Telemetry push error:', err?.message || err);
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  };

  const startWatchingPosition = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      setErrorMessage('Browser atau perangkat ini tidak mendukung sensor Geolocation.');
      return;
    }

    // Stop previous watch if exists
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsStatus('prompting');
    setErrorMessage(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      if (!isMountedRef.current) return;

      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
      };

      setCoords(newCoords);
      setGpsStatus('active');
      setErrorMessage(null);

      // Throttled sync
      syncToFirestore(newCoords);
    };

    const handleError = (error: GeolocationPositionError) => {
      if (!isMountedRef.current) return;

      if (error.code === error.PERMISSION_DENIED) {
        setGpsStatus('denied');
        setErrorMessage('Izin lokasi ditolak. Buka pengaturan browser untuk mengizinkan akses GPS.');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setGpsStatus('unavailable');
        setErrorMessage('Sinyal GPS tidak tersedia atau perangkat kehilangan koneksi satelit.');
      } else if (error.code === error.TIMEOUT) {
        setGpsStatus('timeout');
        setErrorMessage('Permintaan GPS melampaui batas waktu. Sedang mencoba kembali...');
      } else {
        setGpsStatus('unavailable');
        setErrorMessage(error.message || 'Gagal membaca koordinat GPS.');
      }
    };

    try {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
      watchIdRef.current = id;
    } catch (e: any) {
      setGpsStatus('unavailable');
      setErrorMessage('Gagal menginisialisasi Geolocation API: ' + (e?.message || e));
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startWatchingPosition();

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Clean up telemetry document on unmount / map exit
      if (user?.uid) {
        removeOfficerLocation(user.uid);
      }
    };
  }, [mapId, user?.uid]);

  return (
    <div className="absolute top-4 right-16 sm:right-20 z-[500] max-w-sm pointer-events-auto">
      {gpsStatus === 'active' && coords ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#071629]/95 backdrop-blur-md border border-[#2A9D8F]/60 text-white shadow-2xl">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F]" />
            <span className="w-4 h-4 rounded-full bg-[#2A9D8F]/40 absolute animate-ping" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="text-[#2A9D8F]">GPS AKTIF</span>
              <span className="text-slate-400 font-mono text-[10px]">
                (±{Math.round(coords.accuracy)}m)
              </span>
              {isSyncing && (
                <span className="text-[9px] font-mono text-cyan-400 animate-pulse">
                  • Syncing
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-300">
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              {lastSyncTime && (
                <span className="text-slate-400 ml-1">
                  • {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : gpsStatus === 'prompting' ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#071629]/95 backdrop-blur-md border border-amber-500/50 text-amber-200 text-xs shadow-xl">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          <span className="text-[11px] font-medium">Meminta Izin GPS Browser...</span>
        </div>
      ) : gpsStatus === 'denied' ? (
        <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-rose-950/95 backdrop-blur-md border border-rose-500/50 text-rose-200 text-xs shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-rose-300">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Izin Lokasi Ditolak</span>
            </div>
            <button
              onClick={startWatchingPosition}
              className="px-2 py-0.5 rounded bg-rose-800/80 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
          <p className="text-[10px] text-rose-300/90 leading-tight">
            Izinkan akses lokasi pada browser Anda agar Administrator dapat memantau posisi lapangan Anda.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-amber-950/95 backdrop-blur-md border border-amber-500/50 text-amber-200 text-xs shadow-xl">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] leading-tight">
              {errorMessage || 'GPS Tidak Tersedia'}
            </span>
          </div>
          <button
            onClick={startWatchingPosition}
            className="p-1 text-amber-400 hover:text-white"
            title="Coba hubungkan ulang GPS"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
