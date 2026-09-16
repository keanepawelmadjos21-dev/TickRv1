import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Tag, 
  Briefcase, 
  FolderKanban, 
  DollarSign, 
  Trash2, 
  AlertCircle, 
  UserX,
  History,
  Check
} from 'lucide-react';
import { TimeEntry, AbsenceReason } from '../types';
import { CATEGORIES, PROJECTS } from '../services/storageService';

interface EntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimeEntry | null; // null means creating a new entry
  initialDate?: string;
  onSave: (entry: TimeEntry) => void;
  onDelete?: (id: string) => void;
  defaultHourlyRate: number;
}

export const EntryEditModal: React.FC<EntryEditModalProps> = ({
  isOpen,
  onClose,
  entry,
  initialDate,
  onSave,
  onDelete,
  defaultHourlyRate
}) => {
  const [date, setDate] = useState<string>('');
  const [isAbsent, setIsAbsent] = useState<boolean>(false);
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>('forgot_to_clock_in');
  const [absenceNote, setAbsenceNote] = useState<string>('');
  
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(45);
  
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [project, setProject] = useState<string>(PROJECTS[0]);
  const [customProject, setCustomProject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [billable, setBillable] = useState<boolean>(true);
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
  const [isRetroactive, setIsRetroactive] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    if (entry) {
      setDate(entry.date);
      setIsAbsent(entry.isAbsent || false);
      setAbsenceReason(entry.absenceReason || 'forgot_to_clock_in');
      setAbsenceNote(entry.absenceNote || '');
      setStartTime(entry.startTime || '09:00');
      setEndTime(entry.endTime || '17:00');
      setBreakMinutes(entry.breakMinutes ?? 45);
      
      if (CATEGORIES.includes(entry.category)) {
        setCategory(entry.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(entry.category);
      }

      if (PROJECTS.includes(entry.project)) {
        setProject(entry.project);
        setCustomProject('');
      } else {
        setProject('Other');
        setCustomProject(entry.project);
      }

      setDescription(entry.description || '');
      setTags(entry.tags || []);
      setBillable(entry.billable ?? true);
      setHourlyRate(entry.hourlyRate ?? defaultHourlyRate);
      setIsRetroactive(entry.isRetroactive ?? false);
    } else {
      // New entry
      const todayIso = new Date().toISOString().split('T')[0];
      const targetDate = initialDate || todayIso;
      setDate(targetDate);
      setIsAbsent(false);
      setAbsenceReason('forgot_to_clock_in');
      setAbsenceNote('');
      setStartTime('09:00');
      setEndTime('17:30');
      setBreakMinutes(45);
      setCategory(CATEGORIES[0]);
      setCustomCategory('');
      setProject(PROJECTS[0]);
      setCustomProject('');
      setDescription('');
      setTags([]);
      setBillable(true);
      setHourlyRate(defaultHourlyRate);
      // If logging for a past date, mark as retroactive automatically
      setIsRetroactive(targetDate < todayIso);
    }
  }, [isOpen, entry, initialDate, defaultHourlyRate]);

  if (!isOpen) return null;

  // Calculate duration
  const computeMinutes = (): number => {
    if (isAbsent) return 0;
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) {
      endTotal += 24 * 60; // Overnight shift
    }
    const diff = endTotal - startTotal - (breakMinutes || 0);
    return Math.max(0, diff);
  };

  const totalMinutes = computeMinutes();
  const hoursFormatted = (totalMinutes / 60).toFixed(2);
  const hoursInt = Math.floor(totalMinutes / 60);
  const minsInt = totalMinutes % 60;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
    const finalProject = project === 'Other' && customProject.trim() ? customProject.trim() : project;

    const savedEntry: TimeEntry = {
      id: entry ? entry.id : `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      startTime: isAbsent ? '' : startTime,
      endTime: isAbsent ? null : endTime,
      breakMinutes: isAbsent ? 0 : breakMinutes,
      totalMinutes,
      category: isAbsent ? 'Administration' : finalCategory,
      project: isAbsent ? 'General Operations' : finalProject,
      description: isAbsent ? (absenceNote || 'Marked as absent') : description,
      tags,
      billable: isAbsent ? false : billable,
      hourlyRate,
      isRetroactive: entry ? isRetroactive : (isRetroactive || date < new Date().toISOString().split('T')[0]),
      isAbsent,
      absenceReason: isAbsent ? absenceReason : null,
      absenceNote: isAbsent ? absenceNote : undefined,
      createdAt: entry ? entry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    };

    onSave(savedEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isAbsent ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'}`}>
              {isAbsent ? <UserX className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {entry ? 'Edit Time Log Entry' : 'New Retroactive / Manual Entry'}
                {isRetroactive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <History className="w-3 h-3" /> Retroactive
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAbsent ? 'Record absence with retroactive adjustment capability' : 'Log precise work shifts, categories, and retroactive adjustments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Status Switch: Worked Shift vs Marked Absent */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Attendance Mode
              </span>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {isAbsent ? 'Marked as Absent (No clock in)' : 'Logged Work Shift (Active/Worked)'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsAbsent(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  !isAbsent 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Worked Shift
              </button>
              <button
                type="button"
                onClick={() => setIsAbsent(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  isAbsent 
                    ? 'bg-rose-500 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Mark Absent
              </button>
            </div>
          </div>

          {/* Date Picker & Retroactive flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date (YYYY-MM-DD)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    const today = new Date().toISOString().split('T')[0];
                    if (e.target.value < today) {
                      setIsRetroactive(true);
                    }
                  }}
                  className="w-full px-3 py-2 pl-9 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center justify-between sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRetroactive}
                  onChange={(e) => setIsRetroactive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tag as Retroactive Adjustment
                </span>
              </label>
            </div>
          </div>

          {/* If Marked Absent, Show Reason & Notes */}
          {isAbsent ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
              <div>
                <label className="block text-xs font-medium text-rose-900 dark:text-rose-200 mb-1">
                  Reason for Absence / Missed Clock-In
                </label>
                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value as AbsenceReason)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="forgot_to_clock_in">Forgot to Clock In (Can retroactively add hours later)</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave / Personal Day</option>
                  <option value="vacation">Planned Vacation / Holiday</option>
                  <option value="unplanned">Unplanned Emergency</option>
                  <option value="other">Other Absence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-900 dark:text-rose-200 mb-1">
                  Absence Notes & Explanation
                </label>
                <textarea
                  rows={3}
                  value={absenceNote}
                  onChange={(e) => setAbsenceNote(e.target.value)}
                  placeholder="Provide documentation or reason for missing work or missing punch..."
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  You can always come back and switch this day from Absent to a worked shift with exact start and end times at any time.
                </p>
              </div>
            </div>
          ) : (
            /* Shift Times, Breaks, and Real-Time Duration */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Clock In Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Clock Out Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Break (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated Net Time Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-medium">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Computed Net Working Time:</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {hoursInt}h {minsInt}m
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                    ({hoursFormatted} hrs)
                  </span>
                </div>
              </div>

              {/* Category & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 pl-9 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Other">Custom Category...</option>
                    </select>
                    <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {category === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full px-3 py-2 pl-9 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="Other">Custom Project...</option>
                    </select>
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {project === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom project"
                      value={customProject}
                      onChange={(e) => setCustomProject(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  )}
                </div>
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Task Description & Work Log
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of tasks completed, meetings attended, or issues resolved..."
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tags & Metadata
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag (e.g. Sprint, Architecture, Review)"
                      className="w-full px-3 py-1.5 pl-8 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Billable & Hourly Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billable}
                      onChange={(e) => setBillable(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Billable Hours
                    </span>
                  </label>
                </div>

                {billable && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      Hourly Rate (₱)
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 pl-6 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <span className="text-xs font-bold text-slate-400 absolute left-2 top-2 select-none">₱</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            {entry && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this time entry?')) {
                    onDelete(entry.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Entry
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
