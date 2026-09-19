import React, { useState, useEffect, useCallback } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Calendar, 
  Clock, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

import { TimeEntry, UserAccount, WidgetConfig, AbsenceReason, WidgetId } from './types';
import { useFirebase } from './contexts/FirebaseContext';
import { 
  loadLocalEntries, 
  saveLocalEntries, 
  loadUserAccount, 
  saveLocalAccount,
  loadActiveSession, 
  saveActiveSession, 
  loadWidgetConfigs, 
  saveWidgetConfigs, 
  isNetworkOnline, 
  isSimulatedOffline, 
  setSimulatedOfflineState, 
  syncPendingMutations, 
  getPendingMutations, 
  getLastSyncTimestamp, 
  createCloudBackup, 
  getTheme, 
  setTheme as persistTheme, 
  ActiveSession,
  CATEGORIES,
  PROJECTS
} from './services/storageService';

// UI Components
import { Navbar } from './components/Navbar';
import { EntryEditModal } from './components/EntryEditModal';
import { WidgetCustomizerModal } from './components/WidgetCustomizerModal';
import { UserProfileModal } from './components/UserProfileModal';
import { TimeLogTable } from './components/TimeLogTable';
import { AbsentManager } from './components/AbsentManager';
import { MonthlyReportView } from './components/MonthlyReportView';
import { CloudSyncView } from './components/CloudSyncView';
import { HalfMonthPayrollView } from './components/HalfMonthPayrollView';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';

// Widgets
import { PunchClockWidget } from './components/widgets/PunchClockWidget';
import { MissedClockinsWidget } from './components/widgets/MissedClockinsWidget';
import { TodayOverviewWidget } from './components/widgets/TodayOverviewWidget';
import { WeeklyStatsWidget } from './components/widgets/WeeklyStatsWidget';
import { CloudSyncWidget } from './components/widgets/CloudSyncWidget';
import { QuickRetroactiveWidget } from './components/widgets/QuickRetroactiveWidget';
import { MonthlyProgressWidget } from './components/widgets/MonthlyProgressWidget';

