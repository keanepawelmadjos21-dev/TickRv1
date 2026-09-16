import { 
  TimeEntry, 
  UserAccount, 
  PayrollConfig, 
  PayrollHoliday, 
  HalfMonthPayrollSummary, 
  DayPayrollCalculation,
  PayrollPeriodType
} from '../types';

const STORAGE_KEYS = {
  PAYROLL_CONFIG: 'dtk_payroll_config',
  HOLIDAYS: 'dtk_payroll_holidays'
};

export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  expectedShiftStart: '08:00',
  expectedShiftEnd: '17:00',
  gracePeriodMinutes: 5,
  standardDailyHours: 8,
  workDays: [1, 2, 3, 4, 5], // Monday - Friday
  restDays: [0], // Sunday
  regularOvertimeMultiplier: 1.25, // 125% of hourly rate
  sundayRateMultiplier: 1.30, // 130% for Sunday rest day work
  sundayOvertimeMultiplier: 1.69, // 130% * 130% = 169% for Sunday overtime
  regularHolidayMultiplier: 2.00, // 200% for regular holiday worked
  specialHolidayMultiplier: 1.30, // 130% for special holiday worked
  includeUnworkedRegularHolidayPay: true,
  customHourlyRate: null
};

export const DEFAULT_HOLIDAYS_2026: PayrollHoliday[] = [
  { id: 'hol_01', date: '2026-01-01', name: "New Year's Day", type: 'regular' },
  { id: 'hol_02', date: '2026-01-19', name: 'Martin Luther King Jr. Day', type: 'regular' },
  { id: 'hol_03', date: '2026-02-16', name: "Presidents' Day / Washington's Birthday", type: 'regular' },
  { id: 'hol_04', date: '2026-04-02', name: 'Maundy Thursday', type: 'regular' },
  { id: 'hol_05', date: '2026-04-03', name: 'Good Friday', type: 'regular' },
  { id: 'hol_06', date: '2026-04-04', name: 'Black Saturday', type: 'special' },
  { id: 'hol_07', date: '2026-05-25', name: 'Memorial Day', type: 'regular' },
  { id: 'hol_08', date: '2026-06-19', name: 'Juneteenth National Independence Day', type: 'regular' },
  { id: 'hol_09', date: '2026-07-04', name: 'Independence Day', type: 'regular' },
  { id: 'hol_10', date: '2026-08-21', name: 'Special Non-Working Observance', type: 'special' },
  { id: 'hol_11', date: '2026-08-31', name: 'National Heroes Day', type: 'regular' },
  { id: 'hol_12', date: '2026-09-07', name: 'Labor Day', type: 'regular' },
  { id: 'hol_13', date: '2026-10-12', name: 'Columbus Day', type: 'special' },
  { id: 'hol_14', date: '2026-11-01', name: "All Saints' Day", type: 'special' },
  { id: 'hol_15', date: '2026-11-02', name: "All Souls' Day", type: 'special' },
  { id: 'hol_16', date: '2026-11-11', name: 'Veterans Day', type: 'regular' },
  { id: 'hol_17', date: '2026-11-26', name: 'Thanksgiving Day', type: 'regular' },
  { id: 'hol_18', date: '2026-11-30', name: 'Bonifacio Day', type: 'regular' },
  { id: 'hol_19', date: '2026-12-08', name: 'Feast of the Immaculate Conception', type: 'special' },
  { id: 'hol_20', date: '2026-12-25', name: 'Christmas Day', type: 'regular' },
  { id: 'hol_21', date: '2026-12-30', name: 'Rizal Day', type: 'regular' },
  { id: 'hol_22', date: '2026-12-31', name: 'New Year’s Eve', type: 'special' }
];

// Local persistence for config & holidays
export function loadPayrollConfig(): PayrollConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYROLL_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PAYROLL_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error loading payroll config', e);
  }
  return DEFAULT_PAYROLL_CONFIG;
}

export function savePayrollConfig(config: PayrollConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYROLL_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving payroll config', e);
  }
}

export function loadHolidays(): PayrollHoliday[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading holidays', e);
  }
  return DEFAULT_HOLIDAYS_2026;
}

