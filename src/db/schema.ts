import { pgTable, text, integer, timestamp, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for Firebase Auth accounts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('Technical Lead'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tasks / Deliverables table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  sNo: integer('s_no').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  workstream: text('workstream').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  deliverable: text('deliverable').notNull(),
  backendOwner: text('backend_owner').notNull(),
  frontendOwner: text('frontend_owner').notNull(),
  testOwner: text('test_owner').notNull(),
  dependency: text('dependency').notNull(),
  status: text('status').notNull(),
  remark: text('remark').notNull(),
  delayDays: integer('delay_days').default(0),
  delayReason: text('delay_reason'),
  mitigationPlan: text('mitigation_plan'),
  priority: text('priority').default('Medium'),
  percentComplete: integer('percent_complete').default(0),
  lastUpdated: text('last_updated'),
  lastReminderSent: text('last_reminder_sent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Reminders & Notifications Log table
export const remindersLog = pgTable('reminders_log', {
  id: text('id').primaryKey(),
  taskId: text('task_id'),
  taskSNo: integer('task_s_no'),
  taskTitle: text('task_title').notNull(),
  workstream: text('workstream'),
  recipient: text('recipient'),
  recipientName: text('recipient_name'),
  recipientRole: text('recipient_role'),
  recipientEmail: text('recipient_email'),
  dueDate: text('due_date'),
  delayDays: integer('delay_days').default(0),
  urgency: text('urgency').default('Urgent'),
  channel: text('channel').default('Email'),
  message: text('message').notNull(),
  sentAt: timestamp('sent_at').defaultNow(),
  status: text('status').default('Sent'),
});

export const usersRelations = relations(users, () => ({}));
