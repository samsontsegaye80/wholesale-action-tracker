import { TaskItem, TaskStatus, WorkstreamType } from '../types';

export interface DependencyGraphNode {
  id: string;
  sNo: number;
  title: string;
  deliverable: string;
  status: TaskStatus;
  percentComplete: number;
  workstream: WorkstreamType;
  startDate: string;
  endDate: string;
  actualFinishDate?: string;
  backendOwner: string;
  frontendOwner: string;
  testOwner?: string;
  delayDays: number;
  isCritical: boolean;
  phase: number;
  inDegree: number;
  outDegree: number;
  predecessorSNoList: number[];
  successorSNoList: number[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface DependencyGraphLink {
  id: string;
  source: string | DependencyGraphNode;
  target: string | DependencyGraphNode;
  sourceSNo: number;
  targetSNo: number;
  label: string;
  isCritical: boolean;
}

export interface DependencyGraphData {
  nodes: DependencyGraphNode[];
  links: DependencyGraphLink[];
  criticalPathSNos: number[];
  criticalPathNodeCount: number;
  totalDependencies: number;
  workstreamColors: Record<string, string>;
  phases: { id: number; name: string; range: string; color: string }[];
}

// Curated dependency linkages based on CBE Loan Origination System architecture
export const BASELINE_DEPENDENCIES: { fromSNo: number; toSNo: number; label: string }[] = [
  { fromSNo: 1, toSNo: 2, label: 'BRD & Requirements Baseline' },
  { fromSNo: 2, toSNo: 3, label: 'Core Architecture & User Mgmt' },
  { fromSNo: 2, toSNo: 14, label: 'Architecture & Feasibility Pipeline' },
  { fromSNo: 2, toSNo: 15, label: 'Architecture & Lending Limits' },
  { fromSNo: 2, toSNo: 20, label: 'Architecture & Collateral Infra' },
  { fromSNo: 2, toSNo: 28, label: 'Architecture & Post-Disbursement' },
  { fromSNo: 3, toSNo: 4, label: 'User Management Core' },
  { fromSNo: 4, toSNo: 5, label: 'Backend Authorization Framework' },
  { fromSNo: 3, toSNo: 6, label: 'User Profile & Identity Model' },
  { fromSNo: 4, toSNo: 6, label: 'Role-Based API Permissions' },
  { fromSNo: 5, toSNo: 7, label: 'Route & Termination Guards' },
  { fromSNo: 7, toSNo: 8, label: 'Termination Engine to CRM' },
  { fromSNo: 8, toSNo: 9, label: 'CRM LAF & DDR Feeds' },
  { fromSNo: 9, toSNo: 10, label: 'Appraisal LAF & File Viewer' },
  { fromSNo: 9, toSNo: 11, label: 'Appraisal Report Generator' },
  { fromSNo: 12, toSNo: 14, label: 'Credit Registry Assessment' },
  { fromSNo: 13, toSNo: 30, label: 'Fee Schedule Engine' },
  { fromSNo: 15, toSNo: 16, label: 'Delegated Lending Limit Engine' },
  { fromSNo: 16, toSNo: 17, label: 'Committee Voting Rules' },
  { fromSNo: 16, toSNo: 18, label: 'Committee Voting Rules' },
  { fromSNo: 17, toSNo: 19, label: 'Multi-Request Agenda Items' },
  { fromSNo: 16, toSNo: 19, label: 'Quorum & Threshold Rules' },
  { fromSNo: 19, toSNo: 24, label: 'Committee Meeting Minutes & Routing' },
  { fromSNo: 16, toSNo: 25, label: 'Committee Reconsideration Rules' },
  { fromSNo: 19, toSNo: 25, label: 'Meeting Decision Registry' },
  { fromSNo: 16, toSNo: 26, label: 'Afresh Application Evaluation' },
  { fromSNo: 19, toSNo: 26, label: 'Meeting Decision Registry' },
  { fromSNo: 11, toSNo: 27, label: 'Appraisal Annex Report' },
  { fromSNo: 19, toSNo: 27, label: 'Committee Decision Minutes' },
  { fromSNo: 20, toSNo: 21, label: 'Collateral Infrastructure Core' },
  { fromSNo: 20, toSNo: 22, label: 'Collateral Infrastructure Core' },
  { fromSNo: 21, toSNo: 23, label: 'Civil Valuation Workflow' },
  { fromSNo: 22, toSNo: 23, label: 'Agricultural Valuation Workflow' },
  { fromSNo: 20, toSNo: 35, label: 'Valuation Database & Releases' },
  { fromSNo: 20, toSNo: 36, label: 'Valuation Database & Releases' },
  { fromSNo: 35, toSNo: 37, label: 'Collateral Release Protocols' },
  { fromSNo: 36, toSNo: 37, label: 'Collateral Replacement Protocols' },
  { fromSNo: 28, toSNo: 29, label: 'Shared Core Services' },
  { fromSNo: 28, toSNo: 30, label: 'Shared Core Services' },
  { fromSNo: 28, toSNo: 31, label: 'Shared Core Services' },
  { fromSNo: 28, toSNo: 32, label: 'Shared Core Services' },
  { fromSNo: 28, toSNo: 33, label: 'Shared Core Services' },
  { fromSNo: 29, toSNo: 33, label: 'Restructuring Calculation Engine' },
  { fromSNo: 30, toSNo: 34, label: 'Waiver Module Integration' },
  { fromSNo: 31, toSNo: 34, label: 'Extension Module Integration' },
  { fromSNo: 32, toSNo: 34, label: 'Capital Injection Integration' },
  { fromSNo: 19, toSNo: 38, label: 'Approved Credit Sanction Letter' },
  { fromSNo: 38, toSNo: 39, label: 'Verified Document Checklist' },
  { fromSNo: 39, toSNo: 40, label: 'Draft Loan & Security Contract' },
  { fromSNo: 40, toSNo: 41, label: 'Signed Contract Review & Execution' },
  { fromSNo: 41, toSNo: 42, label: 'MVP Core Deliverables Baseline' },
  { fromSNo: 42, toSNo: 43, label: 'Defect Stabilization & Go-Live' },
  { fromSNo: 1, toSNo: 44, label: 'Legal Department BRD Input' },
  { fromSNo: 44, toSNo: 40, label: 'Legal Opinion Verification' }
];

// Color palette tuned specifically to CBE brand: Deep Purple, Metallic Gold, Cyan, Slate
export const WORKSTREAM_COLORS: Record<string, string> = {
  'Foundation & Analysis': '#95288E',
  'Dynamic User Management & Permission Integration': '#8b5cf6',
  'Existing Workflow Completion': '#06b6d4',
  'Core Modules': '#3b82f6',
  'Committee Architecture Refactor': '#B38D34',
  'Collateral Valuation Work flow': '#10b981',
  'Post-Approval Requests Workflow': '#f59e0b',
  'Post-Disbursement Requests Workflow': '#ec4899',
  'Collateral Operation Requests Workflow': '#14b8a6',
  'Credit Operations — BRD Implementation': '#d97706',
  'Decision Communication & Testing': '#6366f1',
  'Production Support & Governance': '#701A75',
};

export const PHASES = [
  { id: 1, name: 'Phase 1: Foundation & Security', range: 'Tasks #1 – #11', color: '#95288E' },
  { id: 2, name: 'Phase 2: Interfaces & Committee', range: 'Tasks #12 – #22', color: '#B38D34' },
  { id: 3, name: 'Phase 3: Valuation & Post-Disbursement', range: 'Tasks #23 – #33', color: '#0ea5e9' },
  { id: 4, name: 'Phase 4: Operations & Stabilization', range: 'Tasks #34 – #44', color: '#10b981' }
];

export function getPhaseBySNo(sNo: number): number {
  if (sNo <= 11) return 1;
  if (sNo <= 22) return 2;
  if (sNo <= 33) return 3;
  return 4;
}

/**
 * Computes Critical Path using Critical Path Method (CPM) / Longest Path in DAG.
 * Returns array of task sNos that belong to the critical path driving project completion.
 */
export function computeCriticalPath(
  tasks: TaskItem[],
  links: { fromSNo: number; toSNo: number }[]
): { criticalPathSNos: number[]; criticalEdges: Set<string> } {
  const taskMap = new Map<number, TaskItem>();
  tasks.forEach(t => taskMap.set(t.sNo, t));

  // Build adjacency graph
  const adj = new Map<number, { to: number; weight: number }[]>();
  const inDegree = new Map<number, number>();
  const allSNos = new Set<number>();

  tasks.forEach(t => {
    allSNos.add(t.sNo);
    adj.set(t.sNo, []);
    inDegree.set(t.sNo, 0);
  });

  links.forEach(link => {
    if (allSNos.has(link.fromSNo) && allSNos.has(link.toSNo)) {
      const fromTask = taskMap.get(link.fromSNo);
      // Weight can represent duration or task importance
      const weight = Math.max(fromTask?.delayDays ? fromTask.delayDays + 1 : 1, 1);
      adj.get(link.fromSNo)!.push({ to: link.toSNo, weight });
      inDegree.set(link.toSNo, (inDegree.get(link.toSNo) || 0) + 1);
    }
  });

  // Topological sorting via Kahn's algorithm
  const queue: number[] = [];
  inDegree.forEach((deg, sNo) => {
    if (deg === 0) queue.push(sNo);
  });

  const topoOrder: number[] = [];
  const inDegCopy = new Map(inDegree);

  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      const currentDeg = (inDegCopy.get(edge.to) || 1) - 1;
      inDegCopy.set(edge.to, currentDeg);
      if (currentDeg === 0) {
        queue.push(edge.to);
      }
    }
  }

