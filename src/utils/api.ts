import { TaskItem, ReminderNotification } from '../types';
import { INITIAL_TASKS } from '../data/initialTasks';

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = (import.meta.env.VITE_API_BASE_URL as string) || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    return `${base.replace(/\/$/, '')}${cleanPath}`;
  }
  return cleanPath;
}

export async function fetchTasksApi(token?: string | null): Promise<TaskItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(getApiUrl('/api/tasks'), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch tasks from Cloud SQL API, using cache:', err);
  }
  return [];
}

export async function saveTaskApi(task: TaskItem, token?: string | null): Promise<TaskItem> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(getApiUrl('/api/tasks'), {
      method: 'POST',
      headers,
      body: JSON.stringify(task),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not save task to Cloud SQL API:', err);
  }
  return task;
}

export async function deleteTaskApi(id: string, token?: string | null): Promise<void> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await fetch(getApiUrl(`/api/tasks/${id}`), {
      method: 'DELETE',
      headers,
    });
  } catch (err) {
    console.warn('Could not delete task from Cloud SQL API:', err);
  }
}

export async function resetTasksApi(token?: string | null): Promise<TaskItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(getApiUrl('/api/tasks/reset'), {
      method: 'POST',
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not reset tasks via Cloud SQL API:', err);
  }
  return INITIAL_TASKS;
}

export async function fetchRemindersApi(token?: string | null): Promise<ReminderNotification[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(getApiUrl('/api/reminders'), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch reminders from Cloud SQL API:', err);
  }
  return [];
}

export async function saveReminderApi(reminder: ReminderNotification, token?: string | null): Promise<ReminderNotification> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(getApiUrl('/api/reminders'), {
      method: 'POST',
      headers,
      body: JSON.stringify(reminder),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not save reminder to Cloud SQL API:', err);
  }
  return reminder;
}

export async function syncRemoteApi(
  remoteUrl: string = 'https://wholsaleprojectmvp3.ai.studio',
  token?: string | null
): Promise<{ success: boolean; tasks: TaskItem[]; reminders?: ReminderNotification[] }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(getApiUrl('/api/sync-remote'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: remoteUrl }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not sync from remote API:', err);
  }
  return { success: false, tasks: [] };
}
