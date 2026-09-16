import React, { useState } from 'react';
import { 
  UserX, 
  CalendarX, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Calendar,
  FileQuestion,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { TimeEntry, AbsenceReason } from '../types';

interface AbsentManagerProps {
  entries: TimeEntry[];
  onOpenRetroactiveModal: (date: string, existingEntry?: TimeEntry) => void;
  onMarkAbsent: (date: string, reason: AbsenceReason, note: string) => void;
}

export const AbsentManager: React.FC<AbsentManagerProps> = ({
  entries,
  onOpenRetroactiveModal,
  onMarkAbsent
}) => {
  const [newAbsentDate, setNewAbsentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newAbsentReason, setNewAbsentReason] = useState<AbsenceReason>('forgot_to_clock_in');
  const [newAbsentNote, setNewAbsentNote] = useState<string>('');

  // Find missed weekdays in the last 21 days
  const getMissedDays = () => {
    const today = new Date();
    const missed: string[] = [];

    for (let i = 1; i <= 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekend

      const dateStr = d.toISOString().split('T')[0];
      const hasEntry = entries.some(e => e.date === dateStr);
      if (!hasEntry) {
        missed.push(dateStr);
      }
    }
    return missed;
  };

  const missedDays = getMissedDays();
  const absentEntries = entries.filter(e => e.isAbsent).sort((a, b) => b.date.localeCompare(a.date));

  const handleCreateAbsent = (e: React.FormEvent) => {
    e.preventDefault();
    onMarkAbsent(newAbsentDate, newAbsentReason, newAbsentNote);
    setNewAbsentNote('');
  };

  const formatReason = (reason?: AbsenceReason | null) => {
    switch (reason) {
      case 'forgot_to_clock_in': return 'Forgot to Clock In';
      case 'sick': return 'Sick Leave';
      case 'casual': return 'Casual / Personal Day';
      case 'vacation': return 'Planned Vacation';
      case 'unplanned': return 'Unplanned Absence';
      default: return 'Other Absence';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Attendance & Missed Clock-in Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit missed punches, mark authorized leaves, and retroactively resolve attendance with worked hours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-center px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block">Total Absences</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{absentEntries.length}</span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block">Pending Missed Days</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{missedDays.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Missed Days Scanner & Existing Absences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Missed Weekdays Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detected Missed Workdays ({missedDays.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Weekdays without attendance
              </span>
            </div>

            {missedDays.length > 0 ? (
              <div className="space-y-2.5">
                {missedDays.map(dateStr => {
                  const d = new Date(`${dateStr}T00:00:00`);
                  const formatted = isNaN(d.getTime()) 
                    ? dateStr 
                    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

                  return (
                    <div 
                      key={dateStr}
                      className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CalendarX className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatted}
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          No clock-in record found for this workday.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => onMarkAbsent(dateStr, 'forgot_to_clock_in', 'Forgot to clock in')}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Mark as Absent
                        </button>
                        <button
                          onClick={() => onOpenRetroactiveModal(dateStr)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                        >
                          <History className="w-3.5 h-3.5" />
                          Log Retroactive Shift
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Zero missed workdays in the last 21 days!
                </p>
                <p className="text-[11px] text-slate-400">
                  Every past Monday-Friday has attendance or authorized absence logged.
                </p>
              </div>
            )}
          </div>

          {/* Historical Absences & Retrospective Conversion */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Marked Absence Records ({absentEntries.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Did you actually work on any of these days? You can retroactively convert them back to worked hours anytime!
                </p>
              </div>
            </div>

            {absentEntries.length > 0 ? (
              <div className="space-y-2.5">
                {absentEntries.map(entry => (
                  <div 
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {entry.date}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {formatReason(entry.absenceReason)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {entry.absenceNote || entry.description || 'No explanation note provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => onOpenRetroactiveModal(entry.date, entry)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition border border-indigo-200 dark:border-indigo-800"
                        title="Convert absent mark back to worked shift retrospectively"
                      >
                        <History className="w-3.5 h-3.5" />
                        Convert to Worked Shift
                      </button>
                      <button
                        onClick={() => onOpenRetroactiveModal(entry.date, entry)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Edit absence details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No absences marked yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Manual Mark Absent Form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mark Absence for a Date
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Log sick leave, vacation, or missed clock-in
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateAbsent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Absence Date
                </label>
                <input
                  type="date"
                  required
                  value={newAbsentDate}
                  onChange={(e) => setNewAbsentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <select
                  value={newAbsentReason}
                  onChange={(e) => setNewAbsentReason(e.target.value as AbsenceReason)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="forgot_to_clock_in">Forgot to Clock In (Fix later)</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual / Personal Day</option>
                  <option value="vacation">Planned Vacation</option>
                  <option value="unplanned">Unplanned Emergency</option>
                  <option value="other">Other Absence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Documentation / Notes
                </label>
                <textarea
                  rows={3}
                  value={newAbsentNote}
                  onChange={(e) => setNewAbsentNote(e.target.value)}
                  placeholder="e.g., Doctor appointment, forgot badge at home..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-xs transition"
              >
                Confirm Absence Record
              </button>
            </form>
          </div>

          {/* Quick Help Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>How Retroactive Adjustment Works</span>
            </div>
            <p>
              If you forgot to clock in yesterday or last week, mark it as absent or leave it in the missed list. Whenever you recall your hours, click <strong>"Log Hours"</strong> or <strong>"Convert to Worked Shift"</strong> to retroactively record your exact arrival, departure, and break times.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
