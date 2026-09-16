import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserAccount, HalfMonthPayrollSummary } from '../types';

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

export function exportPayrollPDF(summary: HalfMonthPayrollSummary, account: UserAccount): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [79, 70, 229]; // Indigo 600
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];
  const cardBg: [number, number, number] = [248, 250, 252];
  const borderCol: [number, number, number] = [226, 232, 240];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(account.company || 'Enterprise Digital Labs', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('SEMI-MONTHLY PAYROLL STATEMENT & TIME ATTENDANCE AUDIT', 14, 18);

  doc.setFontSize(8);
  doc.text(`CONFIDENTIAL • ${new Date().toLocaleDateString()}`, 145, 18);

  // Period Badge on top right
  doc.setFillColor(...accentColor);
  doc.roundedRect(145, 6, 51, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('HALF-MONTH PAYROLL', 148, 11.5);

  // Employee Information Box
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(14, 30, 182, 26, 2, 2, 'FD');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(account.name || 'Employee Name', 18, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Role: ${account.role || 'Staff'} • Dept: ${account.department || 'Operations'}`, 18, 43);
  doc.text(`Email: ${account.email || 'N/A'}`, 18, 48);
  doc.text(`Hourly Base Rate: PHP ${summary.hourlyRate.toFixed(2)}/hr`, 18, 53);

  doc.text(`Payroll Period: ${summary.periodLabel}`, 105, 37);
  doc.text(`Cutoff Dates: ${summary.startDate} to ${summary.endDate} (${summary.totalDays} calendar days)`, 105, 43);
  doc.text(`Expected Workdays: ${summary.expectedWorkdays} | Worked Days: ${summary.actualDaysWorked}`, 105, 48);
  doc.text(`Absent Workdays: ${summary.absentDaysCount} | Total Hours: ${summary.totalHoursWorked.toFixed(1)} hrs`, 105, 53);

  // Two summary cards: Earnings vs Deductions & Net Pay
  // Earnings Box (Left)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 60, 89, 44, 2, 2, 'FD');

  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GROSS EARNINGS BREAKDOWN', 18, 66);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);

  let yL = 72;
  doc.text(`Regular Basic (${summary.regularHours}h):`, 18, yL);
  doc.text(`PHP ${summary.regularBasicPay.toFixed(2)}`, 85, yL, { align: 'right' });
  yL += 4.5;

  doc.text(`Regular Overtime (${summary.regularOvertimeHours}h @ 1.25x):`, 18, yL);
  doc.text(`PHP ${summary.regularOvertimePay.toFixed(2)}`, 85, yL, { align: 'right' });
  yL += 4.5;

  doc.text(`Sunday / Rest Day Work (${summary.sundayHoursWorked}h):`, 18, yL);
  doc.text(`PHP ${summary.sundayPay.toFixed(2)}`, 85, yL, { align: 'right' });
  yL += 4.5;

  doc.text(`Sunday Overtime (${summary.sundayOvertimeHours}h):`, 18, yL);
  doc.text(`PHP ${summary.sundayOvertimePay.toFixed(2)}`, 85, yL, { align: 'right' });
  yL += 4.5;

  doc.text(`Holiday Pay (Worked + Unworked):`, 18, yL);
  doc.text(`PHP ${summary.totalHolidayPay.toFixed(2)}`, 85, yL, { align: 'right' });
  yL += 5.5;

  doc.setDrawColor(203, 213, 225);
  doc.line(18, yL - 2, 98, yL - 2);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL GROSS PAY:', 18, yL);
  doc.text(`PHP ${summary.grossPay.toFixed(2)}`, 85, yL, { align: 'right' });

  // Deductions & Net Box (Right)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(107, 60, 89, 44, 2, 2, 'FD');

  doc.setTextColor(220, 38, 38); // Red 600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DEDUCTIONS & NET PAY', 111, 66);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);

  let yR = 72;
  doc.text(`Tardiness / Late (${summary.lateMinutesTotal} mins):`, 111, yR);
  doc.text(`-PHP ${summary.lateDeductionsTotal.toFixed(2)}`, 178, yR, { align: 'right' });
  yR += 4.5;

  doc.text(`Unworked Absences (${summary.absentDaysCount} days):`, 111, yR);
  doc.text(`-PHP ${summary.absenceDeductionsTotal.toFixed(2)}`, 178, yR, { align: 'right' });
  yR += 4.5;

  doc.text(`Other Adjustments:`, 111, yR);
  doc.text(`PHP 0.00`, 178, yR, { align: 'right' });
  yR += 5.5;

  doc.setDrawColor(203, 213, 225);
  doc.line(111, yR - 2, 191, yR - 2);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DEDUCTIONS:', 111, yR);
  doc.text(`-PHP ${summary.totalDeductions.toFixed(2)}`, 178, yR, { align: 'right' });
  yR += 7;

  // Highlighted NET PAY box
  doc.setFillColor(16, 185, 129); // Emerald 600
  doc.roundedRect(111, yR - 4, 80, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('NET TAKE-HOME PAY:', 115, yR + 1.5);
  doc.text(`PHP ${summary.netPay.toFixed(2)}`, 187, yR + 1.5, { align: 'right' });

  // Section Heading for Itemized Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('ITEMIZED DAILY ATTENDANCE & COMPUTATION AUDIT', 14, 111);

  // Table Data
  const tableRows = summary.dailyRecords.map(day => {
    let dayType = day.isSunday ? 'Sunday' : (day.isRestDay ? 'Rest Day' : 'Regular');
    if (day.holiday) {
      dayType = day.holiday.type === 'regular' ? `Reg Hol (${day.holiday.name})` : `Spc Hol (${day.holiday.name})`;
    }

    const clockIn = day.startTime || '--:--';
    const clockOut = day.endTime || '--:--';
    const hrs = day.workedHours > 0 ? `${day.workedHours.toFixed(1)}h` : '-';
    const late = day.lateMinutes > 0 ? `${day.lateMinutes}m (-PHP ${day.lateDeduction.toFixed(1)})` : '-';
    const ot = day.regularOvertimeHours > 0 ? `${day.regularOvertimeHours.toFixed(1)}h` : '-';
    const sun = (day.sundayHours + day.sundayOvertimeHours) > 0 ? `${(day.sundayHours + day.sundayOvertimeHours).toFixed(1)}h` : '-';
    const holi = day.holidayPay > 0 ? `PHP ${day.holidayPay.toFixed(1)}` : '-';
    const gross = day.grossDayEarnings > 0 ? `PHP ${day.grossDayEarnings.toFixed(2)}` : (day.isAbsent ? 'ABSENT' : 'PHP 0.00');

    return [
      `${day.date.substring(5)} (${day.dayName.substring(0, 3)})`,
      dayType,
      clockIn,
      clockOut,
      hrs,
      late,
      ot,
      sun,
      holi,
      gross
    ];
  });

  autoTable(doc, {
    startY: 114,
    head: [[
      'Date & Day',
      'Classification',
      'In',
      'Out',
      'Hours',
      'Late / Tardiness',
      'Reg OT',
      'Sun OT',
      'Holiday Pay',
      'Daily Net'
    ]],
    body: tableRows,
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 36 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 },
      4: { cellWidth: 14 },
      5: { cellWidth: 24 },
      6: { cellWidth: 14 },
      7: { cellWidth: 14 },
      8: { cellWidth: 16 },
      9: { cellWidth: 16, halign: 'right' }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.text(
        `Daily Time Keeper • Semi-Monthly Payroll Statement • Page ${data.pageNumber} of ${pageCount}`,
        14,
        290
      );
    }
  });

  // Signatures on last page
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 240;
  if (finalY < 265) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);

    doc.line(14, finalY + 12, 74, finalY + 12);
    doc.text('Prepared By: Payroll / HR Officer', 14, finalY + 16);

    doc.line(122, finalY + 12, 182, finalY + 12);
    doc.text('Approved & Acknowledged by Employee', 122, finalY + 16);
  }

  const safePdfName = (account.name || 'Employee').replace(/\s+/g, '_');
  const filename = `Payroll_${summary.startDate}_to_${summary.endDate}_${safePdfName}.pdf`;
  doc.save(filename);
}
