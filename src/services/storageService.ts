import { TimeEntry, UserAccount, CloudBackupSnapshot, WidgetConfig } from '../types';

const STORAGE_KEYS = {
  ENTRIES: 'dtk_entries',
  ACCOUNT: 'dtk_account',
  WIDGETS: 'dtk_widgets',
  PENDING_MUTATIONS: 'dtk_pending_mutations',
  LAST_SYNC: 'dtk_last_sync',
  THEME: 'dtk_theme',
  OFFLINE_SIMULATED: 'dtk_simulated_offline',
  ACTIVE_SESSION: 'dtk_active_session'
};

export interface ActiveSession {
  isClockedIn: boolean;
  clockInTime: string; // ISO string
  isOnBreak: boolean;
  breakStartTime: string | null;
  accumulatedBreakMinutes: number;
  category: string;
  project: string;
  description: string;
  billable: boolean;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'punch_clock', title: 'Punch Clock & Active Shift', enabled: true, order: 0, width: 'half' },
  { id: 'missed_clockins', title: 'Attendance & Missed Clock-ins', enabled: true, order: 1, width: 'half' },
  { id: 'today_overview', title: "Today's Work & Hours", enabled: true, order: 2, width: 'half' },
  { id: 'weekly_stats', title: 'Weekly Hours & Goal Progress', enabled: true, order: 3, width: 'half' },
  { id: 'cloud_sync', title: 'Cloud Sync & Backup Status', enabled: true, order: 4, width: 'half' },
  { id: 'quick_retroactive', title: 'Quick Retroactive Time Entry', enabled: true, order: 5, width: 'half' },
  { id: 'monthly_progress', title: 'Monthly Targets & Billable Total', enabled: true, order: 6, width: 'half' }
];

export const CATEGORIES = [
  'Software Engineering',
  'Client Consultation',
  'Design & UX',
  'Internal Operations',
  'Research & Dev',
  'Administration',
  'Marketing & Content',
  'Quality Assurance',
  'Other'
];

export const PROJECTS = [
  'Core Architecture',
  'Client Portal V2',
  'Design System',
  'Q3 Infrastructure',
  'App Modernization',
  'General Operations',
  'Leave / Absence'
];

export const DEFAULT_ACCOUNT: UserAccount = {
  id: 'usr_default_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@enterprise.io',
  role: 'Senior Product Engineer',
  department: 'Product & Systems',
  company: 'Apex Digital Labs',
  defaultHourlyRate: 85,
  currency: 'PHP',
  currencySymbol: '₱',
  weeklyTargetHours: 40,
  dailyTargetHours: 8,
  timezone: 'Asia/Manila',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

// Theme helper
export function getTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.error(e);
  }
  return 'light';
}

export function setTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error(e);
  }
}

// Local storage entries
export function loadLocalEntries(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading local entries', e);
  }
  return [];
}

