import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TimeEntry, UserAccount, CloudBackupSnapshot } from '../types';

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3. Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 4. Operation types & error handler as mandated by Firebase Skill
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 5. Test connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is unreachable');
      return false;
    }
    // Expected if doc doesn't exist, but connection succeeds
    return true;
  }
}

// 6. User Profile Firestore API
export async function saveUserProfileToFirestore(userId: string, account: UserAccount): Promise<void> {
  const path = `users/${userId}`;
  try {
    const payload = {
      id: userId,
      name: account.name || 'Anonymous User',
      email: account.email || '',
      role: account.role || 'Member',
      department: account.department || 'General',
      company: account.company || 'Enterprise',
      defaultHourlyRate: Number(account.defaultHourlyRate) || 0,
      currency: account.currency || 'PHP',
      currencySymbol: account.currencySymbol || '₱',
      weeklyTargetHours: Number(account.weeklyTargetHours) || 40,
      dailyTargetHours: Number(account.dailyTargetHours) || 8,
      timezone: account.timezone || 'Asia/Manila',
      avatarUrl: account.avatarUrl || '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserProfileFromFirestore(userId: string): Promise<UserAccount | null> {
  const path = `users/${userId}`;
  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (snapshot.exists()) {
      return snapshot.data() as UserAccount;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 7. Time Entries Firestore API
export async function saveEntryToFirestore(userId: string, entry: TimeEntry): Promise<void> {
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    const cleanEntry: Record<string, any> = {
      id: entry.id,
      userId,
      date: entry.date,
      startTime: entry.startTime || '',
      endTime: entry.endTime || null,
      breakMinutes: Number(entry.breakMinutes) || 0,
      totalMinutes: Number(entry.totalMinutes) || 0,
      category: entry.category || 'General',
      project: entry.project || 'General',
      description: entry.description || '',
      tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 10) : [],
      billable: Boolean(entry.billable),
      hourlyRate: Number(entry.hourlyRate) || 0,
      isRetroactive: Boolean(entry.isRetroactive),
      isAbsent: Boolean(entry.isAbsent),
      absenceReason: entry.absenceReason || null,
      absenceNote: entry.absenceNote || null,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    };
    await setDoc(doc(db, 'users', userId, 'entries', entry.id), cleanEntry, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'entries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchEntriesFromFirestore(userId: string): Promise<TimeEntry[]> {
  const path = `users/${userId}/entries`;
  try {
    const q = query(collection(db, 'users', userId, 'entries'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const list: TimeEntry[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as TimeEntry);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function batchSyncEntriesToFirestore(userId: string, entries: TimeEntry[]): Promise<void> {
  const path = `users/${userId}/entries`;
  try {
    // Firestore batch supports up to 500 operations
    const chunks: TimeEntry[][] = [];
    for (let i = 0; i < entries.length; i += 400) {
      chunks.push(entries.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const entry of chunk) {
        const ref = doc(db, 'users', userId, 'entries', entry.id);
        const clean = {
          id: entry.id,
          userId,
          date: entry.date,
          startTime: entry.startTime || '',
          endTime: entry.endTime || null,
          breakMinutes: Number(entry.breakMinutes) || 0,
          totalMinutes: Number(entry.totalMinutes) || 0,
          category: entry.category || 'General',
          project: entry.project || 'General',
          description: entry.description || '',
          tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 10) : [],
          billable: Boolean(entry.billable),
          hourlyRate: Number(entry.hourlyRate) || 0,
          isRetroactive: Boolean(entry.isRetroactive),
          isAbsent: Boolean(entry.isAbsent),
          absenceReason: entry.absenceReason || null,
          absenceNote: entry.absenceNote || null,
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced'
        };
        batch.set(ref, clean, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 8. Cloud Backups Firestore API
export async function saveBackupToFirestore(userId: string, backup: CloudBackupSnapshot): Promise<void> {
  const path = `users/${userId}/backups/${backup.id}`;
  try {
    const cleanBackup = {
      id: backup.id,
      userId,
      timestamp: backup.timestamp,
      accountEmail: backup.accountEmail || '',
      accountName: backup.accountName || '',
      entryCount: Number(backup.entryCount) || 0,
      totalHours: Number(backup.totalHours) || 0,
      description: backup.description || 'Cloud Snapshot',
      createdAt: backup.createdAt || new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userId, 'backups', backup.id), cleanBackup);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchBackupsFromFirestore(userId: string): Promise<CloudBackupSnapshot[]> {
  const path = `users/${userId}/backups`;
  try {
    const q = query(collection(db, 'users', userId, 'backups'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const list: CloudBackupSnapshot[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CloudBackupSnapshot);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteBackupFromFirestore(userId: string, backupId: string): Promise<void> {
  const path = `users/${userId}/backups/${backupId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'backups', backupId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 9. Auth helper functions
export async function loginWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await fbSignOut(auth);
}
