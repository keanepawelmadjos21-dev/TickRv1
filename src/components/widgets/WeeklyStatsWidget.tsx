import React from 'react';
import { BarChart3, TrendingUp, Award } from 'lucide-react';
import { TimeEntry, UserAccount } from '../../types';

interface WeeklyStatsWidgetProps {
  entries: TimeEntry[];
  account: UserAccount;
}

export const WeeklyStatsWidget: React.FC<WeeklyStatsWidgetProps> = ({
  entries,
  account
}) => {
  // Get current week days (Mon-Sun)
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d.toISOString().split('T')[0]);
    }
    return week;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let totalWeekMinutes = 0;
  const targetDailyHours = account?.dailyTargetHours || 8;
  const targetWeeklyHours = account?.weeklyTargetHours || 40;

  const dayStats = weekDays.map((dateStr, idx) => {
    const dayEntries = entries.filter(e => e.date === dateStr);
    const isAbsent = dayEntries.some(e => e.isAbsent);
    const dayMinutes = dayEntries.reduce((acc, curr) => acc + (curr.isAbsent ? 0 : (curr.totalMinutes || 0)), 0);
    totalWeekMinutes += dayMinutes;
    const hours = Math.round((dayMinutes / 60) * 10) / 10;
    
    return {
      date: dateStr,
      dayName: dayNames[idx],
      hours,
      isAbsent,
      isOvertime: hours > targetDailyHours
    };
  });

  const totalWeekHours = Math.round((totalWeekMinutes / 60) * 10) / 10;
  const weekProgressPercent = Math.min(100, Math.round((totalWeekHours / targetWeeklyHours) * 100));
  const maxBarHeight = 10; // 10 hours scale

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Weekly Hours & Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current Week Workload
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {totalWeekHours.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500"> / {targetWeeklyHours}h</span>
          </div>
        </div>

        {/* 7-Day Bar Visualizer */}
        <div className="h-32 flex items-end justify-between gap-2 px-1 pt-4 pb-1">
          {dayStats.map((d, i) => {
            const heightPercent = Math.min(100, (d.hours / maxBarHeight) * 100);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-medium text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition">
                  {d.isAbsent ? 'Abs' : `${d.hours}h`}
                </span>
                
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md h-full flex items-end overflow-hidden relative">
                  {/* Daily 8h goal marker line */}
                  <div 
                    className="absolute w-full border-t border-dashed border-slate-300 dark:border-slate-600 z-10"
                    style={{ bottom: `${(targetDailyHours / maxBarHeight) * 100}%` }}
                    title={`Daily target: ${targetDailyHours}h`}
                  ></div>

                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      d.isAbsent
                        ? 'bg-rose-400 dark:bg-rose-500 h-2'
                        : d.isOvertime
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : d.hours > 0
                        ? 'bg-indigo-600 dark:bg-indigo-500'
                        : 'bg-transparent'
                    }`}
                    style={{ height: d.isAbsent ? '12px' : `${heightPercent}%` }}
                  ></div>
                </div>

                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1.5">
                  {d.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Progress Bar & Status */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-slate-500">Weekly Target Progress</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{weekProgressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-600 transition-all duration-500"
            style={{ width: `${weekProgressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
