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
  Folder
} from 'lucide-react';
import { BrandAssetsFolder } from './BrandAssetsFolder';
import { CloudBackupSnapshot, TimeEntry, UserAccount, WidgetConfig, WidgetId } from '../types';
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
    { id: 'widgets' as const, label: 'Customize Widgets', icon: SlidersHorizontal },
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
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Default Hourly Rate (₱/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Daily Workload Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={editDailyTarget}
                  onChange={(e) => setEditDailyTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Weekly Workload Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={editWeeklyTarget}
                  onChange={(e) => setEditWeeklyTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
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

      {/* 3. Customize Dashboard Widgets Section (Moved from top) */}
      {(activeSection === 'all' || activeSection === 'widgets') && (
        <div id="section-customize-widgets" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Dashboard Widgets Customization
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle visibility, switch between full and half width columns, and reorder dashboard widgets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenWidgetModal && (
                <button
                  type="button"
                  onClick={onOpenWidgetModal}
                  id="btn-settings-open-widget-modal"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Launch Widget Modal</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetWidgetsDefault}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Interactive Widget Items List */}
          <div className="space-y-2.5">
            {widgets.map((widget, index) => {
              const isEnabled = widget.enabled;
              const isFull = widget.width === 'full';

              return (
                <div
                  key={widget.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                    isEnabled
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                      : 'bg-slate-50/20 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {widget.title}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isEnabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {isEnabled ? 'Active' : 'Hidden'}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {isFull ? 'Full Width (1 Col)' : 'Half Width (2 Cols)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Widget ID: <code className="font-mono">{widget.id}</code>
                      </p>
                    </div>
                  </div>

                  {/* Widget Controls */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Width toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleWidth(widget.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isFull
                          ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                      title={isFull ? 'Click to make half width' : 'Click to make full width'}
                    >
                      {isFull ? <Square className="w-3.5 h-3.5" /> : <Columns2 className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{isFull ? 'Full' : 'Half'}</span>
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleWidget(widget.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                      title={isEnabled ? 'Hide widget on dashboard' : 'Show widget on dashboard'}
                    >
                      {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{isEnabled ? 'Visible' : 'Hidden'}</span>
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveWidget(index, 'up')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === widgets.length - 1}
                      onClick={() => handleMoveWidget(index, 'down')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Appearance Theme Scheme Section */}
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
