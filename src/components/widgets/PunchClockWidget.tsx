import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Coffee, 
  Clock, 
  History, 
  CheckCircle2, 
  Briefcase, 
  FolderKanban,
  Sparkles
} from 'lucide-react';
import { ActiveSession, CATEGORIES, PROJECTS } from '../../services/storageService';
import { TimeEntry } from '../../types';

interface PunchClockWidgetProps {
  session: ActiveSession;
  onUpdateSession: (newSession: ActiveSession) => void;
  onClockOut: (entry: TimeEntry) => void;
  onOpenRetroactiveModal: (date?: string) => void;
  defaultHourlyRate: number;
}

export const PunchClockWidget: React.FC<PunchClockWidgetProps> = ({
  session,
  onUpdateSession,
  onClockOut,
  onOpenRetroactiveModal,
  defaultHourlyRate
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [breakSeconds, setBreakSeconds] = useState<number>(0);

  // Live timer tick
  useEffect(() => {
    if (!session.isClockedIn) {
      setElapsedSeconds(0);
      setBreakSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const clockIn = new Date(session.clockInTime).getTime();
      const totalElapsed = Math.max(0, Math.floor((now - clockIn) / 1000));
      setElapsedSeconds(totalElapsed);

      if (session.isOnBreak && session.breakStartTime) {
        const breakStart = new Date(session.breakStartTime).getTime();
        setBreakSeconds(Math.max(0, Math.floor((now - breakStart) / 1000)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isClockedIn, session.clockInTime, session.isOnBreak, session.breakStartTime]);

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    const nowIso = new Date().toISOString();
    onUpdateSession({
      ...session,
      isClockedIn: true,
      clockInTime: nowIso,
      isOnBreak: false,
      breakStartTime: null,
      accumulatedBreakMinutes: 0
    });
  };

  const handleToggleBreak = () => {
    if (!session.isOnBreak) {
      // Start break
      onUpdateSession({
        ...session,
        isOnBreak: true,
        breakStartTime: new Date().toISOString()
      });
    } else {
      // End break
      const breakStart = session.breakStartTime ? new Date(session.breakStartTime).getTime() : Date.now();
      const additionalMins = Math.max(1, Math.round((Date.now() - breakStart) / 60000));
      onUpdateSession({
        ...session,
        isOnBreak: false,
        breakStartTime: null,
        accumulatedBreakMinutes: session.accumulatedBreakMinutes + additionalMins
      });
    }
  };

  const handleClockOut = () => {
    if (!session.isClockedIn) return;

    const now = new Date();
    const clockInDate = new Date(session.clockInTime);
    const dateStr = clockInDate.toISOString().split('T')[0];

    const startH = clockInDate.getHours().toString().padStart(2, '0');
    const startM = clockInDate.getMinutes().toString().padStart(2, '0');
    const endH = now.getHours().toString().padStart(2, '0');
    const endM = now.getMinutes().toString().padStart(2, '0');

    // Calculate total break
    let totalBreaks = session.accumulatedBreakMinutes;
    if (session.isOnBreak && session.breakStartTime) {
      const breakStart = new Date(session.breakStartTime).getTime();
      totalBreaks += Math.max(1, Math.round((Date.now() - breakStart) / 60000));
    }

    const totalMinElapsed = Math.max(0, Math.round((now.getTime() - clockInDate.getTime()) / 60000) - totalBreaks);

    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: dateStr,
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
      breakMinutes: totalBreaks,
      totalMinutes: totalMinElapsed,
      category: session.category || CATEGORIES[0],
      project: session.project || PROJECTS[0],
      description: session.description || 'Daily shift completed via punch clock',
      tags: ['LivePunch'],
      billable: session.billable ?? true,
      hourlyRate: defaultHourlyRate,
      isRetroactive: false,
      isAbsent: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      syncStatus: 'pending'
    };

    onClockOut(newEntry);

    // Reset session
    onUpdateSession({
      isClockedIn: false,
      clockInTime: '',
      isOnBreak: false,
      breakStartTime: null,
      accumulatedBreakMinutes: 0,
      category: session.category,
      project: session.project,
      description: '',
      billable: session.billable
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header & Status Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${
              session.isClockedIn 
                ? session.isOnBreak 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Punch Clock
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {session.isClockedIn 
                  ? session.isOnBreak ? 'On Break' : 'Currently Working' 
                  : 'Off Clock'}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            session.isClockedIn
              ? session.isOnBreak
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              session.isClockedIn
                ? session.isOnBreak ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'
                : 'bg-slate-400'
            }`}></span>
            {session.isClockedIn ? (session.isOnBreak ? 'Break' : 'Active') : 'Idle'}
          </span>
        </div>

        {/* Digital Time Display */}
        <div className="text-center py-4 px-3 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">
            {session.isClockedIn ? formatSeconds(elapsedSeconds) : '00:00:00'}
          </div>
          {session.isClockedIn && (
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Clock In: {new Date(session.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {session.accumulatedBreakMinutes > 0 && (
                <span>Breaks: {session.accumulatedBreakMinutes}m</span>
              )}
            </div>
          )}
        </div>

        {/* Active Shift Category & Project Selector */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FolderKanban className="w-3 h-3" /> Category
            </label>
            <select
              value={session.category}
              onChange={(e) => onUpdateSession({ ...session, category: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Project
            </label>
            <select
              value={session.project}
              onChange={(e) => onUpdateSession({ ...session, project: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 space-y-2">
        {!session.isClockedIn ? (
          <button
            onClick={handleClockIn}
            id="btn-clock-in"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            Clock In Now
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleBreak}
              id="btn-toggle-break"
              className={`py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm border transition flex items-center justify-center gap-1.5 ${
                session.isOnBreak
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Coffee className="w-4 h-4" />
              {session.isOnBreak ? 'Resume Work' : 'Take Break'}
            </button>

            <button
              onClick={handleClockOut}
              id="btn-clock-out"
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              Clock Out
            </button>
          </div>
        )}

        {/* Forgot to clock in retroactive link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => onOpenRetroactiveModal()}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <History className="w-3.5 h-3.5" />
            Forgot to clock in? Add Retroactive Entry
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            ₱{defaultHourlyRate}/hr rate
          </span>
        </div>
      </div>
    </div>
  );
};
