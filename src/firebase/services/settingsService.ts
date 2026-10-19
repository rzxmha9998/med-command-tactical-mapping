import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { AppSettings } from '../../types';

const SETTINGS_DOC_PATH = 'settings/header';

export async function getHeaderSettings(): Promise<AppSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'header'));
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    return {};
  } catch (err) {
    console.warn('Failed to fetch header settings:', err);
    return {};
  }
}

export function subscribeHeaderSettings(onUpdate: (settings: AppSettings) => void) {
  return onSnapshot(
    doc(db, 'settings', 'header'),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as AppSettings);
      } else {
        onUpdate({});
      }
    },
    (err) => {
      console.warn('Error subscribing to header settings:', err);
    }
  );
}

export async function updateHeaderSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    await setDoc(
      doc(db, 'settings', 'header'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, SETTINGS_DOC_PATH);
  }
}

export async function uploadHeaderLogo(file: File, side: 'left' | 'right'): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    throw new Error('Format logo tidak didukung. Harap gunakan PNG, JPEG, WebP, atau SVG.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file logo maksimal 5 MB.');
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const path = `header_logos/${side}_logo_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, path);

  const uploadTask = await uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  const downloadUrl = await getDownloadURL(uploadTask.ref);
  return downloadUrl;
}
