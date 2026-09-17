import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimeEntry, UserAccount } from '../types';
import { generateSimpleTwoColumnPayrollPDF } from './payrollExportService';
import { loadPayrollConfig, loadHolidays } from './payrollService';

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  monthName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  billableHours: number;
  totalEarnings: number;
  presentDays: number;
  absentDays: number;
  retroactiveCount: number;
  entries: TimeEntry[];
  categoryBreakdown: { [category: string]: number };
  projectBreakdown: { [project: string]: number };
}

export function computeMonthlyStats(entries: TimeEntry[], year: number, month: number, account: UserAccount): MonthlyStats {
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const prefix = `${year}-${monthStr}`;

  const monthEntries = entries
    .filter(e => e.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let totalMinutes = 0;
  let regularMinutes = 0;
  let overtimeMinutes = 0;
  let billableMinutes = 0;
  let totalEarnings = 0;
  let absentDays = 0;
  let retroactiveCount = 0;

  const categoryBreakdown: { [category: string]: number } = {};
  const projectBreakdown: { [project: string]: number } = {};
  const presentDatesSet = new Set<string>();

  monthEntries.forEach(entry => {
    if (entry.isAbsent) {
      absentDays++;
      return;
    }

    if (entry.isRetroactive) {
      retroactiveCount++;
    }

    presentDatesSet.add(entry.date);
    const mins = entry.totalMinutes || 0;
    totalMinutes += mins;

    // Overtime rule: daily work > 8 hours (480 mins) counts as overtime
    if (mins > 480) {
      regularMinutes += 480;
      overtimeMinutes += mins - 480;
    } else {
      regularMinutes += mins;
    }

    const rate = entry.hourlyRate || account.defaultHourlyRate || 85;
    if (entry.billable) {
      billableMinutes += mins;
      totalEarnings += (mins / 60) * rate;
    }

    const cat = entry.category || 'General';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + mins / 60;

    const proj = entry.project || 'General';
    projectBreakdown[proj] = (projectBreakdown[proj] || 0) + mins / 60;
  });

  return {
    year,
    month,
    monthName: monthNames[month - 1] || 'Unknown',
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    regularHours: Math.round((regularMinutes / 60) * 100) / 100,
    overtimeHours: Math.round((overtimeMinutes / 60) * 100) / 100,
    billableHours: Math.round((billableMinutes / 60) * 100) / 100,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    presentDays: presentDatesSet.size,
    absentDays,
    retroactiveCount,
    entries: monthEntries,
    categoryBreakdown,
    projectBreakdown
  };
}

export function exportMonthlyCSV(stats: MonthlyStats, account: UserAccount): void {
  const headers = [
    'Date',
    'Day of Week',
    'Status',
    'Clock In',
    'Clock Out',
    'Break (Minutes)',
    'Total Hours',
    'Category',
    'Project',
    'Billable',
    'Hourly Rate (PHP)',
    'Est. Pay (PHP)',
    'Retroactive Adjustment',
    'Absence Reason',
    'Notes / Description'
  ];

  const escapeCSV = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map(escapeCSV).join(','));

  stats.entries.forEach(entry => {
    const dayDate = new Date(`${entry.date}T00:00:00`);
    const dayOfWeek = isNaN(dayDate.getTime())
      ? ''
      : dayDate.toLocaleDateString('en-US', { weekday: 'short' });

    let status = 'Present';
    if (entry.isAbsent) status = 'Absent';
    else if (!entry.endTime) status = 'In Progress';

    const hours = (entry.totalMinutes / 60).toFixed(2);
    const rate = entry.hourlyRate || account.defaultHourlyRate;
    const pay = entry.billable ? ((entry.totalMinutes / 60) * rate).toFixed(2) : '0.00';

    const row = [
      entry.date,
      dayOfWeek,
      status,
      entry.startTime || '--',
      entry.endTime || '--',
      entry.breakMinutes ?? 0,
      entry.isAbsent ? '0.00' : hours,
      entry.category,
      entry.project,
      entry.billable ? 'Yes' : 'No',
      rate,
      pay,
      entry.isRetroactive ? 'Yes' : 'No',
      entry.absenceReason || '',
      entry.isAbsent ? (entry.absenceNote || entry.description) : entry.description
    ];

    rows.push(row.map(escapeCSV).join(','));
  });

  // Append monthly summary rows at the bottom
  rows.push('');
  rows.push(['--- MONTHLY SUMMARY ---'].map(escapeCSV).join(','));
  rows.push(['Employee Name', account?.name || 'Employee', 'Account Email', account?.email || ''].map(escapeCSV).join(','));
  rows.push(['Month & Year', `${stats.monthName} ${stats.year}`].map(escapeCSV).join(','));
  rows.push(['Total Hours Worked', stats.totalHours.toFixed(2), 'Regular Hours', stats.regularHours.toFixed(2)].map(escapeCSV).join(','));
  rows.push(['Overtime Hours', stats.overtimeHours.toFixed(2), 'Billable Hours', stats.billableHours.toFixed(2)].map(escapeCSV).join(','));
  rows.push(['Total Billable Earnings (PHP)', `PHP ${stats.totalEarnings.toFixed(2)}`, 'Days Present', stats.presentDays].map(escapeCSV).join(','));
  rows.push(['Absent Days', stats.absentDays, 'Retroactive Adjustments', stats.retroactiveCount].map(escapeCSV).join(','));

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = (account?.name || 'Employee').replace(/\s+/g, '_');
  link.setAttribute('download', `TimeReport_${stats.year}_${stats.month < 10 ? '0' : ''}${stats.month}_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMonthlyPDF(stats: MonthlyStats, account: UserAccount): void {
  generateSimpleTwoColumnPayrollPDF({
    year: stats.year,
    month: stats.month,
    account,
    entries: stats.entries,
    config: loadPayrollConfig(),
    holidays: loadHolidays()
  });
}
