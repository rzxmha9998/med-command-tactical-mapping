import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { TacticalMap, UserRole } from '../../types';

import { cleanFirestorePayload } from '../utils/sanitize';

const MAPS_COLLECTION = 'maps';

export async function createMap(data: Omit<TacticalMap, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const mapDocRef = doc(collection(db, MAPS_COLLECTION));
  const newMap: TacticalMap = {
    ...data,
    id: mapDocRef.id,
    allowedOfficerIds: data.allowedOfficerIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const cleanedMap = cleanFirestorePayload(newMap);

  try {
    await setDoc(mapDocRef, cleanedMap);
    return mapDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MAPS_COLLECTION}/${mapDocRef.id}`);
    throw error;
  }
}

export async function updateMap(mapId: string, updates: Partial<Omit<TacticalMap, 'id' | 'createdAt'>>): Promise<void> {
  const mapDocRef = doc(db, MAPS_COLLECTION, mapId);
  const cleanedUpdates = cleanFirestorePayload({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  try {
    await updateDoc(mapDocRef, cleanedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${MAPS_COLLECTION}/${mapId}`);
    throw error;
  }
}

export async function deleteMap(mapId: string): Promise<void> {
  try {
    // Delete units subcollection
    const unitsSnap = await getDocs(collection(db, `${MAPS_COLLECTION}/${mapId}/units`));
    const batch = writeBatch(db);
    unitsSnap.forEach(d => batch.delete(d.ref));

    // Delete riskZones subcollection
    const zonesSnap = await getDocs(collection(db, `${MAPS_COLLECTION}/${mapId}/riskZones`));
    zonesSnap.forEach(d => batch.delete(d.ref));

    // Delete map doc
    batch.delete(doc(db, MAPS_COLLECTION, mapId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MAPS_COLLECTION}/${mapId}`);
  }
}

export async function duplicateMap(sourceMapId: string, newName: string, createdBy: string): Promise<string> {
  const mapDocRef = doc(db, MAPS_COLLECTION, sourceMapId);
  try {
    const snap = await getDoc(mapDocRef);
    if (!snap.exists()) {
      throw new Error('Peta sumber tidak ditemukan');
    }
    const sourceData = snap.data() as TacticalMap;
    const newMapId = doc(collection(db, MAPS_COLLECTION)).id;

    const duplicatedMap: TacticalMap = {
      ...sourceData,
      id: newMapId,
      name: newName,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, MAPS_COLLECTION, newMapId), cleanFirestorePayload(duplicatedMap));

    // Duplicate units
    const unitsSnap = await getDocs(collection(db, `${MAPS_COLLECTION}/${sourceMapId}/units`));
    for (const uDoc of unitsSnap.docs) {
      const uData = uDoc.data();
      const newUnitRef = doc(collection(db, `${MAPS_COLLECTION}/${newMapId}/units`));
      await setDoc(newUnitRef, cleanFirestorePayload({
        ...uData,
        id: newUnitRef.id,
        mapId: newMapId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    // Duplicate risk zones
    const zonesSnap = await getDocs(collection(db, `${MAPS_COLLECTION}/${sourceMapId}/riskZones`));
    for (const zDoc of zonesSnap.docs) {
      const zData = zDoc.data();
      const newZoneRef = doc(collection(db, `${MAPS_COLLECTION}/${newMapId}/riskZones`));
      await setDoc(newZoneRef, cleanFirestorePayload({
        ...zData,
        id: newZoneRef.id,
        mapId: newMapId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    return newMapId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MAPS_COLLECTION}/${sourceMapId}`);
  }
}

export function subscribeMaps(
  userRole: UserRole,
  userId: string,
  onUpdate: (maps: TacticalMap[]) => void,
  onError?: (err: Error) => void
) {
  const mapsCol = collection(db, MAPS_COLLECTION);
  let q = query(mapsCol);

  // If officer, query only maps where allowedOfficerIds array-contains userId
  if (userRole === 'officer') {
    q = query(mapsCol, where('allowedOfficerIds', 'array-contains', userId));
  } else {
    q = query(mapsCol, orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const maps: TacticalMap[] = [];
      snapshot.forEach((doc) => {
        maps.push(doc.data() as TacticalMap);
      });
      // Sort client-side by createdAt descending
      maps.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(maps);
    },
    (error) => {
      console.error('Error subscribing to maps:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, MAPS_COLLECTION);
    }
  );
}

export async function getMapById(mapId: string): Promise<TacticalMap | null> {
  const mapPath = `${MAPS_COLLECTION}/${mapId}`;
  try {
    const snap = await getDoc(doc(db, MAPS_COLLECTION, mapId));
    if (snap.exists()) {
      return snap.data() as TacticalMap;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, mapPath);
  }
}
