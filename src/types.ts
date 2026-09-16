export type AbsenceReason = 
  | 'forgot_to_clock_in'
  | 'sick'
  | 'casual'
  | 'vacation'
  | 'unplanned'
  | 'other';

export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string | null; // HH:mm or null if active
  breakMinutes: number;
  totalMinutes: number;
  category: string;
  project: string;
  description: string;
  tags: string[];
  billable: boolean;
  hourlyRate: number;
  isRetroactive: boolean;
  isAbsent: boolean;
  absenceReason?: AbsenceReason | null;
  absenceNote?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'offline_created';
}

export const CURRENCY = {
  code: 'PHP',
  symbol: '₱',
  name: 'Philippine Peso'
};

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  company?: string;
  defaultHourlyRate: number;
  currency?: string;
  currencySymbol?: string;
  weeklyTargetHours: number;
  dailyTargetHours: number;
  timezone: string;
  avatarUrl?: string;
}

export interface CloudBackupSnapshot {
  id: string;
  timestamp: string;
  accountEmail: string;
  accountName: string;
  entryCount: number;
  totalHours: number;
  description: string;
  createdAt?: string;
  totalEntries?: number;
  deviceSource?: string;
  entries?: TimeEntry[];
  account?: UserAccount;
  widgetConfig?: WidgetConfig[];
  data?: {
    entries: TimeEntry[];
    categories: string[];
    projects: string[];
    account: UserAccount;
    widgetConfig: WidgetConfig[];
  };
}

export type WidgetId = 
  | 'punch_clock'
  | 'missed_clockins'
  | 'today_overview'
  | 'weekly_stats'
  | 'cloud_sync'
  | 'quick_retroactive'
  | 'monthly_progress';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  enabled: boolean;
  order: number;
  width: 'half' | 'full';
}

export interface SyncResponse {
  success: boolean;
  serverTime: string;
  syncedCount: number;
  entries: TimeEntry[];
  lastBackupTimestamp?: string;
}

export type PayrollPeriodType = 'first_half' | 'second_half' | 'custom';
export type HolidayType = 'regular' | 'special';

export interface PayrollHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: HolidayType;
  rateMultiplier?: number;
}

export interface PayrollConfig {
  expectedShiftStart: string; // HH:mm (e.g. "08:00")
  expectedShiftEnd: string; // HH:mm (e.g. "17:00")
  gracePeriodMinutes: number; // e.g. 5
  standardDailyHours: number; // e.g. 8
  workDays: number[]; // 0=Sun, 1=Mon... default [1, 2, 3, 4, 5]
  restDays: number[]; // default [0] (Sunday)
  regularOvertimeMultiplier: number; // default 1.25
  sundayRateMultiplier: number; // default 1.30
  sundayOvertimeMultiplier: number; // default 1.69
  regularHolidayMultiplier: number; // default 2.00
  specialHolidayMultiplier: number; // default 1.30
  includeUnworkedRegularHolidayPay: boolean; // default true
  customHourlyRate?: number | null;
}

export interface DayPayrollCalculation {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isSunday: boolean;
  isRestDay: boolean;
  holiday: PayrollHoliday | null;
  entry: TimeEntry | null;
  isAbsent: boolean;
  absenceReason?: string;
  startTime?: string;
  endTime?: string;
  workedHours: number;
  regularHours: number;
  lateMinutes: number;
  lateDeduction: number;
  regularOvertimeHours: number;
  regularOvertimePay: number;
  sundayHours: number;
  sundayPay: number;
  sundayOvertimeHours: number;
  sundayOvertimePay: number;
  holidayPay: number;
  holidayType?: HolidayType;
  isUnworkedHoliday: boolean;
  basePay: number;
  grossDayEarnings: number;
  netDayEarnings: number;
}

export interface HalfMonthPayrollSummary {
  periodLabel: string;
  periodType: PayrollPeriodType;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  hourlyRate: number;
  totalDays: number;
  expectedWorkdays: number;
  actualDaysWorked: number;
  absentDaysCount: number;
  totalHoursWorked: number;
  regularHours: number;
  regularBasicPay: number;
  lateMinutesTotal: number;
  lateDeductionsTotal: number;
  absenceDeductionsTotal: number;
  regularOvertimeHours: number;
  regularOvertimePay: number;
  sundayHoursWorked: number;
  sundayPay: number;
  sundayOvertimeHours: number;
  sundayOvertimePay: number;
  holidayHoursWorked: number;
  holidayWorkedPay: number;
  holidayUnworkedPay: number;
  totalHolidayPay: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  dailyRecords: DayPayrollCalculation[];
}
