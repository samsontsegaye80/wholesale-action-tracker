import PptxGenJS from 'pptxgenjs';
import { TaskItem } from '../types';
import { getTaskDeadlineStatus, getCurrentReportDateTime } from './dateUtils';
import cbeCoverImg from '../assets/images/cbe_ppt_cover_1787232571143.jpg';

// Brand Color Palette Constants
const COLOR_PRIMARY = '95288E';   // Primary Plum / Deep Magenta (#95288E)
const COLOR_GOLD = 'B38D34';      // Accent Gold / Bronze (#B38D34)
const COLOR_ORCHID = 'D667CF';    // Light Orchid / Accent Magenta (#D667CF)
const COLOR_BG_DARK = '0F172A';   // Dark Slate (Midnight)
const COLOR_CARD_DARK = '1E293B'; // Card Dark Slate
const COLOR_BG_LIGHT = 'F8FAFC';  // Crisp Light Background
const COLOR_WHITE = 'FFFFFF';
const COLOR_TEXT_DARK = '0F172A';
const COLOR_TEXT_MUTED = '64748B';
const COLOR_BORDER_LIGHT = 'CBD5E1';

// Helper to initialize standard 16x9 widescreen presentation
function createBasePpt(reportTitle: string) {
  const pptx = new PptxGenJS();
  const reportGen = getCurrentReportDateTime();
  pptx.defineLayout({ name: 'LAYOUT_16X9_INCH', width: 16.0, height: 9.0 });
  pptx.layout = 'LAYOUT_16X9_INCH';
  pptx.author = 'Wholesale Banking PMO';
  pptx.company = 'Wholesale Banking Group';
  pptx.title = `${reportTitle} (Generated ${reportGen.compact})`;
  return { pptx, reportGen };
}

// Helper to get base64 Data URL for cover image safely in browser
let cachedCoverBase64: string | null = null;
async function getCoverImageBase64(): Promise<string | null> {
  if (cachedCoverBase64) return cachedCoverBase64;
  try {
    const res = await fetch(cbeCoverImg);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        cachedCoverBase64 = result;
        resolve(result);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Cover image fetch fallback:', err);
    return null;
  }
}

// Helper to add standard branded cover slide
async function addCoverSlide(pptx: PptxGenJS, eyebrow: string, mainTitle: string, subtitle: string, asOfDate: string, reportGen: any) {
  const slide = pptx.addSlide();
  slide.background = { color: '200826' };

  const imgData = await getCoverImageBase64();
  if (imgData && imgData.startsWith('data:image')) {
    // Full-bleed attached CBE presentation cover slide image via Base64 data URI
    slide.addImage({
      data: imgData,
      x: 0.0,
      y: 0.0,
      w: 16.0,
      h: 9.0
    });
  } else {
    // High-contrast executive vector background fallback
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 16.0, h: 9.0,
      fill: { color: '3B073F' }
    });
  }

  // Top Accent Band
  slide.addShape(pptx.ShapeType.rect, { x: 0.0, y: 0.0, w: 10.0, h: 0.12, fill: { color: COLOR_PRIMARY } });
  slide.addShape(pptx.ShapeType.rect, { x: 10.0, y: 0.0, w: 6.0, h: 0.12, fill: { color: COLOR_GOLD } });

  // Right-aligned glass container card for optimal text readability over the background image
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.2, y: 1.5, w: 10.2, h: 6.2,
    fill: { color: '200826' },
    line: { color: COLOR_GOLD, width: 1.5 }
  });

  // Vertical Brand Anchor inside container
  slide.addShape(pptx.ShapeType.rect, { x: 5.6, y: 1.9, w: 0.15, h: 5.4, fill: { color: COLOR_PRIMARY } });

  // Eyebrow Tag
  slide.addText(eyebrow.toUpperCase(), {
    x: 6.0, y: 1.9, w: 9.0, h: 0.4,
    fontSize: 13, color: COLOR_ORCHID, bold: true, fontFace: 'Calibri'
  });

  // Main Title
  slide.addText(mainTitle, {
    x: 6.0, y: 2.35, w: 9.0, h: 1.2,
    fontSize: 32, color: COLOR_WHITE, bold: true, fontFace: 'Calibri'
  });

  // Subtitle
  slide.addText(`Baseline As of: ${asOfDate} | ${subtitle}`, {
    x: 6.0, y: 3.65, w: 9.0, h: 0.5,
    fontSize: 16, color: COLOR_GOLD, bold: true, fontFace: 'Calibri'
  });

  // Timestamp Badge
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.0, y: 4.3, w: 8.5, h: 0.48,
    fill: { color: '350E3E' },
    line: { color: COLOR_GOLD, width: 1 }
  });
  slide.addText(`🕒 Report Generation Date & Time: ${reportGen.displayDateTime}`, {
    x: 6.1, y: 4.3, w: 8.3, h: 0.48,
    fontSize: 11.5, color: COLOR_WHITE, bold: true, fontFace: 'Calibri',
    valign: 'middle'
  });

  // Brand Pillars Badges
  const badges = [
    { label: '44 Deliverables Catalog', fill: COLOR_PRIMARY, text: COLOR_WHITE },
    { label: '12 Capability Streams', fill: '350E3E', text: COLOR_ORCHID },
    { label: `Generated: ${reportGen.displayDate}`, fill: '350E3E', text: COLOR_GOLD },
  ];
  badges.forEach((b, i) => {
    const xPos = 6.0 + i * 2.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 5.4, w: 2.7, h: 0.55,
      fill: { color: b.fill },
      line: { color: COLOR_PRIMARY, width: 1 }
    });
    slide.addText(b.label, {
      x: xPos, y: 5.4, w: 2.7, h: 0.55,
      fontSize: 10.5, color: b.text, bold: true, fontFace: 'Calibri',
      align: 'center', valign: 'middle'
    });
  });

  // Footer Tagline
  slide.addText(`RESTRICTED ACCESS • COMMERCIAL BANK OF ETHIOPIA • GENERATED: ${reportGen.compact}`, {
    x: 1.2, y: 8.4, w: 13.6, h: 0.4,
    fontSize: 9.5, color: 'CBD5E1', fontFace: 'Calibri', align: 'left'
  });

  return slide;
}

// Helper to add standard slide header
function addSlideHeader(slide: any, tag: string, title: string) {
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: 1.0, y: 0.6, w: 0.15, h: 0.8,
    fill: { color: COLOR_PRIMARY }
  });
  slide.addText(tag.toUpperCase(), {
    x: 1.3, y: 0.55, w: 13.7, h: 0.35,
    fontSize: 11, color: COLOR_PRIMARY, bold: true, fontFace: 'Calibri'
  });
  slide.addText(title, {
    x: 1.3, y: 0.85, w: 13.7, h: 0.55,
    fontSize: 22, color: COLOR_TEXT_DARK, bold: true, fontFace: 'Calibri'
  });
}

