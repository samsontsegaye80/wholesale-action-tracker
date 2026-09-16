import { db } from './index.ts';
import { remindersLog } from './schema.ts';
import { desc } from 'drizzle-orm';
import { ReminderNotification } from '../types';

export async function getAllReminders(): Promise<ReminderNotification[]> {
  try {
    const rows = await db.select().from(remindersLog).orderBy(desc(remindersLog.sentAt));
    return rows.map((r) => ({
      id: r.id,
      taskId: r.taskId || '',
      taskSNo: r.taskSNo ?? undefined,
      taskTitle: r.taskTitle,
      workstream: r.workstream || undefined,
      recipient: r.recipient || undefined,
      recipientName: r.recipientName || undefined,
      recipientRole: r.recipientRole || undefined,
      recipientEmail: r.recipientEmail || undefined,
      dueDate: r.dueDate || undefined,
      delayDays: r.delayDays ?? 0,
      urgency: (r.urgency as any) || 'Urgent',
      channel: (r.channel as any) || 'Email',
      message: r.message,
      sentAt: r.sentAt ? r.sentAt.toISOString() : new Date().toISOString(),
      status: (r.status as any) || 'Sent',
    }));
  } catch (error) {
    console.error('Failed to get reminders from Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function addReminder(reminder: ReminderNotification): Promise<ReminderNotification> {
  try {
    const values = {
      id: reminder.id,
      taskId: reminder.taskId || null,
      taskSNo: reminder.taskSNo || null,
      taskTitle: reminder.taskTitle,
      workstream: reminder.workstream || null,
      recipient: reminder.recipient || null,
      recipientName: reminder.recipientName || null,
      recipientRole: reminder.recipientRole || null,
      recipientEmail: reminder.recipientEmail || null,
      dueDate: reminder.dueDate || null,
      delayDays: reminder.delayDays ?? 0,
      urgency: reminder.urgency || 'Urgent',
      channel: reminder.channel || 'Email',
      message: reminder.message,
      sentAt: reminder.sentAt ? new Date(reminder.sentAt) : new Date(),
      status: reminder.status || 'Sent',
    };

    const result = await db.insert(remindersLog).values(values).returning();
    const r = result[0];
    return {
      id: r.id,
      taskId: r.taskId || '',
      taskSNo: r.taskSNo ?? undefined,
      taskTitle: r.taskTitle,
      workstream: r.workstream || undefined,
      recipient: r.recipient || undefined,
      recipientName: r.recipientName || undefined,
      recipientRole: r.recipientRole || undefined,
      recipientEmail: r.recipientEmail || undefined,
      dueDate: r.dueDate || undefined,
      delayDays: r.delayDays ?? 0,
      urgency: (r.urgency as any) || 'Urgent',
      channel: (r.channel as any) || 'Email',
      message: r.message,
      sentAt: r.sentAt ? r.sentAt.toISOString() : new Date().toISOString(),
      status: (r.status as any) || 'Sent',
    };
  } catch (error) {
    console.error('Failed to add reminder in Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
