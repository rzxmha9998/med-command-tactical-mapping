/**
 * Referral Hospital Service
 * Automatically searches up to 3 nearest referral hospitals for risk zones.
 * 
 * Order of operations:
 * 1. Query verified hospital records in Firestore (if available).
 * 2. If < 3 hospitals found, complement via OpenStreetMap Overpass API.
 * 3. Enforce strict in-memory + localStorage caching and request throttling to avoid repeated requests.
 * 4. Coordinate validation and deduplication.
 * 5. Compute straight-line distance (Haversine formula). Never claim road distance or travel time.
 * 6. Honest fallbacks if service is unavailable (no fictitious hospitals).
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config';
import { RiskZone, LatLngPoint } from '../../types';
import { INDONESIA_LOCATION_PRESETS } from '../../constants/presets';

export interface ReferralHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number; // Straight-line distance
  distanceFormatted: string;
  address?: string;
  phone?: string;
  source: 'firestore' | 'osm' | 'preset';
  navigationUrl: string;
}

export interface HospitalSearchResult {
  hospitals: ReferralHospital[];
  status: 'fresh' | 'cached' | 'unavailable';
  sourceSummary: string;
  searchedAt: string;
  zoneId: string;
  centerLat: number;
  centerLng: number;
  searchRadiusKm: number;
  message?: string;
}

// In-memory cache to guarantee fast instantaneous responses without re-fetching
const memoryCache = new Map<string, { result: HospitalSearchResult; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours TTL

// Rate limiting state for external Overpass API requests
let lastOverpassRequestTime = 0;
const MIN_OVERPASS_INTERVAL_MS = 2000; // At least 2s between outgoing Overpass requests

/**
 * Calculates the geographical center/centroid of any RiskZone
 */
