import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { MedicalUnit } from '../../types';

export function getUnitsCollectionPath(mapId: string) {
  return `maps/${mapId}/units`;
}

export async function createUnit(mapId: string, data: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = getUnitsCollectionPath(mapId);
  const unitDocRef = doc(collection(db, path));
  const newUnit: MedicalUnit = {
    ...data,
    id: unitDocRef.id,
    mapId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(unitDocRef, newUnit);
    return unitDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${unitDocRef.id}`);
  }
}

export async function updateUnit(
  mapId: string,
  unitId: string,
  updates: Partial<Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt'>>
): Promise<void> {
  const path = getUnitsCollectionPath(mapId);
  const unitDocRef = doc(db, path, unitId);
  try {
    await updateDoc(unitDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${unitId}`);
  }
}

export async function deleteUnit(mapId: string, unitId: string): Promise<void> {
  const path = getUnitsCollectionPath(mapId);
  const unitDocRef = doc(db, path, unitId);
  try {
    await deleteDoc(unitDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${unitId}`);
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
  }
}
