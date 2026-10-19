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
import { RiskZone } from '../../types';

export function getZonesCollectionPath(mapId: string) {
  return `maps/${mapId}/riskZones`;
}

export async function createRiskZone(
  mapId: string,
  data: Omit<RiskZone, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = getZonesCollectionPath(mapId);
  const zoneDocRef = doc(collection(db, path));
  const newZone: RiskZone = {
    ...data,
    id: zoneDocRef.id,
    mapId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(zoneDocRef, newZone);
    return zoneDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${zoneDocRef.id}`);
  }
}

export async function updateRiskZone(
  mapId: string,
  zoneId: string,
  updates: Partial<Omit<RiskZone, 'id' | 'mapId' | 'createdAt'>>
): Promise<void> {
  const path = getZonesCollectionPath(mapId);
  const zoneDocRef = doc(db, path, zoneId);
  try {
    await updateDoc(zoneDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${zoneId}`);
  }
}

export async function deleteRiskZone(mapId: string, zoneId: string): Promise<void> {
  const path = getZonesCollectionPath(mapId);
  const zoneDocRef = doc(db, path, zoneId);
  try {
    await deleteDoc(zoneDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${zoneId}`);
  }
}

export function subscribeRiskZones(
  mapId: string,
  onUpdate: (zones: RiskZone[]) => void,
  onError?: (err: Error) => void
) {
  const path = getZonesCollectionPath(mapId);
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const zones: RiskZone[] = [];
      snapshot.forEach((doc) => {
        zones.push(doc.data() as RiskZone);
      });
      zones.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(zones);
    },
    (error) => {
      console.error(`Error subscribing to risk zones on map ${mapId}:`, error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getRiskZonesForMap(mapId: string): Promise<RiskZone[]> {
  const path = getZonesCollectionPath(mapId);
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as RiskZone);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
