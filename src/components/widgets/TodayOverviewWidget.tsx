import React from 'react';
import { CalendarCheck, DollarSign, Clock, Coffee, TrendingUp } from 'lucide-react';
import { TimeEntry, UserAccount } from '../../types';

interface TodayOverviewWidgetProps {
  entries: TimeEntry[];
  account: UserAccount;
}

export const TodayOverviewWidget: React.FC<TodayOverviewWidgetProps> = ({
  entries,
  account
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === todayIso && !e.isAbsent);

  const totalMinutesToday = todayEntries.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0);
  const totalBreaksToday = todayEntries.reduce((acc, curr) => acc + (curr.breakMinutes || 0), 0);

  const totalHoursToday = Math.round((totalMinutesToday / 60) * 10) / 10;
  const targetDailyHours = account?.dailyTargetHours || 8;
  const percentOfGoal = Math.min(100, Math.round((totalHoursToday / targetDailyHours) * 100));

  const regularHoursToday = Math.min(totalHoursToday, targetDailyHours);
  const overtimeHoursToday = Math.max(0, Math.round((totalHoursToday - targetDailyHours) * 10) / 10);

  const billableMinutesToday = todayEntries
    .filter(e => e.billable)
    .reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0);
  const billableEarningsToday = Math.round((billableMinutesToday / 60) * (account?.defaultHourlyRate || 85));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Today's Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {todayEntries.length} {todayEntries.length === 1 ? 'Shift' : 'Shifts'}
          </span>
        </div>

        {/* Big Metric Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Logged Today
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalHoursToday.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/ {targetDailyHours}h goal</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Billable Accrued
            </span>
            <div className="flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl font-bold">
                ₱{billableEarningsToday.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">PHP</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Daily Goal Progress</span>
            <span>{percentOfGoal}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${percentOfGoal}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Sub-Metrics Footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <div>
          <span className="text-[10px] text-slate-500 block">Regular</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{regularHoursToday.toFixed(1)}h</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Overtime</span>
          <span className={`text-xs font-semibold ${overtimeHoursToday > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
            {overtimeHoursToday.toFixed(1)}h
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Breaks</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{totalBreaksToday}m</span>
        </div>
      </div>
    </div>
  );
};