  // Longest path computation
  const dist = new Map<number, number>();
  const prev = new Map<number, number | null>();

  allSNos.forEach(sNo => {
    dist.set(sNo, 0);
    prev.set(sNo, null);
  });

  // Initialize source nodes with baseline weight
  topoOrder.forEach(u => {
    const neighbors = adj.get(u) || [];
    const currentDist = dist.get(u) || 0;

    for (const edge of neighbors) {
      const newDist = currentDist + edge.weight;
      if (newDist > (dist.get(edge.to) || 0)) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, u);
      }
    }
  });

  // Find destination with maximum distance
  let maxNode = 43; // Default project finish (Task #43: Production Support)
  let maxDist = -1;

  dist.forEach((d, sNo) => {
    if (d > maxDist) {
      maxDist = d;
      maxNode = sNo;
    }
  });

  // Backtrack critical path
  const criticalPath: number[] = [];
  let curr: number | null = maxNode;
  while (curr !== null && curr !== undefined) {
    criticalPath.push(curr);
    curr = prev.get(curr) ?? null;
  }
  criticalPath.reverse();

  // If path is too short or disconnected, ensure standard backbone [1, 2, 15, 16, 17, 19, 38, 39, 40, 41, 42, 43] is preserved
  const canonicalSpine = [1, 2, 15, 16, 17, 19, 38, 39, 40, 41, 42, 43];
  const finalCriticalPath = criticalPath.length >= 6 ? criticalPath : canonicalSpine;

  const criticalEdges = new Set<string>();
  for (let i = 0; i < finalCriticalPath.length - 1; i++) {
    criticalEdges.add(`${finalCriticalPath[i]}->${finalCriticalPath[i + 1]}`);
  }

  return {
    criticalPathSNos: finalCriticalPath,
    criticalEdges
  };
}

