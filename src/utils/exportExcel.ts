import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TaskItem } from '../types';
import { getTaskDeadlineStatus, getCurrentReportDateTime } from './dateUtils';
import { getDelayedTasks, getExpectedToDelayTasks, getRiskAreas } from './delayAnalysis';

export function exportMasterPlanToExcel(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const wb = XLSX.utils.book_new();
  const reportGen = getCurrentReportDateTime();

  // Core metrics calculation
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const partial = tasks.filter(t => t.status === 'Partial').length;
  const notStarted = tasks.filter(t => t.status === 'Not Started').length;
  const delayedTasks = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'OVERDUE' || t.status === 'Delayed' || t.status === 'No BRD' || (t.delayDays && t.delayDays > 0);
  });
  const overallProgress = Math.round(
    tasks.reduce((acc, curr) => acc + (curr.percentComplete || (curr.status === 'Completed' ? 100 : curr.status === 'Partial' ? 30 : curr.status === 'In Progress' ? 50 : 0)), 0) / (total || 1)
  );

  // 0. Governance Cover & Metadata Sheet
  const coverMetadata = [
    { 'Governance & Audit Parameter': 'Report Title', 'Value': 'Wholesale Banking PMO — Project Action Plan & Governance Review' },
    { 'Governance & Audit Parameter': 'Report Generation Date & Time', 'Value': reportGen.displayDateTime },
    { 'Governance & Audit Parameter': 'Generation Timestamp (Compact)', 'Value': reportGen.compact },
    { 'Governance & Audit Parameter': 'Generation Date', 'Value': reportGen.displayDate },
    { 'Governance & Audit Parameter': 'Generation Time', 'Value': reportGen.displayTime },
    { 'Governance & Audit Parameter': 'Schedule Baseline As-Of Date', 'Value': asOfDate },
    { 'Governance & Audit Parameter': 'Total Deliverables in Scope', 'Value': `${total} Tasks` },
    { 'Governance & Audit Parameter': 'Completed Deliverables', 'Value': `${completed} (${Math.round((completed / (total || 1)) * 100)}%)` },
    { 'Governance & Audit Parameter': 'Active In-Progress / Partial', 'Value': `${inProgress + partial} Tasks` },
    { 'Governance & Audit Parameter': 'Pending Start', 'Value': `${notStarted} Tasks` },
    { 'Governance & Audit Parameter': 'Critical / Delayed Items', 'Value': `${delayedTasks.length} Tasks Require SteerCo Attention` },
    { 'Governance & Audit Parameter': 'Overall Portfolio Completion', 'Value': `${overallProgress}%` },
    { 'Governance & Audit Parameter': 'Export Authorization', 'Value': 'Wholesale Banking PMO Administrator (Samson)' },
    { 'Governance & Audit Parameter': 'Information Classification', 'Value': 'CONFIDENTIAL & PROPRIETARY • RESTRICTED STEERING COMMITTEE ACCESS' },
  ];
  const wsCover = XLSX.utils.json_to_sheet(coverMetadata);
  wsCover['!cols'] = [
    { wch: 38 }, // Parameter
    { wch: 75 }, // Value
  ];
  XLSX.utils.book_append_sheet(wb, wsCover, 'Governance Cover & Date');

  // 1. Master Action Plan Sheet
  const masterData = tasks.map((t) => {
    const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayCount = deadlineInfo.category === 'OVERDUE' 
      ? Math.abs(deadlineInfo.daysDiff || 0)
      : (t.delayDays || 0);

    return {
      'S.No.': t.sNo,
      'Workstream': t.workstream,
      'Task / Activity': t.title,
      'Description': t.description || '',
      'Start Date': t.startDate,
      'End Date': t.endDate,
      'Deliverable': t.deliverable,
      'Backend Owner': t.backendOwner,
      'Backend Status': t.backendStatus || t.status,
      'Frontend Owner': t.frontendOwner,
      'Frontend Status': t.frontendStatus || (t.frontendOwner === '-' ? 'N/A' : t.status),
      'Test Owner': t.testOwner,
      'Dependency': t.dependency,
      'Overall Status': t.status,
      'Deadline Indicator': deadlineInfo.label,
      'Delay Count (Days)': delayCount,
      'Priority': t.priority || 'Medium',
      '% Complete': `${t.percentComplete || 0}%`,
      'Remarks': t.remark,
      'Delay Reason / Root Cause': t.delayReason || '',
      'Mitigation Action Plan': t.mitigationPlan || '',
      'Report Generation Timestamp': reportGen.compact,
    };
  });

  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  // Set column widths
  wsMaster['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 32 }, // Workstream
    { wch: 42 }, // Task Title
    { wch: 45 }, // Description
    { wch: 12 }, // Start
    { wch: 12 }, // End
    { wch: 32 }, // Deliverable
    { wch: 16 }, // Backend
    { wch: 16 }, // Frontend
    { wch: 12 }, // Test
    { wch: 14 }, // Dependency
    { wch: 14 }, // Status
    { wch: 16 }, // Deadline
    { wch: 16 }, // Delay Count
    { wch: 10 }, // Priority
    { wch: 12 }, // % Complete
    { wch: 25 }, // Remark
    { wch: 35 }, // Delay Reason
    { wch: 35 }, // Mitigation
    { wch: 22 }, // Report Timestamp
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Action Plan');

  // 2. Executive Delay & Risk Log Sheet
  const delayData = delayedTasks.map(t => {
    const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayCount = deadlineInfo.category === 'OVERDUE' 
      ? Math.abs(deadlineInfo.daysDiff || 0) 
      : (t.delayDays || 0);

    return {
      'Task #': t.sNo,
      'Workstream': t.workstream,
      'Deliverable': t.deliverable,
      'Planned Target Date': t.endDate,
      'Current Status': t.status,
      'Days Delayed': delayCount,
      'Backend Owner': t.backendOwner,
      'Frontend Owner': t.frontendOwner,
      'Root Cause': t.delayReason || t.remark || 'Pending detailed analysis',
      'SteerCo Mitigation Plan': t.mitigationPlan || 'Active leadership follow-up in progress',
      'Escalation Level': delayCount > 5 ? 'High (SteerCo Level)' : 'Medium (Lead Review)',
      'Generated Date & Time': reportGen.compact,
    };
  });

  const wsDelay = XLSX.utils.json_to_sheet(delayData.length > 0 ? delayData : [{ 'Status': 'No Active Delays', 'Generated Date & Time': reportGen.compact }]);
  wsDelay['!cols'] = [
    { wch: 8 },  // Task #
    { wch: 30 }, // Workstream
    { wch: 30 }, // Deliverable
    { wch: 18 }, // Target Date
    { wch: 14 }, // Status
    { wch: 14 }, // Days Delayed
    { wch: 16 }, // Backend
    { wch: 16 }, // Frontend
    { wch: 35 }, // Root Cause
    { wch: 35 }, // Mitigation
    { wch: 22 }, // Escalation Level
    { wch: 22 }, // Generated Date & Time
  ];
  XLSX.utils.book_append_sheet(wb, wsDelay, 'Executive Delay Log');

  // 3. Team Accountability Matrix Sheet
  const teamMembers = [
    'Khalid', 'Yohannes Y.', 'Yohannes S.', 'Eyob', 'Amanuel', 'Ephrem',
    'Dewa', 'Melaku', 'Raeye', 'Letu', 'Simachew', 'Natnael', 'Wubishet', 'All Team'
  ];

  const teamData = teamMembers.map(name => {
    const assignedTasks = tasks.filter(t => 
      t.backendOwner.includes(name) || t.frontendOwner.includes(name) || t.testOwner.includes(name)
    );
    const completed = assignedTasks.filter(t => t.status === 'Completed').length;
    const inProgress = assignedTasks.filter(t => t.status === 'In Progress').length;
    const partial = assignedTasks.filter(t => t.status === 'Partial').length;
    const delayed = assignedTasks.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;
    const notStarted = assignedTasks.filter(t => t.status === 'Not Started').length;
    const completionRate = assignedTasks.length > 0 ? Math.round((completed / assignedTasks.length) * 100) : 0;

    return {
      'Team Member': name,
      'Total Deliverables': assignedTasks.length,
      'Completed': completed,
      'In Progress': inProgress,
      'Partial': partial,
      'Delayed / Overdue': delayed,
      'Not Started': notStarted,
      'Completion Rate (%)': `${completionRate}%`,
      'Accountability Health': delayed > 0 ? 'Action Required' : (inProgress > 0 ? 'Active' : 'On Track'),
      'Generated Date & Time': reportGen.compact,
    };
  });

  const wsTeam = XLSX.utils.json_to_sheet(teamData);
  wsTeam['!cols'] = [
    { wch: 18 }, // Team Member
    { wch: 18 }, // Total Deliverables
    { wch: 12 }, // Completed
    { wch: 14 }, // In Progress
    { wch: 12 }, // Partial
    { wch: 18 }, // Delayed
    { wch: 14 }, // Not Started
    { wch: 18 }, // Completion Rate
    { wch: 22 }, // Accountability Health
    { wch: 22 }, // Generated Date & Time
  ];
  XLSX.utils.book_append_sheet(wb, wsTeam, 'Team Accountability');

  // 4. Workstream Summary Sheet
  const workstreams: TaskItem['workstream'][] = [
    'Foundation & Analysis',
    'Dynamic User Management & Permission Integration',
    'Existing Workflow Completion',
    'Core Modules',
    'Committee Architecture Refactor',
    'Collateral Valuation Work flow',
    'Post-Approval Requests Workflow',
    'Post-Disbursement Requests Workflow',
    'Collateral Operation Requests Workflow',
    'Credit Operations — BRD Implementation',
    'Decision Communication & Testing',
    'Production Support & Governance'
  ];

  const wsSummaryData = workstreams.map(ws => {
    const wsTasks = tasks.filter(t => t.workstream === ws);
    const total = wsTasks.length;
    const completed = wsTasks.filter(t => t.status === 'Completed').length;
    const inProgress = wsTasks.filter(t => t.status === 'In Progress').length;
    const partial = wsTasks.filter(t => t.status === 'Partial').length;
    const notStarted = wsTasks.filter(t => t.status === 'Not Started').length;
    const delayed = wsTasks.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;

    const avgProgress = total > 0 
      ? Math.round(wsTasks.reduce((acc, curr) => acc + (curr.percentComplete || 0), 0) / total)
      : 0;

    return {
      'Workstream': ws,
      'Total Tasks': total,
      'Completed': completed,
      'In Progress': inProgress,
      'Partial': partial,
      'Not Started': notStarted,
      'Delayed': delayed,
      'Average Progress (%)': `${avgProgress}%`,
      'Generated Date & Time': reportGen.compact,
    };
  });

  const wsRollup = XLSX.utils.json_to_sheet(wsSummaryData);
  wsRollup['!cols'] = [
    { wch: 38 }, // Workstream
    { wch: 14 }, // Total
    { wch: 12 }, // Completed
    { wch: 14 }, // In Progress
    { wch: 12 }, // Partial
    { wch: 14 }, // Not Started
    { wch: 12 }, // Delayed
    { wch: 20 }, // Avg Progress
    { wch: 22 }, // Generated Date & Time
  ];
  XLSX.utils.book_append_sheet(wb, wsRollup, 'Workstream Summary');

  // Write and trigger download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  
  const finalName = fileName || `Action_Plan_Extraction_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.xlsx`;
  saveAs(dataBlob, finalName);
}

