import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimeEntry, UserAccount } from '../types';

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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const accentColor: [number, number, number] = [2, 132, 199]; // Sky 600
  const textDark: [number, number, number] = [15, 23, 42]; // Slate 900
  const textMuted: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTHLY TIMEKEEPING & ATTENDANCE REPORT', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${stats.monthName.toUpperCase()} ${stats.year} • EMPLOYEE TIME LOG & AUDIT STATEMENT`, 14, 21);

  // 2. Account Details Section
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Name: ${account?.name || 'Employee'}`, 14, 44);
  doc.text(`Email: ${account?.email || ''}`, 14, 49);
  doc.text(`Role / Dept: ${account?.role || 'Staff'} • ${account?.department || 'Operations'}`, 14, 54);

  doc.text(`Generated: ${new Date().toLocaleString()}`, 120, 44);
  doc.text(`Hourly Billing Rate: PHP ${account?.defaultHourlyRate ?? 85}/hr`, 120, 49);
  doc.text(`Weekly Target: ${account?.weeklyTargetHours ?? 40} hrs`, 120, 54);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 59, 196, 59);

  // 3. Four Metric Summary Cards
  const cardY = 63;
  const cardWidth = 43;
  const cardHeight = 22;

  // Box 1: Total Hours
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('TOTAL WORKED', 18, cardY + 7);
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text(`${stats.totalHours.toFixed(1)} hrs`, 18, cardY + 16);

  // Box 2: Regular vs Overtime
  doc.roundedRect(60, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('REGULAR / OVERTIME', 64, cardY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text(`${stats.regularHours.toFixed(1)} / ${stats.overtimeHours.toFixed(1)}h`, 64, cardY + 16);

  // Box 3: Total Earnings / Billable
  doc.roundedRect(106, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('BILLABLE EARNINGS', 110, cardY + 7);
  doc.setFontSize(13);
  doc.setTextColor(16, 149, 102); // Green
  doc.setFont('helvetica', 'bold');
  doc.text(`PHP ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 110, cardY + 16);

  // Box 4: Attendance / Absent
  doc.roundedRect(152, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('ATTENDANCE (PRESENT/ABSENT)', 156, cardY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text(`${stats.presentDays}d / ${stats.absentDays}d absent`, 156, cardY + 16);

  // 4. Category & Project Breakdown Section
  let tableStartY = 92;
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Workload Categorization Summary', 14, tableStartY);

  const categoryRows = Object.entries(stats.categoryBreakdown).map(([cat, hours]) => {
    const pct = stats.totalHours > 0 ? ((hours / stats.totalHours) * 100).toFixed(1) : '0';
    return [cat, `${hours.toFixed(1)} hrs`, `${pct}%`];
  });

  autoTable(doc, {
    startY: tableStartY + 3,
    head: [['Category', 'Recorded Time', '% of Monthly Total']],
    body: categoryRows.length > 0 ? categoryRows : [['No categories logged', '0.0 hrs', '0%']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: 14, right: 14 }
  });

  // 5. Detailed Daily Time Log
  // @ts-ignore
  const lastTableEnd = (doc as any).lastAutoTable?.finalY || 130;
  const logStartY = lastTableEnd + 10;

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Daily Time Entries & Attendance Records', 14, logStartY);

  const detailRows = stats.entries.map(e => {
    const dayDate = new Date(`${e.date}T00:00:00`);
    const dayName = isNaN(dayDate.getTime()) ? '' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    let statusText = 'Present';
    if (e.isAbsent) statusText = `Absent (${e.absenceReason || 'N/A'})`;
    else if (e.isRetroactive) statusText = 'Present (Retro)';

    const hours = e.isAbsent ? '0.0' : (e.totalMinutes / 60).toFixed(2);
    const times = e.isAbsent ? '--' : `${e.startTime} - ${e.endTime || 'Active'}`;

    return [
      `${e.date} (${dayName})`,
      times,
      e.breakMinutes ? `${e.breakMinutes}m` : '0m',
      `${hours}h`,
      e.category || '--',
      e.project || '--',
      statusText,
      e.description || e.absenceNote || '--'
    ];
  });

  autoTable(doc, {
    startY: logStartY + 3,
    head: [['Date', 'Shift (In - Out)', 'Break', 'Hours', 'Category', 'Project', 'Status', 'Description / Note']],
    body: detailRows.length > 0 ? detailRows : [['No entries recorded for this month', '', '', '', '', '', '', '']],
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 24 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 26 },
      5: { cellWidth: 24 },
      6: { cellWidth: 22 },
      7: { cellWidth: 34 }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text(
        `Daily Time Keeper • Confidential Audit Report • Page ${data.pageNumber} of ${pageCount}`,
        14,
        290
      );
    }
  });

  const safePdfName = (account?.name || 'Employee').replace(/\s+/g, '_');
  const filename = `TimeReport_${stats.year}_${stats.month < 10 ? '0' : ''}${stats.month}_${safePdfName}.pdf`;
  doc.save(filename);
}
