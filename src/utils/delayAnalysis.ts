import { TaskItem } from '../types';
import { getTaskDeadlineStatus, calculateDaysDiff, parseDateString } from './dateUtils';

export interface ExpectedDelayTask extends TaskItem {
  riskProbability: 'Critical' | 'High' | 'Medium';
  riskReasons: string[];
  daysRemaining: number | null;
  upstreamBlockers: string[];
}

export interface DelayedTaskDetail extends TaskItem {
  effectiveDelayDays: number;
  isOverdue: boolean;
}

export interface RiskAreaSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: 'Critical' | 'High' | 'Elevated' | 'Controlled';
  color: string;
  tasks: TaskItem[];
  delayedTasks: TaskItem[];
  expectedTasks: ExpectedDelayTask[];
  averageProgress: number;
  keyRiskDrivers: string[];
  mitigationOwners: string[];
  blastRadiusCount: number;
  steerCoRecommendation: string;
}

export function getDelayedTasks(tasks: TaskItem[], asOfDate: string): DelayedTaskDetail[] {
  return tasks
    .filter(t => {
      if (t.status === 'Completed') return false;
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      const isOverdue = info.category === 'OVERDUE';
      const hasDelayDays = typeof t.delayDays === 'number' && t.delayDays > 0;
      const isExplicitDelay = t.status === 'Delayed' || t.status === 'No BRD' || t.status === 'Blocked';
      return isOverdue || hasDelayDays || isExplicitDelay;
    })
    .map(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      const daysOverdue = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : 0;
      const effectiveDelayDays = Math.max(daysOverdue, t.delayDays || 0, 1);
      return {
        ...t,
        effectiveDelayDays,
        isOverdue: info.category === 'OVERDUE',
      };
    })
    .sort((a, b) => b.effectiveDelayDays - a.effectiveDelayDays);
}

export function getExpectedToDelayTasks(tasks: TaskItem[], asOfDate: string): ExpectedDelayTask[] {
  const delayedList = getDelayedTasks(tasks, asOfDate);
  const delayedIdSet = new Set(delayedList.map(t => t.id));
  const delayedSNoSet = new Set(delayedList.map(t => t.sNo));

  const expected: ExpectedDelayTask[] = [];

  for (const t of tasks) {
    // Skip if already in delayed group or completed
    if (delayedIdSet.has(t.id) || t.status === 'Completed') {
      continue;
    }

    const daysRemaining = calculateDaysDiff(t.endDate, asOfDate);
    const pct = t.percentComplete ?? 0;
    const priority = t.priority || 'Medium';
    const riskReasons: string[] = [];
    const upstreamBlockers: string[] = [];

    // Check upstream dependency linkage
    const depStr = t.dependency || '';
    if (depStr && depStr !== '-') {
      for (const delayedTask of delayedList) {
        if (
          depStr.toLowerCase().includes(delayedTask.title.toLowerCase().slice(0, 12)) ||
          depStr.toLowerCase().includes(`task ${delayedTask.sNo}`) ||
          depStr.toLowerCase().includes(`#${delayedTask.sNo}`)
        ) {
          upstreamBlockers.push(`#${delayedTask.sNo}: ${delayedTask.title}`);
          riskReasons.push(`Upstream dependency #${delayedTask.sNo} is currently delayed (+${delayedTask.effectiveDelayDays}d)`);
        }
      }
    }

    // Proximity to deadline vs. low progress
    if (daysRemaining !== null) {
      if (daysRemaining <= 3 && pct < 80) {
        riskReasons.push(`Critical deadline proximity: due in ${daysRemaining} day(s) with only ${pct}% completed`);
      } else if (daysRemaining <= 7 && pct < 35) {
        riskReasons.push(`Imminent deadline: due in ${daysRemaining} day(s) with only ${pct}% completed`);
      } else if (daysRemaining <= 14 && pct < 50) {
        riskReasons.push(`Sprint slippage risk: due in ${daysRemaining} day(s) with ${pct}% completed`);
      }

      if (t.status === 'Not Started' && daysRemaining <= 10) {
        riskReasons.push(`Task not yet initiated with deadline approaching in ${daysRemaining} days`);
      }
    } else if (t.endDate === 'TBD' || !t.endDate) {
      riskReasons.push('Target delivery date is undefined (TBD) due to pending specifications');
    }

    // Past start date with minimal progress
    const daysSinceStart = t.startDate ? calculateDaysDiff(asOfDate, t.startDate) : null;
    if (daysSinceStart !== null && daysSinceStart > 5 && pct < 20 && (priority === 'Critical' || priority === 'High')) {
      riskReasons.push(`${priority} priority deliverable past planned start window with minimal progress (${pct}%)`);
    }

    if (riskReasons.length > 0) {
      let riskProbability: 'Critical' | 'High' | 'Medium' = 'Medium';
      if (
        (daysRemaining !== null && daysRemaining <= 5 && pct < 30) ||
        upstreamBlockers.length > 0 ||
        priority === 'Critical'
      ) {
        riskProbability = 'Critical';
      } else if (
        (daysRemaining !== null && daysRemaining <= 10 && pct < 45) ||
        priority === 'High'
      ) {
        riskProbability = 'High';
      }

      expected.push({
        ...t,
        riskProbability,
        riskReasons,
        daysRemaining,
        upstreamBlockers,
      });
    }
  }

  // Sort by risk priority then days remaining
  return expected.sort((a, b) => {
    const pWeight = { Critical: 3, High: 2, Medium: 1 };
    if (pWeight[b.riskProbability] !== pWeight[a.riskProbability]) {
      return pWeight[b.riskProbability] - pWeight[a.riskProbability];
    }
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
  });
}

