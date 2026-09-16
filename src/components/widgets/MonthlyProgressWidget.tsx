import React from 'react';
import { Calendar, DollarSign, UserCheck, UserX, FileText, ArrowRight } from 'lucide-react';
import { TimeEntry, UserAccount } from '../../types';

interface MonthlyProgressWidgetProps {
  entries: TimeEntry[];
  account: UserAccount;
  onNavigateReports: () => void;
}

export const MonthlyProgressWidget: React.FC<MonthlyProgressWidgetProps> = ({
  entries,
  account,
  onNavigateReports
}) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });

  const monthEntries = entries.filter(e => e.date.startsWith(monthPrefix));
  
  let totalWorkedMinutes = 0;
  let billableMinutes = 0;
  let absentCount = 0;
  const presentDays = new Set<string>();

  monthEntries.forEach(e => {
    if (e.isAbsent) {
      absentCount++;
    } else {
      presentDays.add(e.date);
      const mins = e.totalMinutes || 0;
      totalWorkedMinutes += mins;
      if (e.billable) billableMinutes += mins;
    }
  });

  const totalWorkedHours = Math.round((totalWorkedMinutes / 60) * 10) / 10;
  const monthlyTargetHours = (account.weeklyTargetHours || 40) * 4; // 160h
  const progressPercent = Math.min(100, Math.round((totalWorkedHours / monthlyTargetHours) * 100));

  const totalEstimatedEarnings = Math.round((billableMinutes / 60) * (account.defaultHourlyRate || 85));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {monthName} {year} Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly Target: {monthlyTargetHours} hours
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {totalWorkedHours}h
            </span>
            <span className="text-xs text-slate-500"> / {monthlyTargetHours}h</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
            <span>Target Completion</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Billable Earnings</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              ₱{totalEstimatedEarnings.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Attendance Days</span>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">{presentDays.size} worked</span>
              <span className="text-slate-400">•</span>
              <span className="text-rose-600 dark:text-rose-400">{absentCount} absent</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onNavigateReports}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition"
        >
          <FileText className="w-3.5 h-3.5" />
          Generate Monthly PDF & CSV Report <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
