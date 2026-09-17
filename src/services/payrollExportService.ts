import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserAccount, HalfMonthPayrollSummary, TimeEntry, PayrollConfig, PayrollHoliday } from '../types';
import { 
  calculateHalfMonthPayroll, 
  getDefaultHalfMonthDates, 
  loadPayrollConfig, 
  loadHolidays 
} from './payrollService';
import { loadLocalEntries } from './storageService';

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportPayrollCSV(summary: HalfMonthPayrollSummary, account: UserAccount): void {
  const rows: string[] = [];

  // Header metadata
  rows.push(['SEMI-MONTHLY PAYROLL AUDIT & PAYSLIP'].map(escapeCSV).join(','));
  rows.push(['Company', account.company || 'Enterprise Labs', 'Generated On', new Date().toLocaleString()].map(escapeCSV).join(','));
  rows.push(['Employee Name', account.name || 'Employee', 'Employee Email', account.email || ''].map(escapeCSV).join(','));
  rows.push(['Department', account.department || '', 'Role', account.role || ''].map(escapeCSV).join(','));
  rows.push(['Payroll Period', summary.periodLabel, 'Hourly Rate', `PHP ${summary.hourlyRate}/hr`].map(escapeCSV).join(','));
  rows.push(['Start Date', summary.startDate, 'End Date', summary.endDate].map(escapeCSV).join(','));
  rows.push('');

  // Daily Itemized Table
  const headers = [
    'Date',
    'Day',
    'Type',
    'Clock In',
    'Clock Out',
    'Total Worked (h)',
    'Regular (h)',
    'Late (mins)',
    'Late Deduction (PHP)',
    'Regular OT (h)',
    'Regular OT Pay (PHP)',
    'Sunday Work (h)',
    'Sunday OT (h)',
    'Sunday Pay (PHP)',
    'Holiday Type',
    'Holiday Pay (PHP)',
    'Gross Earnings (PHP)',
    'Net Earnings (PHP)',
    'Status / Note'
  ];
  rows.push(headers.map(escapeCSV).join(','));

  summary.dailyRecords.forEach(day => {
    let dayType = 'Regular';
    if (day.holiday) {
      dayType = `${day.holiday.type === 'regular' ? 'Reg Holiday' : 'Special Holiday'}: ${day.holiday.name}`;
    } else if (day.isSunday) {
      dayType = 'Sunday Rest Day';
    } else if (day.isRestDay) {
      dayType = 'Rest Day';
    }

    let statusNote = 'Normal';
    if (day.isAbsent) {
      statusNote = `ABSENT (${day.absenceReason || 'Unrecorded'})`;
    } else if (day.isUnworkedHoliday) {
      statusNote = 'Unworked Paid Holiday';
    } else if (day.lateMinutes > 0) {
      statusNote = `Late ${day.lateMinutes}m`;
    }

    const row = [
      day.date,
      day.dayName,
      dayType,
      day.startTime || '--:--',
      day.endTime || '--:--',
      day.workedHours.toFixed(2),
      day.regularHours.toFixed(2),
      day.lateMinutes,
      day.lateDeduction.toFixed(2),
      day.regularOvertimeHours.toFixed(2),
      day.regularOvertimePay.toFixed(2),
      day.sundayHours.toFixed(2),
      day.sundayOvertimeHours.toFixed(2),
      (day.sundayPay + day.sundayOvertimePay).toFixed(2),
      day.holiday ? day.holiday.name : 'None',
      day.holidayPay.toFixed(2),
      day.grossDayEarnings.toFixed(2),
      day.netDayEarnings.toFixed(2),
      statusNote
    ];
    rows.push(row.map(escapeCSV).join(','));
  });

  // Summary Totals
  rows.push('');
  rows.push(['--- PAYROLL PERIOD SUMMARY ---'].map(escapeCSV).join(','));
  rows.push(['Expected Workdays', summary.expectedWorkdays, 'Days Actually Worked', summary.actualDaysWorked].map(escapeCSV).join(','));
  rows.push(['Total Hours Worked', summary.totalHoursWorked.toFixed(2), 'Regular Hours Worked', summary.regularHours.toFixed(2)].map(escapeCSV).join(','));
  rows.push(['Regular Basic Pay', `PHP ${summary.regularBasicPay.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push(['Regular Overtime Hours', `${summary.regularOvertimeHours.toFixed(2)}h`, 'Regular Overtime Pay', `PHP ${summary.regularOvertimePay.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push(['Sunday Rest Day Hours', `${(summary.sundayHoursWorked + summary.sundayOvertimeHours).toFixed(2)}h`, 'Sunday Pay (inc OT)', `PHP ${(summary.sundayPay + summary.sundayOvertimePay).toFixed(2)}`].map(escapeCSV).join(','));
  rows.push(['Holiday Hours Worked', `${summary.holidayHoursWorked.toFixed(2)}h`, 'Total Holiday Pay', `PHP ${summary.totalHolidayPay.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push(['GROSS PERIOD EARNINGS', `PHP ${summary.grossPay.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push('');
  rows.push(['--- DEDUCTIONS & PENALTIES ---'].map(escapeCSV).join(','));
  rows.push(['Total Late Minutes', `${summary.lateMinutesTotal} mins`, 'Late Deductions', `-PHP ${summary.lateDeductionsTotal.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push(['Absent Workdays', `${summary.absentDaysCount} days`, 'Absence Deductions', `-PHP ${summary.absenceDeductionsTotal.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push(['TOTAL DEDUCTIONS', `-PHP ${summary.totalDeductions.toFixed(2)}`].map(escapeCSV).join(','));
  rows.push('');
  rows.push(['NET TAKE-HOME PAY', `PHP ${summary.netPay.toFixed(2)}`].map(escapeCSV).join(','));

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = (account.name || 'Employee').replace(/\s+/g, '_');
  link.setAttribute('download', `Payroll_${summary.startDate}_to_${summary.endDate}_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface SimplePayrollPDFParams {
  year: number;
  month: number;
  account: UserAccount;
  entries?: TimeEntry[];
  config?: PayrollConfig;
  holidays?: PayrollHoliday[];
}

/**
 * Generates a clean, simple two-column attendance and payroll PDF:
 * - Divided in two side-by-side columns: 1st (1-15) and 2nd (16-31)
 * - Header strictly limited to Name, Date, Company, Hourly Rate
 * - Columns show Date, Time In, Time Out
 * - Absent rows highlighted in Yellow
 * - Holiday rows highlighted in Light Blue
 * - Side-by-side sample computation per payroll period (1st 1-15 and 2nd 16-31)
 */
export function generateSimpleTwoColumnPayrollPDF(params: SimplePayrollPDFParams): void {
  const { year, month, account } = params;
  const entries = (params.entries && params.entries.length > 0) ? params.entries : loadLocalEntries();
  const config = params.config || loadPayrollConfig();
  const holidays = params.holidays || loadHolidays();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[month - 1] || 'Month';
  const daysInMonth = new Date(year, month, 0).getDate();

  // 1. Calculate 1st Half (1 - 15) and 2nd Half (16 - 31)
  const dates1 = getDefaultHalfMonthDates(year, month, 'first_half');
  const summary1 = calculateHalfMonthPayroll(
    dates1.startDate,
    dates1.endDate,
    entries,
    account,
    config,
    holidays,
    'first_half'
  );

  const dates2 = getDefaultHalfMonthDates(year, month, 'second_half');
  const summary2 = calculateHalfMonthPayroll(
    dates2.startDate,
    dates2.endDate,
    entries,
    account,
    config,
    holidays,
    'second_half'
  );

  // 2. Initialize jsPDF Document (A4 portrait: 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const textDark: [number, number, number] = [15, 23, 42];
  const textMuted: [number, number, number] = [100, 116, 139];
  const borderCol: [number, number, number] = [203, 213, 225];

  // 3. Simple Clean Header: ONLY Company, Name, Date
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, 10, 186, 20, 2, 2, 'FD');

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('COMPANY:', 16, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  doc.text(account.company || 'Enterprise Digital Labs', 36, 17);

  // Date / Period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('DATE / PERIOD:', 112, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textDark);
  doc.text(`${monthName} ${year} (1st: 1-15 | 2nd: 16-${daysInMonth})`, 140, 17);

  // Employee Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('NAME:', 16, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  doc.text(account.name || 'Employee Name', 36, 25);

  // Base Hourly Rate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('RATE:', 112, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(`PHP ${summary1.hourlyRate.toFixed(2)} / hr`, 140, 25);

  // 4. Section Heading for Two-Column Attendance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('1st PERIOD: DAYS 1 - 15', 12, 35);
  doc.text(`2nd PERIOD: DAYS 16 - ${daysInMonth}`, 108, 35);

  // 5. Build Two Column Table Data (Date, Time In, Time Out)
  const col1Rows = summary1.dailyRecords.map(day => {
    const dayNum = day.date.substring(8);
    const shortDay = day.dayName.substring(0, 3);
    const dateLabel = `${monthName.substring(0, 3)} ${dayNum} (${shortDay})`;

    let timeIn = '--:--';
    let timeOut = '--:--';

    if (day.isAbsent) {
      timeIn = 'ABSENT';
      timeOut = 'ABSENT';
    } else if (day.startTime && day.endTime) {
      timeIn = day.startTime;
      timeOut = day.endTime;
    } else if (day.startTime) {
      timeIn = day.startTime;
      timeOut = '--:--';
    } else if (day.holiday) {
      timeIn = 'HOLIDAY';
      timeOut = 'HOLIDAY';
    } else if (day.isSunday || day.isRestDay) {
      timeIn = 'REST DAY';
      timeOut = 'REST DAY';
    }

    return [dateLabel, timeIn, timeOut];
  });

  const col1Meta = summary1.dailyRecords.map(d => ({
    isAbsent: d.isAbsent,
    isHoliday: d.holiday !== null
  }));

  const col2Rows = summary2.dailyRecords.map(day => {
    const dayNum = day.date.substring(8);
    const shortDay = day.dayName.substring(0, 3);
    const dateLabel = `${monthName.substring(0, 3)} ${dayNum} (${shortDay})`;

    let timeIn = '--:--';
    let timeOut = '--:--';

    if (day.isAbsent) {
      timeIn = 'ABSENT';
      timeOut = 'ABSENT';
    } else if (day.startTime && day.endTime) {
      timeIn = day.startTime;
      timeOut = day.endTime;
    } else if (day.startTime) {
      timeIn = day.startTime;
      timeOut = '--:--';
    } else if (day.holiday) {
      timeIn = 'HOLIDAY';
      timeOut = 'HOLIDAY';
    } else if (day.isSunday || day.isRestDay) {
      timeIn = 'REST DAY';
      timeOut = 'REST DAY';
    }

    return [dateLabel, timeIn, timeOut];
  });

  const col2Meta = summary2.dailyRecords.map(d => ({
    isAbsent: d.isAbsent,
    isHoliday: d.holiday !== null
  }));

  const tableStartY = 37;

  // Table 1: 1st Half (1 - 15) on the Left
  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Time In', 'Time Out']],
    body: col1Rows,
    theme: 'grid',
    tableWidth: 90,
    margin: { left: 12 },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.1,
      halign: 'center',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      cellPadding: 1.4
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'left' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 32, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const meta = col1Meta[data.row.index];
        if (meta?.isAbsent) {
          // Highlight absent in Yellow
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.textColor = [113, 63, 18];
          data.cell.styles.fontStyle = 'bold';
        } else if (meta?.isHoliday) {
          // Highlight holidays in Light Blue
          data.cell.styles.fillColor = [186, 230, 253];
          data.cell.styles.textColor = [3, 105, 161];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const table1End = (doc as any).lastAutoTable?.finalY || 102;

  // Table 2: 2nd Half (16 - 31) on the Right
  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Time In', 'Time Out']],
    body: col2Rows,
    theme: 'grid',
    tableWidth: 90,
    margin: { left: 108 },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.1,
      halign: 'center',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      cellPadding: 1.4
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'left' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 32, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const meta = col2Meta[data.row.index];
        if (meta?.isAbsent) {
          // Highlight absent in Yellow
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.textColor = [113, 63, 18];
          data.cell.styles.fontStyle = 'bold';
        } else if (meta?.isHoliday) {
          // Highlight holidays in Light Blue
          data.cell.styles.fillColor = [186, 230, 253];
          data.cell.styles.textColor = [3, 105, 161];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const table2End = (doc as any).lastAutoTable?.finalY || 102;
  const tablesEndY = Math.max(table1End, table2End);

  // 6. Highlight Legend: Absent (Yellow) & Holidays (Light Blue)
  const legendY = tablesEndY + 3;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  // Yellow legend box
  doc.setFillColor(254, 240, 138);
  doc.setDrawColor(234, 179, 8);
  doc.rect(12, legendY, 5, 3.5, 'FD');
  doc.setTextColor(113, 63, 18);
  doc.setFont('helvetica', 'bold');
  doc.text('Absent (Yellow)', 19, legendY + 2.8);

  // Light Blue legend box
  doc.setFillColor(186, 230, 253);
  doc.setDrawColor(56, 189, 248);
  doc.rect(52, legendY, 5, 3.5, 'FD');
  doc.setTextColor(3, 105, 161);
  doc.text('Holiday (Light Blue)', 59, legendY + 2.8);

  // 7. Sample Computation per Payroll (1st: 1-15 and 2nd: 16-31)
  const compStartY = legendY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text('SAMPLE COMPUTATION PER PAYROLL', 12, compStartY);

  const boxY = compStartY + 3;
  const boxHeight = 58;

  // --- Left Box: 1st Payroll (1 - 15) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(12, boxY, 90, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('1st Cutoff Computation (Days 1 - 15)', 16, boxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textDark);

  let cY1 = boxY + 11;
  doc.text(`Expected / Worked Days:`, 16, cY1);
  doc.text(`${summary1.actualDaysWorked} / ${summary1.expectedWorkdays} days`, 97, cY1, { align: 'right' });
  cY1 += 4.5;

  doc.text(`Regular Work Hours:`, 16, cY1);
  doc.text(`${summary1.regularHours.toFixed(1)} hrs`, 97, cY1, { align: 'right' });
  cY1 += 4.5;

  doc.text(`Basic Pay (${summary1.regularHours.toFixed(1)}h × PHP ${summary1.hourlyRate.toFixed(2)}):`, 16, cY1);
  doc.text(`PHP ${summary1.regularBasicPay.toFixed(2)}`, 97, cY1, { align: 'right' });
  cY1 += 4.5;

  doc.text(`Overtime Pay (${summary1.regularOvertimeHours.toFixed(1)}h @ 1.25x):`, 16, cY1);
  doc.text(`PHP ${summary1.regularOvertimePay.toFixed(2)}`, 97, cY1, { align: 'right' });
  cY1 += 4.5;

  doc.text(`Holiday & Sunday Pay:`, 16, cY1);
  doc.text(`PHP ${(summary1.totalHolidayPay + summary1.sundayPay + summary1.sundayOvertimePay).toFixed(2)}`, 97, cY1, { align: 'right' });
  cY1 += 4.5;

  doc.text(`Late Deductions (${summary1.lateMinutesTotal}m):`, 16, cY1);
  doc.text(`-PHP ${summary1.lateDeductionsTotal.toFixed(2)}`, 97, cY1, { align: 'right' });
  cY1 += 4.5;

  doc.text(`Absence Deductions (${summary1.absentDaysCount}d):`, 16, cY1);
  doc.text(`-PHP ${summary1.absenceDeductionsTotal.toFixed(2)}`, 97, cY1, { align: 'right' });
  cY1 += 5.5;

  // Net Pay 1st
  doc.setDrawColor(...borderCol);
  doc.line(16, cY1 - 2, 97, cY1 - 2);

  doc.setFillColor(16, 185, 129); // Emerald 600
  doc.roundedRect(16, cY1 - 0.5, 82, 7, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NET PAY (1st 1-15):', 19, cY1 + 4.2);
  doc.text(`PHP ${summary1.netPay.toFixed(2)}`, 95, cY1 + 4.2, { align: 'right' });

  // --- Right Box: 2nd Payroll (16 - 31) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(108, boxY, 90, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text(`2nd Cutoff Computation (Days 16 - ${daysInMonth})`, 112, boxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textDark);

  let cY2 = boxY + 11;
  doc.text(`Expected / Worked Days:`, 112, cY2);
  doc.text(`${summary2.actualDaysWorked} / ${summary2.expectedWorkdays} days`, 193, cY2, { align: 'right' });
  cY2 += 4.5;

  doc.text(`Regular Work Hours:`, 112, cY2);
  doc.text(`${summary2.regularHours.toFixed(1)} hrs`, 193, cY2, { align: 'right' });
  cY2 += 4.5;

  doc.text(`Basic Pay (${summary2.regularHours.toFixed(1)}h × PHP ${summary2.hourlyRate.toFixed(2)}):`, 112, cY2);
  doc.text(`PHP ${summary2.regularBasicPay.toFixed(2)}`, 193, cY2, { align: 'right' });
  cY2 += 4.5;

  doc.text(`Overtime Pay (${summary2.regularOvertimeHours.toFixed(1)}h @ 1.25x):`, 112, cY2);
  doc.text(`PHP ${summary2.regularOvertimePay.toFixed(2)}`, 193, cY2, { align: 'right' });
  cY2 += 4.5;

  doc.text(`Holiday & Sunday Pay:`, 112, cY2);
  doc.text(`PHP ${(summary2.totalHolidayPay + summary2.sundayPay + summary2.sundayOvertimePay).toFixed(2)}`, 193, cY2, { align: 'right' });
  cY2 += 4.5;

  doc.text(`Late Deductions (${summary2.lateMinutesTotal}m):`, 112, cY2);
  doc.text(`-PHP ${summary2.lateDeductionsTotal.toFixed(2)}`, 193, cY2, { align: 'right' });
  cY2 += 4.5;

  doc.text(`Absence Deductions (${summary2.absentDaysCount}d):`, 112, cY2);
  doc.text(`-PHP ${summary2.absenceDeductionsTotal.toFixed(2)}`, 193, cY2, { align: 'right' });
  cY2 += 5.5;

  // Net Pay 2nd
  doc.setDrawColor(...borderCol);
  doc.line(112, cY2 - 2, 193, cY2 - 2);

  doc.setFillColor(16, 185, 129); // Emerald 600
  doc.roundedRect(112, cY2 - 0.5, 82, 7, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`NET PAY (2nd 16-${daysInMonth}):`, 115, cY2 + 4.2);
  doc.text(`PHP ${summary2.netPay.toFixed(2)}`, 191, cY2 + 4.2, { align: 'right' });

  // 8. Total Monthly Summary Bar
  const summaryBarY = boxY + boxHeight + 4;
  const totalMonthlyNet = summary1.netPay + summary2.netPay;
  const totalMonthlyGross = summary1.grossPay + summary2.grossPay;
  const totalMonthlyDeductions = summary1.totalDeductions + summary2.totalDeductions;

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(12, summaryBarY, 186, 13, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`TOTAL MONTHLY NET PAY: PHP ${totalMonthlyNet.toFixed(2)}`, 16, summaryBarY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Gross: PHP ${totalMonthlyGross.toFixed(2)}  •  Deductions: -PHP ${totalMonthlyDeductions.toFixed(2)}  •  Formula: Net = Basic + OT + Holiday - Deductions`,
    16,
    summaryBarY + 9.8
  );

  // 9. Signatures Block
  const sigY = summaryBarY + 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);

  doc.line(16, sigY + 8, 76, sigY + 8);
  doc.text('Prepared By: Payroll / HR Officer', 16, sigY + 12);

  doc.line(122, sigY + 8, 182, sigY + 8);
  doc.text('Approved / Received By: Employee', 122, sigY + 12);

  // Footer note
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text(
    `Daily Time Keeper • Generated on ${new Date().toLocaleDateString()} • Confidential Payroll Statement`,
    12,
    290
  );

  // Save PDF
  const safePdfName = (account.name || 'Employee').replace(/\s+/g, '_');
  const filename = `Payroll_${year}_${month < 10 ? '0' + month : month}_${safePdfName}.pdf`;
  doc.save(filename);
}

/**
 * Standard Payroll PDF export handler called from the UI
 */
export function exportPayrollPDF(
  summary: HalfMonthPayrollSummary, 
  account: UserAccount,
  allEntries?: TimeEntry[],
  config?: PayrollConfig,
  holidays?: PayrollHoliday[],
  targetYear?: number,
  targetMonth?: number
): void {
  const year = targetYear || summary.year || new Date().getFullYear();
  const month = targetMonth || summary.month || (new Date().getMonth() + 1);

  generateSimpleTwoColumnPayrollPDF({
    year,
    month,
    account,
    entries: (allEntries && allEntries.length > 0) ? allEntries : loadLocalEntries(),
    config: config || loadPayrollConfig(),
    holidays: holidays || loadHolidays()
  });
}
