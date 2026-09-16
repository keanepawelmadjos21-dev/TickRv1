import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Sun, 
  Sparkles, 
  Download, 
  FileText, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X, 
  Info,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  RotateCcw
} from 'lucide-react';
import { 
  TimeEntry, 
  UserAccount, 
  PayrollConfig, 
  PayrollHoliday, 
  PayrollPeriodType 
} from '../types';
import { 
  loadPayrollConfig, 
  savePayrollConfig, 
  loadHolidays, 
  saveHolidays, 
  getDefaultHalfMonthDates, 
  calculateHalfMonthPayroll,
  DEFAULT_PAYROLL_CONFIG 
} from '../services/payrollService';
import { exportPayrollPDF, exportPayrollCSV } from '../services/payrollExportService';

interface HalfMonthPayrollViewProps {
  entries: TimeEntry[];
  account: UserAccount;
  onOpenRetroactiveModal: (date?: string, entry?: TimeEntry | null) => void;
}

export const HalfMonthPayrollView: React.FC<HalfMonthPayrollViewProps> = ({
  entries,
  account,
  onOpenRetroactiveModal
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // Period state
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [periodType, setPeriodType] = useState<PayrollPeriodType>(
    currentDay <= 15 ? 'first_half' : 'second_half'
  );

  // Initialize dates based on current period
  const defaultDates = useMemo(() => {
    return getDefaultHalfMonthDates(year, month, periodType === 'second_half' ? 'second_half' : 'first_half');
  }, [year, month, periodType]);

  const [startDate, setStartDate] = useState<string>(defaultDates.startDate);
  const [endDate, setEndDate] = useState<string>(defaultDates.endDate);

  // Synchronize start & end dates when year/month/periodType changes
  useEffect(() => {
    if (periodType !== 'custom') {
      const dates = getDefaultHalfMonthDates(year, month, periodType === 'second_half' ? 'second_half' : 'first_half');
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  }, [year, month, periodType]);

  // Configurations & Holidays state
  const [config, setConfig] = useState<PayrollConfig>(loadPayrollConfig);
  const [holidays, setHolidays] = useState<PayrollHoliday[]>(loadHolidays);

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);

  // Temporary config edit state
  const [tempConfig, setTempConfig] = useState<PayrollConfig>(config);

  // New holiday input state
  const [newHoliDate, setNewHoliDate] = useState<string>(startDate);
  const [newHoliName, setNewHoliName] = useState<string>('');
  const [newHoliType, setNewHoliType] = useState<'regular' | 'special'>('regular');
  const [newHoliMultiplier, setNewHoliMultiplier] = useState<string>('');

  // Recompute payroll whenever inputs change
  const summary = useMemo(() => {
    return calculateHalfMonthPayroll(startDate, endDate, entries, account, config, holidays, periodType);
  }, [startDate, endDate, entries, account, config, holidays, periodType]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Quick switcher handlers
  const handleSelectPeriodType = (type: PayrollPeriodType) => {
    setPeriodType(type);
    if (type !== 'custom') {
      const dates = getDefaultHalfMonthDates(year, month, type === 'second_half' ? 'second_half' : 'first_half');
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  // Holiday management
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliDate || !newHoliName.trim()) return;

    const newHoli: PayrollHoliday = {
      id: `hol_${Date.now()}`,
      date: newHoliDate,
      name: newHoliName.trim(),
      type: newHoliType,
      rateMultiplier: newHoliMultiplier ? parseFloat(newHoliMultiplier) : undefined
    };

    const updated = [...holidays.filter(h => h.date !== newHoliDate), newHoli];
    setHolidays(updated);
    saveHolidays(updated);
    setNewHoliName('');
    setNewHoliMultiplier('');
  };

  const handleDeleteHoliday = (id: string) => {
    const updated = holidays.filter(h => h.id !== id);
    setHolidays(updated);
    saveHolidays(updated);
  };

  // Save config
  const handleSaveConfig = () => {
    setConfig(tempConfig);
    savePayrollConfig(tempConfig);
    setIsConfigModalOpen(false);
  };

  const handleResetConfig = () => {
    setTempConfig(DEFAULT_PAYROLL_CONFIG);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Semi-Monthly Payroll Audit
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Editable half-month cutoff periods with computed late tardiness, absences, overtime, Sunday premiums, and holiday pay
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Export & Settings */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setTempConfig(config);
                setIsConfigModalOpen(true);
              }}
              id="btn-open-payroll-config"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Edit shift times, grace minutes, and pay multipliers"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>Shift & Rate Rules</span>
            </button>

            <button
              onClick={() => setIsHolidayModalOpen(true)}
              id="btn-open-holiday-manager"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Add or manage regular and special holidays"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Holidays ({holidays.length})</span>
            </button>

            <button
              onClick={() => exportPayrollCSV(summary, account)}
              id="btn-export-payroll-csv"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => exportPayrollPDF(summary, account)}
              id="btn-export-payroll-pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Payslip PDF</span>
            </button>
          </div>
        </div>

        {/* Period Selector & Date Editor Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Month & Year Navigation */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 flex-1">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-24 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Cutoff Cycle Buttons */}
          <div className="md:col-span-4 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => handleSelectPeriodType('first_half')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                periodType === 'first_half'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1st Half (1-15)
            </button>
            <button
              onClick={() => handleSelectPeriodType('second_half')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                periodType === 'second_half'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2nd Half (16-End)
            </button>
            <button
              onClick={() => setPeriodType('custom')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                periodType === 'custom'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Custom Dates
            </button>
          </div>

          {/* Editable Date Pickers */}
          <div className="md:col-span-4 flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodType('custom');
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodType('custom');
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: NET TAKE-HOME PAY (Primary) */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-indigo-100 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Take-Home Pay</span>
              <DollarSign className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              ₱{summary.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-indigo-100/90 mt-1">
              Rate: ₱{summary.hourlyRate}/hr • {summary.totalHoursWorked.toFixed(1)} hrs worked
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-400/30 flex items-center justify-between text-xs text-indigo-100">
            <span>Gross: ₱{summary.grossPay.toFixed(2)}</span>
            <span className="text-rose-200">Deductions: -₱{summary.totalDeductions.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Regular Overtime & Sunday Work */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Overtime & Sunday</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ₱{(summary.regularOvertimePay + summary.sundayPay + summary.sundayOvertimePay).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>Regular OT ({summary.regularOvertimeHours}h @ {config.regularOvertimeMultiplier}x):</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₱{summary.regularOvertimePay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday Work & OT ({summary.sundayHoursWorked + summary.sundayOvertimeHours}h):</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₱{(summary.sundayPay + summary.sundayOvertimePay).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            Overtime adds directly to base compensation
          </div>
        </div>

        {/* Card 3: Holiday Pay Computation */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Holiday Compensation</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ₱{summary.totalHolidayPay.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>Worked Holidays ({summary.holidayHoursWorked}h):</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₱{summary.holidayWorkedPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Unworked Paid Holidays:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₱{summary.holidayUnworkedPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Regular (200% worked) & Special (130%)
          </div>
        </div>

        {/* Card 4: Deductions: Tardiness & Absences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Tardiness & Absences</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              -₱{summary.totalDeductions.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>Late Tardiness ({summary.lateMinutesTotal}m):</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">-₱{summary.lateDeductionsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Absences ({summary.absentDaysCount} workdays):</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">-₱{summary.absenceDeductionsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            Grace period: {config.gracePeriodMinutes} mins past {config.expectedShiftStart}
          </div>
        </div>

      </div>

      {/* Main Itemized Daily Attendance & Payroll Computation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Attendance & Payroll Computation Grid
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {summary.totalDays} calendar days in period • {summary.expectedWorkdays} workdays expected • {summary.actualDaysWorked} worked
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
              Shift: {config.expectedShiftStart} - {config.expectedShiftEnd} ({config.standardDailyHours}h/day)
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Date & Day</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Time In / Out</th>
                <th className="py-3 px-3 text-center">Worked Hours</th>
                <th className="py-3 px-3 text-center">Late (mins)</th>
                <th className="py-3 px-3 text-center">Reg OT (hrs)</th>
                <th className="py-3 px-3 text-center">Sunday Work</th>
                <th className="py-3 px-3 text-center">Holiday Pay</th>
                <th className="py-3 px-4 text-right">Daily Net Pay</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {summary.dailyRecords.map((day) => {
                const hasLate = day.lateMinutes > 0;
                const isAbsent = day.isAbsent;
                const isRest = day.isSunday || day.isRestDay;

                return (
                  <tr 
                    key={day.date}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                      isAbsent ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                    } ${
                      day.holiday ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Date & Day */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {day.date}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {day.dayName}
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {day.holiday ? (
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            day.holiday.type === 'regular'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          }`}>
                            {day.holiday.type === 'regular' ? 'Regular Holiday (200%)' : 'Special Holiday (130%)'}
                          </span>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[140px]" title={day.holiday.name}>
                            {day.holiday.name}
                          </div>
                        </div>
                      ) : isRest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                          {day.isSunday ? 'Sunday Rest Day' : 'Rest Day'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Regular Workday
                        </span>
                      )}
                    </td>

                    {/* Time In / Out */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {day.workedHours > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-mono text-slate-800 dark:text-slate-200">
                            {day.startTime || '--:--'} → {day.endTime || '--:--'}
                          </div>
                          {day.entry?.breakMinutes ? (
                            <div className="text-[10px] text-slate-700 dark:text-slate-300">
                              {day.entry.breakMinutes}m break
                            </div>
                          ) : null}
                        </div>
                      ) : isAbsent ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {day.absenceReason || 'Absent'}
                        </span>
                      ) : day.isUnworkedHoliday ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                          Paid Holiday (Unworked)
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                          --:--
                        </span>
                      )}
                    </td>

                    {/* Worked Hours */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono">
                      {day.workedHours > 0 ? (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {day.workedHours.toFixed(1)}h
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">-</span>
                      )}
                    </td>

                    {/* Late / Tardiness */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {hasLate ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold font-mono text-[11px]">
                            {day.lateMinutes}m late
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                            -₱{day.lateDeduction.toFixed(2)}
                          </span>
                        </div>
                      ) : day.workedHours > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> On time
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">-</span>
                      )}
                    </td>

                    {/* Regular Overtime */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {day.regularOvertimeHours > 0 ? (
                        <div className="inline-flex flex-col items-center font-mono">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            +{day.regularOvertimeHours.toFixed(1)}h
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            +₱{day.regularOvertimePay.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">-</span>
                      )}
                    </td>

                    {/* Sunday Work */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {(day.sundayHours + day.sundayOvertimeHours) > 0 ? (
                        <div className="inline-flex flex-col items-center font-mono">
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {(day.sundayHours + day.sundayOvertimeHours).toFixed(1)}h
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            +₱{(day.sundayPay + day.sundayOvertimePay).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">-</span>
                      )}
                    </td>

                    {/* Holiday Pay */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {day.holidayPay > 0 ? (
                        <div className="inline-flex flex-col items-center font-mono">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            +₱{day.holidayPay.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                            {day.isUnworkedHoliday ? 'Unworked 100%' : 'Premium Worked'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">-</span>
                      )}
                    </td>

                    {/* Daily Net Pay */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {day.grossDayEarnings > 0 ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono">
                            ₱{day.netDayEarnings.toFixed(2)}
                          </div>
                          {day.lateDeduction > 0 && (
                            <div className="text-[10px] text-rose-500 line-through">
                              ₱{day.grossDayEarnings.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : isAbsent ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                          -₱0.00
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 font-mono">₱0.00</span>
                      )}
                    </td>

                    {/* Action: Edit / Adjust entry */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onOpenRetroactiveModal(day.date, day.entry)}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="Edit, add retroactive log, or mark attendance for this day"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Totals Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div>
              <strong>Regular Basic Pay:</strong> ₱{summary.regularBasicPay.toFixed(2)} ({summary.regularHours}h) • <strong>Overtime:</strong> +₱{summary.regularOvertimePay.toFixed(2)} • <strong>Sunday:</strong> +₱{(summary.sundayPay + summary.sundayOvertimePay).toFixed(2)} • <strong>Holidays:</strong> +₱{summary.totalHolidayPay.toFixed(2)}
            </div>
            <div>
              <strong>Deductions:</strong> Tardiness (-₱{summary.lateDeductionsTotal.toFixed(2)}) + Absences (-₱{summary.absenceDeductionsTotal.toFixed(2)}) = -₱{summary.totalDeductions.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Net Amount</span>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                ₱{summary.netPay.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => exportPayrollPDF(summary, account)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              Generate Certified Payslip
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: Shift & Rate Rules Configuration */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payroll & Shift Computation Rules
                </h3>
              </div>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Shift Hours & Grace Period */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2">
                  Daily Shift & Tardiness Threshold
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Expected Shift Start</label>
                    <input
                      type="time"
                      value={tempConfig.expectedShiftStart}
                      onChange={(e) => setTempConfig({ ...tempConfig, expectedShiftStart: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">Clock-ins after this are late</p>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Shift End Time</label>
                    <input
                      type="time"
                      value={tempConfig.expectedShiftEnd}
                      onChange={(e) => setTempConfig({ ...tempConfig, expectedShiftEnd: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Grace Period (Minutes)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={tempConfig.gracePeriodMinutes}
                      onChange={(e) => setTempConfig({ ...tempConfig, gracePeriodMinutes: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">e.g. 5m grace allowed</p>
                  </div>
                </div>
              </div>

              {/* Standard Hours & Hourly Rate Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Standard Daily Work Hours</label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    step="0.5"
                    value={tempConfig.standardDailyHours}
                    onChange={(e) => setTempConfig({ ...tempConfig, standardDailyHours: parseFloat(e.target.value) || 8 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">Hours exceeding this count as Overtime</p>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Hourly Base Rate Override (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder={`Account rate: ₱${account.defaultHourlyRate || 85}`}
                    value={tempConfig.customHourlyRate ?? ''}
                    onChange={(e) => setTempConfig({ 
                      ...tempConfig, 
                      customHourlyRate: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">Leave empty to use account rate</p>
                </div>
              </div>

              {/* Premium Multipliers */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2">
                  Overtime & Holiday Rate Multipliers
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Regular Overtime (OT)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={tempConfig.regularOvertimeMultiplier}
                        onChange={(e) => setTempConfig({ ...tempConfig, regularOvertimeMultiplier: parseFloat(e.target.value) || 1.25 })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400">x</span>
                    </div>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">Standard 125%</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Sunday Rest Day Rate</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={tempConfig.sundayRateMultiplier}
                        onChange={(e) => setTempConfig({ ...tempConfig, sundayRateMultiplier: parseFloat(e.target.value) || 1.30 })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400">x</span>
                    </div>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">Standard 130%</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Sunday Overtime</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={tempConfig.sundayOvertimeMultiplier}
                        onChange={(e) => setTempConfig({ ...tempConfig, sundayOvertimeMultiplier: parseFloat(e.target.value) || 1.69 })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400">x</span>
                    </div>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">1.30 x 1.30 = 1.69x</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Regular Holiday (Worked)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={tempConfig.regularHolidayMultiplier}
                        onChange={(e) => setTempConfig({ ...tempConfig, regularHolidayMultiplier: parseFloat(e.target.value) || 2.00 })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400">x</span>
                    </div>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">Standard 200%</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Special Holiday (Worked)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={tempConfig.specialHolidayMultiplier}
                        onChange={(e) => setTempConfig({ ...tempConfig, specialHolidayMultiplier: parseFloat(e.target.value) || 1.30 })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400">x</span>
                    </div>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">Standard 130%</span>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={tempConfig.includeUnworkedRegularHolidayPay}
                        onChange={(e) => setTempConfig({ ...tempConfig, includeUnworkedRegularHolidayPay: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">Paid Unworked Reg Holiday</span>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetConfig}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save Rules
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Holiday Management Drawer / Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Holiday Calendar Manager
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define regular & special holidays to calculate 200% / 130% holiday compensation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Holiday Form */}
            <form onSubmit={handleAddHoliday} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add / Designate a Holiday</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-3">
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliDate}
                    onChange={(e) => setNewHoliDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Holiday Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Labor Day, Company Holiday"
                    value={newHoliName}
                    onChange={(e) => setNewHoliName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Type</label>
                  <select
                    value={newHoliType}
                    onChange={(e) => setNewHoliType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value="regular">Regular Holiday (200%)</option>
                    <option value="special">Special Holiday (130%)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* List of Holidays */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Registered Holidays ({holidays.length})
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {holidays
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((h) => {
                    const isInCurrentPeriod = h.date >= startDate && h.date <= endDate;
                    return (
                      <div
                        key={h.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                          isInCurrentPeriod 
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60' 
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {h.date}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            h.type === 'regular' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                          }`}>
                            {h.type === 'regular' ? 'Regular 200%' : 'Special 130%'}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">
                            {h.name}
                          </span>
                          {isInCurrentPeriod && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              (In Current Cutoff)
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Remove holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