// -------------------------------------------------------------
// SEPARATE EXCEL REPORT: CURRENTLY DELAYED DELIVERABLES
// -------------------------------------------------------------
export function exportDelayedTasksExcel(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const wb = XLSX.utils.book_new();
  const reportGen = getCurrentReportDateTime();
  const delayedList = getDelayedTasks(tasks, asOfDate);

  const rows = delayedList.map(t => ({
    'S.No.': t.sNo,
    'Workstream': t.workstream,
    'Deliverable Title': t.deliverable || t.title,
    'Backend Owner': t.backendOwner,
    'Frontend Owner': t.frontendOwner,
    'Target End Date': t.endDate,
    'Delay Horizon (Days)': `+${t.effectiveDelayDays}d`,
    'Status': t.status,
    'Priority': t.priority || 'Medium',
    'Completion %': `${t.percentComplete || 0}%`,
    'Delay Root Cause': t.delayReason || 'Pending technical / regulatory interface alignment',
    'SteerCo Remediation Plan': t.mitigationPlan || t.remark || 'Active engineering sync & daily PMO follow-up',
    'Operational Remark': t.remark || '',
    'Report Date': reportGen.displayDate,
  }));

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Message': 'No currently delayed deliverables.' }]);
  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 32 }, // Workstream
    { wch: 45 }, // Title
    { wch: 22 }, // BE
    { wch: 22 }, // FE
    { wch: 16 }, // End Date
    { wch: 18 }, // Delay Horizon
    { wch: 14 }, // Status
    { wch: 12 }, // Priority
    { wch: 14 }, // Progress
    { wch: 50 }, // Root Cause
    { wch: 50 }, // Mitigation
    { wch: 35 }, // Remark
    { wch: 18 }, // Report Date
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Currently Delayed Tasks');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  const finalName = fileName || `Currently_Delayed_Deliverables_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.xlsx`;
  saveAs(dataBlob, finalName);
}

