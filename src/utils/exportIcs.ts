import { TaskItem } from '../types';
import { parseDateString, calculateDaysDiff, getCurrentReportDateTime } from './dateUtils';

export interface IcsExportOptions {
  scope?: 'upcoming' | 'active' | 'all' | 'high_priority';
  includeAlarms?: boolean;
  leadFilter?: string;
  workstreamFilter?: string;
}

/**
 * Converts a Date or DD-MM-YYYY string to iCal YYYYMMDD format
 */
function toIcsDateString(dateStr: string): string | null {
  const d = parseDateString(dateStr);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Adds 1 day and converts to iCal YYYYMMDD format (iCal all-day events are exclusive of DTEND)
 */
function toIcsNextDayString(dateStr: string): string | null {
  const d = parseDateString(dateStr);
  if (!d) return null;
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generates RFC 5545 compliant iCalendar content from project tasks
 */
export function generateIcsCalendarContent(
  tasks: TaskItem[],
  asOfDate: string,
  options: IcsExportOptions = {}
): { content: string; eventCount: number; upcomingCount: number } {
  const {
    scope = 'active',
    includeAlarms = true,
    leadFilter,
    workstreamFilter
  } = options;

  const now = new Date();
  const nowIsoUtc = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Filter tasks with valid deadlines
  const eligibleTasks = tasks.filter(task => {
    // Must have a parsable end date
    const icsDate = toIcsDateString(task.endDate);
    if (!icsDate) return false;

    // Optional lead filter
    if (leadFilter && leadFilter !== 'All') {
      const matchBe = task.backendOwner.toLowerCase().includes(leadFilter.toLowerCase());
      const matchFe = task.frontendOwner.toLowerCase().includes(leadFilter.toLowerCase());
      if (!matchBe && !matchFe) return false;
    }

    // Optional workstream filter
    if (workstreamFilter && workstreamFilter !== 'All') {
      if (task.workstream !== workstreamFilter) return false;
    }

    const daysDiff = calculateDaysDiff(task.endDate, asOfDate);

    // Scope filter
    switch (scope) {
      case 'upcoming':
        // Deadlines within next 14 days or due soon, and not completed
        return task.status !== 'Completed' && (daysDiff === null || (daysDiff >= -7 && daysDiff <= 30));
      case 'high_priority':
        return (task.priority === 'Critical' || task.priority === 'High') && task.status !== 'Completed';
      case 'active':
        // All not completed tasks
        return task.status !== 'Completed';
      case 'all':
      default:
        return true;
    }
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wholesale Banking PMO//Delivery Action Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Wholesale Banking Project Deadlines',
    'X-WR-TIMEZONE:UTC',
    'X-WR-CALDESC:Executive Wholesale Banking Action Plan - Target Deliverables and Deadlines Calendar Sync'
  ];

  let upcomingCount = 0;

  for (const task of eligibleTasks) {
    const dtStart = toIcsDateString(task.endDate);
    const dtEnd = toIcsNextDayString(task.endDate);
    if (!dtStart || !dtEnd) continue;

    const daysDiff = calculateDaysDiff(task.endDate, asOfDate);
    if (daysDiff !== null && daysDiff >= 0 && daysDiff <= 14 && task.status !== 'Completed') {
      upcomingCount++;
    }

    const priorityVal = task.priority === 'Critical' ? 1 : task.priority === 'High' ? 3 : task.priority === 'Low' ? 9 : 5;
    const backendStatus = task.backendStatus || task.status;
    const frontendStatus = task.frontendStatus || task.status;

    // Clean multiline description
    const descLines = [
      `Wholesale Banking PMO Action Plan Deliverable`,
      `================================================`,
      `Task S.No: #${task.sNo}`,
      `Title: ${task.title}`,
      `Workstream: ${task.workstream}`,
      `Deliverable: ${task.deliverable}`,
      `Target Finish Date: ${task.endDate}`,
      `Actual / Projected Finish: ${task.actualFinishDate || task.endDate}`,
      `Overall Status: ${task.status}`,
      `Backend Lead: ${task.backendOwner} [Status: ${backendStatus}]`,
      `Frontend Lead: ${task.frontendOwner} [Status: ${frontendStatus}]`,
      `QA / Test Lead: ${task.testOwner}`,
      `Priority: ${task.priority || 'Medium'}`,
      `Progress: ${task.percentComplete || 0}%`,
      `Dependency: ${task.dependency}`,
      `Delay Count: ${task.delayDays || 0} Days`,
      task.delayReason ? `Root Cause: ${task.delayReason}` : '',
      task.mitigationPlan ? `Mitigation Plan: ${task.mitigationPlan}` : '',
      task.remark ? `Remarks: ${task.remark}` : '',
      `================================================`,
      `Generated by Wholesale Banking PMO Governance Suite`
    ].filter(Boolean);

    const descriptionEscaped = descLines.join('\\n');
    const summaryClean = `[PMO Deadline] #${task.sNo}: ${task.title.replace(/[,;\\]/g, ' ')} (${task.status})`;
    const locationClean = `Wholesale Banking PMO - ${task.workstream.replace(/[,;\\]/g, ' ')}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:task-${task.sNo}-${task.id || 't'}-deadline@wholesalebanking.pmo`);
    lines.push(`DTSTAMP:${nowIsoUtc}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${summaryClean}`);
    lines.push(`DESCRIPTION:${descriptionEscaped}`);
    lines.push(`LOCATION:${locationClean}`);
    lines.push(`STATUS:${task.status === 'Completed' ? 'CONFIRMED' : 'CONFIRMED'}`);
    lines.push(`PRIORITY:${priorityVal}`);
    lines.push(`CATEGORIES:Wholesale Banking,${task.workstream},PMO Deadline`);
    lines.push(`CLASS:PUBLIC`);

    if (includeAlarms && task.status !== 'Completed') {
      // 1-Day Before Alarm
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Upcoming PMO Deadline Tomorrow: #${task.sNo} ${task.title}`);
      lines.push('TRIGGER:-P1D');
      lines.push('END:VALARM');

      // 3-Day Notice Alarm for High/Critical tasks
      if (task.priority === 'Critical' || task.priority === 'High') {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:Upcoming PMO Milestone in 3 Days: #${task.sNo} ${task.title}`);
        lines.push('TRIGGER:-P3D');
        lines.push('END:VALARM');
      }
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return {
    content: lines.join('\r\n'),
    eventCount: eligibleTasks.length,
    upcomingCount
  };
}

/**
 * Triggers download of the generated .ics file for Outlook / Google Calendar
 */
export function exportDeadlinesToIcs(
  tasks: TaskItem[],
  asOfDate: string,
  options: IcsExportOptions = {},
  fileName?: string
): { eventCount: number; fileName: string } {
  const { content, eventCount } = generateIcsCalendarContent(tasks, asOfDate, options);
  const reportTime = getCurrentReportDateTime();
  const defaultFileName = fileName || `Wholesale_Banking_Deadlines_${reportTime.fileTimestamp}.ics`;

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { eventCount, fileName: defaultFileName };
}
