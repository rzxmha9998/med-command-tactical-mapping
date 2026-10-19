import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { MedicalUnit } from '../../types';
import { cleanFirestorePayload, validateMedicalUnitPayload } from '../utils/sanitize';

export function getUnitsCollectionPath(mapId: string) {
  return `maps/${mapId}/units`;
}

export interface UnitOperationResult {
  id: string;
  durationMs: number;
}

/**
 * Creates a timeout promise to prevent infinite waiting on Firestore operations
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Operasi Firestore "${operationName}" melebihi batas waktu (${Math.round(
                timeoutMs / 1000
              )} detik). Silakan coba lagi.`
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

export async function createUnit(
  mapId: string,
  data: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>,
  options?: { timeoutMs?: number }
): Promise<UnitOperationResult> {
  const startTime = performance.now();
  const validation = validateMedicalUnitPayload(data);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Data unit medis tidak valid.');
  }

  const path = getUnitsCollectionPath(mapId);
  const unitDocRef = doc(collection(db, path));
  
  const rawUnit: MedicalUnit = {
    ...data,
    id: unitDocRef.id,
    mapId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Strip all undefined fields recursively
  const cleanedUnit = cleanFirestorePayload(rawUnit);
  const timeoutMs = options?.timeoutMs ?? 20000;

  try {
    await withTimeout(setDoc(unitDocRef, cleanedUnit), timeoutMs, 'createUnit');
    const durationMs = performance.now() - startTime;
    console.info(`[MED-COMMAND UnitService] createUnit completed in ${durationMs.toFixed(2)} ms for unit ${unitDocRef.id}`);
    return { id: unitDocRef.id, durationMs };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${unitDocRef.id}`);
    throw error;
  }
}

export async function updateUnit(
  mapId: string,
  unitId: string,
  updates: Partial<Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt'>>,
  options?: { timeoutMs?: number }
): Promise<{ durationMs: number }> {
  const startTime = performance.now();
  if (!unitId || !unitId.trim()) {
    throw new Error('ID Unit wajib disertakan untuk memperbarui data.');
  }

  const path = getUnitsCollectionPath(mapId);
  const unitDocRef = doc(db, path, unitId);

  const rawUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const cleanedUpdates = cleanFirestorePayload(rawUpdates);
  const timeoutMs = options?.timeoutMs ?? 20000;

  try {
    await withTimeout(updateDoc(unitDocRef, cleanedUpdates), timeoutMs, 'updateUnit');
    const durationMs = performance.now() - startTime;
    console.info(`[MED-COMMAND UnitService] updateUnit completed in ${durationMs.toFixed(2)} ms for unit ${unitId}`);
    return { durationMs };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${unitId}`);
    throw error;
  }
}

export async function deleteUnit(mapId: string, unitId: string): Promise<void> {
  const path = getUnitsCollectionPath(mapId);
  const unitDocRef = doc(db, path, unitId);
  try {
    await deleteDoc(unitDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${unitId}`);
    throw error;
  }
}

export function subscribeUnits(
  mapId: string,
  onUpdate: (units: MedicalUnit[]) => void,
  onError?: (err: Error) => void
) {
  const path = getUnitsCollectionPath(mapId);
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const units: MedicalUnit[] = [];
      snapshot.forEach((doc) => {
        units.push(doc.data() as MedicalUnit);
      });
      units.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(units);
    },
    (error) => {
      console.error(`Error subscribing to units on map ${mapId}:`, error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getUnitsForMap(mapId: string): Promise<MedicalUnit[]> {
  const path = getUnitsCollectionPath(mapId);
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as MedicalUnit);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}
