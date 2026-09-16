import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaskItem } from '../types';
import { getTaskDeadlineStatus, getCurrentReportDateTime } from './dateUtils';
import { getDelayedTasks, getExpectedToDelayTasks, getRiskAreas } from './delayAnalysis';

// Brand Palette RGB Values for jsPDF
const COLOR_PRIMARY = [149, 40, 142] as [number, number, number];    // #95288E Plum
const COLOR_GOLD = [179, 141, 52] as [number, number, number];        // #B38D34 Gold / Bronze
const COLOR_ORCHID = [214, 103, 207] as [number, number, number];     // #D667CF Light Orchid
const COLOR_DARK = [15, 23, 42] as [number, number, number];          // #0F172A Slate 950
const COLOR_MUTED = [100, 116, 139] as [number, number, number];      // #64748B Slate 500
const COLOR_LIGHT_BG = [248, 250, 252] as [number, number, number];  // #F8FAFC Slate 50
const COLOR_BORDER = [203, 213, 225] as [number, number, number];    // #CBD5E1 Slate 300
const COLOR_DANGER = [220, 38, 38] as [number, number, number];      // #DC2626 Red
const COLOR_SUCCESS = [22, 163, 74] as [number, number, number];     // #16A34A Green

// Shared Helper: Setup Base PDF Header & Footer
function createBaseReportDoc(moduleTitle: string, asOfDate: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const reportGen = getCurrentReportDateTime();
  const pageWidth = doc.internal.pageSize.getWidth();   // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const marginX = 14;

  const drawPageHeader = (pageNumber: number) => {
    // Top colored accent ribbon
    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.rect(0, 0, pageWidth * 0.65, 3.5, 'F');
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(pageWidth * 0.65, 0, pageWidth * 0.35, 3.5, 'F');

    // Title banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('WHOLESALE BANKING PMO', marginX, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(`• ${moduleTitle}`, marginX + 68, 11);

    // Right-aligned Timestamp & Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text(`Baseline: ${asOfDate}`, pageWidth - marginX, 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(`Generated: ${reportGen.displayDateTime}`, pageWidth - marginX, 13, { align: 'right' });

    // Subtle divider rule
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, 15, pageWidth - marginX, 15);
  };

  const drawPageFooter = (pageNumber: number) => {
    const footerY = pageHeight - 8;
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY - 2.5, pageWidth - marginX, footerY - 2.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('CONFIDENTIAL & PROPRIETARY', marginX, footerY + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('• Wholesale Banking Group Program Management Office • Official Governance Extract', marginX + 46, footerY + 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(`Page ${pageNumber}`, pageWidth - marginX, footerY + 1, { align: 'right' });
  };

  const finalizePageNumbers = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 8;
      doc.setFillColor(255, 255, 255);
      doc.rect(pageWidth - marginX - 35, footerY - 2, 35, 6, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, footerY + 1, { align: 'right' });
    }
  };

  return { doc, reportGen, pageWidth, pageHeight, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers };
}

