import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Sun, 
  Moon, 
  SlidersHorizontal, 
  Wifi, 
  WifiOff,
  User,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentTab?: string;
  setCurrentTab?: (tab: any) => void;
  activeTab?: string;
  onSelectTab?: (tab: any) => void;
  account?: UserAccount;
  userAccount?: UserAccount;
  onOpenAccountModal?: () => void;
  onOpenWidgetModal?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isOnline?: boolean;
  simulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
  isSyncing?: boolean;
  onManualSync?: () => void;
  pendingCount?: number;
  lastSyncTime?: string | null;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
  const currentTab = props.activeTab || props.currentTab || 'dashboard';
  const setCurrentTab = props.onSelectTab || props.setCurrentTab || (() => {});
  const account = props.account || props.userAccount;
  const displayName = account?.name || 'Alex Rivera';
  const displayEmail = account?.email || 'alex.rivera@enterprise.io';
  const hourlyRate = account?.defaultHourlyRate ?? 85;
  const onOpenAccountModal = props.onOpenAccountModal || (() => setCurrentTab('cloud'));
  const onOpenWidgetModal = props.onOpenWidgetModal || (() => {});
  const darkMode = props.darkMode !== undefined ? props.darkMode : props.theme === 'dark';
  const setDarkMode = props.setDarkMode || props.onToggleTheme || (() => {});
  const isOnline = props.isOnline ?? true;
  const simulatedOffline = props.simulatedOffline ?? false;
  const onToggleSimulatedOffline = props.onToggleSimulatedOffline || (() => {});
  const isSyncing = props.isSyncing ?? false;
  const onManualSync = props.onManualSync || (() => {});
  const pendingCount = props.pendingCount || 0;
  const lastSyncTime = props.lastSyncTime || null;

  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'payroll', label: 'Half-Month Payroll' },
    { id: 'logs', label: 'Time Logs' },
    { id: 'attendance', label: 'Attendance & Absences' },
    { id: 'reports', label: 'Monthly Reports & Export' },
    { id: 'cloud', label: 'Cloud & Backups' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Live Clock */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-sm flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                  Daily Time Keeper
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  v2.4 Cloud+Offline
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {liveTime}
              </p>
            </div>
          </div>

          {/* Sync & Connectivity Status Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline Simulation Toggle */}
            <button
              onClick={onToggleSimulatedOffline}
              id="btn-toggle-offline-simulation"
              title={simulatedOffline ? 'Currently simulating offline mode. Click to reconnect.' : 'Click to simulate network disconnection and test offline storage.'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                simulatedOffline
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {simulatedOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Offline Mode (Simulated)</span>
                  <span className="sm:hidden">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Online</span>
                </>
              )}
            </button>

            {/* Cloud Sync Status & Manual Sync Button */}
            <button
              onClick={onManualSync}
              disabled={isSyncing || !isOnline}
              id="btn-manual-sync"
              title={
                !isOnline
                  ? 'Offline: Changes queued locally'
                  : pendingCount > 0
                  ? `${pendingCount} changes waiting to sync`
                  : 'Cloud synchronized'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                pendingCount > 0
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-sky-500 animate-spin" />
              ) : isOnline ? (
                <Cloud className="w-3.5 h-3.5 text-sky-500" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-amber-500" />
              )}
              
              <span className="hidden md:inline">
                {isSyncing ? 'Syncing...' : pendingCount > 0 ? `Sync (${pendingCount})` : 'Cloud Synced'}
              </span>
            </button>

            {/* Customize Dashboard Widgets Button */}
            {currentTab === 'dashboard' && (
              <button
                onClick={onOpenWidgetModal}
                id="btn-customize-widgets"
                title="Customize dashboard widgets layout and visibility"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customize Widgets</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              id="btn-toggle-dark-mode"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Account Profile Avatar / Button */}
            <button
              onClick={onOpenAccountModal}
              id="btn-account-profile"
              title="Click to edit profile & change user picture"
              className="group flex items-center gap-2 pl-1 pr-2.5 py-1 h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <div 
                id="navbar-profile-thumbnail-container"
                className="relative w-[35px] h-[35px] rounded-full p-[1.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-sm transition-transform duration-300 group-hover:scale-105"
              >
                {/* Rotating animated glow halo ring */}
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[1px] animate-spin-slow group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Avatar Inner Image / Initials */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                  {account?.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-[35px] h-[35px] object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-xs font-bold bg-gradient-to-tr from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-indigo-500" />}
                    </span>
                  )}
                </div>

                {/* Animated active status ping */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900"></span>
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none truncate max-w-[105px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5 font-mono">
                  ₱{hourlyRate}/hr
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/80">
          {navTabs.map(tab => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
