import React from 'react';
import { AlertTriangle, CalendarX, CheckCircle, History, UserX, Clock, ArrowRight } from 'lucide-react';
import { TimeEntry, AbsenceReason } from '../../types';

interface MissedClockinsWidgetProps {
  entries: TimeEntry[];
  onMarkAbsentQuick: (date: string, reason: AbsenceReason) => void;
  onOpenRetroactiveModal: (date: string, existingEntry?: TimeEntry) => void;
}

export const MissedClockinsWidget: React.FC<MissedClockinsWidgetProps> = ({
  entries,
  onMarkAbsentQuick,
  onOpenRetroactiveModal
}) => {
  // Compute missed past weekdays in current month up to yesterday
  const getMissedDays = () => {
    const today = new Date();
    const missed: string[] = [];

    // Check past 14 days
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = d.toISOString().split('T')[0];
      const hasEntry = entries.some(e => e.date === dateStr);
      if (!hasEntry) {
        missed.push(dateStr);
      }
    }
    return missed;
  };

  const missedDays = getMissedDays();

  // Find recently marked absent days that the user can retroactively adjust
  const recentAbsentDays = entries
    .filter(e => e.isAbsent)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${
              missedDays.length > 0 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {missedDays.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Attendance & Missed Clock-ins
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {missedDays.length > 0
                  ? `${missedDays.length} workday(s) missing punch-in records`
                  : 'All recent workdays recorded'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            missedDays.length > 0 
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
          }`}>
            {missedDays.length > 0 ? `${missedDays.length} Pending` : 'Up to Date'}
          </span>
        </div>

        {/* Missed Days List */}
        {missedDays.length > 0 ? (
          <div className="space-y-2 mt-3 max-h-[220px] overflow-y-auto pr-1">
            {missedDays.map(dateStr => {
              const d = new Date(`${dateStr}T00:00:00`);
              const formattedDate = isNaN(d.getTime()) 
                ? dateStr 
                : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div 
                  key={dateStr}
                  className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2">
                    <CalendarX className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {formattedDate}
                      </span>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Forgot to clock in or took a day off?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => onMarkAbsentQuick(dateStr, 'forgot_to_clock_in')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Mark this day as absent"
                    >
                      Mark Absent
                    </button>
                    <button
                      onClick={() => onOpenRetroactiveModal(dateStr)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1"
                      title="Log retroactive work hours for this date"
                    >
                      <History className="w-3 h-3" />
                      Log Hours
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              No missed clock-ins detected
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Every past weekday has attendance or leave recorded.
            </p>
          </div>
        )}

        {/* Recently Marked Absent Days that can be retroactively corrected */}
        {recentAbsentDays.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Recent Absences (Editable Retrospectively)
            </span>
            <div className="space-y-1.5">
              {recentAbsentDays.map(absent => (
                <div 
                  key={absent.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {absent.date}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      ({absent.absenceReason?.replace(/_/g, ' ') || 'Absent'})
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenRetroactiveModal(absent.date, absent)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    title="Actually worked that day? Convert absent record into hours worked"
                  >
                    <History className="w-3 h-3" />
                    Convert to Worked
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Retroactive adjustments are always allowed</span>
        <button
          onClick={() => onOpenRetroactiveModal(new Date().toISOString().split('T')[0])}
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
        >
          Add custom entry <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
