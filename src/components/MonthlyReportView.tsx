import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Clock, 
  DollarSign, 
  UserCheck, 
  UserX, 
  History,
  CheckCircle2,
  PieChart,
  Briefcase
} from 'lucide-react';
import { TimeEntry, UserAccount } from '../types';
import { computeMonthlyStats, exportMonthlyCSV, exportMonthlyPDF } from '../services/exportService';

interface MonthlyReportViewProps {
  entries: TimeEntry[];
  account: UserAccount;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  entries,
  account
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 9 = September
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  const [exportingCSV, setExportingCSV] = useState<boolean>(false);

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' }
  ];

  const years = [2025, 2026, 2027];

  const stats = useMemo(() => {
    return computeMonthlyStats(entries, selectedYear, selectedMonth, account);
  }, [entries, selectedYear, selectedMonth, account]);

  const handleExportPDF = () => {
    setExportingPDF(true);
    try {
      exportMonthlyPDF(stats, account);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setTimeout(() => setExportingPDF(false), 800);
    }
  };

  const handleExportCSV = () => {
    setExportingCSV(true);
    try {
      exportMonthlyCSV(stats, account);
    } catch (e) {
      console.error('CSV export failed', e);
    } finally {
      setTimeout(() => setExportingCSV(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Month/Year Selector & Export Buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Monthly Reports & Export
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate and download certified monthly timekeeping summaries in both PDF and CSV formats.
          </p>
        </div>

        {/* Controls: Month/Year and Download triggers */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Month picker */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            {months.map(m => (
              <option key={m.num} value={m.num}>{m.name}</option>
            ))}
          </select>

          {/* Year picker */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            id="btn-export-csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            title="Download CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{exportingCSV ? 'Generating...' : 'Export CSV'}</span>
          </button>

          {/* PDF Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            id="btn-export-pdf"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            title="Download formatted audit PDF"
          >
            <Download className="w-4 h-4" />
            <span>{exportingPDF ? 'Building PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Worked Time</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span>Regular: {stats.regularHours.toFixed(1)}h</span>
            <span>•</span>
            <span className={stats.overtimeHours > 0 ? 'text-amber-600 font-semibold' : ''}>
              OT: {stats.overtimeHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Billable Earnings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Billable Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ₱{stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.billableHours.toFixed(1)} billable hrs @ ₱{account.defaultHourlyRate}/h
          </div>
        </div>

        {/* Attendance Days */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Days Present / Absent</span>
            <UserCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.presentDays}d <span className="text-xs font-normal text-slate-500">present</span>
          </div>
          <div className="text-[11px] text-rose-500 mt-1 font-medium">
            {stats.absentDays} day(s) marked absent
          </div>
        </div>

        {/* Retroactive Adjustments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Retroactive Adjustments</span>
            <History className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {stats.retroactiveCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Retrospective corrections made
          </div>
        </div>
      </div>

      {/* Category Breakdown Table Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-500" />
            Category Summary for {stats.monthName} {stats.year}
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.categoryBreakdown).length > 0 ? (
              Object.entries(stats.categoryBreakdown).map(([cat, rawHours]) => {
                const hours = Number(rawHours);
                const pct = stats.totalHours > 0 ? ((hours / stats.totalHours) * 100).toFixed(1) : '0';
                return (
                  <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{hours.toFixed(1)}h</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-3">No category data for this month.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            Project Distribution for {stats.monthName} {stats.year}
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.projectBreakdown).length > 0 ? (
              Object.entries(stats.projectBreakdown).map(([proj, rawHours]) => {
                const hours = Number(rawHours);
                const pct = stats.totalHours > 0 ? ((hours / stats.totalHours) * 100).toFixed(1) : '0';
                return (
                  <div key={proj} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{proj}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{hours.toFixed(1)}h</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-3">No project data for this month.</p>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Entries Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Report Itemized Daily Log ({stats.entries.length} records)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Matches the exact contents included in the exported PDF and CSV files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleExportCSV}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Shift Times</th>
                <th className="py-2.5 px-3">Break</th>
                <th className="py-2.5 px-3">Hours</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.entries.length > 0 ? (
                stats.entries.map(e => (
                  <tr key={e.id} className={e.isAbsent ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {e.isAbsent ? '--' : `${e.startTime} - ${e.endTime || 'Active'}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {e.breakMinutes ? `${e.breakMinutes}m` : '0m'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {e.isAbsent ? '0.0h' : `${(e.totalMinutes / 60).toFixed(2)}h`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {e.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {e.project}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {e.isAbsent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          Absent ({e.absenceReason || 'Leave'})
                        </span>
                      ) : e.isRetroactive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Present (Retro)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Present
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {e.isAbsent ? (e.absenceNote || e.description) : e.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No time entries recorded for {stats.monthName} {stats.year}.
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
