export type TaskStatus = 
  | 'Not Started'
  | 'In Progress'
  | 'Partial'
  | 'Completed'
  | 'Delayed'
  | 'Blocked'
  | 'Ongoing'
  | 'No BRD';

export type WorkstreamType = 
  | 'Foundation & Analysis'
  | 'Dynamic User Management & Permission Integration'
  | 'Existing Workflow Completion'
  | 'Core Modules'
  | 'Committee Architecture Refactor'
  | 'Collateral Valuation Work flow'
  | 'Post-Approval Requests Workflow'
  | 'Post-Disbursement Requests Workflow'
  | 'Collateral Operation Requests Workflow'
  | 'Credit Operations — BRD Implementation'
  | 'Decision Communication & Testing'
  | 'Production Support & Governance';

export interface TaskItem {
  id: string;
  sNo: number;
  title: string;
  description?: string;
  workstream: WorkstreamType;
  startDate: string; // DD-MM-YYYY or YYYY-MM-DD or TBD / -
  endDate: string;   // DD-MM-YYYY or YYYY-MM-DD or TBD / - (Target Finish)
  actualFinishDate?: string; // DD-MM-YYYY or YYYY-MM-DD (Actual Finish or Projected)
  deliverable: string;
  backendOwner: string;
  frontendOwner: string;
  testOwner: string;
  dependency: string;
  status: TaskStatus;
  backendStatus?: TaskStatus;
  frontendStatus?: TaskStatus;
  remark: string;
  delayDays?: number;
  delayReason?: string;
  mitigationPlan?: string;
  priority?: 'High' | 'Medium' | 'Low' | 'Critical';
  percentComplete?: number;
  lastUpdated?: string;
  lastReminderSent?: string;
}

export interface TeamMemberStats {
  name: string;
  role: 'Backend' | 'Frontend' | 'QA/Test' | 'Full Team' | 'Management';
  totalAssigned: number;
  completed: number;
  inProgress: number;
  partial: number;
  delayed: number;
  notStarted: number;
  completionRate: number;
}

export interface ReminderNotification {
  id: string;
  taskId: string;
  taskSNo?: number;
  taskTitle: string;
  workstream?: string;
  recipient?: string;
  recipientName?: string;
  recipientRole?: string;
  recipientEmail?: string;
  deadlineDate?: string;
  dueDate?: string;
  delayDays?: number;
  daysRemainingOrOverdue?: number;
  urgency?: 'Standard' | 'Urgent' | 'Escalation';
  type?: '1-Day Warning' | '3-Day Warning' | '7-Day Notice' | 'Overdue Escalation' | 'SteerCo Delay Alert';
  channel?: 'Email' | 'WhatsApp' | 'Email + WhatsApp' | 'Teams' | 'SMS' | 'Google Chat';
  message?: string;
  generatedEmailSubject?: string;
  generatedEmailBody?: string;
  sentAt?: string;
  status: 'Pending' | 'Sent' | 'Dismissed';
}

export interface ExecutiveMetrics {
  totalTasks: number;
  completed: number;
  inProgress: number;
  partial: number;
  delayed: number;
  notStarted: number;
  noBrd: number;
  overallProgressPercent: number;
  totalDelayDays: number;
  criticalAtRiskCount: number;
}

export interface ChangeLogEntry {
  id: string;
  taskId: string;
  taskSNo: number;
  taskTitle: string;
  userEmail: string;
  userName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  workstream?: string;
}

export interface HiddenRiskItem {
  id: string;
  taskId: string;
  taskSNo: number;
  taskTitle: string;
  workstream: string;
  leadOwner: string;
  riskCategory: 'Dependency Blocker' | 'Ambiguous Scope' | 'Architectural Complexity' | 'Regulatory & Compliance' | 'Resource Bottleneck' | 'Testing Deficit' | 'Integration Risk';
  severity: 'Critical' | 'High' | 'Medium';
  subtleSignal: string; // The detected early warning quote or cue from remarks/task metadata
  potentialImpact: string; // What delay or failure will occur if ignored
  recommendedPreventativeAction: string; // Actionable countermeasure for PMO/SteerCo before delay manifests
  estimatedDelayExposureDays: number; // Potential delay in days if not mitigated early
  confidenceScore: number; // e.g. 85-98%
}

export interface HiddenRisksAnalysisResult {
  overallRiskIndex: 'Low' | 'Moderate' | 'Elevated' | 'Severe';
  executiveSummary: string;
  topRiskCount: number;
  criticalHiddenCount: number;
  highHiddenCount: number;
  identifiedRisks: HiddenRiskItem[];
  scannedCount: number;
  analyzedAt: string;
}

export interface TeamWorkloadMetric {
  name: string;
  role: string;
  department: string;
  totalAssigned: number;
  activeTasks: number; // in progress + partial + delayed + not started
  completedTasks: number;
  delayedTasks: number;
  criticalHighPriority: number;
  burnoutScore: number; // 0-100 index
  burnoutRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  capacityWarning: string;
  recommendedAction: string;
  assignedTasks: TaskItem[];
}

export interface StrategicMilestone {
  id: string;
  code: string;
  monthIndex: number; // 1 to 6 (Aug 2026 to Jan 2027)
  monthLabel: string; // "Aug 2026", "Sep 2026", etc.
  title: string;
  phase: string;
  category: 'Foundation' | 'Workflows' | 'Valuation' | 'Disbursement' | 'Testing & UAT' | 'Go-Live';
  status: 'Completed' | 'In Progress' | 'On Track' | 'At Risk' | 'Scheduled';
  progressPercent: number;
  targetDate: string;
  leadOwners: string[];
  workstreams: string[];
  keyDeliverables: string[];
  dependencies: string[]; // Milestone codes or descriptions
  criticalPath: boolean;
  deliverableCount: number;
  completedCount: number;
  delayedCount: number;
  impactSummary: string;
}