/**
 * Builds full graph node and link data structure for D3 rendering.
 */
export function buildDependencyGraphData(tasks: TaskItem[]): DependencyGraphData {
  const taskMap = new Map<number, TaskItem>();
  tasks.forEach(t => taskMap.set(t.sNo, t));

  // Compute Critical Path
  const { criticalPathSNos, criticalEdges } = computeCriticalPath(tasks, BASELINE_DEPENDENCIES);
  const criticalSet = new Set(criticalPathSNos);

  // Map of predecessors and successors
  const predecessorsMap = new Map<number, number[]>();
  const successorsMap = new Map<number, number[]>();
  tasks.forEach(t => {
    predecessorsMap.set(t.sNo, []);
    successorsMap.set(t.sNo, []);
  });

  const links: DependencyGraphLink[] = [];

  BASELINE_DEPENDENCIES.forEach(dep => {
    if (taskMap.has(dep.fromSNo) && taskMap.has(dep.toSNo)) {
      const sourceTask = taskMap.get(dep.fromSNo)!;
      const targetTask = taskMap.get(dep.toSNo)!;
      const edgeKey = `${dep.fromSNo}->${dep.toSNo}`;
      const isCritical = criticalEdges.has(edgeKey);

      links.push({
        id: `link_${dep.fromSNo}_${dep.toSNo}`,
        source: sourceTask.id,
        target: targetTask.id,
        sourceSNo: dep.fromSNo,
        targetSNo: dep.toSNo,
        label: dep.label,
        isCritical
      });

      predecessorsMap.get(dep.toSNo)?.push(dep.fromSNo);
      successorsMap.get(dep.fromSNo)?.push(dep.toSNo);
    }
  });

  // Build nodes
  const nodes: DependencyGraphNode[] = tasks.map(task => {
    const isCritical = criticalSet.has(task.sNo);
    const preds = predecessorsMap.get(task.sNo) || [];
    const succs = successorsMap.get(task.sNo) || [];

    return {
      id: task.id,
      sNo: task.sNo,
      title: task.title,
      deliverable: task.deliverable,
      status: task.status,
      percentComplete: task.percentComplete || 0,
      workstream: task.workstream,
      startDate: task.startDate,
      endDate: task.endDate,
      actualFinishDate: task.actualFinishDate,
      backendOwner: task.backendOwner,
      frontendOwner: task.frontendOwner,
      testOwner: task.testOwner,
      delayDays: task.delayDays || 0,
      isCritical,
      phase: getPhaseBySNo(task.sNo),
      inDegree: preds.length,
      outDegree: succs.length,
      predecessorSNoList: preds,
      successorSNoList: succs
    };
  });

  return {
    nodes,
    links,
    criticalPathSNos,
    criticalPathNodeCount: criticalPathSNos.length,
    totalDependencies: links.length,
    workstreamColors: WORKSTREAM_COLORS,
    phases: PHASES
  };
}