// -------------------------------------------------------------
// 1. TACTICAL GANTT PDF EXPORT
// -------------------------------------------------------------
export async function exportTacticalGanttPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, pageWidth, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Tactical GANTT Execution Timeline & Deliverables Plan', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  // Summary Metrics Banner
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProg = tasks.filter(t => t.status === 'In Progress' || t.status === 'Partial').length;
  const delayed = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'OVERDUE' || t.status === 'Delayed';
  }).length;

  const milestones = [
    { num: 'P1', title: 'Foundation & Core Auth', date: '23-08-2026', owner: 'Khalid & Lead Group', status: 'Phase 1' },
    { num: 'P2', title: 'Workflow Completions & Fee Engine', date: '30-08-2026', owner: 'Yohannes Y., Dewa, Eyob', status: 'Phase 2' },
    { num: 'P3', title: 'Valuation & Committee Refactor', date: '30-09-2026', owner: 'Khalid, Amanuel, Letu', status: 'Phase 3' },
    { num: 'P4', title: 'Post-Approval & Disbursement Suite', date: '31-10-2026', owner: 'Yohannes S., Melaku, Eyob', status: 'Phase 4' },
    { num: 'P5', title: 'Credit Operations & Contract Signing', date: '24-09-2026', owner: 'Ephrem, Wubishet', status: 'Phase 5' },
    { num: 'P6', title: 'End-to-End Integration & SteerCo', date: '15-10-2026', owner: 'All Team & SteerCo', status: 'Phase 6' },
  ];

  // Milestone Bento Grid
  const cardY = 18;
  const cardW = (pageWidth - (marginX * 2) - 15) / 6;
  const cardH = 20;

  milestones.forEach((m, idx) => {
    const x = marginX + idx * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.rect(x + 2, cardY + 2, 7, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(m.num, x + 2, cardY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    const splitTitle = doc.splitTextToSize(m.title, cardW - 4);
    doc.text(splitTitle, x + 2, cardY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text(`Due: ${m.date}`, x + 2, cardY + 18);
  });

  // Table of All Deliverables Gantt Timeline
  const ganttRows = tasks.map(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayDays = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : (t.delayDays || 0);

    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      t.startDate,
      t.endDate,
      t.actualFinishDate || '-',
      t.backendOwner,
      t.frontendOwner,
      t.status,
      delayDays > 0 ? `+${delayDays}d` : '0d',
      t.dependency || '-',
      `${t.percentComplete || (t.status === 'Completed' ? 100 : t.status === 'Partial' ? 30 : t.status === 'In Progress' ? 50 : 0)}%`
    ];
  });

  autoTable(doc, {
    startY: cardY + cardH + 5,
    head: [['#', 'Workstream', 'Deliverable Name', 'Start Date', 'Target Date', 'Actual Finish', 'BE Lead', 'FE Lead', 'Status', 'Delay', 'Pre-req', 'Prog %']],
    body: ganttRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 1.6,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 56, fontStyle: 'bold' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 12, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      10: { cellWidth: 35 },
      11: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Tactical_GANTT_Timeline_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 2. DEPARTMENT MATRIX PDF EXPORT
// -------------------------------------------------------------
export async function exportDepartmentMatrixPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Department Matrix & Engineering Accountability', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const membersList = [
    { name: 'Khalid', role: 'Backend Lead', focus: 'User Mgmt, API Auth, DLL Rules, Committee Engine' },
    { name: 'Yohannes Y.', role: 'Backend Lead', focus: 'CRM LAF/DDR, Appraisal, Committee Bundle, Credit Info' },
    { name: 'Dewa', role: 'Frontend Lead', focus: 'CRM UI, Appraisal File Viewer, Committee Case Bundle' },
    { name: 'Eyob', role: 'Backend Lead', focus: 'Fee Management & Post-Disbursement Suite' },
    { name: 'Simachew', role: 'Frontend Lead', focus: 'Post-Disbursement UI & Workflows' },
    { name: 'Yohannes S.', role: 'Backend Lead', focus: 'Feasibility Review & Post-Approval Appeals' },
    { name: 'Melaku', role: 'Frontend Lead', focus: 'Feasibility UI, Appeals & Condition Lifting' },
    { name: 'Amanuel', role: 'Backend Lead', focus: 'Collateral Valuation Pipeline & Asset Reports' },
    { name: 'Raeye', role: 'Frontend Lead', focus: 'Fee Engine & Valuation Upload Interfaces' },
    { name: 'Letu', role: 'Frontend Lead', focus: 'Committee Voting UI & Meeting Management' },
    { name: 'Ephrem', role: 'Backend Lead', focus: 'Collateral Operations & Credit Operations BRD' },
    { name: 'Natnael', role: 'Frontend Lead', focus: 'Collateral Release & Replacement Interfaces' },
    { name: 'Wubishet', role: 'Frontend Lead', focus: 'Credit Operations UI & Contract Execution' },
    { name: 'All Team', role: 'Cross-Functional', focus: 'BRD Review, Technical Design, E2E Integration' },
  ];

  const teamRows = membersList.map(m => {
    const assigned = tasks.filter(t => 
      t.backendOwner.includes(m.name) || t.frontendOwner.includes(m.name) || t.testOwner.includes(m.name)
    );
    const comp = assigned.filter(t => t.status === 'Completed').length;
    const inProg = assigned.filter(t => t.status === 'In Progress' || t.status === 'Partial').length;
    const dly = assigned.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;
    const notSt = assigned.filter(t => t.status === 'Not Started').length;
    const rate = assigned.length > 0 ? Math.round((comp / assigned.length) * 100) : 0;

    return [
      m.name,
      m.role,
      m.focus,
      assigned.length.toString(),
      comp.toString(),
      inProg.toString(),
      dly.toString(),
      notSt.toString(),
      `${rate}%`,
      dly > 0 ? 'Escalation Flag' : 'On Schedule'
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['Engineering Owner', 'Role', 'Domain Focus & System Responsibilities', 'Total Tasks', 'Done', 'In Prog', 'Delayed', 'Pending', 'Completion %', 'Governance Status']],
    body: teamRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 85 },
      3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 14, halign: 'center', textColor: COLOR_SUCCESS, fontStyle: 'bold' },
      5: { cellWidth: 14, halign: 'center', textColor: COLOR_GOLD, fontStyle: 'bold' },
      6: { cellWidth: 14, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Department_Matrix_Accountability_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 3. STRATEGIC ROADMAP PDF EXPORT
// -------------------------------------------------------------
export async function exportStrategicRoadmapPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Strategic 6-Month Roadmap & Executive Stage Gates Horizon', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const gates = [
    {
      code: 'Gate 1 (M1)',
      title: 'Foundation & Core Security Matrix',
      window: 'Aug 17 - Aug 23, 2026',
      leads: 'Khalid, Yohannes Y., Dewa',
      deliverables: 'Maker-checker matrix (#3), DLL rule engine (#5), Appraisal viewer (#13), Dynamic UI (#2)',
      dependencies: 'Core IAM Provider & Postgres DB Provisioning',
      risk: 'High (Core Access Anchor)',
    },
    {
      code: 'Gate 2 (M2)',
      title: 'Core Workflows & Origination Pipeline',
      window: 'Aug 24 - Sep 13, 2026',
      leads: 'Yohannes Y., Dewa, Eyob, Simachew',
      deliverables: 'LAF/DDR CRM (#11), Dynamic Fee Engine (#15), Credit Info Service (#12)',
      dependencies: 'Gate 1 Sign-Off, NBE API Specs',
      risk: 'Medium-High (External API)',
    },
    {
      code: 'Gate 3 (M3)',
      title: 'Valuation & Committee Engine Refactor',
      window: 'Aug 24 - Sep 30, 2026',
      leads: 'Khalid, Amanuel, Letu, Raeye',
      deliverables: 'Civil/Agri Valuation (#19), Committee Voting Matrix (#27), 8 DLL Outcomes (#26)',
      dependencies: 'Appraisal Workflows, Scoring Rules',
      risk: 'Medium',
    },
    {
      code: 'Gate 4 (M4)',
      title: 'Post-Disbursement & Restructuring Suite',
      window: 'Sep 04 - Oct 31, 2026',
      leads: 'Eyob, Simachew, Yohannes S., Melaku',
      deliverables: 'Waiver Workflow (#35), Tenure & Reschedule (#37), Customer Appeals (#31)',
      dependencies: 'Loan Servicing Core, Core Banking APIs',
      risk: 'Low-Medium',
    },
    {
      code: 'Gate 5 (M5)',
      title: 'Credit Operations & Execution Gate',
      window: 'Sep 14 - Sep 24, 2026',
      leads: 'Ephrem, Wubishet',
      deliverables: 'Contract Prep (#41), 60-Day Execution Rule (#42), Legal Advisory BRD (#44)',
      dependencies: 'Legal Counsel Template Finalization',
      risk: 'Medium',
    },
    {
      code: 'Gate 6 (M6)',
      title: 'UAT, Security Pen-Test & Go-Live',
      window: 'Oct 01, 2026 - Jan 31, 2027',
      leads: 'All Engineering Leads & PMO SteerCo',
      deliverables: 'End-to-End Regression Suite, Security Audit, Production Deployment & Warranty',
      dependencies: 'All Preceding Gate Sign-Offs',
      risk: 'Controlled',
    },
  ];

  const gateRows = gates.map(g => [
    g.code,
    g.title,
    g.window,
    g.leads,
    g.deliverables,
    g.dependencies,
    g.risk,
  ]);

  autoTable(doc, {
    startY: 20,
    head: [['Stage Gate', 'Phase Title', 'Target Window', 'Lead Owners', 'Key Deliverables (# IDs)', 'Prerequisites & Dependencies', 'Risk Profile']],
    body: gateRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2.5,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 30, halign: 'center', textColor: COLOR_GOLD, fontStyle: 'bold' },
      3: { cellWidth: 34 },
      4: { cellWidth: 62 },
      5: { cellWidth: 46 },
      6: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Strategic_Roadmap_6_Months_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 4. MASTER ACTION PLAN (44) PDF EXPORT
// -------------------------------------------------------------
export async function exportMasterActionPlanPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Master Action Plan (44 Deliverables) • Complete Operational Catalog', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const masterRows = tasks.map(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayDays = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : (t.delayDays || 0);

    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      t.startDate,
      t.endDate,
      t.backendOwner,
      t.backendStatus || t.status,
      t.frontendOwner,
      t.frontendStatus || (t.frontendOwner === '-' ? 'N/A' : t.status),
      t.status,
      delayDays > 0 ? `+${delayDays}d` : '-',
      `${t.percentComplete || (t.status === 'Completed' ? 100 : t.status === 'Partial' ? 30 : t.status === 'In Progress' ? 50 : 0)}%`,
      t.mitigationPlan || t.remark || '-'
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['#', 'Workstream', 'Deliverable Name', 'Start Date', 'Target Date', 'BE Lead', 'BE Status', 'FE Lead', 'FE Status', 'Overall Status', 'Delay', '%', 'PMO Action Plan']],
    body: masterRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: 1.5,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15 },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 15 },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 12, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      11: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
      12: { cellWidth: 44 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Master_Action_Plan_44_Deliverables_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 5. DELAY LOG & ROOT CAUSE PDF EXPORT
// -------------------------------------------------------------
export async function exportDelayLogPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Delay Log & Root Cause Analysis • SteerCo Remediation Register', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const delayedTasks = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'OVERDUE' || t.status === 'Delayed' || t.status === 'No BRD' || (t.delayDays && t.delayDays > 0);
  });

  const delayRows = (delayedTasks.length > 0 ? delayedTasks : tasks.slice(0, 10)).map(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayDays = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : (t.delayDays || 0);

    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      `${t.backendOwner} / ${t.frontendOwner}`,
      t.endDate,
      `+${delayDays} days`,
      t.status,
      t.delayReason || 'API interface alignment / BRD sign-off requirement',
      t.mitigationPlan || t.remark || 'Active engineering sync & daily PMO follow-up',
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['#', 'Workstream', 'Deliverable Title', 'Accountable Leads', 'Target Date', 'Delay Horizon', 'Status', 'Root Cause & Impact', 'PMO Remediation & Action Plan']],
    body: delayRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 54, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 42 },
      8: { cellWidth: 43 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Delay_Log_Root_Cause_Register_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 5B. SEPARATE REPORT: CURRENTLY DELAYED DELIVERABLES
// -------------------------------------------------------------
export async function exportDelayedReportPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Currently Delayed Deliverables • Active Overdue Register & Root Causes', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const delayedTasks = getDelayedTasks(tasks, asOfDate);

  const delayRows = delayedTasks.map(t => {
    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      `${t.backendOwner} / ${t.frontendOwner}`,
      t.endDate,
      `+${t.effectiveDelayDays}d`,
      t.status,
      t.delayReason || 'Pending technical / regulatory interface alignment',
      t.mitigationPlan || t.remark || 'Active engineering sync & daily PMO follow-up',
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['#', 'Workstream', 'Delayed Deliverable', 'Accountable Leads', 'Target Date', 'Delay Horizon', 'Status', 'Identified Root Cause', 'SteerCo Mitigation Plan']],
    body: delayRows.length > 0 ? delayRows : [['-', 'No Delayed Tasks', 'All deliverables tracking to schedule', '-', '-', '-', 'On Track', '-', '-']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [185, 28, 28], // Dark Crimson
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 54, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 42 },
      8: { cellWidth: 43 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Currently_Delayed_Deliverables_Report_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 5C. SEPARATE REPORT: EXPECTED TO DELAY (EARLY WARNING FORECAST)
// -------------------------------------------------------------
export async function exportExpectedDelayReportPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Expected to Delay Deliverables • Early Warning Forecast & Slippage Radar', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const expectedTasks = getExpectedToDelayTasks(tasks, asOfDate);

  const expectedRows = expectedTasks.map(t => {
    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      `${t.backendOwner} / ${t.frontendOwner}`,
      t.endDate,
      `${t.percentComplete || 0}%`,
      t.riskProbability.toUpperCase(),
      t.riskReasons.join(' • '),
      t.mitigationPlan || 'Implement preventative checkpoint and pair lead with unblocked engineer',
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['#', 'Workstream', 'At-Risk Deliverable', 'Accountable Leads', 'Target Date', 'Progress', 'Risk Level', 'Early Warning Risk Drivers', 'Preventative Action Plan']],
    body: expectedRows.length > 0 ? expectedRows : [['-', 'No At-Risk Deliverables', 'No deliverables forecasted to slip', '-', '-', '-', 'Controlled', '-', '-']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [180, 83, 9], // Amber/Bronze
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 54, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 44 },
      8: { cellWidth: 43 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Expected_To_Delay_Forecast_Report_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 5D. SEPARATE REPORT: RISK AREAS MATRIX & REMEDIATION REPORT
// -------------------------------------------------------------
export async function exportRiskAreasReportPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Wholesale Banking PMO • Risk Areas Matrix & Blast Radius Analysis', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const riskAreas = getRiskAreas(tasks, asOfDate);

  const rows = riskAreas.map(ra => {
    return [
      ra.title,
      ra.category,
      ra.severity.toUpperCase(),
      `${ra.tasks.length} tasks (${ra.averageProgress}%)`,
      `${ra.delayedTasks.length} Delayed / ${ra.expectedTasks.length} At-Risk`,
      `${ra.blastRadiusCount} downstream tasks`,
      ra.keyRiskDrivers.length > 0 ? ra.keyRiskDrivers.join('\n') : 'No active blockers logged',
      ra.steerCoRecommendation,
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['Risk Area', 'Category', 'Severity', 'Scope & Progress', 'Delays / At-Risk', 'Blast Radius', 'Key Risk Drivers', 'SteerCo Recommendation']],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'top',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 50 },
      7: { cellWidth: 55 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Risk_Areas_Matrix_Report_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// 6. WORKLOAD & BURNOUT PDF EXPORT
// -------------------------------------------------------------
export async function exportWorkloadBurnoutPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Engineering Workload & Burnout Capacity Radar', asOfDate);

  drawPageHeader(1);
  drawPageFooter(1);

  const teamRoster = [
    { name: 'Khalid Mohammed', role: 'Backend Lead', dept: 'Core Architecture', targetCap: 4 },
    { name: 'Yohannes Yilma', role: 'Backend Lead', dept: 'Credit & Appraisal', targetCap: 4 },
    { name: 'Dewan Asefa', role: 'Frontend Lead', dept: 'Portal & UI Suite', targetCap: 4 },
    { name: 'Eyob Girma', role: 'Backend Lead', dept: 'Post-Disbursement', targetCap: 4 },
    { name: 'Simachew Bekele', role: 'Frontend Lead', dept: 'Post-Disbursement UI', targetCap: 4 },
    { name: 'Yohannes Sahle', role: 'Backend Lead', dept: 'Feasibility & Appeals', targetCap: 4 },
    { name: 'Melaku Tefera', role: 'Frontend Lead', dept: 'Feasibility UI', targetCap: 4 },
    { name: 'Amanuel Getachew', role: 'Backend Lead', dept: 'Collateral Valuation', targetCap: 4 },
    { name: 'Raeye Daniel', role: 'Frontend Lead', dept: 'Valuation & Fees UI', targetCap: 4 },
    { name: 'Letarik (Letu) Tadesse', role: 'Frontend Lead', dept: 'Committee UI', targetCap: 4 },
    { name: 'Ephrem Worku', role: 'Backend Lead', dept: 'Credit Operations', targetCap: 4 },
    { name: 'Natnael Hailu', role: 'Frontend Lead', dept: 'Collateral Operations UI', targetCap: 4 },
    { name: 'Wubishet Alemu', role: 'Frontend Lead', dept: 'Contract Execution UI', targetCap: 4 },
  ];

  const workloadRows = teamRoster.map(m => {
    const firstName = m.name.split(' ')[0];
    const assigned = tasks.filter(t => 
      t.backendOwner.includes(m.name) || 
      t.frontendOwner.includes(m.name) || 
      t.backendOwner.includes(firstName) || 
      t.frontendOwner.includes(firstName)
    );
    const active = assigned.filter(t => t.status === 'In Progress' || t.status === 'Partial').length;
    const completed = assigned.filter(t => t.status === 'Completed').length;
    const delayed = assigned.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;

    const utilization = Math.round((active / m.targetCap) * 100);
    const burnoutRisk = active >= 5 || delayed >= 2 ? 'CRITICAL RISK' : active >= 3 ? 'ELEVATED' : 'BALANCED';

    return [
      m.name,
      m.role,
      m.dept,
      assigned.length.toString(),
      active.toString(),
      m.targetCap.toString(),
      `${utilization}%`,
      delayed.toString(),
      completed.toString(),
      burnoutRisk,
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['Engineer Name', 'Track', 'Squad / Domain', 'Total Assigned', 'Active Tasks', 'Target Cap', 'Capacity Util %', 'Delayed Tasks', 'Done', 'Burnout Risk Level']],
    body: workloadRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 44 },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'center', textColor: COLOR_GOLD, fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 20, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      8: { cellWidth: 16, halign: 'center', textColor: COLOR_SUCCESS, fontStyle: 'bold' },
      9: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Workload_Burnout_Analysis_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// MASTER ALL-IN-ONE EXECUTIVE DASHBOARD PDF
// -------------------------------------------------------------
export async function exportDashboardToPdf(tasks: TaskItem[], asOfDate: string, fileName?: string): Promise<void> {
  const { doc, reportGen, pageWidth, pageHeight, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('Project Action Plan & Executive Governance Master Report', asOfDate);

  // PAGE 1: Executive Scorecard
  drawPageHeader(1);
  drawPageFooter(1);

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

  const cardY = 19;
  const cardW = (pageWidth - (marginX * 2) - 9) / 4;
  const cardH = 26;

  const kpis = [
    { title: 'Overall Completion', value: `${overallProgress}%`, sub: `${completed} of ${total} Deliverables Done`, color: COLOR_PRIMARY, border: COLOR_PRIMARY },
    { title: 'Active In Progress', value: `${inProgress + partial}`, sub: `${inProgress} Active, ${partial} Partial Work`, color: COLOR_GOLD, border: COLOR_GOLD },
    { title: 'Delayed / Escalated', value: `${delayedTasks.length}`, sub: `${delayedTasks.length} Require SteerCo Attention`, color: delayedTasks.length > 0 ? COLOR_DANGER : COLOR_SUCCESS, border: COLOR_PRIMARY },
    { title: 'Pending Stage Gates', value: `${notStarted}`, sub: 'Scheduled for Next Phases', color: COLOR_MUTED, border: COLOR_BORDER },
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'FD');

    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x + 3, cardY + 2.5, 8, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, cardY + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(kpi.title, x + 3, cardY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(kpi.sub, x + 3, cardY + 22);
  });

  // Delay radar table
  const section1Y = cardY + cardH + 5;
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(marginX, section1Y, 2.5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('EXECUTIVE RISK RADAR & CRITICAL ESCALATIONS MATRIX', marginX + 4.5, section1Y + 3.8);

  const delayRows = delayedTasks.slice(0, 6).map(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayDays = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : (t.delayDays || 0);
    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      `${t.backendOwner} / ${t.frontendOwner}`,
      t.endDate,
      `+${delayDays} days`,
      t.status,
      t.delayReason || 'API contract / Spec alignment',
      t.mitigationPlan || t.remark || 'Active PMO follow-up'
    ];
  });

  autoTable(doc, {
    startY: section1Y + 7,
    head: [['#', 'Workstream', 'Deliverable Title', 'Owners (BE/FE)', 'End Date', 'Delay', 'Status', 'Root Cause', 'SteerCo Mitigation Action']],
    body: delayRows.length > 0 ? delayRows : [['-', 'All Streams', 'No active delay breaches identified', 'All Leads', '-', '0d', 'On Track', 'None', 'Normal progression']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 54, fontStyle: 'bold' },
      3: { cellWidth: 34 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 40 },
      8: { cellWidth: 43 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX },
  });

  // PAGE 2+: Master Action Plan 44 Tasks Table
  doc.addPage('a4', 'landscape');
  drawPageHeader(2);

  const masterTableRows = tasks.map(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayDays = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : (t.delayDays || 0);

    return [
      `#${t.sNo}`,
      t.workstream,
      t.deliverable || t.title,
      t.priority || 'Medium',
      `${t.backendOwner}\n${t.frontendOwner}`,
      t.startDate,
      t.endDate,
      delayDays > 0 ? `+${delayDays}d` : '-',
      t.status,
      `${t.percentComplete || (t.status === 'Completed' ? 100 : t.status === 'Partial' ? 30 : t.status === 'In Progress' ? 50 : 0)}%`,
      t.mitigationPlan || t.remark || '-'
    ];
  });

  autoTable(doc, {
    startY: 19,
    head: [['#', 'Workstream', 'Deliverable Description', 'Priority', 'Assigned Leads (BE / FE)', 'Start Date', 'Target Date', 'Delay', 'Status', '% Done', 'Governance Remarks & Action']],
    body: masterTableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 1.6,
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 30 },
      2: { cellWidth: 55, fontStyle: 'bold' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 32 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 12, halign: 'center', textColor: COLOR_DANGER, fontStyle: 'bold' },
      8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 48 },
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG,
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `Action_Plan_Executive_Report_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

// -------------------------------------------------------------
// OFFICIAL CBE DAILY REPORT STATUS PDF EXPORT (MATCHING ATTACHED SLIDE TEMPLATE)
// -------------------------------------------------------------
export async function exportCbeDailyReportStatusPdf(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { doc, reportGen, pageWidth, pageHeight, marginX, drawPageHeader, drawPageFooter, finalizePageNumbers } = 
    createBaseReportDoc('CBE Digital Factory • Daily Status Report (44 Deliverables)', asOfDate);

  const CBE_PURPLE = [112, 26, 117] as [number, number, number]; // #701A75
  const CBE_GOLD = [179, 141, 52] as [number, number, number];    // #B38D34

  // Page 1 Header Cards (Initiative Meta Box & MVP table)
  let currentY = 18;

  // Initiative Header Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(CBE_GOLD[0], CBE_GOLD[1], CBE_GOLD[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 24, 2, 2, 'FD');

  // Initiative Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(CBE_PURPLE[0], CBE_PURPLE[1], CBE_PURPLE[2]);
  doc.text('Initiative Name: Wholesale and Credit digitization', marginX + 4, currentY + 6);

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Current MVP: MVP3 (Loan System Origination)', pageWidth - marginX - 4, currentY + 6, { align: 'right' });

  // Sub-box 1 (Left)
  doc.setFillColor(250, 245, 255);
  doc.setDrawColor(226, 212, 183);
  doc.setLineWidth(0.2);
  doc.rect(marginX + 4, currentY + 9, (pageWidth - marginX * 2) * 0.48, 12, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Received at: Jan 03, 2026', marginX + 6, currentY + 14);
  doc.text('Delivery Lead: Technology Sector / Samson', marginX + 50, currentY + 14);
  doc.text('Started at: Jun 15, 2026', marginX + 6, currentY + 18.5);
  doc.text('Product Owner: Wholesale & Credit Group', marginX + 50, currentY + 18.5);

  // Sub-box 2 (Right)
  const rightBoxX = marginX + 4 + (pageWidth - marginX * 2) * 0.5;
  const rightBoxW = (pageWidth - marginX * 2) * 0.48;
  doc.rect(rightBoxX, currentY + 9, rightBoxW, 12, 'FD');

  doc.text('Planned Status: On Track', rightBoxX + 3, currentY + 14);
  doc.text('Lead Time: 120 Days', rightBoxX + 48, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Current Status: In Progress', rightBoxX + 3, currentY + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Cycle Time: 65 Days', rightBoxX + 48, currentY + 18.5);
  doc.setTextColor(CBE_PURPLE[0], CBE_PURPLE[1], CBE_PURPLE[2]);
  doc.text(`Cut-off Date: ${asOfDate}`, rightBoxX + 85, currentY + 18.5);

  currentY += 27;

  // MVP Descriptions Table
  autoTable(doc, {
    startY: currentY,
    head: [
      ['MVPs', 'MVP Descriptions', 'Status Description']
    ],
    body: [
      ['MVP1', 'Customer Profile Registration & KYC Intake Gateway', 'Completed'],
      ['MVP2', 'Onboarding Customer & CRM Integration Gateway', 'Completed'],
      ['MVP3', 'Loan System Origination & Credit Underwriting Pipeline', 'In Progress (Active 44 Workstream Sprints)'],
    ],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [216, 180, 254],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: CBE_PURPLE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center', fontStyle: 'bold', textColor: CBE_PURPLE },
      1: { cellWidth: 160 },
      2: { cellWidth: 85, fontStyle: 'bold', textColor: [22, 163, 74] },
    },
    alternateRowStyles: {
      fillColor: [250, 245, 255],
    },
    margin: { left: marginX, right: marginX },
  });

  // Action Items Table spanning all 44 tasks
  const sortedTasks = [...tasks].sort((a, b) => a.sNo - b.sNo);
  const actionBody = sortedTasks.map((t) => {
    const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const isOverdue = deadlineInfo.category === 'OVERDUE' || t.status === 'Delayed';
    const reasonText = isOverdue
      ? (t.delayReason || t.mitigationPlan || t.remark || 'Delivery horizon extended')
      : (t.status === 'Completed' ? 'Completed & verified' : (t.remark || 'On track with sprint milestones'));

    return [
      `#${t.sNo} ${t.deliverable || t.title}`,
      `${t.backendOwner || '-'} / ${t.frontendOwner || '-'}`,
      t.startDate || '15-06-2026',
      t.endDate || '18-08-2026',
      t.status,
      reasonText
    ];
  });

  const finalAutoTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : currentY + 30;

  autoTable(doc, {
    startY: finalAutoTableY,
    head: [
      [{ content: 'Action Items (Master 44 Tasks Catalog)', colSpan: 6, styles: { halign: 'center', fillColor: CBE_PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 } }],
      ['Action Items', 'Owner', 'Planned Start', 'Planned End', 'Status', 'Reason if Delayed']
    ],
    body: actionBody,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.6,
      lineColor: [216, 180, 254],
      lineWidth: 0.15,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [134, 25, 143],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 69 },
    },
    alternateRowStyles: {
      fillColor: [250, 245, 255],
    },
    margin: { left: marginX, right: marginX, bottom: 14, top: 18 },
    didDrawPage: (data) => {
      drawPageHeader(data.pageNumber);
      drawPageFooter(data.pageNumber);
    },
  });

  finalizePageNumbers();
  const finalName = fileName || `CBE_Daily_Status_Report_44_Tasks_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pdf`;
  doc.save(finalName);
}

