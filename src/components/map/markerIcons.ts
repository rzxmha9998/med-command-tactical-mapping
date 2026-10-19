import L from 'leaflet';
import { UnitType, UnitStatus } from '../../types';
import { getTacticalMarkerInnerHtml } from '../common/TacticalVehicleIcon';

/**
 * Returns tactical Leaflet DivIcon with built-in vehicle SVG,
 * realistic red-blue emergency rotator lightbar, status dot, and GPS heading rotation.
 */
export function createTacticalMarkerIcon(
  type: UnitType,
  status: UnitStatus,
  unitCode: string,
  isSelected: boolean = false,
  heading?: number
): L.DivIcon {
  const html = getTacticalMarkerInnerHtml(type, status, unitCode, heading, isSelected);

  return L.divIcon({
    className: 'tactical-unit-marker',
    html,
    iconSize: [46, 58],
    iconAnchor: [23, 56],
    popupAnchor: [0, -52],
  });
}

/**
 * Temporary marker when admin is plotting a new unit
 */
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
 * Distinct visually from vehicles with person badge, pulsing cyan radar beacon,
 * and optional directional orientation arrow if GPS heading is provided.
 */
export function createOfficerGPSMarkerIcon(
  officerName: string,
  isStale: boolean = false,
  heading?: number | null
): L.DivIcon {
  const shortName = officerName.length > 14 ? officerName.substring(0, 12) + '...' : officerName;

  const bgGradient = isStale
    ? 'from-slate-600 to-slate-800 border-slate-400'
    : 'from-cyan-500 to-blue-700 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.8)]';

  const dotColor = isStale ? '#94A3B8' : '#06B6D4';

  const pulseBeacon = isStale
    ? ''
    : `<span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#071629] animate-ping opacity-80"></span>`;

  // Optional directional pointer if heading is known
  const hasHeading = heading !== undefined && heading !== null && !isNaN(heading);
  const headingArrow =
    hasHeading && !isStale
      ? `
        <div class="absolute -top-3 w-3 h-3 flex items-center justify-center transition-transform duration-300" style="transform: rotate(${heading}deg); transform-origin: center 20px;">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L10.5 11L6 8.5L1.5 11L6 1Z" fill="#38BDF8" stroke="#071629" stroke-width="1.2"/>
          </svg>
        </div>
      `
      : '';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-300">
      ${headingArrow}
      <div class="relative w-10 h-10 rounded-full bg-gradient-to-br ${bgGradient} border-2 flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        ${pulseBeacon}
        <span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#071629]"></span>
      </div>
      <!-- Tactical Officer Label Pill -->
      <div class="mt-1 px-1.5 py-0.5 rounded bg-[#071629]/95 border ${
        isStale ? 'border-slate-700 text-slate-400' : 'border-cyan-500/80 text-cyan-300'
      } text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap shadow-md">
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
