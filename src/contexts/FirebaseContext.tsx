import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  loginWithGooglePopup, 
  loginWithEmail as fbLoginWithEmail,
  registerWithEmail as fbRegisterWithEmail,
  resetPassword as fbResetPassword,
  logoutFirebase, 
  testFirestoreConnection,
  fetchEntriesFromFirestore,
  batchSyncEntriesToFirestore,
  saveUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  saveEntryToFirestore,
  deleteEntryFromFirestore
} from '../services/firebase';
import { TimeEntry, UserAccount } from '../types';

interface FirebaseContextType {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  isOnline: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error' | 'unauthenticated';
  lastCloudSync: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<FirebaseUser>;
  resetPasswordEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  syncEntriesWithCloud: (localEntries: TimeEntry[], localAccount: UserAccount) => Promise<TimeEntry[]>;
  saveSingleEntryToCloud: (entry: TimeEntry) => Promise<void>;
  deleteSingleEntryFromCloud: (entryId: string) => Promise<void>;
  saveProfileToCloud: (account: UserAccount) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'unauthenticated'>('unauthenticated');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(() => {
    return localStorage.getItem('dtk_firestore_last_sync');
  });

  // Track Online / Offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      testFirestoreConnection().then(setIsFirebaseConnected);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsFirebaseConnected(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setSyncStatus('synced');
        testFirestoreConnection().then(setIsFirebaseConnected);
      } else {
        setSyncStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const loggedUser = await loginWithGooglePopup();
      setUser(loggedUser);
      setIsFirebaseConnected(true);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Login error:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setSyncStatus('syncing');
      const loggedUser = await fbLoginWithEmail(email, password);
      setUser(loggedUser);
      setIsFirebaseConnected(true);
      setSyncStatus('synced');
      return loggedUser;
    } catch (err) {
      console.error('Email login error:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setSyncStatus('syncing');
      const newUser = await fbRegisterWithEmail(email, password, displayName);
      setUser(newUser);
      setIsFirebaseConnected(true);
      setSyncStatus('synced');
      return newUser;
    } catch (err) {
      console.error('Email registration error:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  const resetPasswordEmail = useCallback(async (email: string) => {
    try {
      await fbResetPassword(email);
    } catch (err) {
      console.error('Password reset error:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFirebase();
      setUser(null);
      setSyncStatus('unauthenticated');
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  }, []);

  // Sync bidirectional: merge Firestore entries with local entries
  const syncEntriesWithCloud = useCallback(async (localEntries: TimeEntry[], localAccount: UserAccount): Promise<TimeEntry[]> => {
    if (!user) return localEntries;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return localEntries;
    }

    setSyncStatus('syncing');
    try {
      // 1. Sync User Profile
      await saveUserProfileToFirestore(user.uid, {
        ...localAccount,
        email: user.email || localAccount.email,
        name: user.displayName || localAccount.name,
        avatarUrl: user.photoURL || localAccount.avatarUrl
      });

      // 2. Fetch remote entries
      const remoteEntries = await fetchEntriesFromFirestore(user.uid);
      const entryMap = new Map<string, TimeEntry>();

      // Put remote entries
      remoteEntries.forEach(re => entryMap.set(re.id, re));

      // Merge local entries: if local exists and is newer or not in remote, overwrite
      const entriesToUpload: TimeEntry[] = [];
      localEntries.forEach(le => {
        const existing = entryMap.get(le.id);
        if (!existing) {
          entryMap.set(le.id, { ...le, syncStatus: 'synced' });
          entriesToUpload.push(le);
        } else {
          const localUpdated = new Date(le.updatedAt || 0).getTime();
          const remoteUpdated = new Date(existing.updatedAt || 0).getTime();
          if (localUpdated >= remoteUpdated) {
            entryMap.set(le.id, { ...le, syncStatus: 'synced' });
            entriesToUpload.push(le);
          }
        }
      });

      // Batch upload any new/modified local entries to Firestore
      if (entriesToUpload.length > 0) {
        await batchSyncEntriesToFirestore(user.uid, entriesToUpload);
      }

      const mergedList = Array.from(entryMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      const nowIso = new Date().toISOString();
      setLastCloudSync(nowIso);
      localStorage.setItem('dtk_firestore_last_sync', nowIso);
      setSyncStatus('synced');
      return mergedList;
    } catch (error) {
      console.error('Error syncing with Firestore:', error);
      setSyncStatus('error');
      return localEntries;
    }
  }, [user]);

  const saveSingleEntryToCloud = useCallback(async (entry: TimeEntry) => {
    if (!user || !navigator.onLine) return;
    try {
      await saveEntryToFirestore(user.uid, entry);
    } catch (err) {
      console.error('Error saving single entry to cloud:', err);
    }
  }, [user]);

  const deleteSingleEntryFromCloud = useCallback(async (entryId: string) => {
    if (!user || !navigator.onLine) return;
    try {
      await deleteEntryFromFirestore(user.uid, entryId);
    } catch (err) {
      console.error('Error deleting entry from cloud:', err);
    }
  }, [user]);

  const saveProfileToCloud = useCallback(async (account: UserAccount) => {
    if (!user || !navigator.onLine) return;
    try {
      await saveUserProfileToFirestore(user.uid, account);
    } catch (err) {
      console.error('Error saving profile to cloud:', err);
    }
  }, [user]);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAuthReady,
        isOnline,
        isFirebaseConnected,
        syncStatus,
        lastCloudSync,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPasswordEmail,
        logout,
        syncEntriesWithCloud,
        saveSingleEntryToCloud,
        deleteSingleEntryFromCloud,
        saveProfileToCloud
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