export default function App() {
  const { user } = useFirebase();

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payroll' | 'logs' | 'attendance' | 'reports' | 'cloud' | 'settings'>('dashboard');

  // Theme
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme());

  // Data state
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [account, setAccount] = useState<UserAccount>(loadUserAccount());
  const [activeSession, setActiveSession] = useState<ActiveSession>(loadActiveSession());
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgetConfigs());

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(isNetworkOnline());
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(isSimulatedOffline());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTimestamp());
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<TimeEntry | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [modalIsAbsentMode, setModalIsAbsentMode] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  // Initialize theme on HTML root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    persistTheme(theme);
  }, [theme]);

  // Load entries on mount
  const refreshEntriesFromStorage = useCallback(() => {
    const loaded = loadLocalEntries();
    setEntries(loaded);
    setPendingCount(getPendingMutations().length);
    setLastSyncTime(getLastSyncTimestamp());
  }, []);

  useEffect(() => {
    refreshEntriesFromStorage();
  }, [refreshEntriesFromStorage]);

  // Handle Online/Offline window events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(isNetworkOnline());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic and on-demand cloud sync
  const performSync = useCallback(async () => {
    if (!isNetworkOnline() || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncPendingMutations();
      if (res.success) {
        refreshEntriesFromStorage();
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshEntriesFromStorage]);

  // Sync on startup if online
  useEffect(() => {
    if (isOnline) {
      performSync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize account state when authenticated Firebase user changes
  useEffect(() => {
    if (user && user.email && account.email !== user.email) {
      setAccount(prev => {
        const updated: UserAccount = {
          ...prev,
          email: user.email || prev.email,
          name: user.displayName || prev.name,
          avatarUrl: user.photoURL || prev.avatarUrl
        };
        saveLocalAccount(updated);
        return updated;
      });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle Theme
  const handleToggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Toggle Simulated Offline
  const handleToggleSimulatedOffline = () => {
    const nextVal = !simulatedOffline;
    setSimulatedOffline(nextVal);
    setSimulatedOfflineState(nextVal);
    const effectiveOnline = isNetworkOnline();
    setIsOnline(effectiveOnline);
    if (effectiveOnline) {
      performSync();
    }
  };

  // Session Update
  const handleUpdateSession = (newSession: ActiveSession) => {
    setActiveSession(newSession);
    saveActiveSession(newSession);
  };

  // Punch Clock Out
  const handleClockOut = (newEntry: TimeEntry) => {
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveLocalEntries(updated, 'create', newEntry);
    setPendingCount(getPendingMutations().length);
    if (isOnline) {
      performSync();
    }
  };

  // Save/Update Time Entry from Modal
  const handleSaveEntry = (entry: TimeEntry) => {
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    let updated: TimeEntry[];
    let actionType: 'create' | 'update' = 'create';

    if (existingIndex >= 0) {
      actionType = 'update';
      updated = [...entries];
      updated[existingIndex] = entry;
    } else {
      actionType = 'create';
      updated = [entry, ...entries];
    }

    setEntries(updated);
    saveLocalEntries(updated, actionType, entry);
    setPendingCount(getPendingMutations().length);
    if (isOnline) {
      performSync();
    }
  };

  // Delete Entry
  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveLocalEntries(updated, 'delete', undefined, id);
    setPendingCount(getPendingMutations().length);
    if (isOnline) {
      performSync();
    }
  };

  // Quick Mark Absent
  const handleMarkAbsentQuick = (date: string, reason: AbsenceReason, note?: string) => {
    // Check if an entry exists for that date
    const existing = entries.find(e => e.date === date);
    const nowIso = new Date().toISOString();

    const absentEntry: TimeEntry = {
      id: existing ? existing.id : `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      startTime: '',
      endTime: '',
      breakMinutes: 0,
      totalMinutes: 0,
      category: 'Other',
      project: 'Leave / Absence',
      description: note || 'Marked absent due to missed clock-in',
      tags: ['AbsentRecord'],
      billable: false,
      hourlyRate: 0,
      isRetroactive: true,
      isAbsent: true,
      absenceReason: reason,
      absenceNote: note || 'Absent record recorded retrospectively',
      createdAt: existing ? existing.createdAt : nowIso,
      updatedAt: nowIso,
      syncStatus: 'pending'
    };

    handleSaveEntry(absentEntry);
  };

  // Open Retroactive Modal
  const handleOpenRetroactiveModal = (date?: string, existingEntry?: TimeEntry, absentMode = false) => {
    setModalInitialDate(date || new Date().toISOString().split('T')[0]);
    setSelectedEntryForEdit(existingEntry || null);
    setModalIsAbsentMode(absentMode);
    setIsEditModalOpen(true);
  };

  // Quick Toggle Absent to Worked (Retroactive conversion)
  const handleQuickToggleAbsent = (entry: TimeEntry) => {
    handleOpenRetroactiveModal(entry.date, entry, false);
  };

  // Save widgets configuration
  const handleSaveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    saveWidgetConfigs(newWidgets);
  };

  // Save Account Profile Updates
  const handleSaveAccount = (updatedAccount: UserAccount) => {
    setAccount(updatedAccount);
    saveLocalAccount(updatedAccount);
  };

  // Render specific widget component by ID
  const renderWidget = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'punch_clock':
        return (
          <PunchClockWidget
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onClockOut={handleClockOut}
            onOpenRetroactiveModal={(d) => handleOpenRetroactiveModal(d)}
            defaultHourlyRate={account.defaultHourlyRate}
          />
        );
      case 'missed_clockins':
        return (
          <MissedClockinsWidget
            entries={entries}
            onMarkAbsentQuick={(d, r) => handleMarkAbsentQuick(d, r)}
            onOpenRetroactiveModal={(d, existing) => handleOpenRetroactiveModal(d, existing)}
          />
        );
      case 'today_overview':
        return (
          <TodayOverviewWidget
            entries={entries}
            account={account}
          />
        );
      case 'weekly_stats':
        return (
          <WeeklyStatsWidget
            entries={entries}
            account={account}
          />
        );
      case 'cloud_sync':
        return (
          <CloudSyncWidget
            isOnline={isOnline}
            simulatedOffline={simulatedOffline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            lastSyncTime={lastSyncTime}
            onManualSync={performSync}
            onCreateBackup={async (desc) => {
              const res = await createCloudBackup(desc);
              return res.success;
            }}
            onNavigateCloudTab={() => setActiveTab('cloud')}
          />
        );
      case 'quick_retroactive':
        return (
          <QuickRetroactiveWidget
            onAddEntry={handleSaveEntry}
            defaultHourlyRate={account.defaultHourlyRate}
          />
        );
      case 'monthly_progress':
        return (
          <MonthlyProgressWidget
            entries={entries}
            account={account}
            onNavigateReports={() => setActiveTab('reports')}
          />
        );
      default:
        return null;
    }
  };

  // Sort widgets according to order
  const activeSortedWidgets = [...widgets]
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Bar */}
      <Navbar
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        account={account}
        userAccount={account}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        darkMode={theme === 'dark'}
        setDarkMode={(isDark) => setThemeState(isDark ? 'dark' : 'light')}
        isOnline={isOnline}
        simulatedOffline={simulatedOffline}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        onManualSync={performSync}
        lastSyncTime={lastSyncTime}
        onOpenAccountModal={() => setIsProfileModalOpen(true)}
        onOpenWidgetModal={() => setIsCustomizerOpen(true)}
        onReplaySplash={() => {
          setShowWelcome(false);
          setShowSplash(true);
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Offline notification banner if offline */}
        {!isOnline && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs sm:text-sm text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                <strong>Offline Data Entry Active:</strong> All punch clock actions, manual logs, and retroactive changes are stored locally and will sync to the cloud once reconnected.
              </span>
            </div>
            {simulatedOffline && (
              <button
                onClick={handleToggleSimulatedOffline}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:bg-amber-300 transition flex-shrink-0 ml-2"
              >
                Disable Simulation
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Dashboard with Customizable Widgets */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard top action bar */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Real-time punch clock, missed clock-in audits, and configurable widgets
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenRetroactiveModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Retroactive Entry</span>
                  <span className="sm:hidden">Log</span>
                </button>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {activeSortedWidgets.map(widget => (
                <div
                  key={widget.id}
                  className={`${widget.width === 'full' ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}
                >
                  {renderWidget(widget.id)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Semi-Monthly Payroll Audit & Computation */}
        {activeTab === 'payroll' && (
          <HalfMonthPayrollView
            entries={entries}
            account={account}
            onOpenRetroactiveModal={(date, entry) => {
              setSelectedEntryForEdit(entry || null);
              setModalInitialDate(date || new Date().toISOString().split('T')[0]);
              setModalIsAbsentMode(entry ? entry.isAbsent : false);
              setIsEditModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Fully Editable Time Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Time Logs & Retroactive Edits
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Audit, search, filter, and adjust past shifts with detailed manual categorization and tags.
              </p>
            </div>

            <TimeLogTable
              entries={entries}
              account={account}
              onEditEntry={(entry) => {
                setSelectedEntryForEdit(entry);
                setModalInitialDate(entry.date);
                setModalIsAbsentMode(entry.isAbsent);
                setIsEditModalOpen(true);
              }}
              onAddNewEntry={() => handleOpenRetroactiveModal()}
              onDeleteEntry={handleDeleteEntry}
              onQuickToggleAbsent={handleQuickToggleAbsent}
            />
          </div>
        )}

        {/* Tab 3: Attendance & Missed Clock-ins */}
        {activeTab === 'attendance' && (
          <AbsentManager
            entries={entries}
            onOpenRetroactiveModal={(date, existing) => handleOpenRetroactiveModal(date, existing)}
            onMarkAbsent={handleMarkAbsentQuick}
          />
        )}

        {/* Tab 4: Monthly Reports & PDF/CSV Export */}
        {activeTab === 'reports' && (
          <MonthlyReportView
            entries={entries}
            account={account}
          />
        )}

        {/* Tab 5: Settings & Profile (Account Synchronization, Widgets & Cloud Backups) */}
        {(activeTab === 'settings' || activeTab === 'cloud') && (
          <CloudSyncView
            isOnline={isOnline}
            simulatedOffline={simulatedOffline}
            onToggleSimulatedOffline={handleToggleSimulatedOffline}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onManualSync={performSync}
            entries={entries}
            account={account}
            onUpdateAccount={handleSaveAccount}
            onReloadEntries={refreshEntriesFromStorage}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            widgets={widgets}
            onSaveWidgets={handleSaveWidgets}
            onOpenWidgetModal={() => setIsCustomizerOpen(true)}
            theme={theme}
            onSetTheme={(t) => setThemeState(t)}
            onReplaySplash={() => {
              setShowWelcome(false);
              setShowSplash(true);
            }}
          />
        )}
      </main>

      {/* Retroactive Entry / Edit Modal */}
      <EntryEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEntryForEdit(null);
        }}
        onSave={handleSaveEntry}
        existingEntry={selectedEntryForEdit}
        initialDate={modalInitialDate}
        defaultHourlyRate={account.defaultHourlyRate}
        isAbsentMode={modalIsAbsentMode}
      />

      {/* Dashboard Widget Customizer Modal */}
      <WidgetCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        onSaveWidgets={handleSaveWidgets}
      />

      {/* Editable User Profile Modal with Picture Change & Animated Thumbnail */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        account={account}
        onSave={handleSaveAccount}
        theme={theme}
        onSetTheme={(t) => setThemeState(t)}
        onOpenWidgetModal={() => setIsCustomizerOpen(true)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        onManualSync={performSync}
        lastSyncTime={lastSyncTime}
      />

      {/* App Splash Screen with Tickr Logo */}
      {showSplash && (
        <SplashScreen 
          onFinish={() => {
            setShowSplash(false);
            setShowWelcome(true);
          }} 
        />
      )}

      {/* Welcome Screen: Flash Message "Hello [Name]" for logged in profile */}
      {showWelcome && !showSplash && (
        <WelcomeScreen
          profileName={user?.displayName || account.name || 'Alex Rivera'}
          avatarUrl={user?.photoURL || account.avatarUrl}
          role={account.role}
          department={account.department}
          company={account.company}
          email={user?.email || account.email}
          onFinish={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}
