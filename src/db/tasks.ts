import { db } from './index.ts';
import { tasks } from './schema.ts';
import { eq, asc } from 'drizzle-orm';
import { TaskItem } from '../types';
import { INITIAL_TASKS } from '../data/initialTasks.ts';

let inMemoryTasks: TaskItem[] = [...INITIAL_TASKS];

export async function getAllTasks(): Promise<TaskItem[]> {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return inMemoryTasks;
  }
  try {
    const rows = await db.select().from(tasks).orderBy(asc(tasks.sNo));
    if (rows.length === 0) {
      return inMemoryTasks;
    }
    return rows.map((r) => ({
      id: r.id,
      sNo: r.sNo,
      title: r.title,
      description: r.description || undefined,
      workstream: r.workstream as any,
      startDate: r.startDate,
      endDate: r.endDate,
      deliverable: r.deliverable,
      backendOwner: r.backendOwner,
      frontendOwner: r.frontendOwner,
      testOwner: r.testOwner,
      dependency: r.dependency,
      status: r.status as any,
      remark: r.remark,
      delayDays: r.delayDays ?? 0,
      delayReason: r.delayReason || undefined,
      mitigationPlan: r.mitigationPlan || undefined,
      priority: (r.priority as any) || 'Medium',
      percentComplete: r.percentComplete ?? 0,
      lastUpdated: r.lastUpdated || undefined,
      lastReminderSent: r.lastReminderSent || undefined,
    }));
  } catch (error) {
    console.warn('SQL query failed or database not connected, using in-memory tasks fallback:', error);
    return inMemoryTasks;
  }
}

export async function upsertTask(task: TaskItem): Promise<TaskItem> {
  const index = inMemoryTasks.findIndex((t) => t.id === task.id || t.sNo === task.sNo);
  const updatedTask = { ...task, lastUpdated: new Date().toISOString() };
  if (index >= 0) {
    inMemoryTasks[index] = updatedTask;
  } else {
    inMemoryTasks.push(updatedTask);
  }

  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return updatedTask;
  }

  try {
    const values = {
      id: task.id,
      sNo: task.sNo,
      title: task.title,
      description: task.description || null,
      workstream: task.workstream,
      startDate: task.startDate,
      endDate: task.endDate,
      deliverable: task.deliverable,
      backendOwner: task.backendOwner,
      frontendOwner: task.frontendOwner,
      testOwner: task.testOwner,
      dependency: task.dependency,
      status: task.status,
      remark: task.remark,
      delayDays: task.delayDays ?? 0,
      delayReason: task.delayReason || null,
      mitigationPlan: task.mitigationPlan || null,
      priority: task.priority || 'Medium',
      percentComplete: task.percentComplete ?? 0,
      lastUpdated: task.lastUpdated || new Date().toISOString(),
      lastReminderSent: task.lastReminderSent || null,
      updatedAt: new Date(),
    };

    const result = await db.insert(tasks)
      .values(values)
      .onConflictDoUpdate({
        target: tasks.id,
        set: values,
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      sNo: r.sNo,
      title: r.title,
      description: r.description || undefined,
      workstream: r.workstream as any,
      startDate: r.startDate,
      endDate: r.endDate,
      deliverable: r.deliverable,
      backendOwner: r.backendOwner,
      frontendOwner: r.frontendOwner,
      testOwner: r.testOwner,
      dependency: r.dependency,
      status: r.status as any,
      remark: r.remark,
      delayDays: r.delayDays ?? 0,
      delayReason: r.delayReason || undefined,
      mitigationPlan: r.mitigationPlan || undefined,
      priority: (r.priority as any) || 'Medium',
      percentComplete: r.percentComplete ?? 0,
      lastUpdated: r.lastUpdated || undefined,
      lastReminderSent: r.lastReminderSent || undefined,
    };
  } catch (error) {
    console.warn('Could not save to SQL, persisted in memory:', error);
    return updatedTask;
  }
}

export async function bulkUpsertTasks(taskList: TaskItem[]): Promise<void> {
  for (const task of taskList) {
    await upsertTask(task);
  }
}

export async function deleteTask(id: string): Promise<void> {
  inMemoryTasks = inMemoryTasks.filter((t) => t.id !== id);
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return;
  }
  try {
    await db.delete(tasks).where(eq(tasks.id, id));
  } catch (error) {
    console.warn('Failed to delete task in Cloud SQL, removed from memory:', error);
  }
}

export async function resetAllTasks(defaultTasks: TaskItem[]): Promise<TaskItem[]> {
  inMemoryTasks = [...defaultTasks];
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return inMemoryTasks;
  }
  try {
    await db.delete(tasks);
    await bulkUpsertTasks(defaultTasks);
    return await getAllTasks();
  } catch (error) {
    console.warn('Failed to reset tasks in Cloud SQL, reset in memory:', error);
    return inMemoryTasks;
  }
}
