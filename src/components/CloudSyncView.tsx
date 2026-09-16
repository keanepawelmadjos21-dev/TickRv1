import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
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
  Settings
} from 'lucide-react';
import { CloudBackupSnapshot, TimeEntry, UserAccount } from '../types';
import { 
  fetchCloudBackups, 
  createCloudBackup, 
  restoreFromCloudBackup, 
  deleteCloudBackup,
  getPendingMutations,
  exportDataAsJSON,
  importDataFromJSON,
  updateUserAccount
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
  onOpenProfileModal
}) => {
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

  return (
    <div className="space-y-6">
      {/* Notification banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Top Banner: Account Status & Sync Health */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isOnline 
                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400' 
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Account Synchronization & Cloud Backup
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
                Logged in as <strong>{account?.name || 'Alex Rivera'}</strong> ({account?.email || 'alex.rivera@enterprise.io'}) • {account?.company || 'Apex Digital Labs'}
              </p>
            </div>
          </div>

          {/* Sync & Offline Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Simulated Offline Toggle */}
            <button
              onClick={onToggleSimulatedOffline}
              id="btn-toggle-offline-mode"
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                simulatedOffline
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Test offline data entry behavior"
            >
              {simulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{simulatedOffline ? 'Simulating Offline' : 'Simulate Offline'}</span>
            </button>

            {/* Sync Now */}
            <button
              onClick={onManualSync}
              disabled={isSyncing || !isOnline}
              id="btn-manual-sync"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
            </button>
          </div>
        </div>

        {/* Offline info & pending count strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Last Cloud Sync Timestamp</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Local Database Records</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {entries.length} Time Entries stored locally
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Offline Pending Sync Queue</span>
            <span className={`font-semibold ${pendingQueue.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {pendingQueue.length} change(s) queued
            </span>
          </div>
        </div>
      </div>

      {/* Account Settings / Edit */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              User Profile & Default Rates
            </h3>
          </div>
          <button
            onClick={() => setIsEditingAccount(!isEditingAccount)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            {isEditingAccount ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {isEditingAccount ? (
          <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                Daily Goal (Hours)
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
                Weekly Goal (Hours)
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
          <div className="space-y-4">
            {/* Animated Profile Card Summary */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3.5">
                {/* Animated thumbnail */}
                <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-xs animate-spin-slow pointer-events-none" />
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
                        {account.name ? account.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900"></span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {account.name}
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {account.role || 'Staff'} • {account.department || 'Operations'} ({account.company || 'Enterprise'})
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {account.email}
                  </p>
                </div>
              </div>

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  id="btn-open-profile-editor-from-cloud"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-900/50 transition flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Profile & Change Picture</span>
                </button>
              )}
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px]">Default Hourly Rate</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">₱{account.defaultHourlyRate}/hr</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px]">Daily Target Workload</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{account.dailyTargetHours} hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px]">Weekly Target Workload</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{account.weeklyTargetHours} hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px]">Timezone</span>
                <span className="font-semibold text-slate-900 dark:text-white text-xs truncate block">{account.timezone}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cloud Snapshots List & Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Cloud Snapshots Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-500" />
                Cloud Backup Snapshots ({backups.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable cloud snapshots stored on the server. You can restore your database to any previous point.
              </p>
            </div>
            <button
              onClick={loadBackups}
              disabled={loadingBackups}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refresh backups list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBackups ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {backups.length > 0 ? (
              backups.map(snap => (
                <div
                  key={snap.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {snap.description}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                        {snap.totalEntries} entries
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Created: {new Date(snap.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>Source: {snap.deviceSource}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Restore local database to this snapshot"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                {loadingBackups ? 'Loading snapshots...' : 'No cloud snapshots created yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Right (1 col): Create Snapshot & JSON Export/Import */}
        <div className="space-y-6">
          {/* Create Snapshot Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <CloudUpload className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Cloud Snapshot
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Captures all active time entries, absences, and retroactive adjustments into the cloud.
            </p>

            <form onSubmit={handleCreateSnapshot} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. End of Month Backup, Pre-tax snapshot..."
                value={newBackupLabel}
                onChange={(e) => setNewBackupLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              />

              <button
                type="submit"
                disabled={isCreatingBackup || !isOnline}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                {isCreatingBackup ? 'Creating Snapshot...' : 'Create Snapshot Now'}
              </button>
            </form>
          </div>

          {/* Local JSON Export / Import */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Offline File Archive
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download your entire local time database as a JSON file or restore from a previously saved JSON file.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => exportDataAsJSON(entries, account)}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                Export JSON
              </button>

              <label className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
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
  );
};
