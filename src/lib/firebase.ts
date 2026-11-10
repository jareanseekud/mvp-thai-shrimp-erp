import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SyncState } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Initialize App
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence enabled
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  // If already initialized or if multi-tab/indexedDB unsupported, fallback to getFirestore
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as mandated by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline: running with local offline cache.');
    }
    return false;
  }
}

// Global network & sync listener
type SyncListener = (state: SyncState, isOnline: boolean) => void;
const syncListeners: Set<SyncListener> = new Set();
let currentSyncState: SyncState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
let isNetworkOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function subscribeSyncState(listener: SyncListener) {
  syncListeners.add(listener);
  listener(currentSyncState, isNetworkOnline);
  return () => {
    syncListeners.delete(listener);
  };
}

export function notifySyncState(state: SyncState) {
  currentSyncState = state;
  syncListeners.forEach(fn => fn(currentSyncState, isNetworkOnline));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isNetworkOnline = true;
    notifySyncState('syncing');
    setTimeout(() => {
      notifySyncState('synced');
    }, 1200);
  });

  window.addEventListener('offline', () => {
    isNetworkOnline = false;
    notifySyncState('offline');
  });
}