// 8 Functional Wholesale Banking Risk Areas
const RISK_AREA_DEFINITIONS = [
  {
    id: 'ra_user_mgmt_rbac',
    title: 'User Management & Dynamic Access Control (RBAC)',
    category: 'Identity & Security Infrastructure',
    description: 'Dynamic user identity framework, token validation, and frontend permission route barriers.',
    sNos: [3, 4, 5, 6],
    steerCoRecommendation: 'Prioritize frontend token validation to unblock downstream committee action screens.',
  },
  {
    id: 'ra_regulatory_nbe',
    title: 'National Bank of Ethiopia (NBE) & Credit Bureau Integration',
    category: 'Regulatory & Statutory Compliance',
    description: 'Statutory credit check interface, NBE regulatory data exchange, and credit compliance reporting.',
    sNos: [12, 13],
    steerCoRecommendation: 'Engage central regulatory interface working group to freeze API response schemas.',
  },
  {
    id: 'ra_crm_appraisal_committee',
    title: 'Core Workflow Pipeline: CRM, Appraisal & Committee Stages',
    category: 'Customer Onboarding Lifecycle',
    description: 'Loan Application Form (LAF), Due Diligence Report (DDR), Case File Viewer, and Committee Approvals.',
    sNos: [7, 8, 9, 10, 11],
    steerCoRecommendation: 'Ensure Appraisal Report annex upload stability before SteerCo pilot phase.',
  },
  {
    id: 'ra_dll_rule_engine',
    title: 'DLL Rule Engine & Pre-Appraisal Feasibility Scoring',
    category: 'Credit Risk Scoring & Policy Algorithms',
    description: 'Dynamic Lending Limit (DLL) algorithmic calculation matrix and early feasibility gating.',
    sNos: [14, 15],
    steerCoRecommendation: 'Review risk threshold parameters with Credit Risk committee to avoid loan miscalculation.',
  },
  {
    id: 'ra_collateral_valuation',
    title: 'Collateral Valuation, Site Inspection & Title Verification',
    category: 'Collateral Operations & Asset Security',
    description: 'Physical property inspection workflow, valuation certificate generation, and legal title clearance.',
    sNos: [16, 17, 18, 19, 20, 21, 22, 23],
    steerCoRecommendation: 'Standardize valuation report upload format to minimize manual field inspection backlog.',
  },
  {
    id: 'ra_post_approval_disbursement',
    title: 'Post-Approval Requests & Post-Disbursement Workflows',
    category: 'Post-Sanction Execution & Monitoring',
    description: 'Condition Precedent checks, loan sanction tickets, drawdown approvals, and covenant tracking.',
    sNos: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
    steerCoRecommendation: 'Align core banking payment gateway integration for automated disbursement execution.',
  },
  {
    id: 'ra_legal_contracting',
    title: 'Legal Opinion Module & 60-Day Contract Execution Governance',
    category: 'Legal Enforcement & Documentation',
    description: 'Legal opinion issuance workflow, facility agreement signing verification, and security creation.',
    sNos: [34, 35, 36, 37, 38, 39, 40, 44],
    steerCoRecommendation: 'Fast-track Legal Department BRD sign-off for Task #44 (Legal Opinion) to prevent closing delays.',
  },
  {
    id: 'ra_testing_hypercare',
    title: 'Regression Testing, Quality Assurance & Hypercare Support',
    category: 'Release Readiness & Operational Resilience',
    description: 'End-to-end regression validation, production hypercare support, and BRD foundation alignment.',
    sNos: [1, 2, 41, 42, 43],
    steerCoRecommendation: 'Establish dedicated defect triage desk during user acceptance testing (UAT).',
  },
];

