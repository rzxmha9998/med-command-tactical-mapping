import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { MapAccessRequest, TacticalMap } from '../../types';
import { cleanFirestorePayload } from '../utils/sanitize';

const ACCESS_REQUESTS_COLLECTION = 'accessRequests';
const MAPS_COLLECTION = 'maps';
const USERS_COLLECTION = 'users';

export interface CreateAccessRequestParams {
  mapId: string;
  mapName: string;
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  };
  requestNote?: string;
}

/**
 * Safely parses any Firestore timestamp (Timestamp instance, seconds, ISO string, or number) into milliseconds.
 */
export function getRequestMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  if (typeof val === 'string') {
    const d = new Date(val).getTime();
    return isNaN(d) ? 0 : d;
  }
  return 0;
}

/**
 * Formats a Firestore date/timestamp into Indonesian locale string safely.
 */
export function formatFirestoreDate(val: any): string {
  if (!val) return '-';
  try {
    let date: Date;
    if (typeof val === 'string') {
      date = new Date(val);
    } else if (typeof val.toDate === 'function') {
      date = val.toDate();
    } else if (val.seconds) {
      date = new Date(val.seconds * 1000);
    } else if (typeof val === 'number') {
      date = new Date(val);
    } else {
      date = new Date(val);
    }
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Normalizes document snapshot data into a standardized MapAccessRequest object.
 */
function normalizeAccessRequest(docId: string, data: any): MapAccessRequest {
  const officerUid = data.officerUid || data.userId || '';
  const officerName = data.officerName || data.userName || 'Petugas Medis';
  const officerEmail = data.officerEmail || data.userEmail || '';
  return {
    id: docId,
    officerUid,
    userId: officerUid,
    officerName,
    userName: officerName,
    officerEmail,
    userEmail: officerEmail,
    mapId: data.mapId || '',
    mapName: data.mapName || 'Peta Operasional',
    status: data.status || 'pending',
    requestNote: data.requestNote || '',
    reviewedBy: data.reviewedBy,
    reviewedByEmail: data.reviewedByEmail,
    reviewedAt: data.reviewedAt,
    rejectReason: data.rejectReason,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Creates or re-submits a map access request for an officer
 */
export async function createAccessRequest(
  params: CreateAccessRequestParams
): Promise<string> {
  const { mapId, mapName, user, requestNote } = params;
  if (!user || !user.uid) {
    throw new Error('Pengguna tidak terautentikasi.');
  }
  if (!mapId || !mapId.trim()) {
    throw new Error('ID Peta wajib disertakan.');
  }

  // Consistent stable doc ID: `${officerUid}_${mapId}` strictly prevents race duplicates
  const docId = `${user.uid}_${mapId}`;
  const docRef = doc(db, ACCESS_REQUESTS_COLLECTION, docId);

  // Check if active pending request already exists
  try {
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      const existing = existingSnap.data() as MapAccessRequest;
      if (existing.status === 'pending') {
        throw new Error('Permintaan akses ke peta ini sudah diajukan dan sedang menunggu persetujuan Admin.');
      }
      if (existing.status === 'approved') {
        throw new Error('Anda sudah memiliki izin akses ke peta operasional ini.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('sudah')) {
      throw err;
    }
  }

  const rawRequest = {
    id: docId,
    officerUid: user.uid,
    userId: user.uid, // backward compatible
    officerName: user.displayName || user.email?.split('@')[0] || 'Petugas Medis',
    userName: user.displayName || user.email?.split('@')[0] || 'Petugas Medis', // backward compatible
    officerEmail: user.email || '',
    userEmail: user.email || '', // backward compatible
    mapId,
    mapName,
    status: 'pending' as const,
    requestNote: requestNote?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cleaned = cleanFirestorePayload(rawRequest);

  try {
    await setDoc(docRef, cleaned);
    console.info(`[MED-COMMAND Access] Request submitted successfully: ${docId}`);
    return docId;
  } catch (error: any) {
    console.error(`[MED-COMMAND Access] Submit error:`, error?.code, error?.message);
    handleFirestoreError(error, OperationType.CREATE, `${ACCESS_REQUESTS_COLLECTION}/${docId}`);
    throw error;
  }
}

/**
 * Re-submits a previously rejected access request
 */
export async function reRequestAccess(
  requestId: string,
  requestNote?: string
): Promise<void> {
  const docRef = doc(db, ACCESS_REQUESTS_COLLECTION, requestId);
  const updates: Record<string, any> = {
    status: 'pending',
    updatedAt: serverTimestamp(),
  };
  if (requestNote !== undefined) {
    updates.requestNote = requestNote.trim();
  }

  try {
    await updateDoc(docRef, cleanFirestorePayload(updates));
    console.info(`[MED-COMMAND Access] Request re-submitted: ${requestId}`);
  } catch (error: any) {
    console.error(`[MED-COMMAND Access] Re-request error:`, error?.code, error?.message);
    handleFirestoreError(error, OperationType.UPDATE, `${ACCESS_REQUESTS_COLLECTION}/${requestId}`);
    throw error;
  }
}

/**
 * Subscribes to access requests submitted by a specific officer (real-time)
 */
export function subscribeOfficerRequests(
  userId: string,
  onUpdate: (requests: MapAccessRequest[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, ACCESS_REQUESTS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests: MapAccessRequest[] = [];
      snapshot.forEach((d) => {
        requests.push(normalizeAccessRequest(d.id, d.data()));
      });
      // Client-side sort descending by createdAt
      requests.sort((a, b) => getRequestMillis(b.createdAt) - getRequestMillis(a.createdAt));
      onUpdate(requests);
    },
    (error) => {
      console.error('[MED-COMMAND Access] Error subscribing to officer requests:', error?.code, error?.message);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, ACCESS_REQUESTS_COLLECTION);
    }
  );
}

/**
 * Subscribes to all access requests for the Admin dashboard (real-time)
 * Uses direct collection reference and client-side sorting to eliminate composite index crashes
 * and ensure immediate reactivity even with pending serverTimestamp values.
 */
export function subscribeAllAccessRequests(
  onUpdate: (requests: MapAccessRequest[]) => void,
  onError?: (err: any) => void
) {
  const q = collection(db, ACCESS_REQUESTS_COLLECTION);

  return onSnapshot(
    q,
    (snapshot) => {
      const requests: MapAccessRequest[] = [];
      snapshot.forEach((d) => {
        requests.push(normalizeAccessRequest(d.id, d.data()));
      });
      // Resilient client-side sort
      requests.sort((a, b) => getRequestMillis(b.createdAt) - getRequestMillis(a.createdAt));
      onUpdate(requests);
    },
    (error) => {
      console.error('[MED-COMMAND Access] Error subscribing to all access requests:', error?.code, error?.message);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, ACCESS_REQUESTS_COLLECTION);
    }
  );
}

/**
 * Approves an access request atomically:
 * 1. Adds officer UID to map's allowedOfficerIds array.
 * 2. Adds mapId to user's allowedMapIds array.
 * 3. Updates access request status to 'approved' with admin audit info.
 */
export async function approveAccessRequest(
  request: MapAccessRequest,
  adminUser: { uid: string; email?: string | null },
  targetMapId?: string
): Promise<void> {
  const targetOfficerUid = request.officerUid || request.userId;
  if (!targetOfficerUid) {
    throw new Error('UID Petugas tidak ditemukan.');
  }

  const finalMapId = targetMapId || request.mapId;
  const mapDocRef = doc(db, MAPS_COLLECTION, finalMapId);
  const userDocRef = doc(db, USERS_COLLECTION, targetOfficerUid);
  const reqDocRef = doc(db, ACCESS_REQUESTS_COLLECTION, request.id);

  const batch = writeBatch(db);

  // 1. Grant access on Map document
  batch.update(mapDocRef, {
    allowedOfficerIds: arrayUnion(targetOfficerUid),
    updatedAt: serverTimestamp(),
  });

  // 2. Grant access on User Profile document
  batch.update(userDocRef, {
    allowedMapIds: arrayUnion(finalMapId),
    updatedAt: serverTimestamp(),
  });

  // 3. Mark request as approved with Admin audit trail
  batch.update(reqDocRef, {
    status: 'approved',
    mapId: finalMapId,
    reviewedBy: adminUser.uid,
    reviewedByEmail: adminUser.email || '',
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    console.info(
      `[MED-COMMAND Access] Approved request ${request.id} for officer ${targetOfficerUid} on map ${finalMapId}`
    );
  } catch (error: any) {
    console.error('[MED-COMMAND Access] Approval transaction failed:', error?.code, error?.message);
    handleFirestoreError(error, OperationType.UPDATE, `${ACCESS_REQUESTS_COLLECTION}/${request.id}`);
    throw error;
  }
}

/**
 * Rejects an access request with review info
 */
export async function rejectAccessRequest(
  requestId: string,
  adminUser: { uid: string; email?: string | null },
  reason?: string
): Promise<void> {
  const reqDocRef = doc(db, ACCESS_REQUESTS_COLLECTION, requestId);

  try {
    await updateDoc(reqDocRef, {
      status: 'rejected',
      reviewedBy: adminUser.uid,
      reviewedByEmail: adminUser.email || '',
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(reason ? { rejectReason: reason.trim() } : {}),
    });
    console.info(`[MED-COMMAND Access] Rejected request ${requestId} by admin ${adminUser.uid}`);
  } catch (error: any) {
    console.error(`[MED-COMMAND Access] Rejection error:`, error?.code, error?.message);
    handleFirestoreError(error, OperationType.UPDATE, `${ACCESS_REQUESTS_COLLECTION}/${requestId}`);
    throw error;
  }
}

/**
 * Subscribes to all active tactical maps in real-time so officers can see available sectors
 */
export function subscribeAvailableMaps(
  onUpdate: (maps: TacticalMap[]) => void,
  onError?: (err: Error) => void
) {
  const q = collection(db, MAPS_COLLECTION);

  return onSnapshot(
    q,
    (snapshot) => {
      const maps: TacticalMap[] = [];
      snapshot.forEach((d) => {
        const m = d.data() as TacticalMap;
        if (m.status === 'active') {
          maps.push({ ...m, id: d.id });
        }
      });
      // Sort client-side
      maps.sort((a, b) => getRequestMillis(b.createdAt) - getRequestMillis(a.createdAt));
      onUpdate(maps);
    },
    (error) => {
      console.error('[MED-COMMAND Access] Error subscribing to available maps:', error?.code, error?.message);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, MAPS_COLLECTION);
    }
  );
}