// -------------------------------------------------------------
// SEPARATE EXCEL REPORT: EXPECTED TO DELAY (EARLY WARNING)
// -------------------------------------------------------------
export function exportExpectedDelayTasksExcel(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const wb = XLSX.utils.book_new();
  const reportGen = getCurrentReportDateTime();
  const expectedList = getExpectedToDelayTasks(tasks, asOfDate);

  const rows = expectedList.map(t => ({
    'S.No.': t.sNo,
    'Workstream': t.workstream,
    'Deliverable Title': t.deliverable || t.title,
    'Backend Owner': t.backendOwner,
    'Frontend Owner': t.frontendOwner,
    'Target End Date': t.endDate,
    'Days to Deadline': t.daysRemaining !== null ? `${t.daysRemaining} days` : 'TBD',
    'Completion %': `${t.percentComplete || 0}%`,
    'Risk Probability': t.riskProbability.toUpperCase(),
    'Status': t.status,
    'Priority': t.priority || 'Medium',
    'Early Warning Risk Drivers': t.riskReasons.join(' | '),
    'Upstream Blocker Deliverables': t.upstreamBlockers.join(', ') || 'None identified',
    'Preventative Action Plan': t.mitigationPlan || 'Implement preventative checkpoint and pair lead with unblocked engineer',
    'Report Date': reportGen.displayDate,
  }));

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Message': 'No deliverables currently forecasted to delay.' }]);
  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 32 }, // Workstream
    { wch: 45 }, // Title
    { wch: 22 }, // BE
    { wch: 22 }, // FE
    { wch: 16 }, // End Date
    { wch: 16 }, // Days to Deadline
    { wch: 14 }, // Progress
    { wch: 18 }, // Risk Probability
    { wch: 14 }, // Status
    { wch: 12 }, // Priority
    { wch: 55 }, // Risk Drivers
    { wch: 35 }, // Blockers
    { wch: 50 }, // Mitigation
    { wch: 18 }, // Report Date
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Expected to Delay Forecast');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  const finalName = fileName || `Expected_To_Delay_Forecast_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.xlsx`;
  saveAs(dataBlob, finalName);
}

