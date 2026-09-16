import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { TimeEntry, CloudBackupSnapshot, UserAccount, WidgetConfig } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Initial default cloud database state
let cloudAccount: UserAccount = {
  id: 'usr_default_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@enterprise.io',
  role: 'Senior Product Engineer',
  department: 'Product & Systems',
  defaultHourlyRate: 85,
  weeklyTargetHours: 40,
  dailyTargetHours: 8,
  timezone: 'America/Los_Angeles',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

// Seed realistic September 2026 entries leading up to today (Sep 16, 2026)
let cloudEntries: TimeEntry[] = [
  {
    id: 'entry-2026-09-01-1',
    date: '2026-09-01',
    startTime: '08:45',
    endTime: '17:15',
    breakMinutes: 45,
    totalMinutes: 465, // 7h 45m
    category: 'Software Engineering',
    project: 'Core Architecture',
    description: 'Refactoring database synchronization pipeline and offline mutation queue.',
    tags: ['Architecture', 'Performance'],
    billable: true,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-01T08:45:00Z',
    updatedAt: '2026-09-01T17:15:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-02-1',
    date: '2026-09-02',
    startTime: '09:00',
    endTime: '17:30',
    breakMinutes: 60,
    totalMinutes: 450, // 7.5h
    category: 'Client Consultation',
    project: 'Client Portal V2',
    description: 'Sprint planning and architecture review with client stakeholders.',
    tags: ['Meeting', 'Client'],
    billable: true,
    hourlyRate: 95,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-02T17:30:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-03-1',
    date: '2026-09-03',
    startTime: '08:30',
    endTime: '17:00',
    breakMinutes: 45,
    totalMinutes: 465, // 7h 45m
    category: 'Software Engineering',
    project: 'Core Architecture',
    description: 'Implementation of custom widget layout engine and persistent state.',
    tags: ['Frontend', 'Vite'],
    billable: true,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-03T08:30:00Z',
    updatedAt: '2026-09-03T17:00:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-04-1',
    date: '2026-09-04',
    startTime: '09:15',
    endTime: '18:00',
    breakMinutes: 60,
    totalMinutes: 465, // 7h 45m
    category: 'Design & UX',
    project: 'Design System',
    description: 'Dark mode color scheme calibration and high contrast component auditing.',
    tags: ['UI', 'Accessibility'],
    billable: true,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-04T09:15:00Z',
    updatedAt: '2026-09-04T18:00:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-07-1',
    date: '2026-09-07',
    startTime: '08:30',
    endTime: '17:30',
    breakMinutes: 60,
    totalMinutes: 480, // 8.0h
    category: 'Software Engineering',
    project: 'Core Architecture',
    description: 'Export engine development: PDF layout generator and RFC-compliant CSV formatter.',
    tags: ['Export', 'PDF', 'CSV'],
    billable: true,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-07T08:30:00Z',
    updatedAt: '2026-09-07T17:30:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-08-1',
    date: '2026-09-08',
    startTime: '09:00',
    endTime: '18:30',
    breakMinutes: 45,
    totalMinutes: 525, // 8h 45m (Overtime)
    category: 'Client Consultation',
    project: 'Client Portal V2',
    description: 'Security audit remediation and retroactive log review with client compliance team.',
    tags: ['Security', 'Audit'],
    billable: true,
    hourlyRate: 95,
    isRetroactive: true,
    isAbsent: false,
    createdAt: '2026-09-08T09:00:00Z',
    updatedAt: '2026-09-08T19:00:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-09-1',
    date: '2026-09-09',
    startTime: '08:45',
    endTime: '17:15',
    breakMinutes: 45,
    totalMinutes: 465,
    category: 'Internal Operations',
    project: 'Q3 Infrastructure',
    description: 'Team all-hands, weekly planning, and performance 1-on-1 reviews.',
    tags: ['Operations', 'Team'],
    billable: false,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-09T08:45:00Z',
    updatedAt: '2026-09-09T17:15:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-10-1',
    date: '2026-09-10',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 60,
    totalMinutes: 0,
    category: 'Administration',
    project: 'General',
    description: 'Out for medical appointment. Marked as sick leave.',
    tags: ['Leave'],
    billable: false,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: true,
    absenceReason: 'sick',
    absenceNote: 'Medical appointment & recovery.',
    createdAt: '2026-09-10T09:00:00Z',
    updatedAt: '2026-09-10T09:00:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-11-1',
    date: '2026-09-11',
    startTime: '08:30',
    endTime: '16:45',
    breakMinutes: 45,
    totalMinutes: 450, // 7.5h
    category: 'Software Engineering',
    project: 'Core Architecture',
    description: 'Retroactive attendance resolution mechanism and missed clock-in detection.',
    tags: ['Feature', 'Attendance'],
    billable: true,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-11T08:30:00Z',
    updatedAt: '2026-09-11T16:45:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-14-1',
    date: '2026-09-14',
    startTime: '08:50',
    endTime: '17:20',
    breakMinutes: 45,
    totalMinutes: 465, // 7h 45m
    category: 'Research & Dev',
    project: 'App Modernization',
    description: 'Benchmarking client-side IndexedDB caching and sync resolution speed.',
    tags: ['Research', 'Storage'],
    billable: true,
    hourlyRate: 85,
    isRetroactive: false,
    isAbsent: false,
    createdAt: '2026-09-14T08:50:00Z',
    updatedAt: '2026-09-14T17:20:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'entry-2026-09-15-1',
    date: '2026-09-15',
    startTime: '09:00',
    endTime: '17:30',
    breakMinutes: 50,
    totalMinutes: 460, // 7h 40m
    category: 'Software Engineering',
    project: 'Client Portal V2',
    description: 'Retroactively adjusted punch times: forgot to clock in morning arrival; verified commits.',
    tags: ['Adjustment', 'Retroactive'],
    billable: true,
    hourlyRate: 95,
    isRetroactive: true,
    isAbsent: false,
    createdAt: '2026-09-15T18:00:00Z',
    updatedAt: '2026-09-15T18:15:00Z',
    syncStatus: 'synced'
  }
];

let cloudBackups: CloudBackupSnapshot[] = [
  {
    id: 'backup_snap_20260914',
    timestamp: '2026-09-14T18:00:00Z',
    accountEmail: cloudAccount.email,
    accountName: cloudAccount.name,
    entryCount: 10,
    totalHours: 68.5,
    description: 'Pre-sprint cloud synchronization automated snapshot',
    data: {
      entries: [...cloudEntries],
      categories: ['Software Engineering', 'Client Consultation', 'Design & UX', 'Internal Operations', 'Research & Dev', 'Administration'],
      projects: ['Core Architecture', 'Client Portal V2', 'Design System', 'Q3 Infrastructure', 'App Modernization', 'General'],
      account: { ...cloudAccount },
      widgetConfig: []
    }
  }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    entriesCount: cloudEntries.length,
    backupsCount: cloudBackups.length,
    account: cloudAccount.email
  });
});