export function getRiskAreas(tasks: TaskItem[], asOfDate: string): RiskAreaSummary[] {
  const delayedList = getDelayedTasks(tasks, asOfDate);
  const expectedList = getExpectedToDelayTasks(tasks, asOfDate);

  const taskMap = new Map<number, TaskItem>();
  tasks.forEach(t => taskMap.set(t.sNo, t));

  return RISK_AREA_DEFINITIONS.map(def => {
    const areaTasks = def.sNos.map(sNo => taskMap.get(sNo)).filter(Boolean) as TaskItem[];
    const sNoSet = new Set(def.sNos);

    const areaDelayed = delayedList.filter(t => sNoSet.has(t.sNo));
    const areaExpected = expectedList.filter(t => sNoSet.has(t.sNo));

    const avgProgress = areaTasks.length > 0 
      ? Math.round(areaTasks.reduce((sum, t) => sum + (t.percentComplete || 0), 0) / areaTasks.length)
      : 0;

    // Severity calculation
    let severity: 'Critical' | 'High' | 'Elevated' | 'Controlled' = 'Controlled';
    let color = 'text-emerald-400 border-emerald-800/80 bg-emerald-950/20';

    if (areaDelayed.length >= 2 || areaDelayed.some(t => t.priority === 'Critical') || areaDelayed.some(t => t.effectiveDelayDays > 5)) {
      severity = 'Critical';
      color = 'text-rose-400 border-rose-800/80 bg-rose-950/20';
    } else if (areaDelayed.length > 0 || areaExpected.filter(e => e.riskProbability === 'Critical').length > 0) {
      severity = 'High';
      color = 'text-amber-400 border-amber-800/80 bg-amber-950/20';
    } else if (areaExpected.length > 0) {
      severity = 'Elevated';
      color = 'text-cyan-400 border-cyan-800/80 bg-cyan-950/20';
    }

    // Collect key risk drivers
    const drivers: string[] = [];
    areaDelayed.forEach(t => {
      if (t.delayReason) drivers.push(`#${t.sNo}: ${t.delayReason}`);
      else if (t.remark) drivers.push(`#${t.sNo}: ${t.remark}`);
    });
    areaExpected.forEach(t => {
      if (t.riskReasons.length > 0) {
        drivers.push(`#${t.sNo}: ${t.riskReasons[0]}`);
      }
    });

    // Collect mitigation owners
    const owners = new Set<string>();
    areaTasks.forEach(t => {
      if (t.backendOwner && t.backendOwner !== '-') owners.add(`BE: ${t.backendOwner}`);
      if (t.frontendOwner && t.frontendOwner !== '-') owners.add(`FE: ${t.frontendOwner}`);
    });

    // Blast radius: how many other tasks depend on tasks in this risk area
    let blastRadiusCount = 0;
    tasks.forEach(t => {
      if (!sNoSet.has(t.sNo)) {
        const dep = t.dependency?.toLowerCase() || '';
        for (const target of areaTasks) {
          if (
            dep.includes(target.title.toLowerCase().slice(0, 10)) ||
            dep.includes(`task ${target.sNo}`) ||
            dep.includes(`#${target.sNo}`)
          ) {
            blastRadiusCount++;
            break;
          }
        }
      }
    });

    return {
      id: def.id,
      title: def.title,
      category: def.category,
      description: def.description,
      severity,
      color,
      tasks: areaTasks,
      delayedTasks: areaDelayed,
      expectedTasks: areaExpected,
      averageProgress: avgProgress,
      keyRiskDrivers: Array.from(new Set(drivers)).slice(0, 3),
      mitigationOwners: Array.from(owners),
      blastRadiusCount,
      steerCoRecommendation: def.steerCoRecommendation,
    };
  });
}
