import React, { useState } from 'react';
import { History, Plus, Check, Clock } from 'lucide-react';
import { TimeEntry } from '../../types';
import { CATEGORIES, PROJECTS } from '../../services/storageService';

interface QuickRetroactiveWidgetProps {
  onAddEntry: (entry: TimeEntry) => void;
  defaultHourlyRate: number;
}

export const QuickRetroactiveWidget: React.FC<QuickRetroactiveWidgetProps> = ({
  onAddEntry,
  defaultHourlyRate
}) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultDate = yesterday.toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:30');
  const [breakMins, setBreakMins] = useState<number>(45);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [project, setProject] = useState<string>(PROJECTS[0]);
  const [description, setDescription] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const calculateTotalMinutes = () => {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    let start = sH * 60 + sM;
    let end = eH * 60 + eM;
    if (end < start) end += 24 * 60;
    return Math.max(0, end - start - breakMins);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = calculateTotalMinutes();

    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      startTime,
      endTime,
      breakMinutes: breakMins,
      totalMinutes,
      category,
      project,
      description: description.trim() || 'Retroactive shift adjustment logged via quick widget',
      tags: ['RetroactiveQuick'],
      billable: true,
      hourlyRate: defaultHourlyRate,
      isRetroactive: true,
      isAbsent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    };

    onAddEntry(newEntry);
    setSavedSuccess(true);
    setDescription('');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Quick Retroactive Entry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log missed or forgotten past shift
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
            Retroactive
          </span>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white truncate"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                In
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Out
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Break
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={breakMins}
                onChange={(e) => setBreakMins(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Task summary / notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                Retroactive Shift Logged!
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Record Retroactive Shift ({(calculateTotalMinutes() / 60).toFixed(1)}h)
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-2 text-[11px] text-slate-500 text-center">
        Full retroactive editor with tag management available in Time Logs
      </div>
    </div>
  );
};
