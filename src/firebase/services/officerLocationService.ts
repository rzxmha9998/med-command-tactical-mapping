import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { OfficerLocation, GPSStatus } from '../../types';
import { handleFirestoreError, OperationType } from '../error';
import { cleanFirestorePayload } from '../utils/sanitize';

export const OFFICER_LOCATIONS_COLLECTION = 'officerLocations';

export interface UpdateOfficerLocationPayload {
  officerUid: string;
  officerName: string;
  officerEmail: string;
  mapId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  status: GPSStatus;
}

/**
 * Calculates distance between two lat/lng coordinates in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Checks if a location timestamp is older than the max age threshold (default 5 minutes).
 */
export function isLocationStale(updatedAt: any, maxAgeMs: number = 300000): boolean {
  if (!updatedAt) return true;
  let timestampMs = 0;
  if (typeof updatedAt === 'number') {
    timestampMs = updatedAt;
  } else if (typeof updatedAt.toMillis === 'function') {
    timestampMs = updatedAt.toMillis();
  } else if (typeof updatedAt.toDate === 'function') {
    timestampMs = updatedAt.toDate().getTime();
  } else if (updatedAt.seconds) {
    timestampMs = updatedAt.seconds * 1000;
  } else if (typeof updatedAt === 'string') {
    timestampMs = new Date(updatedAt).getTime();
  }
  if (!timestampMs || isNaN(timestampMs)) return true;
  return Date.now() - timestampMs > maxAgeMs;
}

/**
 * Updates an officer's live GPS telemetry position in Firestore.
 */
export async function updateOfficerLocation(payload: UpdateOfficerLocationPayload): Promise<void> {
  if (!payload.officerUid) {
    throw new Error('UID Petugas wajib disertakan.');
  }

  const docRef = doc(db, OFFICER_LOCATIONS_COLLECTION, payload.officerUid);
  const data = cleanFirestorePayload({
    id: payload.officerUid,
    officerUid: payload.officerUid,
    officerName: payload.officerName || 'Petugas Medis',
    officerEmail: payload.officerEmail || '',
    mapId: payload.mapId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    accuracy: payload.accuracy,
    heading: payload.heading,
    speed: payload.speed,
    status: payload.status,
    updatedAt: serverTimestamp(),
  });

  try {
    await setDoc(docRef, data, { merge: true });
  } catch (error: any) {
    console.error(`[MED-COMMAND GPS] Error updating location for ${payload.officerUid}:`, error?.code, error?.message);
    handleFirestoreError(error, OperationType.UPDATE, `${OFFICER_LOCATIONS_COLLECTION}/${payload.officerUid}`);
    throw error;
  }
}

/**
 * Removes an officer's location document (e.g. on logout or map departure).
 */
export async function removeOfficerLocation(officerUid: string): Promise<void> {
  if (!officerUid) return;
  const docRef = doc(db, OFFICER_LOCATIONS_COLLECTION, officerUid);
  try {
    await deleteDoc(docRef);
    console.info(`[MED-COMMAND GPS] Cleared location for officer ${officerUid}`);
  } catch (error: any) {
    console.warn(`[MED-COMMAND GPS] Non-blocking clear location warning:`, error?.code, error?.message);
  }
}

/**
 * Real-time subscription to all officer GPS coordinates for a specific operational map.
 */
export function subscribeOfficerLocations(
  mapId: string,
  onUpdate: (locations: OfficerLocation[]) => void,
  onError?: (err: any) => void
) {
  if (!mapId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, OFFICER_LOCATIONS_COLLECTION),
    where('mapId', '==', mapId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const locations: OfficerLocation[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          locations.push({
            id: d.id,
            officerUid: data.officerUid || d.id,
            officerName: data.officerName || 'Petugas Medis',
            officerEmail: data.officerEmail || '',
            mapId: data.mapId || mapId,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy || 0,
            heading: data.heading ?? null,
            speed: data.speed ?? null,
            status: data.status || 'active',
            updatedAt: data.updatedAt,
          });
        }
      });
      onUpdate(locations);
    },
    (error) => {
      console.error('[MED-COMMAND GPS] Error subscribing to officer locations:', error?.code, error?.message);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, OFFICER_LOCATIONS_COLLECTION);
    }
  );
}