// -------------------------------------------------------------
// 1. TACTICAL GANTT PPT EXPORT
// -------------------------------------------------------------
export async function exportTacticalGanttPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Tactical GANTT Execution Timeline');

  // Slide 1: Cover
  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Execution Timeline',
    'Tactical GANTT Delivery Roadmap',
    'Chronological Milestone Sequencing & Gate Horizons',
    asOfDate,
    reportGen
  );

  // Slide 2: Phase Milestones Overview
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide2, 'Chronological Gate Milestones', 'Tactical Phase Windows & Execution Gateways');

  const phases = [
    { code: 'PHASE 1', title: 'Foundation & Core Auth Ready', date: 'Aug 23, 2026', owner: 'Khalid & Lead Group', desc: 'IAM architecture, dynamic permissions, core route guards, and UI adaptors.', color: COLOR_PRIMARY },
    { code: 'PHASE 2', title: 'Workflow Completions & Fee Engine', date: 'Aug 30, 2026', owner: 'Yohannes Y., Dewa, Eyob', desc: 'LAF/DDR CRM workflow, appraisal file viewer, dynamic fee calculation.', color: COLOR_GOLD },
    { code: 'PHASE 3', title: 'Valuation & Committee Refactor', date: 'Sep 30, 2026', owner: 'Khalid, Amanuel, Letu', desc: 'Civil/agri valuation, weighted committee voting matrix, 8 DLL outcomes.', color: COLOR_ORCHID },
    { code: 'PHASE 4', title: 'Post-Disbursement & Appeals', date: 'Oct 31, 2026', owner: 'Yohannes S., Melaku, Eyob', desc: 'Waivers, restructure, tenure & reschedule, condition lifting pipeline.', color: COLOR_PRIMARY },
    { code: 'PHASE 5', title: 'Credit Operations & Contract Prep', date: 'Sep 24, 2026', owner: 'Ephrem, Wubishet', desc: 'Contract preparation, 60-day execution rule, manager review module.', color: COLOR_GOLD },
    { code: 'PHASE 6', title: 'End-to-End Testing & Go-Live', date: 'Jan 31, 2027', owner: 'All Team & PMO SteerCo', desc: 'Integrated regression testing, security audit, production warranty.', color: COLOR_ORCHID },
  ];

  phases.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const xPos = 1.0 + col * 4.8;
    const yPos = 1.6 + row * 3.4;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 4.5, h: 3.1,
      fill: { color: COLOR_WHITE },
      line: { color: p.color, width: 1.5 }
    });
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos, y: yPos, w: 4.5, h: 0.12,
      fill: { color: p.color }
    });
    slide2.addText(p.code, {
      x: xPos + 0.3, y: yPos + 0.3, w: 2.0, h: 0.35,
      fontSize: 11, color: p.color, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(p.title, {
      x: xPos + 0.3, y: yPos + 0.7, w: 3.9, h: 0.55,
      fontSize: 13, color: COLOR_TEXT_DARK, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(`📅 Target: ${p.date} • Lead: ${p.owner}`, {
      x: xPos + 0.3, y: yPos + 1.3, w: 3.9, h: 0.35,
      fontSize: 10.5, color: COLOR_GOLD, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(p.desc, {
      x: xPos + 0.3, y: yPos + 1.7, w: 3.9, h: 1.1,
      fontSize: 11, color: COLOR_TEXT_MUTED, fontFace: 'Calibri'
    });
  });

  // Slide 3: Tactical Schedule Table (Top deliverables)
  const slide3 = pptx.addSlide();
  slide3.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide3, 'Tactical Gantt Inventory', 'Critical Path Deliverables & Workstream Horizons');

  const ganttRows: any[][] = [
    [
      { text: '#', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Workstream', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Deliverable Title', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Start Date', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Target Date', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Leads (BE / FE)', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Status', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Pre-requisite Dependency', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
    ]
  ];

  tasks.slice(0, 7).forEach((t, idx) => {
    const rowBg = idx % 2 === 0 ? COLOR_WHITE : 'F1F5F9';
    ganttRows.push([
      { text: `#${t.sNo}`, options: { fontSize: 9.5, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_PRIMARY } },
      { text: t.workstream, options: { fontSize: 9, fill: { color: rowBg }, color: '334155' } },
      { text: t.deliverable || t.title, options: { fontSize: 9.5, bold: true, fill: { color: rowBg }, color: COLOR_TEXT_DARK } },
      { text: t.startDate, options: { fontSize: 9, fill: { color: rowBg }, align: 'center', color: '475569' } },
      { text: t.endDate, options: { fontSize: 9, fill: { color: rowBg }, align: 'center', color: '475569' } },
      { text: `${t.backendOwner} / ${t.frontendOwner}`, options: { fontSize: 9, fill: { color: rowBg }, color: '334155' } },
      { text: t.status, options: { fontSize: 9, bold: true, fill: { color: rowBg }, align: 'center', color: t.status === 'Completed' ? '16A34A' : COLOR_PRIMARY } },
      { text: t.dependency || '-', options: { fontSize: 8.5, fill: { color: rowBg }, color: '475569' } },
    ]);
  });

  slide3.addTable(ganttRows, {
    x: 1.0, y: 1.6, w: 14.0,
    rowH: [0.4, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85],
    border: { pt: 0.5, color: COLOR_BORDER_LIGHT },
    colW: [0.8, 2.5, 3.8, 1.2, 1.2, 2.0, 1.3, 1.2]
  });

  const finalName = fileName || `Tactical_GANTT_Presentation_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// 2. DEPARTMENT MATRIX PPT EXPORT
// -------------------------------------------------------------
export async function exportDepartmentMatrixPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Department Matrix & Engineering Accountability');

  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Squad Accountability',
    'Department Matrix & Domain Ownership',
    'Cross-Functional Engineering Squad Allocations & Capacity',
    asOfDate,
    reportGen
  );

  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide2, 'Squad Domain Ownership Matrix', 'Engineering Lead Responsibilities & Delivery Metrics');

  const teamMembers = [
    { name: 'Khalid', role: 'Backend Lead', focus: 'User Mgmt, Role Permissions, Committee Engine' },
    { name: 'Yohannes Y. & Dewa', role: 'Workflow Duo', focus: 'CRM Integration, Appraisal Upload, Credit Info Service' },
    { name: 'Eyob & Simachew', role: 'Financial Services', focus: 'Dynamic Fee Management, Post-Disbursement Reschedule' },
    { name: 'Yohannes S. & Melaku', role: 'Pre/Post Approval', focus: 'Customer Feasibility, Appeals, Condition Precedent' },
    { name: 'Ephrem, Natnael & Wubishet', role: 'Operations & Legal', focus: 'Collateral Release, BRD Specs, Legal Advisory Module' },
    { name: 'Amanuel & Raeye', role: 'Valuation Stream', focus: 'Civil Property, Agricultural Land, Valuation Appeals' },
  ];

  const teamRows: any[][] = [
    [
      { text: 'Engineering Owner', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11 } },
      { text: 'Primary Domain Focus', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11 } },
      { text: 'Total Tasks', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Completed', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Active / Partial', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Delayed', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'SteerCo Status', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
    ]
  ];

  teamMembers.forEach((tm, idx) => {
    const assigned = tasks.filter(t => t.backendOwner.includes(tm.name) || t.frontendOwner.includes(tm.name));
    const comp = assigned.filter(t => t.status === 'Completed').length;
    const act = assigned.filter(t => t.status === 'In Progress' || t.status === 'Partial').length;
    const dly = assigned.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;

    const rowBg = idx % 2 === 0 ? COLOR_WHITE : 'F1F5F9';
    teamRows.push([
      { text: tm.name, options: { fontSize: 10.5, bold: true, fill: { color: rowBg }, color: COLOR_TEXT_DARK } },
      { text: tm.focus, options: { fontSize: 9.5, fill: { color: rowBg }, color: '334155' } },
      { text: `${assigned.length}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_PRIMARY } },
      { text: `${comp}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: '16A34A' } },
      { text: `${act}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_GOLD } },
      { text: `${dly}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: dly > 0 ? 'DC2626' : '64748B' } },
      { text: dly > 0 ? 'Escalation Open' : 'On Schedule', options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: dly > 0 ? 'DC2626' : '16A34A' } },
    ]);
  });

  slide2.addTable(teamRows, {
    x: 1.0, y: 1.6, w: 14.0,
    rowH: [0.45, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95],
    border: { pt: 0.5, color: COLOR_BORDER_LIGHT },
    colW: [2.5, 4.3, 1.4, 1.4, 1.4, 1.4, 1.6]
  });

  const finalName = fileName || `Department_Matrix_Deck_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// 3. STRATEGIC ROADMAP PPT EXPORT
// -------------------------------------------------------------
export async function exportStrategicRoadmapPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Strategic 6-Month Roadmap');

  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Executive Strategy',
    'Strategic 6-Month Roadmap & Gate Horizon',
    'Stage Gate Milestones from August 2026 through January 2027',
    asOfDate,
    reportGen
  );

  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide2, 'Strategic 6-Month Gate Horizon', 'Sequential Stage Gate Milestones (Aug 2026 – Jan 2027)');

  const phases = [
    { num: 'GATE 1', title: 'Foundation & Security Matrix', window: 'Aug 17 - Aug 23, 2026', desc: 'BRD review, dynamic permissions, route protection, UI adaptors', color: COLOR_PRIMARY },
    { num: 'GATE 2', title: 'Core Workflows & Origination', window: 'Aug 24 - Sep 13, 2026', desc: 'CRM LAF/DDR, appraisal upload, fee engine, DLL rule setup', color: COLOR_GOLD },
    { num: 'GATE 3', title: 'Valuation & Committee Engine', window: 'Aug 24 - Sep 30, 2026', desc: 'Civil/agri valuation, weighted voting engine, 8 DLL outcomes', color: COLOR_ORCHID },
    { num: 'GATE 4', title: 'Post-Disbursement & Restructuring', window: 'Sep 04 - Oct 31, 2026', desc: 'Appeal workflow, restructuring, waiver, tenure & reschedule', color: COLOR_PRIMARY },
    { num: 'GATE 5', title: 'Credit Operations & Execution', window: 'Sep 14 - Sep 24, 2026', desc: 'Contract prep, 60-day execution rule, manager review module', color: COLOR_GOLD },
    { num: 'GATE 6', title: 'UAT, Security Audit & Go-Live', window: 'Oct 01, 2026 - Jan 31, 2027', desc: 'End-to-end integration testing, pen test, warranty & production', color: COLOR_ORCHID },
  ];

  phases.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const xPos = 1.0 + col * 4.8;
    const yPos = 1.6 + row * 3.4;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 4.4, h: 3.1,
      fill: { color: COLOR_WHITE },
      line: { color: p.color, width: 1.5 }
    });
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos, y: yPos, w: 4.4, h: 0.12,
      fill: { color: p.color }
    });
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.3, y: yPos + 0.3, w: 1.2, h: 0.35,
      fill: { color: p.color }
    });
    slide2.addText(p.num, {
      x: xPos + 0.3, y: yPos + 0.3, w: 1.2, h: 0.35,
      fontSize: 10, color: COLOR_WHITE, bold: true, fontFace: 'Calibri',
      align: 'center', valign: 'middle'
    });
    slide2.addText(p.title, {
      x: xPos + 0.3, y: yPos + 0.8, w: 3.8, h: 0.5,
      fontSize: 13, color: COLOR_TEXT_DARK, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(`📅 ${p.window}`, {
      x: xPos + 0.3, y: yPos + 1.35, w: 3.8, h: 0.35,
      fontSize: 11, color: p.color, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(p.desc, {
      x: xPos + 0.3, y: yPos + 1.75, w: 3.8, h: 1.1,
      fontSize: 11, color: COLOR_TEXT_MUTED, fontFace: 'Calibri'
    });
  });

  const finalName = fileName || `Strategic_Roadmap_Presentation_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// 4. MASTER ACTION PLAN (44) PPT EXPORT
// -------------------------------------------------------------
export async function exportMasterActionPlanPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Master Action Plan (44 Deliverables)');

  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Master Inventory',
    'Master Action Plan (44 Deliverables)',
    'Comprehensive Deliverable Catalog, Workstreams & Dual-Track Statuses',
    asOfDate,
    reportGen
  );

  // Split 44 tasks into slides of 8 tasks each
  const pageSize = 8;
  const totalPages = Math.ceil(tasks.length / pageSize);

  for (let page = 0; page < totalPages; page++) {
    const slide = pptx.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };
    addSlideHeader(slide, `Master Deliverables Catalog (${page + 1}/${totalPages})`, `Action Items #${page * pageSize + 1} to #${Math.min((page + 1) * pageSize, tasks.length)}`);

    const pageTasks = tasks.slice(page * pageSize, (page + 1) * pageSize);
    const tableRows: any[][] = [
      [
        { text: '#', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5, align: 'center' } },
        { text: 'Deliverable Title', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5 } },
        { text: 'Target Date', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5, align: 'center' } },
        { text: 'BE Lead & Status', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5 } },
        { text: 'FE Lead & Status', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5 } },
        { text: 'Overall Status', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5, align: 'center' } },
        { text: '% Done', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 9.5, align: 'center' } },
      ]
    ];

    pageTasks.forEach((t, idx) => {
      const rowBg = idx % 2 === 0 ? COLOR_WHITE : 'F1F5F9';
      tableRows.push([
        { text: `#${t.sNo}`, options: { fontSize: 9, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_PRIMARY } },
        { text: t.deliverable || t.title, options: { fontSize: 9, bold: true, fill: { color: rowBg }, color: COLOR_TEXT_DARK } },
        { text: t.endDate, options: { fontSize: 9, fill: { color: rowBg }, align: 'center', color: '475569' } },
        { text: `${t.backendOwner} (${t.backendStatus || t.status})`, options: { fontSize: 8.5, fill: { color: rowBg }, color: '334155' } },
        { text: `${t.frontendOwner} (${t.frontendStatus || (t.frontendOwner === '-' ? 'N/A' : t.status)})`, options: { fontSize: 8.5, fill: { color: rowBg }, color: '334155' } },
        { text: t.status, options: { fontSize: 9, bold: true, fill: { color: rowBg }, align: 'center', color: t.status === 'Completed' ? '16A34A' : COLOR_PRIMARY } },
        { text: `${t.percentComplete || (t.status === 'Completed' ? 100 : t.status === 'Partial' ? 30 : t.status === 'In Progress' ? 50 : 0)}%`, options: { fontSize: 9, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_GOLD } },
      ]);
    });

    slide.addTable(tableRows, {
      x: 1.0, y: 1.6, w: 14.0,
      rowH: [0.4, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75],
      border: { pt: 0.5, color: COLOR_BORDER_LIGHT },
      colW: [0.8, 4.4, 1.4, 2.5, 2.5, 1.4, 1.0]
    });
  }

  const finalName = fileName || `Master_Action_Plan_44_Deck_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// 5. DELAY LOG & ROOT CAUSE PPT EXPORT
// -------------------------------------------------------------
export async function exportDelayLogPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Delay Log & Root Cause Analysis');

  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Risk Remediation',
    'Delay Log & Root Cause Analysis',
    'Critical Bottleneck Remediation & Steering Committee Mitigation Register',
    asOfDate,
    reportGen
  );

  const delayedTasks = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'OVERDUE' || t.status === 'Delayed' || (t.delayDays && t.delayDays > 0);
  });

  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide2, 'Critical Bottleneck Register', 'Overdue & Delayed Deliverables with PMO Action Plans');

  const delayRows: any[][] = [
    [
      { text: 'Task #', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Deliverable Title', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Assigned Leads', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Target Date', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Delay Days', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Root Cause & Severity', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'PMO Mitigation Action', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
    ]
  ];

  const topDelays = (delayedTasks.length > 0 ? delayedTasks : tasks.slice(0, 6)).slice(0, 6);
  topDelays.forEach((t, idx) => {
    const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayCount = deadlineInfo.category === 'OVERDUE' 
      ? Math.abs(deadlineInfo.daysDiff || 0) 
      : (t.delayDays || 0);

    const rowBg = idx % 2 === 0 ? COLOR_WHITE : 'F1F5F9';

    delayRows.push([
      { text: `#${t.sNo}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_PRIMARY } },
      { text: t.deliverable || t.title, options: { fontSize: 9.5, fill: { color: rowBg }, bold: true, color: COLOR_TEXT_DARK } },
      { text: `${t.backendOwner} / ${t.frontendOwner}`, options: { fontSize: 9.5, fill: { color: rowBg }, color: '334155' } },
      { text: t.endDate, options: { fontSize: 9.5, fill: { color: rowBg }, align: 'center', color: '475569' } },
      { text: `${delayCount} days`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: delayCount > 0 ? 'DC2626' : COLOR_GOLD } },
      { text: t.delayReason || 'API interface alignment / BRD requirements finalization', options: { fontSize: 9, fill: { color: rowBg }, color: '334155' } },
      { text: t.mitigationPlan || t.remark || 'Active engineering sync & daily PMO follow-up', options: { fontSize: 9, fill: { color: rowBg }, color: '334155' } },
    ]);
  });

  slide2.addTable(delayRows, {
    x: 1.0, y: 1.6, w: 14.0,
    rowH: [0.45, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95],
    border: { pt: 0.5, color: COLOR_BORDER_LIGHT },
    colW: [1.0, 3.2, 2.0, 1.3, 1.3, 2.6, 2.6]
  });

  const finalName = fileName || `Delay_Log_Root_Cause_Deck_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// 6. WORKLOAD & BURNOUT PPT EXPORT
// -------------------------------------------------------------
export async function exportWorkloadBurnoutPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Engineering Workload & Burnout Capacity Radar');

  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Resource Health',
    'Workload Distribution & Burnout Risk Radar',
    'Capacity Utilization, Lead Concurrency & Engineering Bandwidth Balancing',
    asOfDate,
    reportGen
  );

  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide2, 'Engineering Squad Capacity', 'Individual Lead Concurrency & Burnout Risk Levels');

  const teamRoster = [
    { name: 'Khalid', role: 'Backend Lead', dept: 'Core Architecture', targetCap: 4 },
    { name: 'Yohannes Y.', role: 'Backend Lead', dept: 'Credit & Appraisal', targetCap: 4 },
    { name: 'Dewa', role: 'Frontend Lead', dept: 'Portal & UI Suite', targetCap: 4 },
    { name: 'Eyob', role: 'Backend Lead', dept: 'Post-Disbursement', targetCap: 4 },
    { name: 'Simachew', role: 'Frontend Lead', dept: 'Post-Disbursement UI', targetCap: 4 },
    { name: 'Yohannes S.', role: 'Backend Lead', dept: 'Feasibility & Appeals', targetCap: 4 },
  ];

  const workloadRows: any[][] = [
    [
      { text: 'Engineer Lead', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Squad / Domain', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10 } },
      { text: 'Total Assigned', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Active Tasks', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Target Cap', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Utilization %', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Delayed Items', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
      { text: 'Burnout Risk Level', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 10, align: 'center' } },
    ]
  ];

  teamRoster.forEach((m, idx) => {
    const assigned = tasks.filter(t => t.backendOwner.includes(m.name) || t.frontendOwner.includes(m.name));
    const active = assigned.filter(t => t.status === 'In Progress' || t.status === 'Partial').length;
    const delayed = assigned.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;

    const utilization = Math.round((active / m.targetCap) * 100);
    const burnoutRisk = active >= 5 || delayed >= 2 ? 'CRITICAL RISK' : active >= 3 ? 'ELEVATED' : 'BALANCED';
    const rowBg = idx % 2 === 0 ? COLOR_WHITE : 'F1F5F9';

    workloadRows.push([
      { text: m.name, options: { fontSize: 10, bold: true, fill: { color: rowBg }, color: COLOR_TEXT_DARK } },
      { text: m.dept, options: { fontSize: 9.5, fill: { color: rowBg }, color: '334155' } },
      { text: `${assigned.length}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_PRIMARY } },
      { text: `${active}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_GOLD } },
      { text: `${m.targetCap}`, options: { fontSize: 10, fill: { color: rowBg }, align: 'center', color: '475569' } },
      { text: `${utilization}%`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: utilization > 100 ? 'DC2626' : COLOR_PRIMARY } },
      { text: `${delayed}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: delayed > 0 ? 'DC2626' : '64748B' } },
      { text: burnoutRisk, options: { fontSize: 9.5, bold: true, fill: { color: rowBg }, align: 'center', color: burnoutRisk === 'CRITICAL RISK' ? 'DC2626' : burnoutRisk === 'ELEVATED' ? COLOR_GOLD : '16A34A' } },
    ]);
  });

  slide2.addTable(workloadRows, {
    x: 1.0, y: 1.6, w: 14.0,
    rowH: [0.45, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95],
    border: { pt: 0.5, color: COLOR_BORDER_LIGHT },
    colW: [2.0, 2.5, 1.4, 1.4, 1.4, 1.5, 1.4, 2.4]
  });

  const finalName = fileName || `Workload_Burnout_Deck_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// MASTER ALL-IN-ONE EXECUTIVE PRESENTATION PPT
// -------------------------------------------------------------
export async function exportExecutivePresentation(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Project Action Plan - Executive Status Review');

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const partial = tasks.filter(t => t.status === 'Partial').length;
  const notStarted = tasks.filter(t => t.status === 'Not Started').length;
  
  const delayedTasks = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'OVERDUE' || t.status === 'Delayed' || (t.delayDays && t.delayDays > 0);
  });

  const overallProgress = Math.round(
    tasks.reduce((acc, curr) => acc + (curr.percentComplete || (curr.status === 'Completed' ? 100 : curr.status === 'Partial' ? 30 : curr.status === 'In Progress' ? 50 : 0)), 0) / (total || 1)
  );

  // SLIDE 1: Cover
  await addCoverSlide(
    pptx,
    'Wholesale Banking PMO • Loan Origination System',
    'Project Action Plan & Executive Review',
    'Steering Committee Review & Operational Action Tracking',
    asOfDate,
    reportGen
  );

  // SLIDE 2: Executive Scorecard
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide2, 'Executive Delivery Scorecard & Portfolio Health', 'Program Velocity & Completion Metrics');

  const kpiCards = [
    { label: 'Overall Completion', val: `${overallProgress}%`, color: COLOR_PRIMARY, sub: `${completed} of ${total} Deliverables Done`, border: COLOR_PRIMARY },
    { label: 'Active In Progress', val: `${inProgress + partial}`, color: COLOR_GOLD, sub: `${inProgress} Active, ${partial} Partial`, border: COLOR_GOLD },
    { label: 'Delayed / Critical', val: `${delayedTasks.length}`, color: delayedTasks.length > 0 ? 'DC2626' : '16A34A', sub: `${delayedTasks.length} Require SteerCo Attention`, border: COLOR_ORCHID },
    { label: 'Pending Start', val: `${notStarted}`, color: COLOR_TEXT_MUTED, sub: 'Scheduled for Next Stage Gates', border: COLOR_BORDER_LIGHT },
  ];

  kpiCards.forEach((kpi, idx) => {
    const xPos = 1.0 + idx * 3.6;
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: 3.3, h: 2.1,
      fill: { color: COLOR_WHITE },
      line: { color: kpi.border, width: 1.5 }
    });
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos + 0.3, y: 1.8, w: 0.8, h: 0.08,
      fill: { color: kpi.color }
    });
    slide2.addText(kpi.val, {
      x: xPos + 0.3, y: 2.0, w: 2.7, h: 0.8,
      fontSize: 34, color: kpi.color, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(kpi.label, {
      x: xPos + 0.3, y: 2.8, w: 2.7, h: 0.4,
      fontSize: 13, color: COLOR_TEXT_DARK, bold: true, fontFace: 'Calibri'
    });
    slide2.addText(kpi.sub, {
      x: xPos + 0.3, y: 3.2, w: 2.7, h: 0.35,
      fontSize: 10.5, color: COLOR_TEXT_MUTED, fontFace: 'Calibri'
    });
  });

  // Strategic Takeaways Container
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 4.0, w: 14.0, h: 4.4,
    fill: { color: COLOR_WHITE },
    line: { color: COLOR_BORDER_LIGHT, width: 1 }
  });
  slide2.addShape(pptx.ShapeType.rect, {
    x: 1.0, y: 4.0, w: 14.0, h: 0.5,
    fill: { color: COLOR_PRIMARY }
  });
  slide2.addText('EXECUTIVE STEERING COMMITTEE TAKEAWAYS & CRITICAL OBSERVATIONS', {
    x: 1.3, y: 4.05, w: 13.4, h: 0.4,
    fontSize: 12, color: COLOR_WHITE, bold: true, fontFace: 'Calibri'
  });

  const bulletPoints = [
    { title: 'Core Security & Permission Matrix (Lead: Khalid Mohammed):', text: 'Dynamic maker-checker permission mapping and route guards are active with mock integration tests scheduled.' },
    { title: 'Regulatory External Interface Gate (Lead: Dewan Asefa & Yohannes Yilma):', text: 'Credit Information Service (Task #12) requires National Bank API contract finalization to prevent downstream approval blocking.' },
    { title: 'Credit Committee Decision Framework (Lead: Khalid Mohammed):', text: 'Weighted voting matrix, quorum thresholds, and 8 DLL outcomes established for multi-branch lending hierarchies.' },
    { title: 'Valuation & Real Estate Appraisal (Lead: Amanuel Getachew & Raeye Daniel):', text: 'Civil and agricultural valuation workflows are active, ensuring physical collateral checks tie into underwriting ratios.' },
    { title: 'Governance Enforcement:', text: 'Automated daily reminders active to samsontsegayef@gmail.com and WhatsApp samsontsegaye26 across all engineering leads to safeguard target milestones.' }
  ];

  bulletPoints.forEach((bp, i) => {
    const yPos = 4.7 + i * 0.68;
    slide2.addShape(pptx.ShapeType.rect, {
      x: 1.3, y: yPos + 0.05, w: 0.12, h: 0.35,
      fill: { color: i % 2 === 0 ? COLOR_GOLD : COLOR_ORCHID }
    });
    slide2.addText(`${bp.title} ${bp.text}`, {
      x: 1.6, y: yPos, w: 13.0, h: 0.55,
      fontSize: 11.5, color: '334155', fontFace: 'Calibri'
    });
  });

  // SLIDE 3: Critical Delays
  const slide3 = pptx.addSlide();
  slide3.background = { color: COLOR_BG_LIGHT };
  addSlideHeader(slide3, 'Risk & Bottleneck Remediation', 'Critical Delays & Actionable Escalation Matrix');

  const delayRows: any[][] = [
    [
      { text: 'Task #', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Deliverable Title', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11 } },
      { text: 'Assigned Leads', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11 } },
      { text: 'Target Date', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Delay Horizon', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Status', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11, align: 'center' } },
      { text: 'Remediation & SteerCo Action Plan', options: { bold: true, fill: { color: COLOR_PRIMARY }, color: COLOR_WHITE, fontSize: 11 } },
    ]
  ];

  const topDelays = (delayedTasks.length > 0 ? delayedTasks : tasks.slice(0, 6)).slice(0, 6);
  topDelays.forEach((t, idx) => {
    const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    const delayCount = deadlineInfo.category === 'OVERDUE' 
      ? Math.abs(deadlineInfo.daysDiff || 0) 
      : (t.delayDays || 0);

    const rowBg = idx % 2 === 0 ? COLOR_WHITE : 'F1F5F9';
    delayRows.push([
      { text: `#${t.sNo}`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: COLOR_PRIMARY } },
      { text: t.deliverable || t.title, options: { fontSize: 10, fill: { color: rowBg }, bold: true, color: COLOR_TEXT_DARK } },
      { text: `${t.backendOwner} / ${t.frontendOwner}`, options: { fontSize: 9.5, fill: { color: rowBg }, color: '334155' } },
      { text: t.endDate, options: { fontSize: 9.5, fill: { color: rowBg }, align: 'center', color: '475569' } },
      { text: `${delayCount} days`, options: { fontSize: 10, bold: true, fill: { color: rowBg }, align: 'center', color: delayCount > 0 ? 'DC2626' : COLOR_GOLD } },
      { text: t.status, options: { fontSize: 9.5, bold: true, fill: { color: rowBg }, align: 'center', color: t.status === 'Completed' ? '16A34A' : COLOR_PRIMARY } },
      { text: t.mitigationPlan || t.remark || 'Active engineering sync & daily PMO follow-up', options: { fontSize: 9.5, fill: { color: rowBg }, color: '334155' } },
    ]);
  });

  slide3.addTable(delayRows, {
    x: 1.0, y: 1.6, w: 14.0,
    rowH: [0.45, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95],
    border: { pt: 0.5, color: COLOR_BORDER_LIGHT },
    colW: [1.0, 3.4, 2.1, 1.3, 1.4, 1.4, 3.4]
  });

  const finalName = fileName || `Action_Plan_Executive_Deck_16x9_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

// -------------------------------------------------------------
// OFFICIAL CBE DAILY STATUS REPORT PRESENTATION (MATCHING ATTACHED PPT FORMAT)
// -------------------------------------------------------------
export async function exportCbeDailyReportStatusPpt(tasks: TaskItem[], asOfDate: string, fileName?: string) {
  const { pptx, reportGen } = createBasePpt('Daily Status Report - Wholesale & Credit Digitization');

  const CBE_PURPLE = '581845';      // Deep rich purple (#581845)
  const CBE_PURPLE_HEADER = '701A75'; // Table banner purple (#701A75)
  const CBE_PURPLE_LIGHT = 'FAF5FF';  // Row alternating light lavender
  const CBE_GOLD = 'B38D34';         // CBE Gold / Bronze (#B38D34)
  const CBE_GOLD_LIGHT = 'FEF9C3';
  const CBE_BORDER = 'E2E8F0';

  // Format date display (e.g. "Aug 18, 2026")
  let displayCoverDate = asOfDate;
  try {
    const parts = asOfDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d.getTime())) {
        displayCoverDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
  } catch {
    displayCoverDate = asOfDate;
  }

  // =========================================================================
  // HELPER: BUILD A DAILY REPORT STATUS SLIDE (EXACT MATCH TO ATTACHED SLIDE 2)
  // =========================================================================
  const buildDailyReportSlide = (
    slideTasks: TaskItem[],
    batchTitle: string,
    currentMvpText: string = 'MVP3',
    slideNum: number,
    totalTaskSlides: number
  ) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FDFBF7' }; // Soft warm light background

    // 1. TOP HEADER METADATA CARD (Matching exact wireframe of Slide 2)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.4, w: 14.4, h: 1.45,
      fill: { color: 'FFFFFF' },
      line: { color: CBE_GOLD, width: 1.5 }
    });

    // Initiative Name & Current MVP (Top Row of Header Card)
    slide.addText(`Initiative Name: Wholesale and Credit digitization`, {
      x: 0.95, y: 0.45, w: 9.0, h: 0.35,
      fontSize: 12, color: CBE_PURPLE_HEADER, bold: true, fontFace: 'Calibri'
    });
    slide.addText(`Current MVP: ${currentMvpText} (${batchTitle})`, {
      x: 10.0, y: 0.45, w: 5.0, h: 0.35,
      fontSize: 12, color: '0F172A', bold: true, align: 'right', fontFace: 'Calibri'
    });

    // Sub-Box 1 (Left Meta Box)
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.95, y: 0.85, w: 6.8, h: 0.9,
      fill: { color: 'FAF5FF' },
      line: { color: 'E2D4B7', width: 0.75 }
    });
    slide.addText('Received at: Jan 03, 2026', {
      x: 1.05, y: 0.9, w: 3.2, h: 0.35,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });
    slide.addText('Delivery Lead: Technology Sector', {
      x: 4.25, y: 0.9, w: 3.4, h: 0.35,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });
    slide.addText('Started at: Jun 15, 2026', {
      x: 1.05, y: 1.3, w: 3.2, h: 0.35,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });
    slide.addText('Product Owner: Wholesale & Credit', {
      x: 4.25, y: 1.3, w: 3.4, h: 0.35,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });

    // Sub-Box 2 (Right Meta Box)
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.0, y: 0.85, w: 7.05, h: 0.9,
      fill: { color: 'FAF5FF' },
      line: { color: 'E2D4B7', width: 0.75 }
    });
    slide.addText('Planned Status: On Track', {
      x: 8.1, y: 0.9, w: 3.3, h: 0.35,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });
    slide.addText('Lead Time: 120 Days', {
      x: 11.6, y: 0.9, w: 3.3, h: 0.35,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });
    slide.addText('Current Status: In Progress', {
      x: 8.1, y: 1.25, w: 3.3, h: 0.25,
      fontSize: 9.5, color: '16A34A', bold: true, fontFace: 'Calibri'
    });
    slide.addText('Cycle Time: 65 Days', {
      x: 11.6, y: 1.25, w: 3.3, h: 0.25,
      fontSize: 9.5, color: '1E293B', bold: true, fontFace: 'Calibri'
    });
    slide.addText(`Cut-off Date: ${asOfDate}`, {
      x: 8.1, y: 1.5, w: 3.3, h: 0.22,
      fontSize: 9, color: CBE_PURPLE_HEADER, bold: true, fontFace: 'Calibri'
    });

    // 2. MVP DESCRIPTIONS TABLE (Exact match to Slide 2 top table)
    const mvpTableRows: any[][] = [
      [
        { text: 'MVPs', options: { bold: true, fill: { color: CBE_PURPLE_HEADER }, color: 'FFFFFF', fontSize: 9.5, align: 'center' } },
        { text: 'MVP Descriptions', options: { bold: true, fill: { color: CBE_PURPLE_HEADER }, color: 'FFFFFF', fontSize: 9.5 } },
        { text: 'Status Description', options: { bold: true, fill: { color: CBE_PURPLE_HEADER }, color: 'FFFFFF', fontSize: 9.5 } },
      ],
      [
        { text: 'MVP1', options: { fontSize: 8.5, bold: true, fill: { color: 'F3E8FF' }, align: 'center', color: CBE_PURPLE_HEADER } },
        { text: 'Customer Profile Registration & KYC Intake', options: { fontSize: 8.5, fill: { color: 'F3E8FF' }, color: '1E293B' } },
        { text: 'Completed', options: { fontSize: 8.5, bold: true, fill: { color: 'F3E8FF' }, color: '16A34A' } },
      ],
      [
        { text: 'MVP2', options: { fontSize: 8.5, bold: true, fill: { color: 'FFFFFF' }, align: 'center', color: CBE_PURPLE_HEADER } },
        { text: 'Onboarding Customer & CRM Integration Gateway', options: { fontSize: 8.5, fill: { color: 'FFFFFF' }, color: '1E293B' } },
        { text: 'Completed', options: { fontSize: 8.5, bold: true, fill: { color: 'FFFFFF' }, color: '16A34A' } },
      ],
      [
        { text: 'MVP3', options: { fontSize: 8.5, bold: true, fill: { color: 'F3E8FF' }, align: 'center', color: CBE_PURPLE_HEADER } },
        { text: 'Loan System Origination & Credit Underwriting Pipeline', options: { fontSize: 8.5, fill: { color: 'F3E8FF' }, color: '1E293B' } },
        { text: 'In Progress (Active 44 Workstream Sprint)', options: { fontSize: 8.5, bold: true, fill: { color: 'F3E8FF' }, color: CBE_PURPLE_HEADER } },
      ]
    ];

    slide.addTable(mvpTableRows, {
      x: 0.8, y: 1.95, w: 14.4,
      rowH: [0.32, 0.28, 0.28, 0.28],
      border: { pt: 0.5, color: 'D8B4FE' },
      colW: [1.6, 7.8, 5.0]
    });

    // 3. ACTION ITEMS TABLE (Exact match to Slide 2 bottom table with ALL listed tasks)
    const actionRows: any[][] = [
      // Banner Spanning Action Items
      [
        { 
          text: `Action Items  (Section ${slideNum} of ${totalTaskSlides} • Tasks #${slideTasks[0]?.sNo || 1} to #${slideTasks[slideTasks.length - 1]?.sNo || 44})`, 
          options: { colspan: 6, bold: true, fill: { color: CBE_PURPLE_HEADER }, color: 'FFFFFF', fontSize: 10.5, align: 'center' } 
        }
      ],
      // Column Sub-headers
      [
        { text: 'Action Items', options: { bold: true, fill: { color: '86198F' }, color: 'FFFFFF', fontSize: 9.5 } },
        { text: 'Owner', options: { bold: true, fill: { color: '86198F' }, color: 'FFFFFF', fontSize: 9.5 } },
        { text: 'Planned Start', options: { bold: true, fill: { color: '86198F' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' } },
        { text: 'Planned End', options: { bold: true, fill: { color: '86198F' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' } },
        { text: 'Status', options: { bold: true, fill: { color: '86198F' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' } },
        { text: 'Reason if Delayed', options: { bold: true, fill: { color: '86198F' }, color: 'FFFFFF', fontSize: 9.5 } },
      ]
    ];

    slideTasks.forEach((t, idx) => {
      const rowBg = idx % 2 === 0 ? 'FFFFFF' : 'FAF5FF';
      const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      const isOverdue = deadlineInfo.category === 'OVERDUE' || t.status === 'Delayed';
      const delayReasonText = isOverdue
        ? (t.delayReason || t.mitigationPlan || t.remark || 'Target delivery horizon extended')
        : (t.status === 'Completed' ? 'Completed & verified' : (t.remark || 'On track with sprint milestones'));

      const statusColor = t.status === 'Completed' 
        ? '16A34A' 
        : isOverdue 
        ? 'DC2626' 
        : t.status === 'In Progress' 
        ? CBE_PURPLE_HEADER 
        : '64748B';

      actionRows.push([
        { text: `${t.sNo}. ${t.deliverable || t.title}`, options: { fontSize: 8.5, bold: true, fill: { color: rowBg }, color: '0F172A' } },
        { text: `${t.backendOwner || '-'} / ${t.frontendOwner || '-'}`, options: { fontSize: 8, fill: { color: rowBg }, color: '334155' } },
        { text: t.startDate || '15-06-2026', options: { fontSize: 8, fill: { color: rowBg }, align: 'center', color: '475569' } },
        { text: t.endDate || '18-08-2026', options: { fontSize: 8, fill: { color: rowBg }, align: 'center', color: isOverdue ? 'DC2626' : '475569', bold: isOverdue } },
        { text: t.status, options: { fontSize: 8.5, bold: true, fill: { color: rowBg }, align: 'center', color: statusColor } },
        { text: delayReasonText, options: { fontSize: 7.8, fill: { color: rowBg }, color: isOverdue ? '991B1B' : '475569' } },
      ]);
    });

    slide.addTable(actionRows, {
      x: 0.8, y: 3.25, w: 14.4,
      rowH: [0.32, 0.3, ...slideTasks.map(() => 0.44)],
      border: { pt: 0.5, color: 'D8B4FE' },
      colW: [4.9, 2.3, 1.4, 1.4, 1.6, 2.8]
    });

    // Slide footer
    slide.addText(`Commercial Bank of Ethiopia • Digital Factory Division • Daily Status Report • Generated: ${reportGen.displayDate}`, {
      x: 0.8, y: 8.6, w: 14.4, h: 0.3,
      fontSize: 8.5, color: '64748B', fontFace: 'Calibri'
    });
  };

  // =========================================================================
  // SLIDES 2 to 5: PARTITION ALL 44 TASKS ACROSS CLEAN DEDICATED SLIDES
  // =========================================================================
  const sortedTasks = [...tasks].sort((a, b) => a.sNo - b.sNo);
  const tasksPerSlide = 11;
  const totalSlidesNeeded = Math.ceil(sortedTasks.length / tasksPerSlide);

  const batchNames = [
    'Foundation & Auth Security',
    'External Interfaces & Committee Engine',
    'Collateral Valuation & Underwriting',
    'Disbursement, Documents & Governance'
  ];

  for (let i = 0; i < totalSlidesNeeded; i++) {
    const chunk = sortedTasks.slice(i * tasksPerSlide, (i + 1) * tasksPerSlide);
    const batchName = batchNames[i] || `Workstream Batch ${i + 1}`;
    buildDailyReportSlide(chunk, batchName, 'MVP3', i + 1, totalSlidesNeeded);
  }

  // =========================================================================
  // SLIDE 6: CLOSING SLIDE (EXACT MATCH TO ATTACHED SLIDE 3)
  // =========================================================================
  const slideClosing = pptx.addSlide();
  slideClosing.background = { color: 'FDFBF7' };

  // Left Side: 3D Gold "Thank You!" and wave motif
  slideClosing.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 7.5, h: 9.0,
    fill: { color: 'FFFFFF' }
  });

  // Large 3D Styled Gold "Thank You!" text
  slideClosing.addText('Thank You!', {
    x: 0.6, y: 3.2, w: 6.3, h: 2.2,
    fontSize: 64, color: CBE_GOLD, bold: true, fontFace: 'Calibri'
  });

  // Bottom waves on Left
  slideClosing.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.2, w: 7.5, h: 0.35,
    fill: { color: CBE_GOLD }
  });
  slideClosing.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.55, w: 7.5, h: 1.45,
    fill: { color: '581845' }
  });

  // Right Side: 90 Days Challenge & Digital Factory Excellence Banner
  slideClosing.addShape(pptx.ShapeType.rect, {
    x: 7.5, y: 0, w: 8.5, h: 9.0,
    fill: { color: '3B073F' }
  });

  // Top Announcement Banner
  slideClosing.addText('ANNOUNCING APRIL 01 – JUNE 30, 2026', {
    x: 7.8, y: 0.4, w: 7.9, h: 0.4,
    fontSize: 12, color: 'FDE047', bold: true, align: 'center', fontFace: 'Calibri'
  });

  // 90 DAYS CHALLENGE Title Box
  slideClosing.addShape(pptx.ShapeType.roundRect, {
    x: 8.8, y: 0.9, w: 5.9, h: 1.5,
    fill: { color: '581845' },
    line: { color: CBE_GOLD, width: 2 }
  });
  slideClosing.addText('90', {
    x: 8.8, y: 0.95, w: 5.9, h: 0.8,
    fontSize: 48, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Calibri'
  });
  slideClosing.addText('DAYS CHALLENGE', {
    x: 8.8, y: 1.75, w: 5.9, h: 0.4,
    fontSize: 16, color: CBE_GOLD, bold: true, align: 'center', fontFace: 'Calibri'
  });

  slideClosing.addText('DRIVING DIGITAL PRODUCT DELIVERY EXCELLENCE', {
    x: 7.8, y: 2.55, w: 7.9, h: 0.35,
    fontSize: 11, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Calibri'
  });

  slideClosing.addText('SPEED  •  DISCIPLINE  •  INNOVATION  •  EXECUTION', {
    x: 7.8, y: 2.95, w: 7.9, h: 0.3,
    fontSize: 10, color: COLOR_ORCHID, bold: true, align: 'center', fontFace: 'Calibri'
  });

  // 4 Execution Pillars Badges
  const pillars = [
    { title: 'FAST-TRACK DELIVERY', icon: '⚡' },
    { title: 'ENHANCED COLLABORATION', icon: '🤝' },
    { title: 'REMOVE BOTTLENECKS', icon: '🧩' },
    { title: 'READY FOR DEPLOYMENT', icon: '🛡️' }
  ];

  pillars.forEach((p, idx) => {
    const xP = 8.0 + (idx % 2) * 3.8;
    const yP = 3.4 + Math.floor(idx / 2) * 0.95;
    slideClosing.addShape(pptx.ShapeType.roundRect, {
      x: xP, y: yP, w: 3.5, h: 0.8,
      fill: { color: '4A0E4E' },
      line: { color: CBE_GOLD, width: 1 }
    });
    slideClosing.addText(`${p.icon}  ${p.title}`, {
      x: xP, y: yP, w: 3.5, h: 0.8,
      fontSize: 9.5, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });
  });

  // Bottom Milestones on Right Box
  slideClosing.addText('300 DAYS OF DIGITAL FACTORY SUCCESS', {
    x: 7.8, y: 5.5, w: 7.9, h: 0.35,
    fontSize: 11.5, color: CBE_GOLD, bold: true, align: 'center', fontFace: 'Calibri'
  });
  slideClosing.addText('GRAND EVENT COMING AUGUST 2026', {
    x: 7.8, y: 5.85, w: 7.9, h: 0.3,
    fontSize: 10, color: 'E2E8F0', align: 'center', fontFace: 'Calibri'
  });

  slideClosing.addText('90 DAYS TO EXECUTE', {
    x: 7.8, y: 6.3, w: 7.9, h: 0.5,
    fontSize: 22, color: CBE_GOLD, bold: true, align: 'center', fontFace: 'Calibri'
  });

  slideClosing.addText('TRANSFORM IDEAS INTO IMPACT', {
    x: 7.8, y: 6.95, w: 7.9, h: 0.35,
    fontSize: 12, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Calibri'
  });
  slideClosing.addText('TOGETHER, WE DELIVER RESULTS!', {
    x: 7.8, y: 7.3, w: 7.9, h: 0.3,
    fontSize: 10.5, color: COLOR_ORCHID, bold: true, align: 'center', fontFace: 'Calibri'
  });

  const finalName = fileName || `CBE_Daily_Status_Report_44_Tasks_${asOfDate.replace(/[^0-9a-zA-Z]/g, '_')}_${reportGen.fileTimestamp}.pptx`;
  await pptx.writeFile({ fileName: finalName });
}

