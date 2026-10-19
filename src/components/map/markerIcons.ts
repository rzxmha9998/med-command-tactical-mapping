import L from 'leaflet';
import { UnitType, UnitStatus } from '../../types';

// Returns tactical SVG and styling for Leaflet DivIcon
export function createTacticalMarkerIcon(
  type: UnitType,
  status: UnitStatus,
  unitCode: string,
  isSelected: boolean = false
): L.DivIcon {
  // Status indicator colors
  const statusColors = {
    standby: '#10B981', // green
    on_duty: '#F59E0B', // amber
    en_route: '#0284C7', // sky blue
    inactive: '#64748B', // gray
  };
  const dotColor = (statusColors as Record<string, string>)[status] || '#10B981';

  // Type-specific colors and SVG icons
  let bgGradient = 'from-red-600 to-red-800';
  let borderColor = '#EF4444';
  let iconSvg = '';

  if (type === 'ambulance') {
    bgGradient = 'from-rose-600 to-red-800';
    borderColor = '#F87171';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 10H6"/>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 7H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    `;
  } else if (type === 'medical_bike') {
    bgGradient = 'from-cyan-600 to-blue-800';
    borderColor = '#38BDF8';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="15" cy="5" r="1"/>
        <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
      </svg>
    `;
  } else if (type === 'response_bike') {
    bgGradient = 'from-amber-600 to-orange-800';
    borderColor = '#FBBF24';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    `;
  } else {
    bgGradient = 'from-teal-600 to-emerald-800';
    borderColor = '#34D399';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>
      </svg>
    `;
  }

  const selectedRing = isSelected
    ? 'ring-4 ring-[#2A9D8F] shadow-[0_0_20px_rgba(42,157,143,0.8)] scale-110'
    : 'shadow-[0_4px_14px_rgba(0,0,0,0.6)]';

  const pulseEffect = (status === 'standby' || status === 'on_duty' || status === 'en_route')
    ? `<span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#071629] animate-ping opacity-75"></span>`
    : '';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-all duration-200">
      <div class="relative w-10 h-10 rounded-xl bg-gradient-to-br ${bgGradient} border-2 flex items-center justify-center ${selectedRing}" style="border-color: ${borderColor};">
        ${iconSvg}
        ${pulseEffect}
        <span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#071629]"></span>
      </div>
      <!-- Unit Code Tactical Pill -->
      <div class="mt-1 px-1.5 py-0.5 rounded bg-[#071629]/95 border border-[#1E3A5F] text-[10px] font-mono font-bold text-white tracking-wider uppercase whitespace-nowrap shadow-md">
        ${unitCode}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'tactical-unit-marker',
    html,
    iconSize: [44, 56],
    iconAnchor: [22, 54],
    popupAnchor: [0, -50],
  });
}

// Temporary marker when admin is plotting a new unit
export function createDraftPlottingIcon(): L.DivIcon {
  const html = `
    <div class="relative flex flex-col items-center cursor-move">
      <div class="w-11 h-11 rounded-full bg-[#2A9D8F] border-3 border-white flex items-center justify-center shadow-[0_0_25px_rgba(42,157,143,0.9)] animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="mt-1 px-2 py-0.5 rounded bg-[#071629] border border-[#2A9D8F] text-[11px] font-mono text-[#2A9D8F] font-bold shadow-lg">
        GESER POSISI
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'draft-plotting-marker',
    html,
    iconSize: [48, 62],
    iconAnchor: [24, 60],
  });
}

/**
 * Creates a tactical marker icon for live Petugas (Officer) GPS tracking.
 * Distinct visually from vehicles with person badge and pulsing cyan radar beacon.
 */
export function createOfficerGPSMarkerIcon(
  officerName: string,
  isStale: boolean = false
): L.DivIcon {
  const shortName = officerName.length > 14 ? officerName.substring(0, 12) + '...' : officerName;

  const bgGradient = isStale
    ? 'from-slate-600 to-slate-800 border-slate-400'
    : 'from-cyan-500 to-blue-700 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.8)]';

  const dotColor = isStale ? '#94A3B8' : '#06B6D4';

  const pulseBeacon = isStale
    ? ''
    : `<span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#071629] animate-ping opacity-80"></span>`;

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-300">
      <div class="relative w-10 h-10 rounded-full bg-gradient-to-br ${bgGradient} border-2 flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        ${pulseBeacon}
        <span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#071629]"></span>
      </div>
      <!-- Tactical Officer Label Pill -->
      <div class="mt-1 px-1.5 py-0.5 rounded bg-[#071629]/95 border ${isStale ? 'border-slate-700 text-slate-400' : 'border-cyan-500/80 text-cyan-300'} text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap shadow-md">
        ${shortName}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'tactical-officer-gps-marker',
    html,
    iconSize: [52, 60],
    iconAnchor: [26, 54],
    popupAnchor: [0, -50],
  });
}
