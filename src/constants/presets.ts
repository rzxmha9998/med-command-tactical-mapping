import { UnitType, UnitStatus, ZoneType, GeometryType } from '../types';

export interface LocationPreset {
  name: string;
  category: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const INDONESIA_LOCATION_PRESETS: LocationPreset[] = [
  {
    name: 'Monas & Istana Negara (Jakarta Pusat)',
    category: 'Pusat Pemerintahan',
    lat: -6.175392,
    lng: 106.827153,
    zoom: 16,
  },
  {
    name: 'Gelora Bung Karno (GBK Senayan)',
    category: 'Kawasan Olahraga & Massa',
    lat: -6.218525,
    lng: 106.801815,
    zoom: 16,
  },
  {
    name: 'RSUPN Dr. Cipto Mangunkusumo (RSCM)',
    category: 'Pusat Rujukan Nasional',
    lat: -6.196924,
    lng: 106.848529,
    zoom: 17,
  },
  {
    name: 'Bundaran HI - Koridor Thamrin/Sudirman',
    category: 'Jalur Protokol VVIP',
    lat: -6.194951,
    lng: 106.823126,
    zoom: 16,
  },
  {
    name: 'Gedung Sate & Gasibu (Bandung)',
    category: 'Jawa Barat',
    lat: -6.902476,
    lng: 107.618776,
    zoom: 16,
  },
  {
    name: 'Tugu Pahlawan (Surabaya)',
    category: 'Jawa Timur',
    lat: -7.245842,
    lng: 112.737831,
    zoom: 16,
  },
  {
    name: 'Lapangan Renon (Denpasar Bali)',
    category: 'Bali / Nusra',
    lat: -8.672535,
    lng: 115.234032,
    zoom: 16,
  },
];

export const UNIT_TYPES: { id: UnitType; label: string; shortLabel: string; description: string; icon: string }[] = [
  {
    id: 'ambulance',
    label: 'Ambulans Gawat Darurat (AGD)',
    shortLabel: 'Ambulans AGD',
    description: 'Unit ambulans advance/basic life support lengkap dengan brankar, oksigen, dan defibrillator',
    icon: 'Ambulance',
  },
  {
    id: 'ambulance_referral',
    label: 'Ambulans Rujukan',
    shortLabel: 'Ambulans Rujukan',
    description: 'Unit transportasi dan evakuasi rujukan medis pasien antar pos/rumah sakit',
    icon: 'Ambulance',
  },
  {
    id: 'medical_bike',
    label: 'Motor Medis Reaksi Cepat',
    shortLabel: 'Motor Medis',
    description: 'Unit roda dua medis taktis untuk penetrasi cepat menembus kemacetan dan kerumunan massa',
    icon: 'Bike',
  },
  {
    id: 'response_bike',
    label: 'Motor Respons Triase',
    shortLabel: 'Motor Respons',
    description: 'Unit perintis triase lapangan, asesmen awal korban gawat darurat di lokasi bencana/insiden',
    icon: 'Zap',
  },
  {
    id: 'other',
    label: 'Pos Medis Bergerak',
    shortLabel: 'Pos Medis',
    description: 'Pos aju medis lapangan bergerak, tenda triase terpadu, atau posko evakuasi statis',
    icon: 'Cross',
  },
];

export const UNIT_STATUSES: { id: UnitStatus; label: string; badgeClass: string; dotClass: string }[] = [
  {
    id: 'standby',
    label: 'Siaga (Standby)',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  {
    id: 'on_duty',
    label: 'Bertugas (On Duty)',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'en_route',
    label: 'Dalam Perjalanan (En Route)',
    badgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    dotClass: 'bg-sky-500',
  },
  {
    id: 'inactive',
    label: 'Tidak Aktif (Inactive)',
    badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    dotClass: 'bg-slate-500',
  },
];

export const ZONE_CONFIG: Record<
  ZoneType,
  {
    label: string;
    subLabel: string;
    fillColor: string;
    borderColor: string;
    textColor: string;
    bgBadge: string;
    description: string;
  }
> = {
  red: {
    label: 'ZONA MERAH',
    subLabel: 'Risiko Tinggi / Area Panas',
    fillColor: '#EF4444',
    borderColor: '#DC2626',
    textColor: 'text-red-400',
    bgBadge: 'bg-red-500/15 text-red-400 border-red-500/40',
    description: 'Area berbahaya tingkat tinggi, paparan ancaman langsung, evakuasi prioritas utama.',
  },
  yellow: {
    label: 'ZONA KUNING',
    subLabel: 'Risiko Sedang / Kewaspadaan',
    fillColor: '#FACC15',
    borderColor: '#CA8A04',
    textColor: 'text-yellow-400',
    bgBadge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    description: 'Area dengan risiko sedang, pos triase sekunder, atau perimeter penyangga.',
  },
  green: {
    label: 'ZONA HIJAU',
    subLabel: 'Risiko Rendah / Area Aman',
    fillColor: '#22C55E',
    borderColor: '#16A34A',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    description: 'Area aman terverifikasi, pos komando medis utama, evakuasi lanjutan, landing zone.',
  },
};