// Profile / Account
app.get('/api/account', (req, res) => {
  res.json({ account: cloudAccount });
});

app.post('/api/account', (req, res) => {
  const updated = req.body;
  cloudAccount = { ...cloudAccount, ...updated };
  res.json({ success: true, account: cloudAccount });
});

// Sync Endpoint (Receives client offline queue / mutations and returns latest merged records)
app.post('/api/sync', (req, res) => {
  const { entries: clientEntries, lastSyncTime } = req.body as { entries?: TimeEntry[]; lastSyncTime?: string };

  if (Array.isArray(clientEntries) && clientEntries.length > 0) {
    // Merge client entries: if entry exists and client version is newer, update; else insert
    const entryMap = new Map<string, TimeEntry>();
    cloudEntries.forEach(e => entryMap.set(e.id, e));

    clientEntries.forEach(clientEntry => {
      const existing = entryMap.get(clientEntry.id);
      if (!existing) {
        entryMap.set(clientEntry.id, { ...clientEntry, syncStatus: 'synced' });
      } else {
        const clientUpdated = new Date(clientEntry.updatedAt || 0).getTime();
        const existingUpdated = new Date(existing.updatedAt || 0).getTime();
        if (clientUpdated >= existingUpdated) {
          entryMap.set(clientEntry.id, { ...clientEntry, syncStatus: 'synced' });
        }
      }
    });

    cloudEntries = Array.from(entryMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    syncedCount: cloudEntries.length,
    entries: cloudEntries
  });
});

// Backup Endpoints
app.get('/api/backups', (req, res) => {
  const summaries = cloudBackups.map(b => ({
    id: b.id,
    timestamp: b.timestamp,
    accountEmail: b.accountEmail,
    accountName: b.accountName,
    entryCount: b.entryCount,
    totalHours: b.totalHours,
    description: b.description
  }));
  res.json({ backups: summaries });
});

app.post('/api/backups', (req, res) => {
  const { description, entries, account, categories, projects, widgetConfig } = req.body;
  const currentEntries = Array.isArray(entries) && entries.length > 0 ? entries : cloudEntries;
  const currentAccount = account || cloudAccount;

  const totalMinutes = currentEntries.reduce((acc: number, cur: TimeEntry) => acc + (cur.totalMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const snapshot: CloudBackupSnapshot = {
    id: `snap_${Date.now()}`,
    timestamp: new Date().toISOString(),
    accountEmail: currentAccount.email,
    accountName: currentAccount.name,
    entryCount: currentEntries.length,
    totalHours,
    description: description || `Cloud Snapshot (${new Date().toLocaleDateString()})`,
    data: {
      entries: currentEntries,
      categories: categories || ['Software Engineering', 'Client Consultation', 'Design & UX', 'Internal Operations', 'Research & Dev', 'Administration'],
      projects: projects || ['Core Architecture', 'Client Portal V2', 'Design System', 'Q3 Infrastructure', 'App Modernization', 'General'],
      account: currentAccount,
      widgetConfig: widgetConfig || []
    }
  };

  cloudBackups.unshift(snapshot);
  res.json({ success: true, backup: snapshot });
});

app.post('/api/backups/restore/:id', (req, res) => {
  const { id } = req.params;
  const snapshot = cloudBackups.find(b => b.id === id);

  if (!snapshot) {
    res.status(404).json({ success: false, error: 'Backup snapshot not found' });
    return;
  }

  cloudEntries = [...snapshot.data.entries];
  if (snapshot.data.account) {
    cloudAccount = { ...snapshot.data.account };
  }

  res.json({
    success: true,
    message: 'Backup successfully restored from cloud',
    snapshot
  });
});

app.delete('/api/backups/:id', (req, res) => {
  const { id } = req.params;
  cloudBackups = cloudBackups.filter(b => b.id !== id);
  res.json({ success: true, message: 'Backup snapshot deleted' });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daily Time Keeper server running on port ${PORT}`);
  });
}

startServer();
