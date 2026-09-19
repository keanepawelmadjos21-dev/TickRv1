import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff,
  CloudUpload, 
  RefreshCw, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Download, 
  Upload, 
  Wifi, 
  WifiOff, 
  Trash2, 
  ShieldCheck, 
  User,
  Settings,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  Columns2,
  Square,
  Sparkles,
  Layers,
  LayoutGrid,
  Building2,
  Briefcase,
  Mail,
  Clock,
  Globe,
  Folder,
  Flame,
  LogIn,
  LogOut
} from 'lucide-react';
import { BrandAssetsFolder } from './BrandAssetsFolder';
import { CloudBackupSnapshot, TimeEntry, UserAccount, WidgetConfig, WidgetId } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { 
  fetchCloudBackups, 
  createCloudBackup, 
  restoreFromCloudBackup, 
  deleteCloudBackup, 
  getPendingMutations,
  exportDataAsJSON,
  importDataFromJSON,
  updateUserAccount,
  DEFAULT_WIDGETS
} from '../services/storageService';

interface CloudSyncViewProps {
  isOnline: boolean;
  simulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onManualSync: () => void;
  entries: TimeEntry[];
  account: UserAccount;
  onUpdateAccount: (account: UserAccount) => void;
  onReloadEntries: () => void;
  onOpenProfileModal?: () => void;
  widgets?: WidgetConfig[];
  onSaveWidgets?: (widgets: WidgetConfig[]) => void;
  onOpenWidgetModal?: () => void;
  theme?: 'light' | 'dark';
  onSetTheme?: (theme: 'light' | 'dark') => void;
  onReplaySplash?: () => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  isOnline,
  simulatedOffline,
  onToggleSimulatedOffline,
  isSyncing,
  lastSyncTime,
  onManualSync,
  entries,
  account,
  onUpdateAccount,
  onReloadEntries,
  onOpenProfileModal,
  widgets = DEFAULT_WIDGETS,
  onSaveWidgets,
  onOpenWidgetModal,
  theme = 'light',
  onSetTheme,
  onReplaySplash
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'profile' | 'cloud' | 'widgets' | 'appearance' | 'assets'>('all');
  const [backups, setBackups] = useState<CloudBackupSnapshot[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [newBackupLabel, setNewBackupLabel] = useState<string>('');
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account editing state
  const [isEditingAccount, setIsEditingAccount] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(account?.name || 'Alex Rivera');
  const [editEmail, setEditEmail] = useState<string>(account?.email || 'alex.rivera@enterprise.io');
  const [editCompany, setEditCompany] = useState<string>(account?.company || 'Apex Digital Labs');
  const [editRate, setEditRate] = useState<number>(account?.defaultHourlyRate ?? 85);
  const [editDailyTarget, setEditDailyTarget] = useState<number>(account?.dailyTargetHours ?? 8);
  const [editWeeklyTarget, setEditWeeklyTarget] = useState<number>(account?.weeklyTargetHours ?? 40);

  // Pending queue inspection
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);

  // Firebase integration state
  const {
    user: fbUser,
    isFirebaseConnected,
    loginWithGoogle,
    logout: logoutFb,
    syncEntriesWithCloud,
    syncStatus: fbSyncStatus,
    lastCloudSync: fbLastSync
  } = useFirebase();
  const [isSyncingFirebase, setIsSyncingFirebase] = useState<boolean>(false);

