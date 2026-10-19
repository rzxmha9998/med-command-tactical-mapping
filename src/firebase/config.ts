import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// Detect whether databaseId is standard (default) or a measurement ID / old applet DB
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {} as any;
const rawDatabaseId = env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;
const safeDatabaseId =
  !rawDatabaseId ||
  rawDatabaseId.startsWith('G-') ||
  rawDatabaseId.includes('ai-studio-')
    ? '(default)'
    : rawDatabaseId;

export const resolvedFirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId,
  firestoreDatabaseId: safeDatabaseId,
};

const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with long-polling to prevent WebSocket iframe disconnection
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    safeDatabaseId === '(default)' ? undefined : safeDatabaseId
  );
} catch {
  firestoreDb = safeDatabaseId === '(default)' ? getFirestore(app) : getFirestore(app, safeDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);

// Non-blocking connection verification as mandated by Firebase Skill
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[MED-COMMAND] Initial Firestore connection pending or offline mode.');
    }
  }
}

testFirestoreConnection();

export default app;
