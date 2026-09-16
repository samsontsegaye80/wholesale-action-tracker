import { TaskItem } from '../types';

export function parseDateString(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'TBD' || dateStr === 'Ongoing' || dateStr === '-') {
    return null;
  }

  // Handle DD-MM-YYYY
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Fallback to ISO parsing
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateToDisplay(dateStr: string): string {
  if (!dateStr || dateStr === '-' || dateStr === 'TBD' || dateStr === 'Ongoing') {
    return dateStr || '-';
  }
  const date = parseDateString(dateStr);
  if (!date) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateDaysDiff(targetDateStr: string, asOfDate: string): number | null {
  const target = parseDateString(targetDateStr);
  const asOf = parseDateString(asOfDate) || new Date(2026, 7, 18); // Default Aug 18, 2026

  if (!target || !asOf) return null;

  // normalize to midnight
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const asOfMidnight = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());

  const diffTime = targetMidnight.getTime() - asOfMidnight.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export type UrgencyCategory = 
  | 'OVERDUE'
  | 'DUE_TODAY'
  | 'DUE_SOON_3D'
  | 'DUE_UPCOMING_7D'
  | 'FUTURE'
  | 'COMPLETED'
  | 'ONGOING_OR_TBD';

export function getTaskDeadlineStatus(endDateStr: string, status: string, asOfDate: string): {
  category: UrgencyCategory;
  daysDiff: number | null;
  label: string;
  badgeColor: string;
  isDelayed: boolean;
} {
  if (status === 'Completed') {
    return {
      category: 'COMPLETED',
      daysDiff: null,
      label: 'Delivered',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isDelayed: false,
    };
  }

  if (endDateStr === 'Ongoing' || endDateStr === 'TBD' || endDateStr === '-') {
    return {
      category: 'ONGOING_OR_TBD',
      daysDiff: null,
      label: endDateStr,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      isDelayed: status === 'No BRD' || status === 'Delayed',
    };
  }

  const days = calculateDaysDiff(endDateStr, asOfDate);
  if (days === null) {
    return {
      category: 'ONGOING_OR_TBD',
      daysDiff: null,
      label: 'Date TBD',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      isDelayed: false,
    };
  }

  if (days < 0) {
    const overdueCount = Math.abs(days);
    return {
      category: 'OVERDUE',
      daysDiff: days,
      label: `${overdueCount}d Overdue`,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      isDelayed: true,
    };
  } else if (days === 0) {
    return {
      category: 'DUE_TODAY',
      daysDiff: 0,
      label: 'Due Today',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold animate-pulse',
      isDelayed: false,
    };
  } else if (days <= 3) {
    return {
      category: 'DUE_SOON_3D',
      daysDiff: days,
      label: `Due in ${days}d`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      isDelayed: false,
    };
  } else if (days <= 7) {
    return {
      category: 'DUE_UPCOMING_7D',
      daysDiff: days,
      label: `Due in ${days}d`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      isDelayed: false,
    };
  } else {
    return {
      category: 'FUTURE',
      daysDiff: days,
      label: `In ${days}d`,
      badgeColor: 'bg-slate-50 text-slate-600 border-slate-200',
      isDelayed: false,
    };
  }
}

/**
 * Result of comparing Actual/Projected Finish vs Target Finish dates
 */
export interface DeadlineComparisonResult {
  hasWarning: boolean;
  varianceDays: number; // positive = projected/actual finish is after target finish
  targetFinishDisplay: string;
  actualFinishDisplay: string;
  projectedFinishDate: string;
  statusRisk: 'ON_TRACK' | 'AT_RISK' | 'MISSED_DEADLINE' | 'DELIVERED_EARLY' | 'DELIVERED_ON_TIME' | 'DELIVERED_LATE' | 'NO_SCHEDULE';
  warningTitle: string;
  warningMessage: string;
  severity: 'none' | 'info' | 'warning' | 'critical';
  confidenceScore?: number;
}

/**
 * Compares 'Actual Finish' (or projected finish) vs 'Target Finish' dates
 * and determines if a task is likely to miss its target deadline.
 */
export function compareFinishDates(task: TaskItem, asOfDate: string): DeadlineComparisonResult {
  const targetDateObj = parseDateString(task.endDate);
  const asOfDateObj = parseDateString(asOfDate) || new Date(2026, 7, 18);

  if (!targetDateObj) {
    return {
      hasWarning: task.status === 'Delayed' || task.status === 'Blocked' || task.status === 'No BRD',
      varianceDays: 0,
      targetFinishDisplay: task.endDate || 'TBD',
      actualFinishDisplay: task.actualFinishDate ? formatDateToDisplay(task.actualFinishDate) : 'Not Scheduled',
      projectedFinishDate: 'TBD',
      statusRisk: 'NO_SCHEDULE',
      warningTitle: task.status === 'No BRD' ? 'Missing Requirements BRD' : 'Schedule Not Baselined',
      warningMessage: task.status === 'No BRD' 
        ? 'Business Requirements Document (BRD) pending approval. Critical blocker.' 
        : 'Milestone target date is currently TBD or ongoing.',
      severity: task.status === 'No BRD' ? 'critical' : 'info',
    };
  }

  const targetFinishDisplay = formatDateToDisplay(task.endDate);

  // 1. Task is Completed
  if (task.status === 'Completed') {
    const actualDateObj = task.actualFinishDate ? parseDateString(task.actualFinishDate) : targetDateObj;
    const actualFinishDisplay = actualDateObj ? formatDateToDisplay(formatDateToDDMMYYYY(actualDateObj)) : targetFinishDisplay;
    
    let variance = 0;
    if (actualDateObj) {
      const diffMs = actualDateObj.getTime() - targetDateObj.getTime();
      variance = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    if (variance > 0) {
      return {
        hasWarning: false,
        varianceDays: variance,
        targetFinishDisplay,
        actualFinishDisplay,
        projectedFinishDate: actualFinishDisplay,
        statusRisk: 'DELIVERED_LATE',
        warningTitle: 'Delivered (With Historical Slippage)',
        warningMessage: `Deliverable finalized ${variance} day(s) after target baseline (${targetFinishDisplay}).`,
        severity: 'info',
      };
    } else if (variance < 0) {
      return {
        hasWarning: false,
        varianceDays: variance,
        targetFinishDisplay,
        actualFinishDisplay,
        projectedFinishDate: actualFinishDisplay,
        statusRisk: 'DELIVERED_EARLY',
        warningTitle: 'Delivered Ahead of Schedule',
        warningMessage: `Completed ${Math.abs(variance)} day(s) ahead of target finish date.`,
        severity: 'none',
      };
    } else {
      return {
        hasWarning: false,
        varianceDays: 0,
        targetFinishDisplay,
        actualFinishDisplay,
        projectedFinishDate: actualFinishDisplay,
        statusRisk: 'DELIVERED_ON_TIME',
        warningTitle: 'Delivered On Time',
        warningMessage: `Successfully delivered on target baseline date (${targetFinishDisplay}).`,
        severity: 'none',
      };
    }
  }

  // 2. Incomplete task: Calculate Projected Finish Date
  const delayDays = task.delayDays || 0;
  
  // Calculate projected date from target finish + delay days
  let projectedDateObj = addDaysToDate(targetDateObj, delayDays);

  // If as-of date has already passed the target date, ensure projected date is at least as-of date + remaining work
  const percentComplete = task.percentComplete || 0;
  if (asOfDateObj > targetDateObj && percentComplete < 100) {
    const minDaysNeeded = percentComplete > 75 ? 2 : percentComplete > 40 ? 4 : 7;
    const adjustedProjected = addDaysToDate(asOfDateObj, minDaysNeeded);
    if (adjustedProjected > projectedDateObj) {
      projectedDateObj = adjustedProjected;
    }
  }

  const projectedFinishDate = formatDateToDDMMYYYY(projectedDateObj);
  const actualFinishDisplay = task.actualFinishDate ? formatDateToDisplay(task.actualFinishDate) : `Est: ${formatDateToDisplay(projectedFinishDate)}`;

  // Calculate Variance = Projected Finish - Target Finish
  const varianceMs = projectedDateObj.getTime() - targetDateObj.getTime();
  const varianceDays = Math.ceil(varianceMs / (1000 * 60 * 60 * 24));

  // Determine days remaining until target finish from current as-of baseline
  const daysUntilTarget = calculateDaysDiff(task.endDate, asOfDate) ?? 0;

  // Evaluation: Is it likely to miss deadline?
  if (daysUntilTarget < 0 || varianceDays > 0 || task.status === 'Delayed' || task.status === 'Blocked') {
    const isAlreadyPastTarget = daysUntilTarget < 0;
    const overdueBy = Math.abs(daysUntilTarget);

    return {
      hasWarning: true,
      varianceDays: Math.max(varianceDays, overdueBy),
      targetFinishDisplay,
      actualFinishDisplay,
      projectedFinishDate,
      statusRisk: isAlreadyPastTarget ? 'MISSED_DEADLINE' : 'AT_RISK',
      warningTitle: isAlreadyPastTarget ? '⚠️ Deadline Missed / Overdue' : '⚠️ Projected Deadline Slippage',
      warningMessage: isAlreadyPastTarget
        ? `Target finish was ${targetFinishDisplay} (${overdueBy}d overdue). Projected completion: ${formatDateToDisplay(projectedFinishDate)} (+${Math.max(varianceDays, overdueBy)}d variance).`
        : `High slippage risk: Projected to finish on ${formatDateToDisplay(projectedFinishDate)}, exceeding target finish by ${varianceDays} day(s). Action needed.`,
      severity: 'critical',
      confidenceScore: 92,
    };
  }

  // If due soon (within 3 days) and progress is low (< 50%)
  if (daysUntilTarget <= 3 && percentComplete < 50) {
    return {
      hasWarning: true,
      varianceDays: 2,
      targetFinishDisplay,
      actualFinishDisplay,
      projectedFinishDate,
      statusRisk: 'AT_RISK',
      warningTitle: '⚠️ Critical Velocity Risk',
      warningMessage: `Due in ${daysUntilTarget} day(s) but progress is only ${percentComplete}%. High probability of missing target finish (${targetFinishDisplay}).`,
      severity: 'warning',
      confidenceScore: 85,
    };
  }

  // On Track
  return {
    hasWarning: false,
    varianceDays: 0,
    targetFinishDisplay,
    actualFinishDisplay,
    projectedFinishDate,
    statusRisk: 'ON_TRACK',
    warningTitle: 'On Track',
    warningMessage: `Progressing according to baseline schedule. Projected finish matches target finish (${targetFinishDisplay}).`,
    severity: 'none',
    confidenceScore: 95,
  };
}

export interface ReportGenerationDateTime {
  dateObj: Date;
  iso: string;
  displayDateTime: string;
  displayDate: string;
  displayTime: string;
  compact: string;
  fileTimestamp: string;
  steercoHeader: string;
}

/**
 * Generates structured, high-precision current date and time for report generation,
 * metadata tagging, PowerPoint headers, Excel cover sheets, and export file names.
 */
export function getCurrentReportDateTime(referenceDate?: Date): ReportGenerationDateTime {
  const now = referenceDate || new Date();

  const pad = (n: number) => String(n).padStart(2, '0');
  
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthFullNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const weekday = weekdayNames[now.getDay()];
  const monthShort = monthNames[now.getMonth()];
  const monthFull = monthFullNames[now.getMonth()];

  const displayDate = `${day}-${monthShort}-${year}`;
  const displayTime = `${hours}:${minutes}:${seconds}`;
  const displayDateTime = `${weekday}, ${monthFull} ${now.getDate()}, ${year} at ${displayTime}`;
  const compact = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  const fileTimestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  const steercoHeader = `Generated on ${displayDate} at ${displayTime} (PMO Governance Master Timestamp)`;

  return {
    dateObj: now,
    iso: now.toISOString(),
    displayDateTime,
    displayDate,
    displayTime,
    compact,
    fileTimestamp,
    steercoHeader,
  };
}

export interface CriticalDelayCalculation {
  delayDays: number;
  isCriticalDelay: boolean;
  varianceDays: number;
  targetDateDisplay: string;
  businessDateDisplay: string;
  statusText: string;
}

/**
 * Calculates critical delay days count as the difference between "Target Finish Date" 
 * and "Business Date" (asOfDate) if task status is not completed.
 */
export function calculateCriticalDelayDays(task: TaskItem, asOfDate: string): CriticalDelayCalculation {
  const targetDate = parseDateString(task.endDate);
  const businessDate = parseDateString(asOfDate) || new Date(2026, 7, 18);
  const targetDisplay = formatDateToDisplay(task.endDate);
  const businessDisplay = formatDateToDisplay(asOfDate);

  // 1. If status is 'Completed'
  if (task.status === 'Completed') {
    if (task.actualFinishDate && targetDate) {
      const actualDate = parseDateString(task.actualFinishDate);
      if (actualDate) {
        const diffMs = actualDate.getTime() - targetDate.getTime();
        const variance = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (variance > 0) {
          return {
            delayDays: variance,
            isCriticalDelay: false, // Delivered, but delayed historically
            varianceDays: variance,
            targetDateDisplay: targetDisplay,
            businessDateDisplay: businessDisplay,
            statusText: `Completed late (+${variance}d)`
          };
        }
      }
    }
    return {
      delayDays: 0,
      isCriticalDelay: false,
      varianceDays: 0,
      targetDateDisplay: targetDisplay,
      businessDateDisplay: businessDisplay,
      statusText: 'Completed on-time'
    };
  }

  // 2. If status is NOT 'Completed'
  // If target date is unbaselined (TBD, Ongoing, or missing)
  if (!targetDate) {
    const isSpecialDelay = task.status === 'Delayed' || task.status === 'No BRD' || task.status === 'Blocked';
    const fallbackDays = task.delayDays || (isSpecialDelay ? 7 : 0);
    return {
      delayDays: fallbackDays,
      isCriticalDelay: fallbackDays > 0,
      varianceDays: fallbackDays,
      targetDateDisplay: targetDisplay,
      businessDateDisplay: businessDisplay,
      statusText: isSpecialDelay ? `Critical: ${task.status}` : 'Schedule TBD'
    };
  }

  // Difference: business date - Target Finish Date
  const diffMs = businessDate.getTime() - targetDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If business date has surpassed Target Finish Date, task is critically overdue by that difference
  if (diffDays > 0) {
    return {
      delayDays: diffDays,
      isCriticalDelay: true,
      varianceDays: diffDays,
      targetDateDisplay: targetDisplay,
      businessDateDisplay: businessDisplay,
      statusText: `${diffDays}d past business date (${businessDisplay})`
    };
  }

  // If task has an explicit actual finish date or projected date that extends past target date
  if (task.actualFinishDate) {
    const actualDate = parseDateString(task.actualFinishDate);
    if (actualDate && actualDate.getTime() > targetDate.getTime()) {
      const projDiff = Math.ceil((actualDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        delayDays: projDiff,
        isCriticalDelay: true,
        varianceDays: projDiff,
        targetDateDisplay: targetDisplay,
        businessDateDisplay: businessDisplay,
        statusText: `Projected slippage +${projDiff}d`
      };
    }
  }

  // If explicitly flagged as Delayed or No BRD or has manual delayDays
  if (task.status === 'Delayed' || task.status === 'No BRD' || (task.delayDays && task.delayDays > 0)) {
    const d = task.delayDays || 1;
    return {
      delayDays: d,
      isCriticalDelay: true,
      varianceDays: d,
      targetDateDisplay: targetDisplay,
      businessDateDisplay: businessDisplay,
      statusText: `Blocked / Delayed (+${d}d)`
    };
  }

  // Otherwise on track
  return {
    delayDays: 0,
    isCriticalDelay: false,
    varianceDays: diffDays, // negative indicates days remaining until target
    targetDateDisplay: targetDisplay,
    businessDateDisplay: businessDisplay,
    statusText: `On-Track (Due in ${Math.abs(diffDays)}d)`
  };
}