  const handleFirebaseGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setStatusMessage({ type: 'success', text: 'Connected to Firebase & signed in with Google!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Firebase sign-in failed' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFirebaseSyncNow = async () => {
    if (!isOnline) {
      setStatusMessage({ type: 'error', text: 'Cannot sync while offline. Please connect first.' });
      return;
    }
    setIsSyncingFirebase(true);
    try {
      const merged = await syncEntriesWithCloud(entries, account);
      onReloadEntries();
      setStatusMessage({ type: 'success', text: `Synchronized ${merged.length} entries with Firebase Firestore!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to sync with Firestore' });
    } finally {
      setIsSyncingFirebase(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleFirebaseLogout = async () => {
    try {
      await logoutFb();
      setStatusMessage({ type: 'success', text: 'Signed out from Firebase' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to sign out from Firebase' });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const list = await fetchCloudBackups();
      setBackups(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    loadBackups();
    setPendingQueue(getPendingMutations());
  }, []);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setStatusMessage({ type: 'error', text: 'Cannot create cloud backup while offline. Please connect or disable simulated offline mode.' });
      return;
    }

    setIsCreatingBackup(true);
    try {
      const desc = newBackupLabel.trim() || `Manual snapshot (${entries.length} entries)`;
      const res = await createCloudBackup(desc);
      if (res.success && res.snapshot) {
        setBackups([res.snapshot, ...backups]);
        setNewBackupLabel('');
        setStatusMessage({ type: 'success', text: `Snapshot "${desc}" successfully stored in cloud.` });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to create cloud snapshot' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error creating cloud backup' });
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to restore this cloud snapshot? Your local entries will be updated from the backup.')) {
      return;
    }

    const res = await restoreFromCloudBackup(snapshotId);
    if (res.success) {
      onReloadEntries();
      setStatusMessage({ type: 'success', text: 'Restored successfully from cloud snapshot!' });
    } else {
      setStatusMessage({ type: 'error', text: 'Cloud restore failed' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!confirm('Permanently delete this backup snapshot from cloud storage?')) return;
    const ok = await deleteCloudBackup(snapshotId);
    if (ok) {
      setBackups(backups.filter(b => b.id !== snapshotId));
      setStatusMessage({ type: 'success', text: 'Snapshot deleted from cloud storage' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...account,
      name: editName,
      email: editEmail,
      company: editCompany,
      defaultHourlyRate: Number(editRate),
      dailyTargetHours: Number(editDailyTarget),
      weeklyTargetHours: Number(editWeeklyTarget)
    };
    updateUserAccount(updated);
    onUpdateAccount(updated);
    setIsEditingAccount(false);
    setStatusMessage({ type: 'success', text: 'Account settings updated and queued for cloud sync!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const success = importDataFromJSON(jsonStr);
        if (success) {
          onReloadEntries();
          setStatusMessage({ type: 'success', text: 'Data imported successfully from JSON file!' });
        } else {
          setStatusMessage({ type: 'error', text: 'Invalid backup file format' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Error reading JSON file' });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Widget customizer helpers
  const handleToggleWidget = (id: WidgetId) => {
    if (!onSaveWidgets) return;
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    onSaveWidgets(updated);
  };

  const handleToggleWidth = (id: WidgetId) => {
    if (!onSaveWidgets) return;
    const updated = widgets.map(w => {
      if (w.id === id) {
        return { ...w, width: (w.width === 'full' ? 'half' : 'full') as 'half' | 'full' };
      }
      return w;
    });
    onSaveWidgets(updated);
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    if (!onSaveWidgets) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;

    const copy = [...widgets];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    const reordered = copy.map((w, idx) => ({ ...w, order: idx }));
    onSaveWidgets(reordered);
  };

  const handleResetWidgetsDefault = () => {
    if (!onSaveWidgets) return;
    onSaveWidgets(DEFAULT_WIDGETS);
    setStatusMessage({ type: 'success', text: 'Dashboard widgets reset to default layout!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const sectionPills = [
    { id: 'all' as const, label: 'All Settings', icon: Layers },
    { id: 'profile' as const, label: 'Profile Settings', icon: User },
    { id: 'cloud' as const, label: 'Cloud Synced & Storage', icon: Cloud },
    { id: 'appearance' as const, label: 'Appearance Scheme', icon: Sun },
    { id: 'assets' as const, label: 'Brand Assets & Media', icon: Folder },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Section Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize profile settings, cloud data synchronization, and dashboard widget layouts
          </p>
        </div>

        {/* Filter Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto no-scrollbar">
          {sectionPills.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                id={`btn-settings-section-${sec.id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in duration-150 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Profile Settings Section */}
      {(activeSection === 'all' || activeSection === 'profile') && (
        <div id="section-profile-settings" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Profile Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  User identity, hourly rate, and target daily & weekly workload
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenWidgetModal && (
                <button
                  type="button"
                  onClick={onOpenWidgetModal}
                  id="btn-settings-profile-customize-widgets"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-2xs transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Customize Widgets</span>
                </button>
              )}
              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  id="btn-settings-open-profile-modal"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Edit Profile & Avatar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditingAccount(!isEditingAccount)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isEditingAccount ? 'Cancel Quick Edit' : 'Quick Edit'}</span>
              </button>
            </div>
          </div>

          {isEditingAccount ? (
            <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    Default Hourly Rate
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    ₱{editRate}/hr
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
                <div className="mt-2 px-0.5">
                  <input
                    type="range"
                    min="25"
                    max="500"
                    step="5"
                    value={Math.min(500, Math.max(25, editRate || 25))}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="slider-bar w-full"
                    title={`Rate slider: ₱${editRate}/hr`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                    <span>₱25</span>
                    <span>₱500</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    Daily Workload Target
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {editDailyTarget}h / day
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={editDailyTarget}
                  onChange={(e) => setEditDailyTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
                <div className="mt-2 px-0.5">
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="0.5"
                    value={Math.min(16, Math.max(1, editDailyTarget || 8))}
                    onChange={(e) => setEditDailyTarget(Number(e.target.value))}
                    className="slider-bar w-full"
                    title={`Daily target slider: ${editDailyTarget}h`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                    <span>1h</span>
                    <span>16h</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    Weekly Workload Target
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {editWeeklyTarget}h / week
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={editWeeklyTarget}
                  onChange={(e) => setEditWeeklyTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
                <div className="mt-2 px-0.5">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={Math.min(60, Math.max(5, editWeeklyTarget || 40))}
                    onChange={(e) => setEditWeeklyTarget(Number(e.target.value))}
                    className="slider-bar w-full"
                    title={`Weekly target slider: ${editWeeklyTarget}h`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                    <span>5h</span>
                    <span>60h</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAccount(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-5 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                {/* Rotating Animated Glow Halo Thumbnail */}
                <div className="relative w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md flex-shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-65 blur-xs animate-spin-slow pointer-events-none" />
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt={account.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-base font-bold bg-gradient-to-tr from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {account.name ? account.name.charAt(0).toUpperCase() : 'A'}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                  </span>
                </div>

                {/* Account Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {account.name || 'Alex Rivera'}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {account.role || 'Senior Software Engineer'}
                    </span>
                    {fbUser ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Signed In
                      </span>
                    ) : (
                      onOpenProfileModal && (
                        <button
                          type="button"
                          onClick={onOpenProfileModal}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                        >
                          Sign In with Email
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{account.email || 'alex.rivera@enterprise.io'}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{account.company || 'Apex Digital Labs'}</span>
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-left">
                  <span className="text-[10px] text-slate-400 block font-medium">Hourly Rate</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    ₱{account.defaultHourlyRate ?? 85}/hr
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-left">
                  <span className="text-[10px] text-slate-400 block font-medium">Daily Target</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {account.dailyTargetHours ?? 8}h / day
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-left">
                  <span className="text-[10px] text-slate-400 block font-medium">Weekly Target</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {account.weeklyTargetHours ?? 40}h / week
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-left">
                  <span className="text-[10px] text-slate-400 block font-medium">Timezone</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                    {account.timezone ? account.timezone.split('/')[1] || account.timezone : 'Asia/Manila'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Customize Dashboard Widgets Bar directly under Profile Menu */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Customize Dashboard Widgets
                  </h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {widgets.filter(w => w.enabled).length} of {widgets.length} Active
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click to open popup tab: choose card visibility, change full/half widths, and reorder dashboard widgets
                </p>
              </div>
            </div>

            {onOpenWidgetModal && (
              <button
                type="button"
                onClick={onOpenWidgetModal}
                id="btn-profile-card-customize-widgets"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Customize Widgets</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Cloud Synchronization Section (Moved from top) */}
      {(activeSection === 'all' || activeSection === 'cloud') && (
        <div id="section-cloud-synced" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                isOnline 
                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400' 
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}>
                {isSyncing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                ) : isOnline ? (
                  <Cloud className="w-6 h-6 text-sky-500" />
                ) : (
                  <CloudOff className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Cloud Synchronization & Storage
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isOnline 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isOnline ? 'Online & Synchronized' : 'Offline Mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automatic background synchronization with conflict-free offline change logging
                </p>
              </div>
            </div>

            {/* Cloud Synced Action Buttons (Moved from top) */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {/* Simulate Offline Toggle */}
              <button
                onClick={onToggleSimulatedOffline}
                id="btn-settings-toggle-offline"
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                  simulatedOffline
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Simulate network disconnection to verify offline behavior"
              >
                {simulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>{simulatedOffline ? 'Simulating Offline' : 'Simulate Offline'}</span>
              </button>

              {/* Sync Cloud Now Button */}
              <button
                onClick={onManualSync}
                disabled={isSyncing || !isOnline}
                id="btn-settings-manual-sync"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
              </button>
            </div>
          </div>

          {/* Firebase Firestore Cloud Persistence Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-indigo-500/5 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Google Firebase Firestore Database
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      Hardened Security Rules
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cloud database in <span className="font-mono font-medium text-slate-700 dark:text-slate-300">asia-southeast1</span> with user-isolated subcollections
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isFirebaseConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isFirebaseConnected ? 'Firestore Online' : 'Connecting to Firestore...'}
                </span>
              </div>
            </div>

            {/* Auth / Action State */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {fbUser ? (
                <div className="flex items-center gap-3">
                  {fbUser.photoURL ? (
                    <img
                      src={fbUser.photoURL}
                      alt={fbUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-indigo-400/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {fbUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {fbUser.displayName || 'Google User'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {fbUser.email} • UID: {fbUser.uid.substring(0, 10)}...
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Sign in with Google to enable Firestore cloud persistence
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Changes will sync automatically to your personal Firestore collection
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {fbUser ? (
                  <>
                    <button
                      onClick={handleFirebaseSyncNow}
                      disabled={isSyncingFirebase || !isOnline}
                      id="btn-firebase-sync-now"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
                      <span>{isSyncingFirebase ? 'Syncing...' : 'Sync with Firestore'}</span>
                    </button>
                    <button
                      onClick={handleFirebaseLogout}
                      id="btn-firebase-logout"
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFirebaseGoogleLogin}
                    id="btn-firebase-google-login"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sync Stats Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Last Cloud Sync</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Local Database Records</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {entries.length} Time Entries stored locally
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Offline Pending Queue</span>
              <span className={`font-semibold ${pendingQueue.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {pendingQueue.length} change(s) waiting to sync
              </span>
            </div>
          </div>

          {/* Cloud Snapshots & Backup Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Snapshots Table (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cloud Snapshots & Backups
                  </h3>
                </div>
                <button
                  onClick={loadBackups}
                  disabled={loadingBackups}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingBackups ? 'animate-spin' : ''}`} />
                  Refresh List
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Snapshot Label</th>
                      <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Entries</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {backups.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {b.label}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                          {new Date(b.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 font-mono">
                          {b.entriesCount}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleRestoreSnapshot(b.id)}
                            className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium transition"
                            title="Restore entries from this cloud backup snapshot"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteSnapshot(b.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {backups.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-400">
                    {loadingBackups ? 'Loading snapshots...' : 'No cloud snapshots created yet.'}
                  </p>
                )}
              </div>
            </div>

            {/* Create Snapshot & Offline File Archive (1 col) */}
            <div className="space-y-4">
              {/* Create Snapshot Form */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Create Cloud Snapshot
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Captures all active time entries, absences, and retroactive records into the cloud.
                </p>

                <form onSubmit={handleCreateSnapshot} className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. End of Month Backup..."
                    value={newBackupLabel}
                    onChange={(e) => setNewBackupLabel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingBackup || !isOnline}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-2xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>{isCreatingBackup ? 'Creating Snapshot...' : 'Create Snapshot Now'}</span>
                  </button>
                </form>
              </div>

              {/* Local JSON Export / Import */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Offline File Archive
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Download your local time entries as a JSON file or restore from a previously saved JSON file.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => exportDataAsJSON(entries, account)}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Export JSON</span>
                  </button>

                  <label className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-purple-500" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 3. Appearance Theme Scheme Section */}
      {(activeSection === 'all' || activeSection === 'appearance') && onSetTheme && (
        <div id="section-theme-appearance" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Appearance Theme Scheme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose between light and dark presentation modes for comfort across environments
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              id="btn-settings-theme-light"
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 shadow-2xs ring-2 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-2xs">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Light Scheme</h3>
                  {theme === 'light' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Crisp, high-contrast bright canvas ideal for daytime productivity and clear data auditing
                </p>
              </div>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              id="btn-settings-theme-dark"
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-2xs ring-2 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-2xs">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dark Scheme</h3>
                  {theme === 'dark' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500 text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Eye-safe nocturnal palette engineered with deep slate tones for prolonged evening focus
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 5. Brand Assets & Splash Animation Folder Section */}
      {(activeSection === 'all' || activeSection === 'assets') && (
        <BrandAssetsFolder onReplaySplash={onReplaySplash} />
      )}
    </div>
  );
};