export function getZoneCenterCoordinates(zone: RiskZone): LatLngPoint {
  try {
    if (zone.geometryType === 'circle') {
      const parsed = JSON.parse(zone.coordinates);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } else {
      const points = JSON.parse(zone.coordinates) as LatLngPoint[];
      if (Array.isArray(points) && points.length > 0) {
        const sumLat = points.reduce((acc, p) => acc + p.lat, 0);
        const sumLng = points.reduce((acc, p) => acc + p.lng, 0);
        return {
          lat: sumLat / points.length,
          lng: sumLng / points.length,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse zone center coordinates:', e);
  }
  // Fallback to center of Jakarta if parsing fails
  return { lat: -6.175392, lng: 106.827153 };
}

/**
 * Calculates straight-line distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function calculateStraightLineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats distance into a human-readable tactical string
 */
export function formatTacticalDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Generates Google Maps navigation URL for a given destination coordinate
 */
export function createNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * Validates geographical coordinates
 */
export function isValidLatLng(lat: any, lng: any): boolean {
  return (
    typeof lat === 'number' &&
    !isNaN(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === 'number' &&
    !isNaN(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Clean and normalize hospital name for deduplication
 */
function normalizeHospitalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(rsupn|rsup|rsud|rsu|rs|rumah sakit|klinik|hospital)\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Deduplicate hospitals list based on normalized name and proximity (< 150m)
 */
function deduplicateHospitals(list: ReferralHospital[]): ReferralHospital[] {
  const result: ReferralHospital[] = [];

  for (const item of list) {
    const norm = normalizeHospitalName(item.name);
    const isDup = result.some((existing) => {
      const existingNorm = normalizeHospitalName(existing.name);
      if (norm && existingNorm && (norm.includes(existingNorm) || existingNorm.includes(norm))) {
        return true;
      }
      const dist = calculateStraightLineDistance(item.lat, item.lng, existing.lat, existing.lng);
      return dist < 150;
    });

    if (!isDup) {
      result.push(item);
    }
  }

  return result;
}

/**
 * 1. Query Firestore for existing hospital documents
 */
async function queryFirestoreHospitals(
  mapId: string,
  center: LatLngPoint,
  radiusMeters: number
): Promise<ReferralHospital[]> {
  const hospitals: ReferralHospital[] = [];

  // Check subcollection maps/{mapId}/hospitals
  try {
    const snap = await getDocs(collection(db, `maps/${mapId}/hospitals`));
    snap.forEach((doc) => {
      const data = doc.data();
      if (isValidLatLng(data.lat, data.lng) && data.name) {
        const dist = calculateStraightLineDistance(center.lat, center.lng, data.lat, data.lng);
        if (dist <= radiusMeters) {
          hospitals.push({
            id: `fs-map-${doc.id}`,
            name: data.name,
            lat: data.lat,
            lng: data.lng,
            distanceMeters: dist,
            distanceFormatted: formatTacticalDistance(dist),
            address: data.address || undefined,
            phone: data.phone || undefined,
            source: 'firestore',
            navigationUrl: createNavigationUrl(data.lat, data.lng),
          });
        }
      }
    });
  } catch {
    // Subcollection might not exist or empty
  }

  // Check top-level /hospitals collection
  try {
    const rootSnap = await getDocs(collection(db, 'hospitals'));
    rootSnap.forEach((doc) => {
      const data = doc.data();
      if (isValidLatLng(data.lat, data.lng) && data.name) {
        const dist = calculateStraightLineDistance(center.lat, center.lng, data.lat, data.lng);
        if (dist <= radiusMeters) {
          hospitals.push({
            id: `fs-root-${doc.id}`,
            name: data.name,
            lat: data.lat,
            lng: data.lng,
            distanceMeters: dist,
            distanceFormatted: formatTacticalDistance(dist),
            address: data.address || undefined,
            phone: data.phone || undefined,
            source: 'firestore',
            navigationUrl: createNavigationUrl(data.lat, data.lng),
          });
        }
      }
    });
  } catch {
    // Collection might not exist
  }

  // Check known Indonesian presets if they match hospital category
  INDONESIA_LOCATION_PRESETS.forEach((preset) => {
    if (preset.category.toLowerCase().includes('rujukan') || preset.name.toLowerCase().startsWith('rs')) {
      const dist = calculateStraightLineDistance(center.lat, center.lng, preset.lat, preset.lng);
      if (dist <= radiusMeters) {
        hospitals.push({
          id: `preset-${preset.name}`,
          name: preset.name,
          lat: preset.lat,
          lng: preset.lng,
          distanceMeters: dist,
          distanceFormatted: formatTacticalDistance(dist),
          address: preset.category,
          source: 'preset',
          navigationUrl: createNavigationUrl(preset.lat, preset.lng),
        });
      }
    }
  });

  return hospitals;
}

/**
 * 2. Query OpenStreetMap Overpass API for hospitals around center coordinates
 */
async function queryOverpassHospitals(
  center: LatLngPoint,
  radiusMeters: number
): Promise<ReferralHospital[]> {
  // Throttling: wait if another request just happened
  const now = Date.now();
  const timeSinceLast = now - lastOverpassRequestTime;
  if (timeSinceLast < MIN_OVERPASS_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_OVERPASS_INTERVAL_MS - timeSinceLast));
  }
  lastOverpassRequestTime = Date.now();

  const query = `[out:json][timeout:8];(node["amenity"="hospital"](around:${radiusMeters},${center.lat},${center.lng});way["amenity"="hospital"](around:${radiusMeters},${center.lat},${center.lng}););out center 15;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`Overpass API responded with HTTP ${resp.status}`);
      }

      const json = await resp.json();
      if (!Array.isArray(json.elements)) {
        return [];
      }

      const hospitals: ReferralHospital[] = [];

      for (const el of json.elements) {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        const tags = el.tags || {};
        const name = tags.name || tags['name:id'] || tags['name:en'];

        if (name && isValidLatLng(lat, lng)) {
          const dist = calculateStraightLineDistance(center.lat, center.lng, lat, lng);
          if (dist <= radiusMeters) {
            // Build detailed address from tags if available
            const addrParts: string[] = [];
            if (tags['addr:street']) addrParts.push(tags['addr:street']);
            if (tags['addr:city']) addrParts.push(tags['addr:city']);
            const fullAddr = tags['addr:full'] || (addrParts.length > 0 ? addrParts.join(', ') : undefined);

            const phone = tags.phone || tags['contact:phone'] || tags['emergency:phone'];

            hospitals.push({
              id: `osm-${el.type}-${el.id}`,
              name,
              lat,
              lng,
              distanceMeters: dist,
              distanceFormatted: formatTacticalDistance(dist),
              address: fullAddr,
              phone: phone || undefined,
              source: 'osm',
              navigationUrl: createNavigationUrl(lat, lng),
            });
          }
        }
      }

      return hospitals;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      // Continue to next mirror endpoint
    }
  }

  throw lastError || new Error('Semua endpoint Overpass tidak dapat diakses.');
}

/**
 * Local Storage Cache Helper
 */
function getStorageCache(key: string): HospitalSearchResult | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed.data;
    }
    localStorage.removeItem(key);
  } catch {
    // Ignore storage parse issues
  }
  return null;
}

function setStorageCache(key: string, data: HospitalSearchResult): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore quota issues
  }
}

/**
 * Main API: Search up to 3 nearest referral hospitals for a given RiskZone
 * 
 * @param mapId Current tactical map ID
 * @param zone Target risk zone
 * @param searchRadiusKm Configurable coverage radius in kilometers (default 10km)
 * @param forceRefresh Set true to bypass cache and fetch fresh data
 */
export async function searchNearestReferralHospitals(
  mapId: string,
  zone: RiskZone,
  searchRadiusKm: number = 10,
  forceRefresh: boolean = false
): Promise<HospitalSearchResult> {
  const center = getZoneCenterCoordinates(zone);
  const radiusMeters = searchRadiusKm * 1000;
  
  // Coordinate bucket for caching (~100m bucket)
  const cacheKey = `med_rs_cache_${zone.id}_${center.lat.toFixed(3)}_${center.lng.toFixed(3)}_${searchRadiusKm}`;

  // 1. Check memory cache first
  if (!forceRefresh) {
    const memEntry = memoryCache.get(cacheKey);
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
      return {
        ...memEntry.result,
        status: 'cached',
        sourceSummary: 'Cache Memori Lokal',
      };
    }

    // 2. Check localStorage cache
    const storageResult = getStorageCache(cacheKey);
    if (storageResult) {
      memoryCache.set(cacheKey, { result: storageResult, timestamp: Date.now() });
      return {
        ...storageResult,
        status: 'cached',
        sourceSummary: 'Cache Penyimpanan Browser',
      };
    }
  }

  // 3. Step A: Query valid Firestore hospitals first
  let combinedHospitals: ReferralHospital[] = [];
  let isFirestoreSufficient = false;

  try {
    const firestoreHospitals = await queryFirestoreHospitals(mapId, center, radiusMeters);
    combinedHospitals.push(...firestoreHospitals);
    if (combinedHospitals.length >= 3) {
      isFirestoreSufficient = true;
    }
  } catch (err) {
    console.warn('Firestore hospital lookup failed or collection not configured:', err);
  }

  // 4. Step B: If < 3 hospitals, complement with OpenStreetMap Overpass
  let osmStatus: 'fresh' | 'unavailable' = 'fresh';
  let serviceMessage: string | undefined;

  if (!isFirestoreSufficient) {
    try {
      const osmHospitals = await queryOverpassHospitals(center, radiusMeters);
      combinedHospitals.push(...osmHospitals);
    } catch (err: any) {
      console.warn('Overpass API lookup failed:', err);
      osmStatus = 'unavailable';
      serviceMessage =
        'Layanan OpenStreetMap sedang tidak merespons. Sistem tidak menampilkan nama atau koordinat rumah sakit fiktif demi keselamatan.';
    }
  }

  // 5. Deduplicate and sort by distance
  const uniqueHospitals = deduplicateHospitals(combinedHospitals);
  uniqueHospitals.sort((a, b) => a.distanceMeters - b.distanceMeters);

  // Take top 3 candidate hospitals
  const topThree = uniqueHospitals.slice(0, 3);

  // Determine result status
  let finalStatus: 'fresh' | 'cached' | 'unavailable';
  let sourceSummary: string;

  if (topThree.length > 0) {
    finalStatus = isFirestoreSufficient ? 'fresh' : osmStatus === 'fresh' ? 'fresh' : 'cached';
    const sources = Array.from(new Set(topThree.map((h) => h.source)));
    sourceSummary = sources
      .map((s) => (s === 'firestore' ? 'Database Firestore' : s === 'preset' ? 'Pusat Rujukan Nasional' : 'OpenStreetMap Live'))
      .join(' + ');
  } else {
    // Honest messaging if no hospitals found
    finalStatus = osmStatus === 'unavailable' ? 'unavailable' : 'fresh';
    sourceSummary = osmStatus === 'unavailable' ? 'Layanan Tidak Tersedia' : 'Pencarian Selesai';
    if (!serviceMessage) {
      serviceMessage = `Tidak ada rumah sakit rujukan terverifikasi dalam radius cakupan ${searchRadiusKm} km dari titik pusat zona.`;
    }
  }

  const result: HospitalSearchResult = {
    hospitals: topThree,
    status: finalStatus,
    sourceSummary,
    searchedAt: new Date().toISOString(),
    zoneId: zone.id,
    centerLat: center.lat,
    centerLng: center.lng,
    searchRadiusKm,
    message: serviceMessage,
  };

  // Cache results
  memoryCache.set(cacheKey, { result, timestamp: Date.now() });
  setStorageCache(cacheKey, result);

  return result;
}
