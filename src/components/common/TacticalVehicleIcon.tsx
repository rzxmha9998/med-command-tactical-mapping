import React from 'react';
import { UnitType, UnitStatus } from '../../types';

interface TacticalVehicleIconProps {
  type: UnitType;
  status: UnitStatus;
  size?: 'sm' | 'md' | 'lg';
  heading?: number;
  className?: string;
  showRotator?: boolean;
}

/**
 * Returns the CSS class for the rotator lightbar based on unit status
 */
export function getRotatorStatusClass(status: UnitStatus): string {
  switch (status) {
    case 'en_route':
      return 'rotator-active-enroute';
    case 'on_duty':
      return 'rotator-active-onduty';
    case 'standby':
      return 'rotator-active-standby';
    case 'inactive':
    default:
      return 'rotator-inactive';
  }
}

/**
 * SVG markup for Ambulans Gawat Darurat (AGD)
 */
export function getAmbulanceAgdSvg(sizePx: number = 32): string {
  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
      <!-- Van Chassis / Body -->
      <rect x="12" y="6" width="24" height="36" rx="5" fill="#0F172A" stroke="#EF4444" stroke-width="2"/>
      <!-- Cab Windshield (Forward) -->
      <path d="M15 13H33V18C33 19.1 32.1 20 31 20H17C15.9 20 15 19.1 15 18V13Z" fill="#1E293B" stroke="#F87171" stroke-width="1.2"/>
      <!-- Side Mirrors -->
      <rect x="9.5" y="14" width="2.5" height="4" rx="1" fill="#EF4444"/>
      <rect x="36" y="14" width="2.5" height="4" rx="1" fill="#EF4444"/>
      <!-- Red Cross Insignia on Roof -->
      <rect x="22" y="24" width="4" height="12" rx="0.8" fill="#EF4444"/>
      <rect x="18" y="28" width="12" height="4" rx="0.8" fill="#EF4444"/>
      <circle cx="24" cy="30" r="1.5" fill="#FFFFFF"/>
      <!-- Rear Windows -->
      <line x1="16" y1="41" x2="22" y2="41" stroke="#64748B" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="26" y1="41" x2="32" y2="41" stroke="#64748B" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * SVG markup for Ambulans Rujukan
 */
export function getAmbulanceReferralSvg(sizePx: number = 32): string {
  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
      <!-- Van Chassis / Body -->
      <rect x="12" y="6" width="24" height="36" rx="5" fill="#0B1E3B" stroke="#0284C7" stroke-width="2"/>
      <!-- Cab Windshield (Forward) -->
      <path d="M15 13H33V18C33 19.1 32.1 20 31 20H17C15.9 20 15 19.1 15 18V13Z" fill="#1E293B" stroke="#38BDF8" stroke-width="1.2"/>
      <!-- Side Mirrors -->
      <rect x="9.5" y="14" width="2.5" height="4" rx="1" fill="#0284C7"/>
      <rect x="36" y="14" width="2.5" height="4" rx="1" fill="#0284C7"/>
      <!-- Medical Star / Transfer Cross on Roof -->
      <rect x="22" y="24" width="4" height="12" rx="0.8" fill="#0284C7"/>
      <rect x="18" y="28" width="12" height="4" rx="0.8" fill="#0284C7"/>
      <circle cx="24" cy="30" r="3" fill="#38BDF8"/>
      <path d="M22.5 30H25.5M24 28.5V31.5" stroke="#0B1E3B" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Transport Stripe -->
      <line x1="14" y1="38" x2="34" y2="38" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * SVG markup for Motor Medis Reaksi Cepat
 */
export function getMedicalBikeSvg(sizePx: number = 32): string {
  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
      <!-- Front Wheel & Mudguard -->
      <rect x="22" y="5" width="4" height="9" rx="2" fill="#334155" stroke="#38BDF8" stroke-width="1"/>
      <!-- Handlebars & Mirrors -->
      <line x1="13" y1="14" x2="35" y2="14" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="14" r="1.5" fill="#38BDF8"/>
      <circle cx="36" cy="14" r="1.5" fill="#38BDF8"/>
      <!-- Motorcycle Body / Tank -->
      <path d="M21 14H27L28 26C28 28.2 26.2 30 24 30C21.8 30 20 28.2 20 26L21 14Z" fill="#0B2342" stroke="#38BDF8" stroke-width="1.8"/>
      <!-- Medical Saddlebags / Panniers -->
      <rect x="11" y="28" width="6" height="11" rx="1.5" fill="#0F172A" stroke="#EF4444" stroke-width="1.2"/>
      <rect x="31" y="28" width="6" height="11" rx="1.5" fill="#0F172A" stroke="#EF4444" stroke-width="1.2"/>
      <!-- Red Cross on Panniers -->
      <line x1="14" y1="31" x2="14" y2="36" stroke="#EF4444" stroke-width="1.2"/>
      <line x1="12" y1="33.5" x2="16" y2="33.5" stroke="#EF4444" stroke-width="1.2"/>
      <line x1="34" y1="31" x2="34" y2="36" stroke="#EF4444" stroke-width="1.2"/>
      <line x1="32" y1="33.5" x2="36" y2="33.5" stroke="#EF4444" stroke-width="1.2"/>
      <!-- Rear Wheel -->
      <rect x="22" y="32" width="4" height="11" rx="2" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
    </svg>
  `;
}

/**
 * SVG markup for Motor Respons Triase Lapangan
 */
export function getResponseBikeSvg(sizePx: number = 32): string {
  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
      <!-- Front Wheel & Shield -->
      <rect x="22" y="5" width="4" height="9" rx="2" fill="#334155" stroke="#F59E0B" stroke-width="1"/>
      <path d="M19 11L24 6L29 11H19Z" fill="#F59E0B" opacity="0.8"/>
      <!-- Handlebars & Handguards -->
      <line x1="13" y1="15" x2="35" y2="15" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round"/>
      <rect x="11" y="13.5" width="4" height="3" rx="1" fill="#F59E0B"/>
      <rect x="33" y="13.5" width="4" height="3" rx="1" fill="#F59E0B"/>
      <!-- Body & Fuel Cell -->
      <path d="M21 15H27L29 27C29 29 26.8 31 24 31C21.2 31 19 29 19 27L21 15Z" fill="#18181B" stroke="#F59E0B" stroke-width="1.8"/>
      <!-- Rapid Triage Chest (Rear Rack) -->
      <rect x="16" y="30" width="16" height="10" rx="2" fill="#27272A" stroke="#FBBF24" stroke-width="1.4"/>
      <!-- Triage Pulse Icon -->
      <path d="M19 35H21.5L23 32.5L25 37.5L26.5 35H29" stroke="#FBBF24" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Rear Wheel Extension -->
      <rect x="22.5" y="39" width="3" height="5" rx="1.5" fill="#334155"/>
    </svg>
  `;
}

/**
 * SVG markup for Pos Medis Bergerak / Unit Lain
 */
export function getMobileClinicSvg(sizePx: number = 32): string {
  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
      <!-- Tactical Shelter Truck Body -->
      <rect x="9" y="8" width="30" height="34" rx="4" fill="#062823" stroke="#10B981" stroke-width="2"/>
      <!-- Front Cab Windows -->
      <rect x="13" y="11" width="22" height="7" rx="2" fill="#134E4A" stroke="#2DD4BF" stroke-width="1"/>
      <!-- Command Cross / Medical Emblem -->
      <rect x="21" y="22" width="6" height="14" rx="1" fill="#10B981"/>
      <rect x="17" y="26" width="14" height="6" rx="1" fill="#10B981"/>
      <circle cx="24" cy="29" r="2" fill="#FFFFFF"/>
      <!-- Tactical Corner Bumpers -->
      <rect x="7" y="10" width="2" height="6" rx="1" fill="#10B981"/>
      <rect x="39" y="10" width="2" height="6" rx="1" fill="#10B981"/>
      <rect x="7" y="34" width="2" height="6" rx="1" fill="#10B981"/>
      <rect x="39" y="34" width="2" height="6" rx="1" fill="#10B981"/>
    </svg>
  `;
}

/**
 * Returns raw SVG string for any vehicle type
 */
export function getVehicleSvgByType(type: UnitType, sizePx: number = 32): string {
  switch (type) {
    case 'ambulance':
      return getAmbulanceAgdSvg(sizePx);
    case 'ambulance_referral':
      return getAmbulanceReferralSvg(sizePx);
    case 'medical_bike':
      return getMedicalBikeSvg(sizePx);
    case 'response_bike':
      return getResponseBikeSvg(sizePx);
    case 'mobile_clinic':
    case 'other':
    default:
      return getMobileClinicSvg(sizePx);
  }
}

/**
 * HTML string generator for Red-Blue Rotator Lightbar
 */
export function getRotatorLightbarHtml(status: UnitStatus, isCompact: boolean = false): string {
  const rotatorStatusClass = getRotatorStatusClass(status);
  const barWidth = isCompact ? 'w-5 h-1.5' : 'w-7 h-2.5';
  const lampSize = isCompact ? 'w-2 h-1' : 'w-3 h-1.5';

  const isInactive = status === 'inactive';

  return `
    <div class="relative flex items-center justify-center pointer-events-none">
      ${!isInactive ? '<div class="absolute -inset-1 rounded-full bg-blue-500/10 rotator-halo blur-[2px]"></div>' : ''}
      <div class="relative ${barWidth} rounded-sm bg-[#071629] border border-slate-700/80 flex items-center justify-between px-0.5 shadow-sm ${rotatorStatusClass}">
        <!-- Left Strobe: Vivid Red -->
        <span class="lamp-red ${lampSize} rounded-xs ${isInactive ? 'bg-red-950/40 opacity-20' : 'bg-red-600'} transition-all"></span>
        <!-- Center Divider -->
        <span class="w-[1px] h-full bg-slate-800"></span>
        <!-- Right Strobe: Vivid Blue / Sky -->
        <span class="lamp-blue ${lampSize} rounded-xs ${isInactive ? 'bg-blue-950/40 opacity-20' : 'bg-sky-500'} transition-all"></span>
      </div>
    </div>
  `;
}

/**
 * Full HTML generator for Leaflet tactical marker
 */
export function getTacticalMarkerInnerHtml(
  type: UnitType,
  status: UnitStatus,
  unitCode: string,
  heading?: number,
  isSelected: boolean = false
): string {
  const vehicleSvg = getVehicleSvgByType(type, 36);
  const rotatorHtml = getRotatorLightbarHtml(status, false);

  const statusColors: Record<UnitStatus, string> = {
    standby: '#10B981',
    on_duty: '#F59E0B',
    en_route: '#0284C7',
    inactive: '#64748B',
  };
  const dotColor = statusColors[status] || '#10B981';

  const rotationStyle =
    heading !== undefined && heading !== null && !isNaN(heading)
      ? `transform: rotate(${heading}deg); transform-origin: center center;`
      : '';

  const selectedRing = isSelected
    ? 'ring-3 ring-[#2A9D8F] shadow-[0_0_24px_rgba(42,157,143,0.9)] scale-110'
    : 'shadow-[0_4px_16px_rgba(0,0,0,0.7)]';

  const pulseBeacon =
    status !== 'inactive'
      ? `<span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#071629] animate-ping opacity-75"></span>`
      : '';

  return `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-200">
      <!-- Tactical Container with vehicle & rotator -->
      <div class="relative w-11 h-11 rounded-xl bg-[#071629]/95 border border-[#1E3A5F] flex flex-col items-center justify-center ${selectedRing}">
        <!-- Rotator Lightbar Mounted at Top -->
        <div class="absolute -top-2 z-20">
          ${rotatorHtml}
        </div>

        <!-- Vehicle Silhouette SVG (Rotates if heading is available) -->
        <div class="w-8 h-8 flex items-center justify-center transition-transform duration-300" style="${rotationStyle}">
          ${vehicleSvg}
        </div>

        <!-- Status Dot & Pulse -->
        ${pulseBeacon}
        <span style="background-color: ${dotColor};" class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#071629]"></span>
      </div>

      <!-- Tactical Unit Code Pill -->
      <div class="mt-1 px-1.5 py-0.5 rounded bg-[#071629]/95 border border-[#1E3A5F] text-[10px] font-mono font-bold text-white tracking-wider uppercase whitespace-nowrap shadow-md">
        ${unitCode}
      </div>
    </div>
  `;
}

/**
 * Reusable React component for unit cards and dialogs
 */
export const TacticalVehicleCardIcon: React.FC<TacticalVehicleIconProps> = ({
  type,
  status,
  size = 'md',
  heading,
  className = '',
  showRotator = true,
}) => {
  const sizePx = size === 'sm' ? 24 : size === 'lg' ? 40 : 30;
  const containerSize = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';

  const rotatorStatusClass = getRotatorStatusClass(status);
  const isInactive = status === 'inactive';

  const rotationStyle: React.CSSProperties =
    heading !== undefined && heading !== null && !isNaN(heading)
      ? { transform: `rotate(${heading}deg)`, transformOrigin: 'center center', transition: 'transform 0.3s ease' }
      : {};

  const statusColors: Record<UnitStatus, string> = {
    standby: 'bg-emerald-500',
    on_duty: 'bg-amber-500',
    en_route: 'bg-sky-500',
    inactive: 'bg-slate-500',
  };

  return (
    <div
      className={`relative rounded-xl bg-[#071629] border border-[#1E3A5F] flex flex-col items-center justify-center shrink-0 shadow-md ${containerSize} ${className}`}
    >
      {/* Rotator Lightbar */}
      {showRotator && (
        <div className="absolute -top-1.5 z-10 pointer-events-none">
          <div
            className={`w-5 h-1.5 rounded-xs bg-[#071629] border border-slate-700/80 flex items-center justify-between px-0.5 shadow-sm ${rotatorStatusClass}`}
          >
            <span
              className={`w-1.5 h-1 rounded-xs ${
                isInactive ? 'bg-red-950/40 opacity-20' : 'bg-red-600 lamp-red'
              }`}
            />
            <span className="w-[1px] h-full bg-slate-800" />
            <span
              className={`w-1.5 h-1 rounded-xs ${
                isInactive ? 'bg-blue-950/40 opacity-20' : 'bg-sky-500 lamp-blue'
              }`}
            />
          </div>
        </div>
      )}

      {/* Vehicle SVG */}
      <div
        className="flex items-center justify-center"
        style={rotationStyle}
        dangerouslySetInnerHTML={{ __html: getVehicleSvgByType(type, sizePx) }}
      />

      {/* Status Dot */}
      <span
        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#071629] ${
          statusColors[status] || 'bg-slate-500'
        }`}
      />
    </div>
  );
};
