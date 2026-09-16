import { TaskItem, ReminderNotification } from '../types';
import { INITIAL_TASKS } from '../data/initialTasks';

const STORAGE_KEY_TASKS = 'wholesale_banking_action_plan_tasks_v2';
const STORAGE_KEY_AS_OF_DATE = 'action_plan_as_of_date';
const STORAGE_KEY_REMINDERS = 'action_plan_reminders_log';

export function loadTasksFromStorage(): TaskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(t => ({
          ...t,
          backendStatus: t.backendStatus || t.status,
          frontendStatus: t.frontendStatus || (t.frontendOwner === '-' ? (t.status === 'Completed' ? 'Completed' : 'Not Started') : t.status),
        }));
      }
    }
  } catch (e) {
    console.error('Error loading tasks from localStorage', e);
  }
  return INITIAL_TASKS.map(t => ({
    ...t,
    backendStatus: t.backendStatus || t.status,
    frontendStatus: t.frontendStatus || (t.frontendOwner === '-' ? (t.status === 'Completed' ? 'Completed' : 'Not Started') : t.status),
  }));
}

export function saveTasksToStorage(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks to localStorage', e);
  }
}

export function loadAsOfDateFromStorage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AS_OF_DATE);
    if (saved) return saved;
  } catch (e) {
    // ignore
  }
  return '18-08-2026'; // Baseline project reference date
}

export function saveAsOfDateToStorage(dateStr: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_AS_OF_DATE, dateStr);
  } catch (e) {
    // ignore
  }
}

export function loadRemindersFromStorage(): ReminderNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveRemindersToStorage(reminders: ReminderNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    // ignore
  }
}

export function resetTasksToOriginal(): TaskItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY_TASKS);
  } catch (e) {
    // ignore
  }
  return INITIAL_TASKS;
}

export const resetTasksToDefault = resetTasksToOriginal;