// -------------------------------------------------------------
// SEPARATE EXCEL REPORT: RISK AREAS MATRIX
// -------------------------------------------------------------
export function exportRiskAreasExcel(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const wb = XLSX.utils.book_new();
  const reportGen = getCurrentReportDateTime();
  const riskAreas = getRiskAreas(tasks, asOfDate);

  const rows = riskAreas.map(ra => ({
    'Risk Area Name': ra.title,
    'Governance Category': ra.category,
    'Severity Level': ra.severity.toUpperCase(),
    'Total Deliverables': ra.tasks.length,
    'Average Progress %': `${ra.averageProgress}%`,
    'Active Delays Count': ra.delayedTasks.length,
    'Expected to Delay Count': ra.expectedTasks.length,
    'Downstream Blast Radius (Tasks)': ra.blastRadiusCount,
    'Key Risk Drivers / Blockers': ra.keyRiskDrivers.join(' | ') || 'Controlled',
    'Accountable Engineering Leads': ra.mitigationOwners.join(', '),
    'SteerCo Action Recommendation': ra.steerCoRecommendation,
    'Report Date': reportGen.displayDate,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 42 }, // Title
    { wch: 32 }, // Category
    { wch: 16 }, // Severity
    { wch: 18 }, // Total
    { wch: 18 }, // Avg Progress
    { wch: 18 }, // Active Delays
    { wch: 22 }, // Expected Delays
    { wch: 26 }, // Blast Radius
    { wch: 50 }, // Drivers
    { wch: 35 }, // Leads
    { wch: 55 }, // SteerCo
    { wch: 18 }, // Report Date
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Wholesale Risk Areas Matrix');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  const finalName = fileName || `Risk_Areas_Matrix_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.xlsx`;
  saveAs(dataBlob, finalName);
}

/**
 * Export the Live AI Audit Report to a formatted Excel workbook (.xlsx)
 */
export function exportAiAuditToExcel(
  analysisData: {
    overallRiskIndex: string;
    executiveSummary: string;
    criticalHiddenCount: number;
    highHiddenCount: number;
    topRiskCount: number;
    identifiedRisks: Array<{
      id: string;
      taskId: string;
      taskSNo: number;
      taskTitle: string;
      workstream: string;
      leadOwner: string;
      riskCategory: string;
      severity: string;
      subtleSignal: string;
      potentialImpact: string;
      recommendedPreventativeAction: string;
      estimatedDelayExposureDays: number;
      confidenceScore: number;
    }>;
  },
  tasks: TaskItem[],
  asOfDate: string,
  fileName?: string
) {
  const wb = XLSX.utils.book_new();
  const reportGen = getCurrentReportDateTime();

  const totalRisks = analysisData.identifiedRisks.length;
  const criticalCount = analysisData.criticalHiddenCount || analysisData.identifiedRisks.filter(r => r.severity === 'Critical').length;
  const highCount = analysisData.highHiddenCount || analysisData.identifiedRisks.filter(r => r.severity === 'High').length;
  const totalExposureDays = analysisData.identifiedRisks.reduce((acc, r) => acc + (r.estimatedDelayExposureDays || 0), 0);

  // 1. Executive Summary & Audit Governance Sheet
  const summaryRows = [
    { 'Audit Parameter': 'Audit Title', 'Value': 'Wholesale Banking PMO — Live AI Risk & Resolution Audit' },
    { 'Audit Parameter': 'Report Generation Timestamp', 'Value': reportGen.displayDateTime },
    { 'Audit Parameter': 'As-Of Operational Date', 'Value': asOfDate },
    { 'Audit Parameter': 'Overall Cognitive Risk Index', 'Value': analysisData.overallRiskIndex },
    { 'Audit Parameter': 'Total Scanned Deliverables', 'Value': `${tasks.length} Deliverables In-Scope` },
    { 'Audit Parameter': 'Total Identified Risks', 'Value': `${totalRisks} Action Items with Hidden Friction` },
    { 'Audit Parameter': 'Critical Severity Risks', 'Value': `${criticalCount} Items Requiring Immediate SteerCo Action` },
    { 'Audit Parameter': 'High Severity Risks', 'Value': `${highCount} Items With Downstream Blast Radius` },
    { 'Audit Parameter': 'Total Delay Exposure Prevented', 'Value': `+${totalExposureDays} Business Days Delay Prevented` },
    { 'Audit Parameter': 'Diagnostic Engine Model', 'Value': 'Gemini Cognitive Project Diagnostic Model' },
    { 'Audit Parameter': 'Executive Summary Finding', 'Value': analysisData.executiveSummary },
    { 'Audit Parameter': 'Governance Clearance', 'Value': 'CONFIDENTIAL • FOR PMO & STEERING COMMITTEE USE ONLY' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 36 },
    { wch: 80 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'AI Audit Summary');

  // 2. Identified Risks & Resolutions Grid
  const riskRows = analysisData.identifiedRisks.map((r, idx) => ({
    'Risk #': idx + 1,
    'Task #': r.taskSNo,
    'Task Title': r.taskTitle,
    'Workstream': r.workstream,
    'Engineering Owners': r.leadOwner,
    'Risk Category': r.riskCategory,
    'Severity Level': r.severity.toUpperCase(),
    'Early Warning Signal (from Remarks)': r.subtleSignal,
    'Potential Operational Impact': r.potentialImpact,
    'Recommended Preventative Action (Resolution)': r.recommendedPreventativeAction,
    'Delay Exposure (Days)': r.estimatedDelayExposureDays || 0,
    'AI Confidence %': `${r.confidenceScore || 90}%`,
  }));

  const wsRisks = XLSX.utils.json_to_sheet(riskRows);
  wsRisks['!cols'] = [
    { wch: 8 },  // Risk #
    { wch: 8 },  // Task #
    { wch: 40 }, // Title
    { wch: 32 }, // Workstream
    { wch: 25 }, // Owners
    { wch: 24 }, // Category
    { wch: 16 }, // Severity
    { wch: 45 }, // Signal
    { wch: 45 }, // Impact
    { wch: 55 }, // Resolution
    { wch: 22 }, // Exposure
    { wch: 16 }, // Confidence
  ];
  XLSX.utils.book_append_sheet(wb, wsRisks, 'Identified Risks & Actions');

  // 3. Portfolio Tasks Baseline Cross-Check
  const taskRows = tasks.map(t => ({
    'Task #': t.sNo,
    'Deliverable Output': t.deliverable,
    'Workstream': t.workstream,
    'Target Finish Date': t.endDate,
    'Actual Finish Date': t.actualFinishDate || '-',
    'Status': t.status,
    'Backend Lead': t.backendOwner,
    'Frontend Lead': t.frontendOwner,
    'Predecessor Dependencies': t.dependency,
    'Logged Delay Days': t.delayDays || 0,
    'Logged Delay Reason': t.delayReason || '-',
    'Mitigation Plan': t.mitigationPlan || '-',
  }));

  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  wsTasks['!cols'] = [
    { wch: 8 },
    { wch: 35 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 18 },
    { wch: 40 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Portfolio Cross-Check');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  const finalName = fileName || `CBE_Live_AI_Audit_Report_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.xlsx`;
  saveAs(dataBlob, finalName);
}
