import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { UserProfile, TacticalMap } from '../../types';

const USERS_COLLECTION = 'users';

export async function getAllOfficers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs
      .map(d => d.data() as UserProfile)
      .filter(u => u.role === 'officer');
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
  }
}

export function subscribeAllOfficers(
  onUpdate: (officers: UserProfile[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const officers: UserProfile[] = [];
      snapshot.forEach(d => {
        const u = d.data() as UserProfile;
        if (u.role === 'officer') {
          officers.push(u);
        }
      });
      onUpdate(officers);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    }
  );
}

export async function toggleOfficerActive(uid: string, isActive: boolean): Promise<void> {
  const userPath = `${USERS_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      isActive,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updateOfficerMapAccess(
  officerUid: string,
  allowedMapIds: string[]
): Promise<void> {
  const userPath = `${USERS_COLLECTION}/${officerUid}`;
  try {
    // 1. Update user profile
    await updateDoc(doc(db, USERS_COLLECTION, officerUid), {
      allowedMapIds,
      updatedAt: new Date().toISOString(),
    });

    // 2. Sync to all maps: ensure allowedOfficerIds reflects this officer's presence
    const mapsSnap = await getDocs(collection(db, 'maps'));
    const batch = writeBatch(db);

    mapsSnap.forEach(mDoc => {
      const mapData = mDoc.data() as TacticalMap;
      const currentAllowed = mapData.allowedOfficerIds || [];
      const shouldHaveAccess = allowedMapIds.includes(mapData.id);

      if (shouldHaveAccess && !currentAllowed.includes(officerUid)) {
        batch.update(mDoc.ref, {
          allowedOfficerIds: [...currentAllowed, officerUid],
          updatedAt: new Date().toISOString(),
        });
      } else if (!shouldHaveAccess && currentAllowed.includes(officerUid)) {
        batch.update(mDoc.ref, {
          allowedOfficerIds: currentAllowed.filter(id => id !== officerUid),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function createOfficerProfile(
  uid: string,
  email: string,
  displayName: string,
  allowedMapIds: string[] = []
): Promise<UserProfile> {
  const userPath = `${USERS_COLLECTION}/${uid}`;
  const profile: UserProfile = {
    uid,
    email,
    displayName,
    role: 'officer',
    isActive: true,
    allowedMapIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }
}