export function saveLocalEntries(
  entries: TimeEntry[], 
  actionType?: 'create' | 'update' | 'delete', 
  entry?: TimeEntry,
  deleteId?: string
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    // If an action was specified, queue it to pending mutations for cloud sync
    if (actionType && (entry || deleteId)) {
      const pending = getPendingMutations();
      if (actionType === 'delete' && deleteId) {
        // queue a tombstone or filter out
        const filtered = pending.filter(p => p.id !== deleteId);
        // Add tombstone record
        filtered.push({
          id: deleteId,
          date: '',
          startTime: '',
          endTime: '',
          breakMinutes: 0,
          totalMinutes: 0,
          category: 'Deleted',
          project: 'Deleted',
          description: '__DELETED__',
          tags: [],
          billable: false,
          hourlyRate: 0,
          isRetroactive: false,
          isAbsent: false,
          createdAt: '',
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending'
        });
        localStorage.setItem(STORAGE_KEYS.PENDING_MUTATIONS, JSON.stringify(filtered));
      } else if (entry) {
        const filtered = pending.filter(p => p.id !== entry.id);
        filtered.push({ ...entry, syncStatus: 'pending' });
        localStorage.setItem(STORAGE_KEYS.PENDING_MUTATIONS, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.error('Error saving local entries', e);
  }
}

// Account helpers
export function loadLocalAccount(): UserAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_ACCOUNT,
          ...parsed,
          name: parsed.name || DEFAULT_ACCOUNT.name,
          email: parsed.email || DEFAULT_ACCOUNT.email,
          role: parsed.role || DEFAULT_ACCOUNT.role,
          department: parsed.department || DEFAULT_ACCOUNT.department,
          company: parsed.company || DEFAULT_ACCOUNT.company,
          currency: parsed.currency || 'PHP',
          currencySymbol: parsed.currencySymbol || '₱',
          defaultHourlyRate: typeof parsed.defaultHourlyRate === 'number' ? parsed.defaultHourlyRate : DEFAULT_ACCOUNT.defaultHourlyRate,
          weeklyTargetHours: typeof parsed.weeklyTargetHours === 'number' ? parsed.weeklyTargetHours : DEFAULT_ACCOUNT.weeklyTargetHours,
          dailyTargetHours: typeof parsed.dailyTargetHours === 'number' ? parsed.dailyTargetHours : DEFAULT_ACCOUNT.dailyTargetHours,
          timezone: parsed.timezone || DEFAULT_ACCOUNT.timezone,
          avatarUrl: parsed.avatarUrl !== undefined ? parsed.avatarUrl : DEFAULT_ACCOUNT.avatarUrl,
        };
      }
    }
  } catch (e) {
    console.error('Error loading account', e);
  }
  return DEFAULT_ACCOUNT;
}

export function saveLocalAccount(account: UserAccount): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
  } catch (e) {
    console.error('Error saving account', e);
  }
}

export const loadUserAccount = loadLocalAccount;
export const updateUserAccount = saveLocalAccount;

// Widgets helpers
export function loadLocalWidgets(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    if (raw) {
      const parsed: WidgetConfig[] = JSON.parse(raw);
      const filtered = parsed.filter(w => (w.id as string) !== 'category_distribution');
      if (filtered.length !== parsed.length) {
        saveLocalWidgets(filtered);
      }
      return filtered;
    }
  } catch (e) {
    console.error('Error loading widgets config', e);
  }
  return DEFAULT_WIDGETS;
}

export function saveLocalWidgets(widgets: WidgetConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
  } catch (e) {
    console.error('Error saving widgets config', e);
  }
}

export const loadWidgetConfigs = loadLocalWidgets;
export const saveWidgetConfigs = saveLocalWidgets;

// Active Session helpers
export function loadActiveSession(): ActiveSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading active session', e);
  }
  return {
    isClockedIn: false,
    clockInTime: '',
    isOnBreak: false,
    breakStartTime: null,
    accumulatedBreakMinutes: 0,
    category: 'Software Engineering',
    project: 'Core Architecture',
    description: '',
    billable: true
  };
}

export function saveActiveSession(session: ActiveSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving active session', e);
  }
}

// Pending mutations for offline support
export function getPendingMutations(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_MUTATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading pending mutations', e);
  }
  return [];
}

export function clearPendingMutations(): void {
  localStorage.removeItem(STORAGE_KEYS.PENDING_MUTATIONS);
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

export const getLastSyncTimestamp = getLastSyncTime;

export function setLastSyncTime(timeIso: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timeIso);
}

// Simulated offline toggle
export function getSimulatedOffline(): boolean {
  return localStorage.getItem(STORAGE_KEYS.OFFLINE_SIMULATED) === 'true';
}

export const isSimulatedOffline = getSimulatedOffline;

export function setSimulatedOffline(val: boolean): void {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_SIMULATED, String(val));
}

export const setSimulatedOfflineState = setSimulatedOffline;