export function saveHolidays(holidays: PayrollHoliday[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
  } catch (e) {
    console.error('Error saving holidays', e);
  }
}

// Helpers for date ranges
export function getDefaultHalfMonthDates(
  year: number,
  month: number, // 1-12
  half: 'first_half' | 'second_half'
): { startDate: string; endDate: string } {
  const yStr = String(year);
  const mStr = month < 10 ? `0${month}` : `${month}`;

  if (half === 'first_half') {
    return {
      startDate: `${yStr}-${mStr}-01`,
      endDate: `${yStr}-${mStr}-15`
    };
  } else {
    // Last day of month
    const lastDay = new Date(year, month, 0).getDate();
    return {
      startDate: `${yStr}-${mStr}-16`,
      endDate: `${yStr}-${mStr}-${lastDay < 10 ? '0' + lastDay : lastDay}`
    };
  }
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Main calculation engine for editable half-month payroll
export function calculateHalfMonthPayroll(
  startDateStr: string,
  endDateStr: string,
  entries: TimeEntry[],
  account: UserAccount,
  config: PayrollConfig = DEFAULT_PAYROLL_CONFIG,
  holidays: PayrollHoliday[] = DEFAULT_HOLIDAYS_2026,
  periodType: PayrollPeriodType = 'first_half'
): HalfMonthPayrollSummary {
  const effectiveHourlyRate = (config.customHourlyRate && config.customHourlyRate > 0)
    ? config.customHourlyRate
    : (account.defaultHourlyRate || 85);

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T23:59:59');

  const expectedStartMins = timeToMinutes(config.expectedShiftStart);
  const graceMins = config.gracePeriodMinutes || 0;

  const holidayMap = new Map<string, PayrollHoliday>();
  holidays.forEach(h => {
    holidayMap.set(h.date, h);
  });

  const dailyRecords: DayPayrollCalculation[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let expectedWorkdays = 0;
  let actualDaysWorked = 0;
  let absentDaysCount = 0;
  let totalHoursWorked = 0;
  let regularHours = 0;
  let regularBasicPay = 0;
  let lateMinutesTotal = 0;
  let lateDeductionsTotal = 0;
  let absenceDeductionsTotal = 0;
  let regularOvertimeHours = 0;
  let regularOvertimePay = 0;
  let sundayHoursWorked = 0;
  let sundayPay = 0;
  let sundayOvertimeHours = 0;
  let sundayOvertimePay = 0;
  let holidayHoursWorked = 0;
  let holidayWorkedPay = 0;
  let holidayUnworkedPay = 0;

  // Iterate every day in the date range
  const curr = new Date(start);
  while (curr <= end) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = curr.getDay(); // 0 = Sun, 1 = Mon...
    const dayName = dayNames[dayOfWeek];

    const isSunday = dayOfWeek === 0;
    const isRestDay = config.restDays.includes(dayOfWeek);
    const isScheduledWorkDay = config.workDays.includes(dayOfWeek);
    const holiday = holidayMap.get(dateStr) || null;

    // Find entries for this day
    const dayEntries = entries.filter(e => e.date === dateStr);
    const absentEntry = dayEntries.find(e => e.isAbsent);
    const workedEntries = dayEntries.filter(e => !e.isAbsent && e.totalMinutes > 0);

    const primaryEntry = workedEntries.length > 0 ? workedEntries[0] : (absentEntry || null);

    const totalWorkedMinutes = workedEntries.reduce((sum, e) => sum + e.totalMinutes, 0);
    const dayWorkedHours = Math.round((totalWorkedMinutes / 60) * 100) / 100;

    let isAbsent = false;
    let absenceReason: string | undefined = undefined;

    // Determine if absent
    if (absentEntry) {
      isAbsent = true;
      absenceReason = absentEntry.absenceReason ? String(absentEntry.absenceReason).replace(/_/g, ' ') : 'Marked Absent';
    } else if (isScheduledWorkDay && !holiday && dayWorkedHours === 0) {
      // It was a regular scheduled workday without holiday, and no time was logged
      // Only count as absent if the date is in the past or today
      const todayIso = new Date().toISOString().split('T')[0];
      if (dateStr <= todayIso) {
        isAbsent = true;
        absenceReason = 'Unrecorded / Missed Workday';
      }
    }

    if (isScheduledWorkDay && !holiday) {
      expectedWorkdays++;
    }

    // Late calculation
    let dayLateMinutes = 0;
    let dayLateDeduction = 0;

    if (dayWorkedHours > 0 && primaryEntry?.startTime) {
      const actualStartMins = timeToMinutes(primaryEntry.startTime);
      if (actualStartMins > (expectedStartMins + graceMins)) {
        dayLateMinutes = actualStartMins - expectedStartMins;
        dayLateDeduction = Math.round(((dayLateMinutes / 60) * effectiveHourlyRate) * 100) / 100;
        lateMinutesTotal += dayLateMinutes;
        lateDeductionsTotal += dayLateDeduction;
      }
    }

    // Work computations by day classification
    let dayRegularHours = 0;
    let dayBasePay = 0;
    let dayRegularOtHours = 0;
    let dayRegularOtPay = 0;
    let daySundayHours = 0;
    let daySundayPay = 0;
    let daySundayOtHours = 0;
    let daySundayOtPay = 0;
    let dayHolidayPay = 0;
    let isUnworkedHoliday = false;

    if (isAbsent) {
      absentDaysCount++;
      const absentDeduction = Math.round((config.standardDailyHours * effectiveHourlyRate) * 100) / 100;
      absenceDeductionsTotal += absentDeduction;
    } else if (dayWorkedHours > 0) {
      actualDaysWorked++;
      totalHoursWorked += dayWorkedHours;

      if (holiday) {
        // WORKED ON HOLIDAY
        holidayHoursWorked += dayWorkedHours;
        const multiplier = holiday.type === 'regular'
          ? (holiday.rateMultiplier || config.regularHolidayMultiplier)
          : (holiday.rateMultiplier || config.specialHolidayMultiplier);

        const regularHoliHours = Math.min(dayWorkedHours, config.standardDailyHours);
        const overHoliHours = Math.max(0, dayWorkedHours - config.standardDailyHours);

        // Regular holiday pay for first 8 hours
        const baseHoliPay = regularHoliHours * effectiveHourlyRate * multiplier;
        // Holiday overtime pay (usually multiplier * 1.30 for excess)
        const otHoliPay = overHoliHours * effectiveHourlyRate * (multiplier * 1.30);
        
        dayHolidayPay = Math.round((baseHoliPay + otHoliPay) * 100) / 100;
        holidayWorkedPay += dayHolidayPay;

      } else if (isRestDay || isSunday) {
        // WORKED ON SUNDAY / REST DAY
        const regSunHours = Math.min(dayWorkedHours, config.standardDailyHours);
        const otSunHours = Math.max(0, dayWorkedHours - config.standardDailyHours);

        daySundayHours = regSunHours;
        daySundayPay = Math.round((regSunHours * effectiveHourlyRate * config.sundayRateMultiplier) * 100) / 100;

        daySundayOtHours = otSunHours;
        daySundayOtPay = Math.round((otSunHours * effectiveHourlyRate * config.sundayOvertimeMultiplier) * 100) / 100;

        sundayHoursWorked += dayWorkedHours;
        sundayPay += daySundayPay;
        sundayOvertimeHours += daySundayOtHours;
        sundayOvertimePay += daySundayOtPay;

      } else {
        // REGULAR WORKDAY
        dayRegularHours = Math.min(dayWorkedHours, config.standardDailyHours);
        dayRegularOtHours = Math.max(0, dayWorkedHours - config.standardDailyHours);

        dayBasePay = Math.round((dayRegularHours * effectiveHourlyRate) * 100) / 100;
        dayRegularOtPay = Math.round((dayRegularOtHours * effectiveHourlyRate * config.regularOvertimeMultiplier) * 100) / 100;

        regularHours += dayRegularHours;
        regularBasicPay += dayBasePay;
        regularOvertimeHours += dayRegularOtHours;
        regularOvertimePay += dayRegularOtPay;
      }
    } else if (holiday && holiday.type === 'regular' && config.includeUnworkedRegularHolidayPay) {
      // UNWORKED REGULAR HOLIDAY
      isUnworkedHoliday = true;
      dayHolidayPay = Math.round((config.standardDailyHours * effectiveHourlyRate) * 100) / 100;
      holidayUnworkedPay += dayHolidayPay;
    }

    const grossDay = dayBasePay + dayRegularOtPay + daySundayPay + daySundayOtPay + dayHolidayPay;
    const netDay = Math.max(0, grossDay - dayLateDeduction);

    dailyRecords.push({
      date: dateStr,
      dayOfWeek,
      dayName,
      isSunday,
      isRestDay,
      holiday,
      entry: primaryEntry,
      isAbsent,
      absenceReason,
      startTime: primaryEntry?.startTime || (dayWorkedHours > 0 ? '08:00' : undefined),
      endTime: primaryEntry?.endTime || undefined,
      workedHours: dayWorkedHours,
      regularHours: dayRegularHours,
      lateMinutes: dayLateMinutes,
      lateDeduction: dayLateDeduction,
      regularOvertimeHours: dayRegularOtHours,
      regularOvertimePay: dayRegularOtPay,
      sundayHours: daySundayHours,
      sundayPay: daySundayPay,
      sundayOvertimeHours: daySundayOtHours,
      sundayOvertimePay: daySundayOtPay,
      holidayPay: dayHolidayPay,
      holidayType: holiday?.type,
      isUnworkedHoliday,
      basePay: dayBasePay,
      grossDayEarnings: grossDay,
      netDayEarnings: netDay
    });

    curr.setDate(curr.getDate() + 1);
  }

  // Summary calculations
  const totalHolidayPay = Math.round((holidayWorkedPay + holidayUnworkedPay) * 100) / 100;
  const grossPay = Math.round((regularBasicPay + regularOvertimePay + sundayPay + sundayOvertimePay + totalHolidayPay) * 100) / 100;
  const totalDeductions = Math.round((lateDeductionsTotal + absenceDeductionsTotal) * 100) / 100;
  const netPay = Math.max(0, Math.round((grossPay - totalDeductions) * 100) / 100);

  const startD = new Date(startDateStr + 'T00:00:00');
  const monthName = startD.toLocaleString('default', { month: 'long' });
  const yearNum = startD.getFullYear();
  const monthNum = startD.getMonth() + 1;

  let periodLabel = `${monthName} ${yearNum} (${startDateStr} to ${endDateStr})`;
  if (periodType === 'first_half') {
    periodLabel = `1st Half - ${monthName} ${yearNum} (1st to 15th)`;
  } else if (periodType === 'second_half') {
    periodLabel = `2nd Half - ${monthName} ${yearNum} (16th to End)`;
  }

  return {
    periodLabel,
    periodType,
    year: yearNum,
    month: monthNum,
    startDate: startDateStr,
    endDate: endDateStr,
    hourlyRate: effectiveHourlyRate,
    totalDays: dailyRecords.length,
    expectedWorkdays,
    actualDaysWorked,
    absentDaysCount,
    totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    regularBasicPay: Math.round(regularBasicPay * 100) / 100,
    lateMinutesTotal,
    lateDeductionsTotal: Math.round(lateDeductionsTotal * 100) / 100,
    absenceDeductionsTotal: Math.round(absenceDeductionsTotal * 100) / 100,
    regularOvertimeHours: Math.round(regularOvertimeHours * 100) / 100,
    regularOvertimePay: Math.round(regularOvertimePay * 100) / 100,
    sundayHoursWorked: Math.round(sundayHoursWorked * 100) / 100,
    sundayPay: Math.round(sundayPay * 100) / 100,
    sundayOvertimeHours: Math.round(sundayOvertimeHours * 100) / 100,
    sundayOvertimePay: Math.round(sundayOvertimePay * 100) / 100,
    holidayHoursWorked: Math.round(holidayHoursWorked * 100) / 100,
    holidayWorkedPay: Math.round(holidayWorkedPay * 100) / 100,
    holidayUnworkedPay: Math.round(holidayUnworkedPay * 100) / 100,
    totalHolidayPay,
    grossPay,
    totalDeductions,
    netPay,
    dailyRecords
  };
}
