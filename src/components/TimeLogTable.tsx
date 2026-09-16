import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  History, 
  UserX, 
  CheckCircle2, 
  DollarSign, 
  Tag, 
  Download,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { TimeEntry, UserAccount } from '../types';
import { CATEGORIES, PROJECTS } from '../services/storageService';

interface TimeLogTableProps {
  entries: TimeEntry[];
  account: UserAccount;
  onEditEntry: (entry: TimeEntry) => void;
  onAddNewEntry: () => void;
  onDeleteEntry: (id: string) => void;
  onQuickToggleAbsent: (entry: TimeEntry) => void;
}

export const TimeLogTable: React.FC<TimeLogTableProps> = ({
  entries,
  account,
  onEditEntry,
  onAddNewEntry,
  onDeleteEntry,
  onQuickToggleAbsent
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'worked' | 'retroactive' | 'absent'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Generate list of unique months available in entries
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      if (e.date) {
        set.add(e.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [entries]);

  // Filtered and sorted entries (newest first)
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = entry.description?.toLowerCase().includes(q);
        const matchesCategory = entry.category?.toLowerCase().includes(q);
        const matchesProject = entry.project?.toLowerCase().includes(q);
        const matchesDate = entry.date?.includes(q);
        const matchesTags = entry.tags?.some(t => t.toLowerCase().includes(q));
        const matchesNote = entry.absenceNote?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesCategory && !matchesProject && !matchesDate && !matchesTags && !matchesNote) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'All' && entry.category !== selectedCategory) {
        return false;
      }

      // Project filter
      if (selectedProject !== 'All' && entry.project !== selectedProject) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'worked' && entry.isAbsent) return false;
      if (selectedStatus === 'retroactive' && (!entry.isRetroactive || entry.isAbsent)) return false;
      if (selectedStatus === 'absent' && !entry.isAbsent) return false;

      // Month filter
      if (selectedMonth !== 'all' && !entry.date.startsWith(selectedMonth)) {
        return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchQuery, selectedCategory, selectedProject, selectedStatus, selectedMonth]);

  // Totals for filtered view
  const summary = useMemo(() => {
    let totalMins = 0;
    let billableMins = 0;
    let retroCount = 0;
    let absentCount = 0;

    filteredEntries.forEach(e => {
      if (e.isAbsent) {
        absentCount++;
      } else {
        totalMins += e.totalMinutes || 0;
        if (e.billable) billableMins += e.totalMinutes || 0;
        if (e.isRetroactive) retroCount++;
      }
    });

    const totalHours = Math.round((totalMins / 60) * 10) / 10;
    const billableEarnings = Math.round((billableMins / 60) * (account?.defaultHourlyRate || 85));

    return {
      totalHours,
      billableEarnings,
      retroCount,
      absentCount,
      count: filteredEntries.length
    };
  }, [filteredEntries, account]);

  return (
    <div className="space-y-4">
      {/* Top action bar: Search, Filters, and New Retroactive Entry */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search time logs by task, project, category, tag, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* New Entry Button */}
          <button
            onClick={onAddNewEntry}
            id="btn-add-retroactive-entry"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-sm transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Retroactive / Manual Log
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Months</option>
            {availableMonths.map(m => {
              const [y, mon] = m.split('-');
              const d = new Date(parseInt(y), parseInt(mon) - 1, 1);
              const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="worked">Worked Shifts</option>
            <option value="retroactive">Retroactive Only</option>
            <option value="absent">Marked Absent Only</option>
          </select>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Project selector */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Projects</option>
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-4">
          <span>Showing <strong>{summary.count}</strong> records</span>
          <span>Total: <strong>{summary.totalHours} hrs</strong></span>
          <span>Billable: <strong className="text-emerald-600 dark:text-emerald-400">₱{summary.billableEarnings.toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          {summary.retroCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <History className="w-3.5 h-3.5" /> {summary.retroCount} Retroactive
            </span>
          )}
          {summary.absentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <UserX className="w-3.5 h-3.5" /> {summary.absentCount} Absent
            </span>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Time & Breaks</th>
                <th className="py-3 px-3">Hours</th>
                <th className="py-3 px-4">Category & Project</th>
                <th className="py-3 px-4">Description / Notes</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.length > 0 ? (
                filteredEntries.map(entry => {
                  const d = new Date(`${entry.date}T00:00:00`);
                  const dayOfWeek = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' });
                  const hours = Math.floor((entry.totalMinutes || 0) / 60);
                  const mins = (entry.totalMinutes || 0) % 60;

                  return (
                    <tr 
                      key={entry.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        entry.isAbsent ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {entry.date}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {dayOfWeek}
                        </span>
                      </td>

                      {/* Time & Breaks */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {entry.isAbsent ? (
                          <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                            No punch recorded
                          </span>
                        ) : (
                          <div>
                            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {entry.startTime} → {entry.endTime || 'In Progress'}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {entry.breakMinutes > 0 ? `${entry.breakMinutes}m break` : 'No breaks'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Hours */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {entry.isAbsent ? (
                          <span className="text-xs text-slate-400 font-mono">0.0h</span>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                              {hours}h {mins}m
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {((entry.totalMinutes || 0) / 60).toFixed(2)} hrs
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Category & Project */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                            {entry.category}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {entry.project}
                          </div>
                        </div>
                      </td>

                      {/* Description & Tags */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                          {entry.isAbsent ? (entry.absenceNote || 'Marked as absent') : (entry.description || '--')}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          {entry.isAbsent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              <UserX className="w-3 h-3" /> Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Present
                            </span>
                          )}

                          {entry.isRetroactive && (
                            <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              • Retroactive Adjust
                            </span>
                          )}

                          {entry.billable && !entry.isAbsent && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              • Billable (₱{entry.hourlyRate || account?.defaultHourlyRate || 85}/h)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Convert button if absent */}
                          {entry.isAbsent && (
                            <button
                              onClick={() => onQuickToggleAbsent(entry)}
                              title="Convert absent mark back into worked hours retrospectively"
                              className="px-2 py-1 text-[11px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
                            >
                              Log Hours
                            </button>
                          )}

                          {/* Edit Modal Button */}
                          <button
                            onClick={() => onEditEntry(entry)}
                            title="Edit entry details and retroactive adjustments"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm('Delete this time entry permanently?')) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            title="Delete entry"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      No matching time entries found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Adjust your search query or filters, or add a retroactive entry.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
