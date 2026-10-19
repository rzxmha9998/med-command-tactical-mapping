/**
 * MED-COMMAND Tactical Medical Mapping Types
 */

export type UserRole = 'admin' | 'officer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  allowedMapIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export type UnitType = 'ambulance' | 'medical_bike' | 'response_bike' | 'other';
export type UnitStatus = 'standby' | 'on_duty' | 'en_route' | 'inactive';

export interface MedicalUnit {
  id: string;
  mapId: string;
  name: string;
  unitCode: string;
  callsign?: string;
  type: UnitType;
  status: UnitStatus;
  lat: number;
  lng: number;
  zoneId?: string;
  zoneName?: string;
  crewNames?: string;
  hospitalReferral?: string;
  notes?: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ZoneType = 'red' | 'yellow' | 'green';
export type GeometryType = 'polygon' | 'circle' | 'rectangle';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RiskZone {
  id: string;
  mapId: string;
  name: string;
  zoneType: ZoneType;
  geometryType: GeometryType;
  coordinates: string; // JSON serialized string of LatLngPoint[] or center LatLngPoint
  radius?: number; // In meters, for circle
  riskLevel: string; // e.g. 'Tinggi - Evakuasi Segera', 'Sedang - Siaga', 'Aman - Pos Aju'
  description?: string;
  notes?: string;
  color?: string; // e.g. #EF4444, #FACC15, #22C55E
  isActive?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MapStatus = 'active' | 'archived';

export interface TacticalMap {
  id: string;
  name: string;
  description?: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  status: MapStatus;
  allowedOfficerIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  agencyName?: string;
  operationTitle?: string;
  updatedAt?: string;
}

export interface MapStats {
  totalMaps: number;
  totalAmbulances: number;
  totalMedicalBikes: number;
  totalResponseUnits: number;
  totalOtherUnits: number;
  totalRedZones: number;
  totalYellowZones: number;
  totalGreenZones: number;
  totalOfficers: number;
}

export type BaseMapLayer = 'osm' | 'night' | 'satellite' | 'humanitarian';
