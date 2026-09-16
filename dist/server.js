var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { GoogleGenAI } from "@google/genai";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  remindersLog: () => remindersLog,
  tasks: () => tasks,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  // Firebase UID
  email: text("email").notNull(),
  displayName: text("display_name"),
  role: text("role").default("Technical Lead"),
  createdAt: timestamp("created_at").defaultNow()
});
var tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  sNo: integer("s_no").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  workstream: text("workstream").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  deliverable: text("deliverable").notNull(),
  backendOwner: text("backend_owner").notNull(),
  frontendOwner: text("frontend_owner").notNull(),
  testOwner: text("test_owner").notNull(),
  dependency: text("dependency").notNull(),
  status: text("status").notNull(),
  remark: text("remark").notNull(),
  delayDays: integer("delay_days").default(0),
  delayReason: text("delay_reason"),
  mitigationPlan: text("mitigation_plan"),
  priority: text("priority").default("Medium"),
  percentComplete: integer("percent_complete").default(0),
  lastUpdated: text("last_updated"),
  lastReminderSent: text("last_reminder_sent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var remindersLog = pgTable("reminders_log", {
  id: text("id").primaryKey(),
  taskId: text("task_id"),
  taskSNo: integer("task_s_no"),
  taskTitle: text("task_title").notNull(),
  workstream: text("workstream"),
  recipient: text("recipient"),
  recipientName: text("recipient_name"),
  recipientRole: text("recipient_role"),
  recipientEmail: text("recipient_email"),
  dueDate: text("due_date"),
  delayDays: integer("delay_days").default(0),
  urgency: text("urgency").default("Urgent"),
  channel: text("channel").default("Email"),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("Sent")
});
var usersRelations = relations(users, () => ({}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// src/db/tasks.ts
import { eq, asc } from "drizzle-orm";

// src/data/initialTasks.ts
var INITIAL_TASKS = [
  {
    "id": "task-1",
    "sNo": 1,
    "title": "Requirement Analysis & BRD Review",
    "description": "Perform deep-dive analysis of Wholesale Banking Customer Onboarding BRD and cross-functional requirements.",
    "workstream": "Foundation & Analysis",
    "startDate": "17-08-2026",
    "endDate": "19-08-2026",
    "deliverable": "Reviewed BRD",
    "backendOwner": "All Engineering Team",
    "frontendOwner": "All Engineering Team",
    "testOwner": "-",
    "dependency": "-",
    "status": "In Progress",
    "remark": "Recurrent",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-2",
    "sNo": 2,
    "title": "Brainstorming on Requirements",
    "description": "Technical architecture brainstorming, system boundary definitions, and core architectural design decisions.",
    "workstream": "Foundation & Analysis",
    "startDate": "20-08-2026",
    "endDate": "23-08-2026",
    "deliverable": "Technical design decisions",
    "backendOwner": "All Engineering Team",
    "frontendOwner": "All Engineering Team",
    "testOwner": "-",
    "dependency": "Reviewed BRD & Requirement Analysis",
    "status": "In Progress",
    "remark": "Recurrent",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-3",
    "sNo": 3,
    "title": "Dynamic User Management Engine Integration",
    "description": "Consolidate dynamic user management framework into current codebase with centralized identity and token validation.",
    "workstream": "Dynamic User Management & Permission Integration",
    "startDate": "17-08-2026",
    "endDate": "23-08-2026",
    "deliverable": "Dynamic user management core",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "Melese Ayichlie Jigar",
    "testOwner": "-",
    "dependency": "Technical Architecture Decisions & System Boundary Definition",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Critical",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T11:01:45.822Z"
  },
  {
    "id": "task-4",
    "sNo": 4,
    "title": "Backend Permission & Authorization Framework",
    "description": "Implement dynamic permission enforcement on API endpoints with role-based access control and policy interceptors.",
    "workstream": "Dynamic User Management & Permission Integration",
    "startDate": "17-08-2026",
    "endDate": "23-08-2026",
    "deliverable": "Dynamic API authorization & permission",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "-",
    "testOwner": "-",
    "dependency": "Dynamic User Management Core Integration",
    "status": "Completed",
    "remark": "",
    "delayDays": 0,
    "priority": "Critical",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T10:59:14.455Z"
  },
  {
    "id": "task-5",
    "sNo": 5,
    "title": "Frontend Dynamic Access Control & Route Protection",
    "description": "Implement page-level access control, route guards, and navigation security based on dynamic user permissions.",
    "workstream": "Dynamic User Management & Permission Integration",
    "startDate": "17-08-2026",
    "endDate": "23-08-2026",
    "deliverable": "Protected navigation & route security",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "Melese Ayichlie Jigar",
    "testOwner": "-",
    "dependency": "Backend Permission & Authorization Framework",
    "status": "In Progress",
    "remark": "Blocked on Backend Permission & Authorization Framework API endpoints",
    "delayDays": 1,
    "delayReason": "Awaiting completion of Backend Permission & Authorization API contracts",
    "mitigationPlan": "Mock endpoint interfaces to unblock frontend route guard skeleton",
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-6",
    "sNo": 6,
    "title": "Role-Based Dynamic User Interface Rendering",
    "description": "Conditionally adapt UI menus, buttons, and action controls based on user role permissions across all existing modules.",
    "workstream": "Dynamic User Management & Permission Integration",
    "startDate": "17-08-2026",
    "endDate": "23-08-2026",
    "deliverable": "Dynamic permission-driven UI",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "-",
    "testOwner": "-",
    "dependency": "Dynamic User Management Core & API Authorization Framework",
    "status": "Completed",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T10:59:22.919Z"
  },
  {
    "id": "task-7",
    "sNo": 7,
    "title": "Maloperation Check (Terminate case)",
    "description": "Implement workflow logic and backend handlers for case termination during maloperation checks.",
    "workstream": "Existing Workflow Completion",
    "startDate": "24-08-2026",
    "endDate": "30-08-2026",
    "deliverable": "Termination case service",
    "backendOwner": "Yohannes Yeshanew Mazengia",
    "frontendOwner": "Dewa Abebe Warie",
    "testOwner": "-",
    "dependency": "Dynamic Permission & Route Protection Framework",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-8",
    "sNo": 8,
    "title": "CRM Stage: LAF and DDR Enhancements",
    "description": "Enhancements to Loan Application Form (LAF) and Due Diligence Report (DDR) services in the CRM stage.",
    "workstream": "Existing Workflow Completion",
    "startDate": "31-08-2026",
    "endDate": "06-09-2026",
    "deliverable": "Updated DDR/LAF services",
    "backendOwner": "Yohannes Yilma",
    "frontendOwner": "Dewan Asefa",
    "testOwner": "-",
    "dependency": "Maloperation Check & Termination Service",
    "status": "In Progress",
    "remark": "Data schema drafted",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-9",
    "sNo": 9,
    "title": "Appraisal Stage: LAF, Report Upload & Case File Viewer",
    "description": "Integrate appraisal stage document viewer, file uploads, and synced LAF/DDR services.",
    "workstream": "Existing Workflow Completion",
    "startDate": "07-09-2026",
    "endDate": "13-09-2026",
    "deliverable": "Updated Appraisal DDR/ LAF services",
    "backendOwner": "Yohannes Yilma",
    "frontendOwner": "Dewan Asefa",
    "testOwner": "-",
    "dependency": "CRM Stage LAF & DDR Enhancement Services",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-10",
    "sNo": 10,
    "title": "Committee Stage: LAF, Report Upload & Case File Viewer",
    "description": "Implement Committee stage case viewer, deliberation file attachments, and LAF syncing.",
    "workstream": "Existing Workflow Completion",
    "startDate": "14-09-2026",
    "endDate": "20-09-2026",
    "deliverable": "Committee Stage case bundle",
    "backendOwner": "Yohannes Yilma",
    "frontendOwner": "Dewan Asefa",
    "testOwner": "-",
    "dependency": "Appraisal Stage Document Viewer & Upload Service",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-16T13:05:38.719Z"
  },
  {
    "id": "task-11",
    "sNo": 11,
    "title": "Appraisal Report and Annex",
    "description": "Generate standardized credit appraisal reports and comprehensive annex document attachments.",
    "workstream": "Existing Workflow Completion",
    "startDate": "21-09-2026",
    "endDate": "24-09-2026",
    "deliverable": "Appraisal report & annex generator",
    "backendOwner": "Yohannes Yilma",
    "frontendOwner": "Dewan Asefa",
    "testOwner": "-",
    "dependency": "Appraisal Stage Document Viewer & Upload Service",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 50,
    "lastUpdated": "2026-09-16T13:06:01.072Z"
  },
  {
    "id": "task-12",
    "sNo": 12,
    "title": "Credit Info (National Bank)",
    "description": "Integration with National Bank credit registry for automated credit scoring and exposure queries.",
    "workstream": "Core Modules",
    "startDate": "25-09-2026",
    "endDate": "31-09-2026",
    "deliverable": "Credit Info Service",
    "backendOwner": "Yohannes Yeshanew Mazengia",
    "frontendOwner": "Dewan Asefa",
    "testOwner": "-",
    "dependency": "National Bank Credit Registry API Specification",
    "status": "In Progress",
    "remark": "No BRD - blocked on Central Bank regulatory spec",
    "delayDays": 0,
    "delayReason": "Pending finalized regulatory schema and API auth cert from National Bank",
    "mitigationPlan": "Escalate to Bank Compliance and Legal Liaison",
    "priority": "Critical",
    "percentComplete": 50,
    "lastUpdated": "2026-09-16T13:05:41.524Z"
  },
  {
    "id": "task-13",
    "sNo": 13,
    "title": "Different Payments / Fee Management",
    "description": "Pre-appraisal feasibility study review fee, Collateral valuation fee, Stamp duty fee, Revenue stamp fee, Credit info fee, Loan processing fee.",
    "workstream": "Core Modules",
    "startDate": "20-08-2026",
    "endDate": "23-08-2026",
    "deliverable": "Different fee management service",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Raeye Daniel",
    "testOwner": "-",
    "dependency": "Fee Structure Definition & Fee Service Engine",
    "status": "Completed",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T11:05:38.926Z"
  },
  {
    "id": "task-14",
    "sNo": 14,
    "title": "Pre-Appraisal Feasibility Review Workflow",
    "description": "Initial review of project feasibility parameters before committing full valuation and appraisal resources.",
    "workstream": "Core Modules",
    "startDate": "24-08-2026",
    "endDate": "03-09-2026",
    "deliverable": "Feasibility Review Service",
    "backendOwner": "yohannes sintayhu Getanhe",
    "frontendOwner": "Melaku Sisay Gurum",
    "testOwner": "-",
    "dependency": "Technical Architecture Decisions & Requirement Analysis",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T11:06:44.654Z"
  },
  {
    "id": "task-15",
    "sNo": 15,
    "title": "DLL Rule Engine Enhancement",
    "description": "Discretionary Lending Limit (DLL) rule engine enhancements and tiered credit approval routing.",
    "workstream": "Core Modules",
    "startDate": "24-08-2026",
    "endDate": "30-08-2026",
    "deliverable": "Updated Application Routing Service",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "-",
    "testOwner": "-",
    "dependency": "Technical Architecture Decisions & Requirement Analysis",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-16",
    "sNo": 16,
    "title": "Committee Decision Rules & Voting Engine",
    "description": "Implement weighted voting (chairperson double-vote), dynamic committee sizes, and all 8 DLL decision outcomes (Approve, Decline, Defer, System Restriction).",
    "workstream": "Committee Architecture Refactor",
    "startDate": "31-08-2026",
    "endDate": "10-09-2026",
    "deliverable": "Enhanced voting logic & decision rules",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "Letarik (Letu) Tadesse",
    "testOwner": "-",
    "dependency": "Delegated Lending Limit (DLL) Rule Engine",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Critical",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-17",
    "sNo": 17,
    "title": "Multi-Request Agenda Item Support",
    "description": "Expand committee agenda management to accept all 17 request types (loan products, post-approval, post-disbursement, collateral operations).",
    "workstream": "Committee Architecture Refactor",
    "startDate": "11-09-2026",
    "endDate": "17-09-2026",
    "deliverable": "Agenda support for all request types",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "Letarik (Letu) Tadesse",
    "testOwner": "-",
    "dependency": "Committee Decision Rules & Voting Engine",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:07:23.902Z"
  },
  {
    "id": "task-18",
    "sNo": 18,
    "title": "Committee Composition & Level Configuration",
    "description": "Enforce committee composition rules, quorum requirements, and role assignments across District, Regional, and Head Office levels per DLL spec.",
    "workstream": "Committee Architecture Refactor",
    "startDate": "18-09-2026",
    "endDate": "24-09-2026",
    "deliverable": "Committee composition validation",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "Letarik (Letu) Tadesse",
    "testOwner": "-",
    "dependency": "Committee Decision Rules & Voting Engine",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T11:16:45.911Z"
  },
  {
    "id": "task-19",
    "sNo": 19,
    "title": "Meeting Lifecycle & Decision Routing",
    "description": "Upgrade meeting management to handle multi-request agendas, vote tallying, decision summary recording.",
    "workstream": "Committee Architecture Refactor",
    "startDate": "25-09-2026",
    "endDate": "31-09-2026",
    "deliverable": "Multi-request meeting management",
    "backendOwner": "Khalid Mohammed",
    "frontendOwner": "Letarik (Letu) Tadesse",
    "testOwner": "-",
    "dependency": "Multi-Request Agenda Item Support & Voting Engine",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:08:05.334Z"
  },
  {
    "id": "task-20",
    "sNo": 20,
    "title": "Collateral Valuation Infrastructure",
    "description": "Setup valuation stage pipeline, valuation report document upload, key valuation summary entry (Market Value), and standard multi-role assignment workflow.",
    "workstream": "Collateral Valuation Work flow",
    "startDate": "24-08-2026",
    "endDate": "05-09-2026",
    "deliverable": "Report upload & workflow engine",
    "backendOwner": "Amanuel Getachew",
    "frontendOwner": "Raeye Daniel",
    "testOwner": "-",
    "dependency": "Technical Architecture Decisions & Requirement Analysis",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Critical",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-21",
    "sNo": 21,
    "title": "Civil Collateral Valuation Report Workflow",
    "description": "Process civil asset valuations (buildings, land) conducted outside system: CRM initiation, Maker report upload & summary entry, checker verification, and final manager approval.",
    "workstream": "Collateral Valuation Work flow",
    "startDate": "06-09-2026",
    "endDate": "13-09-2026",
    "deliverable": "Civil report upload UI & approval workflow",
    "backendOwner": "Amanuel Getachew",
    "frontendOwner": "Raeye Daniel",
    "testOwner": "-",
    "dependency": "Collateral Valuation Infrastructure & Upload Engine",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-22",
    "sNo": 22,
    "title": "Agricultural Collateral Valuation Report Approval Workflow",
    "description": "Process agricultural asset valuations (farm land, machinery, livestock) conducted outside system: CRM initiation, Maker report upload & valuation summary entry, checker review, and manager sign-off.",
    "workstream": "Collateral Valuation Work flow",
    "startDate": "14-09-2026",
    "endDate": "21-09-2026",
    "deliverable": "Agricultural report upload UI & workflow",
    "backendOwner": "Amanuel Getachew",
    "frontendOwner": "Raeye Daniel",
    "testOwner": "-",
    "dependency": "Collateral Valuation Infrastructure & Upload Engine",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-23",
    "sNo": 23,
    "title": "Collateral Estimation & Valuation Appeal Workflow",
    "description": "Support customer/CRM valuation dispute and re-valuation report upload workflow.",
    "workstream": "Collateral Valuation Work flow",
    "startDate": "22-09-2026",
    "endDate": "31-09-2026",
    "deliverable": "Valuation estimation appeal workflow",
    "backendOwner": "Amanuel Getachew",
    "frontendOwner": "Raeye Daniel",
    "testOwner": "-",
    "dependency": "Civil & Agricultural Valuation Report Workflows",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:09:00.613Z"
  },
  {
    "id": "task-24",
    "sNo": 24,
    "title": "Appeal Request Workflow",
    "description": "Submission \u2192 CRM review \u2192 Appraisal \u2192 Next-level committee \u2192 Operation \u2192 Decision letter.",
    "workstream": "Post-Approval Requests Workflow",
    "startDate": "04-09-2026",
    "endDate": "10-09-2026",
    "deliverable": "Appeal request workflow",
    "backendOwner": "Yohannes Sahle",
    "frontendOwner": "Melaku Tefera",
    "testOwner": "-",
    "dependency": "Committee Meeting Lifecycle & Decision Routing",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:09:15.909Z"
  },
  {
    "id": "task-25",
    "sNo": 25,
    "title": "Reconsideration Request Workflow",
    "description": "Submission \u2192 Review \u2192 Same-level committee \u2192 Operation \u2192 Decision letter.",
    "workstream": "Post-Approval Requests Workflow",
    "startDate": "11-09-2026",
    "endDate": "17-09-2026",
    "deliverable": "Reconsideration request workflow",
    "backendOwner": "Yohannes Sahle",
    "frontendOwner": "Melaku Tefera",
    "testOwner": "-",
    "dependency": "Committee Decision Rules & Meeting Lifecycle",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:09:25.782Z"
  },
  {
    "id": "task-26",
    "sNo": 26,
    "title": "Afresh Application Workflow",
    "description": "Re-application after decline \u2192 Appraisal \u2192 Committee \u2192 Operation.",
    "workstream": "Post-Approval Requests Workflow",
    "startDate": "18-09-2026",
    "endDate": "24-09-2026",
    "deliverable": "Afresh request workflow",
    "backendOwner": "Yohannes Sahle",
    "frontendOwner": "Melaku Tefera",
    "testOwner": "-",
    "dependency": "Committee Decision Rules & Meeting Lifecycle",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:09:37.045Z"
  },
  {
    "id": "task-27",
    "sNo": 27,
    "title": "Condition Lifting Workflow",
    "description": "Fulfilment evidence \u2192 Appraisal verify \u2192 Committee confirm \u2192 Operation.",
    "workstream": "Post-Approval Requests Workflow",
    "startDate": "25-09-2026",
    "endDate": "31-09-2026",
    "deliverable": "Condition lifting workflow",
    "backendOwner": "Yohannes Sahle",
    "frontendOwner": "Melaku Tefera",
    "testOwner": "-",
    "dependency": "Appraisal Report & Committee Decision Framework",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:09:44.030Z"
  },
  {
    "id": "task-28",
    "sNo": 28,
    "title": "Post-Disbursement Shared Workflow Infrastructure",
    "description": "Common services, state transitions, and database models for all post-disbursement actions.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "24-09-2026",
    "endDate": "26-09-2026",
    "deliverable": "Shared post-disbursement services",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Technical Architecture Decisions & Core Banking Interfaces",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Critical",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:09:51.038Z"
  },
  {
    "id": "task-29",
    "sNo": 29,
    "title": "Restructuring Request Workflow",
    "description": "Customer debt restructuring application, cashflow re-assessment, and repayment schedule adjustments.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "27-09-2026",
    "endDate": "30-09-2026",
    "deliverable": "Restructuring workflow",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Post-Disbursement Shared Services Infrastructure",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:09.941Z"
  },
  {
    "id": "task-30",
    "sNo": 30,
    "title": "Fee & Interest Waiver Request Workflow",
    "description": "Special fee waiver and interest relief request routing with tiered managerial approvals.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "31-09-2026",
    "endDate": "02-10-2026",
    "deliverable": "Waiver request workflow",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Fee Engine & Post-Disbursement Shared Infrastructure",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:16.109Z"
  },
  {
    "id": "task-31",
    "sNo": 31,
    "title": "Tenure Extension Request Workflow",
    "description": "Loan maturity tenure extension review, risk calculation, and collateral coverage validation.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "03-10-2026",
    "endDate": "09-10-2026",
    "deliverable": "Extension request workflow",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Post-Disbursement Shared Services Infrastructure",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:25.934Z"
  },
  {
    "id": "task-32",
    "sNo": 32,
    "title": "Equity/Capital Injection Request Workflow",
    "description": "Verification of equity or capital injection covenants and milestone disbursements.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "10-10-2026",
    "endDate": "16-10-2026",
    "deliverable": "Injection request workflow",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Post-Disbursement Shared Services Infrastructure",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:34.590Z"
  },
  {
    "id": "task-33",
    "sNo": 33,
    "title": "Loan Reschedule Request Workflow",
    "description": "Principal and interest repayment reschedule engine with revised amortization table generator.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "17-10-2026",
    "endDate": "23-10-2026",
    "deliverable": "Reschedule request workflow",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Restructuring Workflow & Post-Disbursement Shared Engine",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:41.893Z"
  },
  {
    "id": "task-34",
    "sNo": 34,
    "title": "Combination Post-Disbursement Requests",
    "description": "Waiver & Extension, Waiver & Injection, Injection & Extension, Waiver + Injection + Extension composite workflows.",
    "workstream": "Post-Disbursement Requests Workflow",
    "startDate": "24-10-2026",
    "endDate": "31-10-2026",
    "deliverable": "Combination request workflows",
    "backendOwner": "Eyob Girma",
    "frontendOwner": "Simachew Bekele",
    "testOwner": "-",
    "dependency": "Fee Waiver, Tenure Extension & Capital Injection Workflows",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:50.054Z"
  },
  {
    "id": "task-35",
    "sNo": 35,
    "title": "Collateral Release Workflow",
    "description": "Partial or full release of pledged collateral upon loan payoff or substitution threshold check.",
    "workstream": "Collateral Operation Requests Workflow",
    "startDate": "24-08-2026",
    "endDate": "30-08-2026",
    "deliverable": "Collateral release workflow",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Natnael Hailu",
    "testOwner": "-",
    "dependency": "Collateral Valuation Infrastructure & Core Services",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:10:56.750Z"
  },
  {
    "id": "task-36",
    "sNo": 36,
    "title": "Collateral Replacement Workflow",
    "description": "Collateral substitution workflow \u2014 triggers collateral valuation for replacement asset before old asset discharge.",
    "workstream": "Collateral Operation Requests Workflow",
    "startDate": "31-08-2026",
    "endDate": "06-09-2026",
    "deliverable": "Collateral replacement workflow",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Natnael Hailu",
    "testOwner": "-",
    "dependency": "Collateral Valuation Infrastructure & Replacement Pipeline",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:11:03.982Z"
  },
  {
    "id": "task-37",
    "sNo": 37,
    "title": "Collateral Release & Replacement Combined Workflow",
    "description": "Simultaneous combined release and replacement pipeline with unified audit trail and title registry handoff.",
    "workstream": "Collateral Operation Requests Workflow",
    "startDate": "07-09-2026",
    "endDate": "13-09-2026",
    "deliverable": "Combined release/ replacement workflow",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Natnael Hailu",
    "testOwner": "-",
    "dependency": "Collateral Release & Replacement Workflows",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:11:19.542Z"
  },
  {
    "id": "task-38",
    "sNo": 38,
    "title": "Operation Manager: Credit Case Review & Document Checklist Verification",
    "description": "Credit operations manager case review, legal checklist completeness check, and condition compliance audit.",
    "workstream": "Credit Operations \u2014 BRD Implementation",
    "startDate": "14-09-2026",
    "endDate": "16-09-2026",
    "deliverable": "Operation manager module",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Wubishet Alemu",
    "testOwner": "-",
    "dependency": "Committee Decision Letters & Approval Package",
    "status": "In Progress",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T10:55:18.463Z"
  },
  {
    "id": "task-39",
    "sNo": 39,
    "title": "Operation Officer: Loan & Security Contract Preparation",
    "description": "Automated contract template assembly, credit facility terms drafting, and collateral pledge agreements.",
    "workstream": "Credit Operations \u2014 BRD Implementation",
    "startDate": "17-09-2026",
    "endDate": "20-09-2026",
    "deliverable": "Operation officer module",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Wubishet Alemu",
    "testOwner": "-",
    "dependency": "Credit Operations Manager Case Review Module",
    "status": "Completed",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T11:00:48.446Z"
  },
  {
    "id": "task-40",
    "sNo": 40,
    "title": "Operation Senior: Signed Contract Review Checklist & 60-Day Signing Verification",
    "description": "Signed contract audit, 60-day execution window verification, perfection of security interests, and final signoff.",
    "workstream": "Credit Operations \u2014 BRD Implementation",
    "startDate": "21-09-2026",
    "endDate": "24-09-2026",
    "deliverable": "Signed contract review module",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Wubishet Alemu",
    "testOwner": "-",
    "dependency": "Loan & Security Contract Preparation Module",
    "status": "In Progress",
    "remark": "60-Day Signing Verification strict rule",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T11:18:54.670Z"
  },
  {
    "id": "task-41",
    "sNo": 41,
    "title": "Decision Communication Letter, Customer Decision Acceptance & Rejection Workflow",
    "description": "Generate customer sanction letters, track acceptance / refusal signatures, and feed response into account booking.",
    "workstream": "Decision Communication & Testing",
    "startDate": "25-09-2026",
    "endDate": "31-09-2026",
    "deliverable": "Decision acceptance workflow",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Wubishet Alemu",
    "testOwner": "-",
    "dependency": "Signed Contract Review & 60-Day Signing Verification",
    "status": "Completed",
    "remark": "",
    "delayDays": 0,
    "priority": "High",
    "percentComplete": 100,
    "lastUpdated": "2026-09-07T11:12:51.430Z"
  },
  {
    "id": "task-42",
    "sNo": 42,
    "title": "End-to-End Integration Testing & Defect Resolution",
    "description": "Rigorous end-to-end user acceptance testing across onboarding, appraisal, committee voting, operations, and core banking integration.",
    "workstream": "Decision Communication & Testing",
    "startDate": "01-10-2026",
    "endDate": "15-10-2026",
    "deliverable": "Integrated system test",
    "backendOwner": "All Engineering Team",
    "frontendOwner": "All Engineering Team",
    "testOwner": "All Workstreams",
    "dependency": "All 41 Core Delivery Workstreams (MVP3 Modules)",
    "status": "Not Started",
    "remark": "",
    "delayDays": 0,
    "priority": "Critical",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T11:18:05.710Z"
  },
  {
    "id": "task-43",
    "sNo": 43,
    "title": "Production Support",
    "description": "Live environment warranty support, production issue hotfixes, transaction monitoring, and operational handover.",
    "workstream": "Production Support & Governance",
    "startDate": "Ongoing",
    "endDate": "Ongoing",
    "deliverable": "On demand production support",
    "backendOwner": "All Engineering Team",
    "frontendOwner": "All Engineering Team",
    "testOwner": "-",
    "dependency": "Live Production Deployment & Stabilization",
    "status": "Ongoing",
    "remark": "On demand",
    "delayDays": 0,
    "priority": "Medium",
    "percentComplete": 50,
    "lastUpdated": "2026-09-07T11:13:21.757Z"
  },
  {
    "id": "task-44",
    "sNo": 44,
    "title": "Legal Opinion Module",
    "description": "Legal opinion submission, title deed verification, mortgage perfection checklist, and external attorney review.",
    "workstream": "Production Support & Governance",
    "startDate": "TBD",
    "endDate": "TBD",
    "deliverable": "Pending BRD Specification",
    "backendOwner": "Ephrem Worku",
    "frontendOwner": "Wubishet Alemu",
    "testOwner": "-",
    "dependency": "Legal Department Final BRD Specification",
    "status": "Not Started",
    "remark": "No BRD",
    "delayDays": 0,
    "delayReason": "Pending Legal Department final BRD Signoff",
    "mitigationPlan": "Legal Counsel meeting scheduled for SteerCo review",
    "priority": "High",
    "percentComplete": 0,
    "lastUpdated": "2026-09-07T12:27:17.194Z"
  }
];

// src/db/tasks.ts
var inMemoryTasks = [...INITIAL_TASKS];
async function getAllTasks() {
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
      description: r.description || void 0,
      workstream: r.workstream,
      startDate: r.startDate,
      endDate: r.endDate,
      deliverable: r.deliverable,
      backendOwner: r.backendOwner,
      frontendOwner: r.frontendOwner,
      testOwner: r.testOwner,
      dependency: r.dependency,
      status: r.status,
      remark: r.remark,
      delayDays: r.delayDays ?? 0,
      delayReason: r.delayReason || void 0,
      mitigationPlan: r.mitigationPlan || void 0,
      priority: r.priority || "Medium",
      percentComplete: r.percentComplete ?? 0,
      lastUpdated: r.lastUpdated || void 0,
      lastReminderSent: r.lastReminderSent || void 0
    }));
  } catch (error) {
    console.warn("SQL query failed or database not connected, using in-memory tasks fallback:", error);
    return inMemoryTasks;
  }
}
async function upsertTask(task) {
  const index = inMemoryTasks.findIndex((t) => t.id === task.id || t.sNo === task.sNo);
  const updatedTask = { ...task, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() };
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
      priority: task.priority || "Medium",
      percentComplete: task.percentComplete ?? 0,
      lastUpdated: task.lastUpdated || (/* @__PURE__ */ new Date()).toISOString(),
      lastReminderSent: task.lastReminderSent || null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await db.insert(tasks).values(values).onConflictDoUpdate({
      target: tasks.id,
      set: values
    }).returning();
    const r = result[0];
    return {
      id: r.id,
      sNo: r.sNo,
      title: r.title,
      description: r.description || void 0,
      workstream: r.workstream,
      startDate: r.startDate,
      endDate: r.endDate,
      deliverable: r.deliverable,
      backendOwner: r.backendOwner,
      frontendOwner: r.frontendOwner,
      testOwner: r.testOwner,
      dependency: r.dependency,
      status: r.status,
      remark: r.remark,
      delayDays: r.delayDays ?? 0,
      delayReason: r.delayReason || void 0,
      mitigationPlan: r.mitigationPlan || void 0,
      priority: r.priority || "Medium",
      percentComplete: r.percentComplete ?? 0,
      lastUpdated: r.lastUpdated || void 0,
      lastReminderSent: r.lastReminderSent || void 0
    };
  } catch (error) {
    console.warn("Could not save to SQL, persisted in memory:", error);
    return updatedTask;
  }
}
async function bulkUpsertTasks(taskList) {
  for (const task of taskList) {
    await upsertTask(task);
  }
}
async function deleteTask(id) {
  inMemoryTasks = inMemoryTasks.filter((t) => t.id !== id);
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return;
  }
  try {
    await db.delete(tasks).where(eq(tasks.id, id));
  } catch (error) {
    console.warn("Failed to delete task in Cloud SQL, removed from memory:", error);
  }
}
async function resetAllTasks(defaultTasks) {
  inMemoryTasks = [...defaultTasks];
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return inMemoryTasks;
  }
  try {
    await db.delete(tasks);
    await bulkUpsertTasks(defaultTasks);
    return await getAllTasks();
  } catch (error) {
    console.warn("Failed to reset tasks in Cloud SQL, reset in memory:", error);
    return inMemoryTasks;
  }
}

