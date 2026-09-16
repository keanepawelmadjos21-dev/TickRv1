import React, { useState } from 'react';
import { Cloud, CloudUpload, RefreshCw, CheckCircle2, AlertCircle, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { TimeEntry, UserAccount } from '../../types';

interface CloudSyncWidgetProps {
  isOnline: boolean;
  simulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  onManualSync: () => void;
  onCreateBackup: (desc: string) => Promise<boolean>;
  onNavigateCloudTab: () => void;
}

export const CloudSyncWidget: React.FC<CloudSyncWidgetProps> = ({
  isOnline,
  simulatedOffline,
  isSyncing,
  pendingCount,
  lastSyncTime,
  onManualSync,
  onCreateBackup,
  onNavigateCloudTab
}) => {
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupSuccess, setBackupSuccess] = useState<boolean>(false);

  const handleQuickBackup = async () => {
    setIsBackingUp(true);
    const success = await onCreateBackup('Dashboard Quick Snapshot');
    setIsBackingUp(false);
    if (success) {
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    }
  };

  const formatRelative = (iso: string | null) => {
    if (!iso) return 'Not synced yet';
    try {
      const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${
              isOnline 
                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400' 
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Cloud Sync & Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isOnline ? 'Online • Real-time synchronization' : 'Offline Mode • Local storage active'}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isOnline 
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" /> Synced
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" /> Offline
              </>
            )}
          </span>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Last Cloud Sync</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formatRelative(lastSyncTime)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Offline Pending</span>
            <span className={`text-sm font-semibold ${
              pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
            }`}>
              {pendingCount} changes
            </span>
          </div>
        </div>

        {/* Informative Note */}
        {!isOnline && (
          <div className="p-3 mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Offline data entry enabled. All your time logs, punch actions, and retroactive edits are saved safely on your device and will auto-sync when you reconnect.
            </p>
          </div>
        )}

        {backupSuccess && (
          <div className="p-3 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Cloud backup snapshot created successfully!</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onManualSync}
            disabled={isSyncing || !isOnline}
            className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Cloud'}
          </button>

          <button
            onClick={handleQuickBackup}
            disabled={isBackingUp || !isOnline}
            className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            {isBackingUp ? 'Saving...' : 'Backup Snapshot'}
          </button>
        </div>

        <button
          onClick={onNavigateCloudTab}
          className="w-full py-1 text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium block"
        >
          Manage Backups, Snapshots & Restore →
        </button>
      </div>
    </div>
  );
};