// Network online check
export function isNetworkOnline(): boolean {
  if (getSimulatedOffline()) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Cloud synchronization
export async function syncPendingMutations(): Promise<{
  success: boolean;
  entries?: TimeEntry[];
  serverTime?: string;
  error?: string;
}> {
  if (!isNetworkOnline()) {
    return {
      success: false,
      error: 'Client is currently offline. Mutations remain queued locally.'
    };
  }

  try {
    const localEntries = loadLocalEntries();
    const pending = getPendingMutations();

    const payload = {
      entries: pending.length > 0 ? pending : localEntries,
      lastSyncTime: getLastSyncTime()
    };

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.entries)) {
      clearPendingMutations();
      saveLocalEntries(data.entries);
      setLastSyncTime(data.serverTime || new Date().toISOString());
      return {
        success: true,
        entries: data.entries,
        serverTime: data.serverTime
      };
    }
    throw new Error('Unexpected response format from server');
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export const syncWithCloud = syncPendingMutations;

// Cloud Backups API
export async function createCloudBackup(
  descOrParams: string | { description: string; entries?: TimeEntry[]; account?: UserAccount; widgets?: WidgetConfig[] }
): Promise<{ success: boolean; backup?: CloudBackupSnapshot; snapshot?: CloudBackupSnapshot; error?: string }> {
  if (!isNetworkOnline()) {
    return {
      success: false,
      error: 'Cannot create cloud backup while in offline mode.'
    };
  }

  try {
    const description = typeof descOrParams === 'string' ? descOrParams : descOrParams.description;
    const entries = loadLocalEntries();
    const account = loadLocalAccount();
    const widgets = loadLocalWidgets();

    const res = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        entries,
        account,
        widgetConfig: widgets,
        categories: CATEGORIES,
        projects: PROJECTS
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, backup: data.backup, snapshot: data.backup };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchCloudBackups(): Promise<CloudBackupSnapshot[]> {
  if (!isNetworkOnline()) return [];
  try {
    const res = await fetch('/api/backups');
    if (res.ok) {
      const data = await res.json();
      return data.backups || [];
    }
  } catch (e) {
    console.warn('Unable to reach cloud backups', e);
  }
  return [];
}

export async function restoreFromCloudBackup(backupId: string): Promise<{
  success: boolean;
  snapshot?: CloudBackupSnapshot;
  error?: string;
}> {
  if (!isNetworkOnline()) {
    return { success: false, error: 'Cannot restore cloud backup while offline' };
  }

  try {
    const res = await fetch(`/api/backups/restore/${backupId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.snapshot) {
      if (data.snapshot.entries) {
        saveLocalEntries(data.snapshot.entries);
      }
      if (data.snapshot.account) {
        saveLocalAccount(data.snapshot.account);
      }
      if (data.snapshot.widgetConfig) {
        saveLocalWidgets(data.snapshot.widgetConfig);
      }
      clearPendingMutations();
      return { success: true, snapshot: data.snapshot };
    }
    return { success: false, error: 'Failed to restore snapshot' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const restoreCloudBackup = restoreFromCloudBackup;

export async function deleteCloudBackup(backupId: string): Promise<boolean> {
  if (!isNetworkOnline()) return false;
  try {
    const res = await fetch(`/api/backups/${backupId}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (e) {
    console.error('Delete cloud backup failed', e);
    return false;
  }
}

// JSON file export and import for offline cold-storage backups
export function exportDataAsJSON(entries: TimeEntry[], account: UserAccount): void {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    account,
    widgets: loadLocalWidgets(),
    entries
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `timekeeper-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.entries && Array.isArray(parsed.entries)) {
      saveLocalEntries(parsed.entries);
      if (parsed.account) {
        saveLocalAccount(parsed.account);
      }
      if (parsed.widgets) {
        saveLocalWidgets(parsed.widgets);
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to parse JSON backup', e);
  }
  return false;
}
