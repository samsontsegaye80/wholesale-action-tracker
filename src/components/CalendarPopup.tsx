import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  Clock, 
  RotateCcw,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { 
  parseDateString, 
  formatDateToDDMMYYYY, 
  calculateDaysDiff, 
  formatDateToDisplay,
  addDaysToDate 
} from '../utils/dateUtils';

interface CalendarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  value?: string; // Initial/current date in DD-MM-YYYY
  onChange: (newDateDDMMYYYY: string) => void;
  title?: string;
  targetFinishDate?: string; // Target Finish Date (DD-MM-YYYY) to compare against
  businessDate?: string; // Business date (asOfDate), e.g. 18-08-2026
  taskTitle?: string;
}

export const CalendarPopup: React.FC<CalendarPopupProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  title = 'Select Actual Finish Date',
  targetFinishDate,
  businessDate = '18-08-2026',
  taskTitle,
}) => {
  // Parse initial selected date or default to business date or target date
  const parsedInitial = value ? parseDateString(value) : null;
  const parsedBusiness = parseDateString(businessDate) || new Date(2026, 7, 18);
  const parsedTarget = targetFinishDate ? parseDateString(targetFinishDate) : null;

  // View state: Month & Year
  const [currentYear, setCurrentYear] = useState<number>(() => {
    return parsedInitial?.getFullYear() || parsedBusiness.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    return parsedInitial !== null ? parsedInitial.getMonth() : parsedBusiness.getMonth();
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedInitial);
  const [manualInput, setManualInput] = useState<string>(value || '');

  // Keep in sync when opened
  useEffect(() => {
    if (isOpen) {
      const p = value ? parseDateString(value) : null;
      setSelectedDate(p);
      setManualInput(value || '');
      if (p) {
        setCurrentYear(p.getFullYear());
        setCurrentMonth(p.getMonth());
      } else {
        const b = parseDateString(businessDate) || new Date(2026, 7, 18);
        setCurrentYear(b.getFullYear());
        setCurrentMonth(b.getMonth());
      }
    }
  }, [isOpen, value, businessDate]);

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate day cells for calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  // Adjust so Monday is 0
  const startOffset = (firstDayIndex + 6) % 7;

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    const formatted = formatDateToDDMMYYYY(newDate);
    setManualInput(formatted);
  };

  const handleApply = () => {
    if (selectedDate) {
      const formatted = formatDateToDDMMYYYY(selectedDate);
      onChange(formatted);
    } else if (manualInput.trim()) {
      const parsed = parseDateString(manualInput.trim());
      if (parsed) {
        onChange(formatDateToDDMMYYYY(parsed));
      } else {
        onChange(manualInput.trim());
      }
    } else {
      onChange('');
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedDate(null);
    setManualInput('');
    onChange('');
    onClose();
  };

  const handleSelectToday = () => {
    const b = parseDateString(businessDate) || new Date(2026, 7, 18);
    setSelectedDate(b);
    setCurrentYear(b.getFullYear());
    setCurrentMonth(b.getMonth());
    setManualInput(formatDateToDDMMYYYY(b));
  };

  const handleSelectTarget = () => {
    if (parsedTarget) {
      setSelectedDate(parsedTarget);
      setCurrentYear(parsedTarget.getFullYear());
      setCurrentMonth(parsedTarget.getMonth());
      setManualInput(formatDateToDDMMYYYY(parsedTarget));
    }
  };

  // Compute variance from target finish date
  let delayVarianceDays: number | null = null;
  if (selectedDate && parsedTarget) {
    const diffMs = selectedDate.getTime() - parsedTarget.getTime();
    delayVarianceDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden border-t-4 border-t-[#95288E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#95288E]/20 border border-[#95288E]/50 flex items-center justify-center text-[#D667CF]">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <span>{title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#95288E]/30 text-[#D667CF] font-mono">
                  (DD-MM-YYYY)
                </span>
              </h3>
              {taskTitle && (
                <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                  {taskTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Date Summary & Variance Badge */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Selected:</span>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                const p = parseDateString(e.target.value);
                if (p) {
                  setSelectedDate(p);
                  setCurrentYear(p.getFullYear());
                  setCurrentMonth(p.getMonth());
                }
              }}
              placeholder="DD-MM-YYYY"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold w-28 text-center focus:outline-none focus:border-[#95288E]"
            />
          </div>

          {/* Comparison with Target Date */}
          {targetFinishDate && (
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">Target Baseline: {targetFinishDate}</span>
              {delayVarianceDays !== null ? (
                delayVarianceDays > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                    <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                    <span>+{delayVarianceDays}d Delay</span>
                  </span>
                ) : delayVarianceDays < 0 ? (
                  <span className="text-[11px] font-bold text-emerald-400">
                    {Math.abs(delayVarianceDays)}d Ahead
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-400">
                    On-Time (0d)
                  </span>
                )
              ) : null}
            </div>
          )}
        </div>

        {/* Calendar Controls (Month & Year) */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white font-mono">
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-[#B38D34] font-mono font-semibold transition cursor-pointer"
                title={`Set to Business Date (${businessDate})`}
              >
                Today ({businessDate.slice(0, 5)})
              </button>
              {parsedTarget && (
                <button
                  type="button"
                  onClick={handleSelectTarget}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-cyan-400 font-mono font-semibold transition cursor-pointer"
                  title={`Match Target Finish Date (${targetFinishDate})`}
                >
                  Target
                </button>
              )}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-slate-400 font-bold mb-1.5 pb-1 border-b border-slate-800/80">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span className="text-amber-400/80">Sa</span>
              <span className="text-rose-400/80">Su</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank offset days */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const cellDate = new Date(currentYear, currentMonth, dayNumber);
                const cellFormatted = formatDateToDDMMYYYY(cellDate);
                
                const isSelected = selectedDate && 
                  selectedDate.getDate() === dayNumber && 
                  selectedDate.getMonth() === currentMonth && 
                  selectedDate.getFullYear() === currentYear;

                const isBusinessToday = 
                  parsedBusiness.getDate() === dayNumber && 
                  parsedBusiness.getMonth() === currentMonth && 
                  parsedBusiness.getFullYear() === currentYear;

                const isTargetDate = parsedTarget && 
                  parsedTarget.getDate() === dayNumber && 
                  parsedTarget.getMonth() === currentMonth && 
                  parsedTarget.getFullYear() === currentYear;

                return (
                  <button
                    key={dayNumber}
                    type="button"
                    onClick={() => handleSelectDay(dayNumber)}
                    className={`h-8 rounded-lg text-xs font-mono font-semibold transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#95288E] to-[#B38D34] text-white shadow-md shadow-[#95288E]/50 font-bold ring-2 ring-[#D667CF]'
                        : isTargetDate
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600 hover:bg-cyan-900'
                          : isBusinessToday
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-600/70 hover:bg-amber-900'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{dayNumber}</span>
                    {isTargetDate && !isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-400" title="Target Baseline Date" />
                    )}
                    {isBusinessToday && !isSelected && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" title="Business Date" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Business Date</span>
            </span>
            {targetFinishDate && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Target Finish</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D667CF]"></span>
              <span>Selected Actual</span>
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-xs font-mono transition cursor-pointer"
          >
            Clear Date
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-[#95288E] hover:bg-[#701A75] text-white text-xs font-bold font-mono shadow-md shadow-[#95288E]/40 border border-[#D667CF]/50 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply (DD-MM-YYYY)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