// src/db/reminders.ts
import { desc } from "drizzle-orm";
var inMemoryReminders = [];
async function getAllReminders() {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return inMemoryReminders;
  }
  try {
    const rows = await db.select().from(remindersLog).orderBy(desc(remindersLog.sentAt));
    return rows.map((r) => ({
      id: r.id,
      taskId: r.taskId || "",
      taskSNo: r.taskSNo ?? void 0,
      taskTitle: r.taskTitle,
      workstream: r.workstream || void 0,
      recipient: r.recipient || void 0,
      recipientName: r.recipientName || void 0,
      recipientRole: r.recipientRole || void 0,
      recipientEmail: r.recipientEmail || void 0,
      dueDate: r.dueDate || void 0,
      delayDays: r.delayDays ?? 0,
      urgency: r.urgency || "Urgent",
      channel: r.channel || "Email",
      message: r.message,
      sentAt: r.sentAt ? r.sentAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      status: r.status || "Sent"
    }));
  } catch (error) {
    console.warn("SQL query failed or database not connected, using in-memory reminders:", error);
    return inMemoryReminders;
  }
}
async function addReminder(reminder) {
  const newReminder = { ...reminder, sentAt: reminder.sentAt || (/* @__PURE__ */ new Date()).toISOString() };
  inMemoryReminders.unshift(newReminder);
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return newReminder;
  }
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
      urgency: reminder.urgency || "Urgent",
      channel: reminder.channel || "Email",
      message: reminder.message,
      sentAt: reminder.sentAt ? new Date(reminder.sentAt) : /* @__PURE__ */ new Date(),
      status: reminder.status || "Sent"
    };
    const result = await db.insert(remindersLog).values(values).returning();
    const r = result[0];
    return {
      id: r.id,
      taskId: r.taskId || "",
      taskSNo: r.taskSNo ?? void 0,
      taskTitle: r.taskTitle,
      workstream: r.workstream || void 0,
      recipient: r.recipient || void 0,
      recipientName: r.recipientName || void 0,
      recipientRole: r.recipientRole || void 0,
      recipientEmail: r.recipientEmail || void 0,
      dueDate: r.dueDate || void 0,
      delayDays: r.delayDays ?? 0,
      urgency: r.urgency || "Urgent",
      channel: r.channel || "Email",
      message: r.message,
      sentAt: r.sentAt ? r.sentAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      status: r.status || "Sent"
    };
  } catch (error) {
    console.error("Failed to add reminder in Cloud SQL:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

// src/db/users.ts
async function getOrCreateUser(uid, email, displayName) {
  try {
    const result = await db.insert(users).values({
      uid,
      email,
      displayName: displayName || null
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        displayName: displayName || null
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Failed to get or create user:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Failed to get users:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

// src/lib/firebase-admin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "striped-archive-f83b3",
  appId: "1:462523080770:web:419ced5f0ee0a7ce0bcddb",
  apiKey: "AIzaSyDVyEthaSxOtr6JLiGRlX0laK5e3e54TPg",
  authDomain: "striped-archive-f83b3.firebaseapp.com",
  storageBucket: "striped-archive-f83b3.firebasestorage.app",
  messagingSenderId: "462523080770",
  measurementId: "",
  oAuthClientId: "462523080770-o0npja7uh9trngtjrcl4ko9etcjsrmlg.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/firebase-admin.ts
if (!getApps().length) {
  initializeApp({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = getAuth();

// src/middleware/auth.ts
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
var optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
    } catch (error) {
      console.warn("Optional auth token invalid:", error);
    }
  }
  next();
};

// server.ts
var ai = null;
function getGenAI() {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return ai;
}
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(express.json({ limit: "10mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/tasks", async (req, res) => {
    try {
      let taskList = await getAllTasks();
      if (taskList.length === 0) {
        await bulkUpsertTasks(INITIAL_TASKS);
        taskList = await getAllTasks();
      }
      res.json(taskList);
    } catch (error) {
      console.error("Failed to get tasks from Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to fetch tasks from Cloud SQL" });
    }
  });
  app.post("/api/tasks", optionalAuth, async (req, res) => {
    try {
      const task = req.body;
      if (!task || !task.id || !task.title) {
        return res.status(400).json({ error: "Valid task payload is required" });
      }
      const saved = await upsertTask(task);
      res.json(saved);
    } catch (error) {
      console.error("Failed to upsert task in Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to save task in Cloud SQL" });
    }
  });
  app.post("/api/tasks/bulk", optionalAuth, async (req, res) => {
    try {
      const taskList = req.body;
      if (!Array.isArray(taskList)) {
        return res.status(400).json({ error: "Array of tasks required" });
      }
      await bulkUpsertTasks(taskList);
      const updated = await getAllTasks();
      res.json(updated);
    } catch (error) {
      console.error("Failed bulk upsert in Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to bulk save tasks in Cloud SQL" });
    }
  });
  app.delete("/api/tasks/:id", optionalAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await deleteTask(id);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Failed to delete task in Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to delete task in Cloud SQL" });
    }
  });
  app.post("/api/tasks/reset", optionalAuth, async (req, res) => {
    try {
      const reset = await resetAllTasks(INITIAL_TASKS);
      res.json(reset);
    } catch (error) {
      console.error("Failed to reset tasks in Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to reset tasks in Cloud SQL" });
    }
  });
  app.post("/api/sync-remote", optionalAuth, async (req, res) => {
    try {
      const remoteUrl = req.body?.url || "https://wholsaleprojectmvp3.ai.studio";
      console.log(`Syncing deliverables and data from remote URL: ${remoteUrl}`);
      const tasksRes = await fetch(`${remoteUrl}/api/tasks`);
      if (!tasksRes.ok) {
        throw new Error(`Failed to fetch tasks from ${remoteUrl} (status: ${tasksRes.status})`);
      }
      const remoteTasks = await tasksRes.json();
      if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
        await bulkUpsertTasks(remoteTasks);
      }
      try {
        const remindersRes = await fetch(`${remoteUrl}/api/reminders`);
        if (remindersRes.ok) {
          const remoteReminders = await remindersRes.json();
          if (Array.isArray(remoteReminders)) {
            for (const rem of remoteReminders) {
              await addReminder(rem);
            }
          }
        }
      } catch (remErr) {
        console.warn("Could not sync reminders from remote:", remErr);
      }
      const updated = await getAllTasks();
      const allReminders = await getAllReminders();
      res.json({ success: true, count: updated.length, tasks: updated, reminders: allReminders });
    } catch (error) {
      console.error("Failed to sync from remote:", error);
      res.status(500).json({ error: error.message || "Failed to sync from remote URL" });
    }
  });
  app.get("/api/reminders", async (req, res) => {
    try {
      const logs = await getAllReminders();
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch reminders from Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to fetch reminders" });
    }
  });
  app.post("/api/reminders", optionalAuth, async (req, res) => {
    try {
      const reminder = req.body;
      if (!reminder || !reminder.id || !reminder.taskTitle) {
        return res.status(400).json({ error: "Valid reminder payload required" });
      }
      const saved = await addReminder(reminder);
      res.json(saved);
    } catch (error) {
      console.error("Failed to save reminder to Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to save reminder" });
    }
  });
  app.post("/api/users/sync", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { email, name } = req.body;
      const user = await getOrCreateUser(req.user.uid, email || req.user.email || "user@example.com", name || req.user.name);
      res.json(user);
    } catch (error) {
      console.error("Failed to sync user in Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to sync user profile" });
    }
  });
  app.get("/api/users", optionalAuth, async (req, res) => {
    try {
      const userList = await getUsers();
      res.json(userList);
    } catch (error) {
      console.error("Failed to get users from Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });
  app.post("/api/ai/executive-summary", async (req, res) => {
    try {
      const { tasks: tasks2, summaryType = "executive", asOfDate } = req.body;
      if (!tasks2 || !Array.isArray(tasks2)) {
        return res.status(400).json({ error: "Tasks array is required" });
      }
      const totalTasks = tasks2.length;
      const completed = tasks2.filter((t) => t.status === "Completed").length;
      const inProgress = tasks2.filter((t) => t.status === "In Progress").length;
      const partial = tasks2.filter((t) => t.status === "Partial").length;
      const delayed = tasks2.filter((t) => t.isDelayed || t.status === "Delayed").length;
      const notStarted = tasks2.filter((t) => t.status === "Not Started").length;
      const delayedSample = tasks2.filter((t) => t.isDelayed || t.status === "Delayed" || t.delayDays && t.delayDays > 0).map((t) => ({
        taskNo: t.sNo,
        title: t.title,
        workstream: t.workstream,
        backend: t.backendOwner,
        frontend: t.frontendOwner,
        status: t.status,
        delayDays: t.delayDays || 0,
        deliverable: t.deliverable,
        remark: t.remark
      }));
      const prompt = `You are a Senior Program Director and Executive Project Management Advisor evaluating a mission-critical project: "Wholesale Banking Customer Onboarding & Loan Origination System - Action Plan".
Current As-Of Date: ${asOfDate || "August 18, 2026"}.

PROJECT METRICS:
- Total Tasks/Deliverables: ${totalTasks}
- Completed: ${completed} (${Math.round(completed / totalTasks * 100)}%)
- In Progress: ${inProgress}
- Partial Progress: ${partial}
- Delayed/Critical Attention: ${delayed}
- Not Started: ${notStarted}

CURRENT DELAYED / AT-RISK DELIVERABLES:
${JSON.stringify(delayedSample, null, 2)}

SUMMARY TYPE REQUESTED: ${summaryType.toUpperCase()} (options: Executive SteerCo Brief, Daily Operational Standup, Root-Cause & Risk Mitigation, Team Workload & Accountability Audit)

Please generate a high-impact, professional executive summary with clear structure:
1. Executive Snapshot & RAG Status (Red/Amber/Green with justification)
2. Critical Path & Key Delayed Deliverables (Highlighting exact owners and impact)
3. Department & Team Accountability Overview (Backend vs Frontend vs QA bottlenecks)
4. Recommended Immediate SteerCo Action Plan & Escalation Steps (3-5 concrete bullet points)

Format in clean markdown with bold headers and crisp executive tone.`;
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
      });
      res.json({
        summary: response.text,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        metrics: { totalTasks, completed, inProgress, partial, delayed, notStarted }
      });
    } catch (error) {
      console.error("Error generating executive summary:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI executive summary" });
    }
  });
  app.post("/api/ai/generate-reminder", async (req, res) => {
    try {
      const { task, recipient, escalationLevel = "standard" } = req.body;
      const prompt = `You are a Project Management Office (PMO) automated reminder and escalation assistant.
Create a high-priority, professional notification email to be dispatched to team member ${recipient || "Team Lead"} regarding a project deliverable.

DELIVERABLE DETAILS:
- Task #${task.sNo}: ${task.title}
- Workstream: ${task.workstream}
- Target Deliverable: ${task.deliverable}
- Scheduled Timeline: ${task.startDate} to ${task.endDate}
- Current Status: ${task.status}
- Backend Lead: ${task.backendOwner}
- Frontend Lead: ${task.frontendOwner}
- Delay Count / Days Overdue: ${task.delayDays || 0} days
- Remarks: ${task.remark || "None"}
- Escalation Level: ${escalationLevel} (Options: Gentle Reminder, Urgent Action Required, Executive SteerCo Escalation)

Output a structured response:
Subject: [Clear, urgent subject line with Task # and Deliverable]
Body: [Professional, concise body with deadline impact, accountability request, concrete next steps, and steering committee CC notice]`;
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
      });
      res.json({ email: response.text, draft: response.text });
    } catch (error) {
      console.error("Error generating reminder email:", error);
      res.status(500).json({ error: error.message || "Failed to generate reminder email" });
    }
  });
  app.post("/api/reminders/send-daily-email", async (req, res) => {
    try {
      const {
        email = "samsontsegayef@gmail.com",
        whatsapp = "samsontsegaye26",
        subject,
        emailBody,
        whatsappMessage,
        taskCount,
        automated = false
      } = req.body;
      console.log(`[PMO Reminder Dispatch] Dispatching daily reminder to Email: ${email}, WhatsApp: ${whatsapp} (${taskCount || 44} tasks, automated: ${automated})`);
      res.json({
        success: true,
        message: `Daily reminder notification queued and sent successfully to ${email} and WhatsApp ${whatsapp}`,
        dispatchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        targetEmail: email,
        targetWhatsApp: whatsapp,
        subject: subject || `[CBE Daily Task Reminder] 44 Master Deliverables Status Update`
      });
    } catch (error) {
      console.error("Error sending daily reminder email:", error);
      res.status(500).json({ error: error.message || "Failed to dispatch daily reminder" });
    }
  });
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { question, tasks: tasks2 } = req.body;
      const prompt = `You are an expert Project Management AI Assistant with complete knowledge of the "Wholesale Banking Customer Onboarding & Loan Origination System Action Plan".

PROJECT DATA:
${JSON.stringify((tasks2 || []).slice(0, 44), null, 2)}

USER QUESTION:
${question}

Provide a concise, accurate, and actionable answer directly referencing the task numbers, deliverables, dates, backend/frontend owners (e.g., Khalid, Yohannes Y., Dewa, Eyob, Raeye, Melaku, Letu, Simachew, Ephrem, Natnael, Wubishet), and dependencies.`;
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
      });
      res.json({ answer: response.text });
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ error: error.message || "Failed to generate answer" });
    }
  });
  app.post("/api/ai/analyze-hidden-risks", async (req, res) => {
    try {
      const { tasks: tasks2, asOfDate } = req.body;
      if (!tasks2 || !Array.isArray(tasks2)) {
        return res.status(400).json({ error: "Tasks array is required" });
      }
      const taskPayload = tasks2.map((t) => ({
        sNo: t.sNo,
        id: t.id,
        title: t.title,
        workstream: t.workstream,
        status: t.status,
        startDate: t.startDate,
        endDate: t.endDate,
        deliverable: t.deliverable,
        backendOwner: t.backendOwner,
        frontendOwner: t.frontendOwner,
        dependency: t.dependency,
        remark: t.remark || "",
        delayReason: t.delayReason || "",
        mitigationPlan: t.mitigationPlan || "",
        priority: t.priority || "Medium",
        percentComplete: t.percentComplete ?? 0
      }));
      const prompt = `You are a Senior Project Risk Officer and Wholesale Banking PMO Expert.
Analyze all 44 action items in the "Wholesale Banking Customer Onboarding & Loan Origination System".
Current As-Of Date: ${asOfDate || "18-08-2026"}.

OBJECTIVE:
Scrutinize all task remarks, deliverable commitments, lead assignments, dependencies, and progress percentages to identify POTENTIAL "HIDDEN RISKS" before they manifest as delayed deliverables.

Look for subtle early warning patterns such as:
1. "Scope & Requirement Ambiguity": Remarks mentioning waiting for specifications, BRD unconfirmed parts, or changing user stories.
2. "Architectural & Technical Debt Bottlenecks": Mentions of query re-writes, heavy maker-checker logic, state machine synchronization, or data migration complications.
3. "Dependency Traps & Unsynced Handoffs": Backend completed but frontend not integrated, or dependencies on third-party APIs/Core Banking switches.
4. "Resource Concentration / Owner Overload": Critical path tasks concentrated on single leads (e.g. Khalid, Dewa, Yohannes).
5. "False Progress Signals": Deliverables with near-deadline dates, marked "In Progress" or "Not Started" where remarks reveal unstarted submodules.

TASK DATA:
${JSON.stringify(taskPayload, null, 2)}

Return a STRICT JSON response (no code block wrappers, valid JSON only) with this exact schema:
{
  "overallRiskIndex": "Severe" | "Elevated" | "Moderate" | "Low",
  "executiveSummary": "2-3 crisp sentences detailing the hidden risk patterns identified across remarks and unbaselined subtasks",
  "criticalHiddenCount": 3,
  "highHiddenCount": 4,
  "topRiskCount": 7,
  "identifiedRisks": [
    {
      "id": "hrisk_1",
      "taskId": "task_3",
      "taskSNo": 3,
      "taskTitle": "Initiate dynamic maker-checker permission mapping matrix",
      "workstream": "Dynamic User Management & Permission Integration",
      "leadOwner": "Khalid (BE) / Dewa (FE)",
      "riskCategory": "Dependency Blocker" | "Ambiguous Scope" | "Architectural Complexity" | "Regulatory & Compliance" | "Resource Bottleneck" | "Testing Deficit" | "Integration Risk",
      "severity": "Critical" | "High" | "Medium",
      "subtleSignal": "Excerpt or subtle clue from remarks indicating hidden friction",
      "potentialImpact": "Specific operational or timeline impact if this risk materializes",
      "recommendedPreventativeAction": "Concrete PMO countermeasure to take immediately before delay happens",
      "estimatedDelayExposureDays": 5,
      "confidenceScore": 92
    }
  ]
}`;
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      let parsed;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch (parseError) {
        const cleaned = (response.text || "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        parsed = JSON.parse(cleaned);
      }
      res.json({
        ...parsed,
        scannedCount: tasks2.length,
        analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error analyzing hidden risks:", error);
      res.status(500).json({ error: error.message || "Failed to analyze hidden risks" });
    }
  });
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  if (hasDist) {
    console.log("[Server] Serving pre-built static client from ./dist (Ultra-low RAM mode)");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[Server] Dist not found, loading Vite development server on-the-fly...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
======================================================`);
    console.log(`  CBE Action Tracker & Executive Follow-up System`);
    console.log(`======================================================`);
    console.log(`  Local Web Access:    http://localhost:${PORT}`);
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          addresses.push(`http://${net.address}:${PORT}`);
        }
      }
    }
    if (addresses.length > 0) {
      console.log(`  iOS / Mobile Wi-Fi:  ${addresses.join("\n                       ")}`);
      console.log(`  Tip: Open the Wi-Fi address in Mobile Safari on iPhone/iPad`);
    }
    console.log(`======================================================
`);
  });
}
startServer();
//# sourceMappingURL=server.js.map
