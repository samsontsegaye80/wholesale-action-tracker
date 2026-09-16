import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  Flame, 
  User, 
  FileText, 
  Presentation, 
  Check, 
  Flag,
  Link as LinkIcon,
  ArrowRight,
  ShieldAlert,
  Layers,
  Filter,
  Eye,
  Zap,
  Info
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';
import { getTaskDeadlineStatus } from '../utils/dateUtils';
import { exportTacticalGanttPdf } from '../utils/exportPdf';
import { exportTacticalGanttPpt } from '../utils/exportPpt';

interface TimelineGanttViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onEditTask: (task: TaskItem) => void;
  onTriggerReminder: (task: TaskItem) => void;
}

interface DependencyRelationship {
  task: TaskItem;
  predecessors: TaskItem[];
  successors: TaskItem[];
  hasDelayedPredecessor: boolean;
  delayingPredecessors: { task: TaskItem; delayDays: number; reason: string }[];
  cascadingToSuccessors: TaskItem[];
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  tasks,
  asOfDate,
  onEditTask,
  onTriggerReminder,
}) => {
  const [expandedWorkstream, setExpandedWorkstream] = useState<string | null>('Foundation & Analysis');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'cascade_impacted' | 'delayed_roots' | 'has_dependencies'>('all');
  const [viewFormat, setViewFormat] = useState<'gantt' | 'workstream'>('gantt');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportTacticalGanttPdf(tasks, asOfDate);
      setToastMsg('Tactical GANTT PDF downloaded successfully!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      await exportTacticalGanttPpt(tasks, asOfDate);
      setToastMsg('Tactical GANTT 16:9 Presentation (.pptx) downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExportingPpt(false);
    }
  };

  // Build complete dependency relationship graph
  const dependencyGraph = useMemo(() => {
    const map = new Map<string, DependencyRelationship>();

    // Helper to find task by sNo
    const taskBySNo = new Map<number, TaskItem>();
    tasks.forEach(t => taskBySNo.set(t.sNo, t));

    // Initialize map
    tasks.forEach(task => {
      map.set(task.id, {
        task,
        predecessors: [],
        successors: [],
        hasDelayedPredecessor: false,
        delayingPredecessors: [],
        cascadingToSuccessors: [],
      });
    });

    // Parse dependencies for each task
    tasks.forEach(task => {
      const rel = map.get(task.id)!;
      const depStr = (task.dependency || '').toLowerCase();
      if (!depStr || depStr === '-' || depStr === 'none') return;

      // Extract referenced sNos (e.g. "#3", "task 3", "3:")
      const sNoMatches = depStr.match(/(?:#|task\s*|deliverable\s*)(\d+)/g) || [];
      const extractedSNos = new Set<number>();

      sNoMatches.forEach(m => {
        const num = parseInt(m.replace(/\D/g, ''), 10);
        if (num && num !== task.sNo && taskBySNo.has(num)) {
          extractedSNos.add(num);
        }
      });

      // Also check if any task's deliverable title or main title appears in depStr
      tasks.forEach(other => {
        if (other.id !== task.id) {
          if (other.deliverable && other.deliverable.length > 5 && depStr.includes(other.deliverable.toLowerCase())) {
            extractedSNos.add(other.sNo);
          }
        }
      });

      // Populate predecessors
      extractedSNos.forEach(sNo => {
        const pred = taskBySNo.get(sNo);
        if (pred && pred.id !== task.id) {
          rel.predecessors.push(pred);

          // Check if predecessor is delayed or overdue
          const predDeadline = getTaskDeadlineStatus(pred.endDate, pred.status, asOfDate);
          const isPredDelayed = pred.status === 'Delayed' || predDeadline.category === 'OVERDUE' || (pred.delayDays && pred.delayDays > 0);

          if (isPredDelayed) {
            rel.hasDelayedPredecessor = true;
            const delayDays = pred.delayDays || Math.abs(predDeadline.daysDiff || 0) || 5;
            rel.delayingPredecessors.push({
              task: pred,
              delayDays,
              reason: pred.delayReason || 'Predecessor milestone slipped past target finish date',
            });
          }

          // Register this task as successor on the predecessor
          const predRel = map.get(pred.id);
          if (predRel && !predRel.successors.some(s => s.id === task.id)) {
            predRel.successors.push(task);
            if (isPredDelayed) {
              predRel.cascadingToSuccessors.push(task);
            }
          }
        }
      });
    });

    return map;
  }, [tasks, asOfDate]);

  // Selected task relationship details
  const selectedTaskRel = useMemo(() => {
    if (!selectedTaskId) return null;
    return dependencyGraph.get(selectedTaskId) || null;
  }, [selectedTaskId, dependencyGraph]);

  // Cascade impact metrics
  const impactStats = useMemo(() => {
    let cascadeImpactedCount = 0;
    let delayedRootsCount = 0;
    let totalLinkedCount = 0;

    dependencyGraph.forEach(rel => {
      if (rel.predecessors.length > 0) totalLinkedCount++;
      if (rel.hasDelayedPredecessor) cascadeImpactedCount++;
      if ((rel.task.status === 'Delayed' || (rel.task.delayDays && rel.task.delayDays > 0)) && rel.successors.length > 0) {
        delayedRootsCount++;
      }
    });

    return { cascadeImpactedCount, delayedRootsCount, totalLinkedCount };
  }, [dependencyGraph]);

  // Filtered tasks based on active filterMode
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const rel = dependencyGraph.get(task.id);
      if (!rel) return true;

      if (filterMode === 'cascade_impacted') {
        return rel.hasDelayedPredecessor;
      }
      if (filterMode === 'delayed_roots') {
        return (task.status === 'Delayed' || (task.delayDays && task.delayDays > 0)) && rel.successors.length > 0;
      }
      if (filterMode === 'has_dependencies') {
        return rel.predecessors.length > 0 || rel.successors.length > 0;
      }
      return true;
    });
  }, [tasks, filterMode, dependencyGraph]);

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

  const milestones = [
    { title: 'Foundation & Core Auth Ready', date: '23-08-2026', owner: 'Khalid & Lead Group', status: 'In Progress', phase: 'Phase 1' },
    { title: 'Workflow Completions & Fee Engine', date: '30-08-2026', owner: 'Yohannes Y., Dewa, Eyob', status: 'In Progress', phase: 'Phase 2' },
    { title: 'Valuation & Committee Architecture Refactor', date: '30-09-2026', owner: 'Khalid, Amanuel, Letu', status: 'Scheduled', phase: 'Phase 3' },
    { title: 'Post-Approval & Post-Disbursement Release', date: '31-10-2026', owner: 'Yohannes S., Melaku, Eyob', status: 'Scheduled', phase: 'Phase 4' },
    { title: 'Credit Operations & Contract Signing', date: '24-09-2026', owner: 'Ephrem, Wubishet', status: 'Scheduled', phase: 'Phase 5' },
    { title: 'End-to-End Integration & SteerCo Sign-off', date: '15-10-2026', owner: 'All Team & SteerCo', status: 'Scheduled', phase: 'Phase 6' },
  ];

  // Helper to parse dates into relative positions on a 6-month scale (Aug 2026 - Jan 2027)
  const getTimelinePosition = (dateStr?: string) => {
    if (!dateStr) return 10;
    const parts = dateStr.split('-');
    if (parts.length < 3) return 10;
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) || 8; // 8 = Aug
    const year = parseInt(parts[2], 10) || 2026;

    // Timeline start: 01-08-2026, end: 31-01-2027 (~180 days)
    const baseMonth = 8;
    const monthOffset = (year - 2026) * 12 + (month - baseMonth);
    const dayOffset = monthOffset * 30 + day;
    const totalSpan = 180;
    const percent = Math.min(Math.max((dayOffset / totalSpan) * 100, 2), 95);
    return percent;
  };

  return (
    <div className="space-y-5 mb-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#95288E] rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-[#D667CF] text-xs uppercase font-bold tracking-widest font-mono">
            <Calendar className="w-4 h-4" />
            <span>Master Execution Roadmap & Deliverables Horizon</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Tactical Gantt & Dependency Cascade Impact
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Real-time relationship mapping across 44 deliverables. Highlights downstream impact when a linked predecessor is delayed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1.5 bg-slate-950 text-[#B38D34] border border-slate-800 rounded-md font-mono text-xs font-bold shadow-sm">
            Baseline: {asOfDate}
          </span>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md text-xs font-medium transition shadow-sm hover:border-[#95288E]/60 disabled:opacity-50"
            title="Download Tactical GANTT as PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Gantt PDF'}</span>
          </button>
          <button
            onClick={handleExportPpt}
            disabled={isExportingPpt}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#95288E]/20 hover:bg-[#95288E]/40 text-[#D667CF] hover:text-white border border-[#95288E]/50 rounded-md text-xs font-medium transition shadow-sm disabled:opacity-50"
            title="Download Tactical GANTT 16:9 Presentation (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>{isExportingPpt ? 'Exporting PPT...' : 'Gantt PPT (16:9)'}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-[#95288E]/20 border border-[#95288E]/60 rounded-lg flex items-center justify-between text-xs text-white animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* CASCADE DELAY & DEPENDENCY FILTER TOOLBAR */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>Filter View:</span>
          </span>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/60'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Deliverables ({tasks.length})
          </button>

          <button
            onClick={() => setFilterMode('cascade_impacted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'cascade_impacted'
                ? 'bg-rose-950 text-rose-200 border-2 border-rose-500 shadow-md shadow-rose-900/50'
                : 'bg-slate-950 text-rose-400 hover:bg-rose-950/40 border border-rose-900/60'
            }`}
            title="Show only deliverables whose predecessors are delayed or overdue"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>⚠️ Cascade Impacted ({impactStats.cascadeImpactedCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('delayed_roots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'delayed_roots'
                ? 'bg-amber-950 text-amber-200 border-2 border-amber-500 shadow-md shadow-amber-900/50'
                : 'bg-slate-950 text-[#B38D34] hover:bg-amber-950/40 border border-[#B38D34]/50'
            }`}
            title="Deliverables causing downstream delay to other tasks"
          >
            <Flame className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>Delay Roots ({impactStats.delayedRootsCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('has_dependencies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'has_dependencies'
                ? 'bg-[#B38D34] text-slate-950 font-extrabold border border-[#FDE047]'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>Mapped Dependencies ({impactStats.totalLinkedCount})</span>
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Layout:</span>
          <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => setViewFormat('gantt')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                viewFormat === 'gantt' ? 'bg-[#95288E] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📅 Gantt Bars &amp; Links
            </button>
            <button
              onClick={() => setViewFormat('workstream')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                viewFormat === 'workstream' ? 'bg-[#95288E] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📂 Workstream Hierarchy
            </button>
          </div>
        </div>

      </div>

      {/* SELECTED TASK RELATIONSHIP IMPACT INSPECTOR */}
      {selectedTaskRel && (
        <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-2 border-[#95288E] rounded-xl shadow-2xl animate-in fade-in zoom-in-98 duration-150">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded bg-[#95288E] text-white font-mono font-bold text-xs">
                  #{selectedTaskRel.task.sNo}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedTaskRel.task.deliverable}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  ({selectedTaskRel.task.workstream})
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  selectedTaskRel.task.status === 'Delayed'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {selectedTaskRel.task.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Window: <strong>{selectedTaskRel.task.startDate}</strong> to <strong>{selectedTaskRel.task.endDate}</strong> • Leads: {selectedTaskRel.task.backendOwner} / {selectedTaskRel.task.frontendOwner}
              </p>
            </div>

            <button
              onClick={() => setSelectedTaskId(null)}
              className="text-slate-400 hover:text-white text-xs font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 cursor-pointer"
            >
              ✕ Close Inspector
            </button>
          </div>

          {/* Upstream & Downstream Impact Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800/80">
            
            {/* UPSTREAM PREDECESSORS */}
            <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase text-[#B38D34] flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#B38D34]" />
                  <span>Upstream Dependencies (Predecessors: {selectedTaskRel.predecessors.length})</span>
                </span>
                {selectedTaskRel.hasDelayedPredecessor && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold animate-pulse">
                    ⚠️ DELAY IMPACT DETECTED
                  </span>
                )}
              </div>

              {selectedTaskRel.predecessors.length === 0 ? (
                <p className="text-xs text-slate-500 italic font-mono py-2">
                  No upstream dependencies. This task can commence independently.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTaskRel.predecessors.map(pred => {
                    const isPredDelayed = pred.status === 'Delayed' || (pred.delayDays && pred.delayDays > 0);
                    return (
                      <div 
                        key={pred.id}
                        onClick={() => setSelectedTaskId(pred.id)}
                        className={`p-2 rounded border text-xs font-mono cursor-pointer transition-colors ${
                          isPredDelayed 
                            ? 'bg-rose-950/60 border-rose-700 text-rose-200 hover:bg-rose-950'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">#{pred.sNo}: {pred.deliverable}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isPredDelayed ? 'bg-rose-900 text-rose-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {pred.status}
                          </span>
                        </div>
                        {isPredDelayed && (
                          <div className="mt-1 text-[11px] text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Delay slippage: +{pred.delayDays || 5} days! Direct blocker to current deliverable.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DOWNSTREAM SUCCESSORS */}
            <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase text-[#D667CF] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[#D667CF]" />
                  <span>Downstream Impact (Successors: {selectedTaskRel.successors.length})</span>
                </span>
                {selectedTaskRel.cascadingToSuccessors.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold">
                    🔥 CASCADING DELAY TO {selectedTaskRel.cascadingToSuccessors.length} TASKS
                  </span>
                )}
              </div>

              {selectedTaskRel.successors.length === 0 ? (
                <p className="text-xs text-slate-500 italic font-mono py-2">
                  No downstream tasks depend on this deliverable directly.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTaskRel.successors.map(succ => {
                    return (
                      <div 
                        key={succ.id}
                        onClick={() => setSelectedTaskId(succ.id)}
                        className="p-2 rounded border bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 text-xs font-mono cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">#{succ.sNo}: {succ.deliverable}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                            {succ.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Target window: {succ.startDate} to {succ.endDate} ({succ.workstream})
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              onClick={() => onTriggerReminder(selectedTaskRel.task)}
              className="px-3 py-1.5 bg-[#B38D34]/20 hover:bg-[#B38D34]/30 text-[#B38D34] border border-[#B38D34]/50 rounded-md text-xs font-bold font-mono cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡ Send Delay Impact Alert</span>
            </button>
            <button
              onClick={() => onEditTask(selectedTaskRel.task)}
              className="px-3 py-1.5 bg-[#95288E] hover:bg-[#701A75] text-white rounded-md text-xs font-bold font-mono cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>Edit Deliverable &amp; Dependencies</span>
            </button>
          </div>
        </div>
      )}

      {/* GANTT BAR TIMELINE VIEW */}
      {viewFormat === 'gantt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          
          {/* Gantt Timeline Header Bar */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D667CF] font-mono block">
                Deliverables Horizon &amp; Dependency Cascade Links
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any bar or deliverable to inspect its linked dependencies and upstream delay impact.
              </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> In Progress
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Delayed
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded border-2 border-amber-400 bg-rose-950"></span> Cascade Impacted
              </span>
            </div>
          </div>

          {/* Month Horizon Scale */}
          <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 grid grid-cols-6 text-center text-xs font-mono font-bold text-slate-400">
            <div>AUG 2026</div>
            <div>SEP 2026</div>
            <div>OCT 2026</div>
            <div>NOV 2026</div>
            <div>DEC 2026</div>
            <div>JAN 2027</div>
          </div>

          {/* Deliverables Rows */}
          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No deliverables match the selected filter.
              </div>
            ) : (
              filteredTasks.map(task => {
                const rel = dependencyGraph.get(task.id);
                const isSelected = selectedTaskId === task.id;
                const hasCascadeDelay = rel?.hasDelayedPredecessor;
                const isDelayed = task.status === 'Delayed' || (task.delayDays && task.delayDays > 0);

                const startPos = getTimelinePosition(task.startDate);
                const endPos = Math.max(getTimelinePosition(task.endDate), startPos + 4);
                const widthPercent = Math.max(endPos - startPos, 5);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                    className={`p-3 transition-colors cursor-pointer flex flex-col md:flex-row items-stretch md:items-center gap-3 ${
                      isSelected 
                        ? 'bg-[#95288E]/20 border-l-4 border-l-[#D667CF]' 
                        : hasCascadeDelay
                          ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Left: Task Info & Dependencies */}
                    <div className="w-full md:w-[340px] shrink-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-300">#{task.sNo}</span>
                        <span className="font-bold text-white text-xs truncate max-w-[220px]" title={task.deliverable}>
                          {task.deliverable}
                        </span>

                        {hasCascadeDelay && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-950 border border-rose-700 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Cascade Impact</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{task.startDate} → {task.endDate}</span>
                        <span>•</span>
                        <span className="truncate">{task.backendOwner}/{task.frontendOwner}</span>
                      </div>

                      {/* Linked Predecessors Pills */}
                      {rel && rel.predecessors.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500">Depends on:</span>
                          {rel.predecessors.map(p => {
                            const pDelayed = p.status === 'Delayed' || (p.delayDays && p.delayDays > 0);
                            return (
                              <span
                                key={p.id}
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                  pDelayed 
                                    ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold' 
                                    : 'bg-slate-950 text-slate-400 border-slate-800'
                                }`}
                                title={`#${p.sNo}: ${p.deliverable} (${p.status})`}
                              >
                                #{p.sNo}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Gantt Bar Track */}
                    <div className="flex-1 relative h-7 bg-slate-950 rounded border border-slate-800/80 overflow-hidden flex items-center px-1">
                      {/* Gantt Bar */}
                      <div
                        className={`absolute top-1 bottom-1 rounded transition-all flex items-center px-2 shadow-sm ${
                          hasCascadeDelay
                            ? 'bg-gradient-to-r from-rose-900 to-rose-700 border-2 border-amber-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                            : task.status === 'Completed'
                              ? 'bg-emerald-600/90 border border-emerald-400'
                              : task.status === 'In Progress'
                                ? 'bg-blue-600/90 border border-blue-400'
                                : isDelayed
                                  ? 'bg-rose-600 border border-rose-400'
                                  : 'bg-slate-700 border border-slate-600'
                        }`}
                        style={{
                          left: `${startPos}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <span className="text-[10px] font-mono font-bold text-white truncate drop-shadow">
                          {task.percentComplete ?? 0}%
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className="shrink-0 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* WORKSTREAM ACCORDION VIEW */}
      {viewFormat === 'workstream' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#D667CF] font-mono">
              Workstream Execution Timelines (12 Modules)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              CLICK STREAM TO EXPAND DELIVERABLES
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {workstreams.map((ws, wsIdx) => {
              const wsTasks = filteredTasks.filter(t => t.workstream === ws);
              const total = wsTasks.length;
              const completed = wsTasks.filter(t => t.status === 'Completed').length;
              const delayed = wsTasks.filter(t => {
                const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
                return info.category === 'OVERDUE' || t.status === 'Delayed';
              }).length;

              const isExpanded = expandedWorkstream === ws;
              const avgProgress = total > 0 
                ? Math.round(wsTasks.reduce((acc, curr) => acc + (curr.percentComplete || 0), 0) / total)
                : 0;

              return (
                <div key={ws} className="hover:bg-slate-800/40 transition-colors">
                  <div 
                    onClick={() => setExpandedWorkstream(isExpanded ? null : ws)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-3.5">
                      <button className="text-slate-400 hover:text-[#D667CF]">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-[#D667CF]" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-mono text-[#D667CF] font-bold">
                            STREAM {wsIdx < 9 ? `0${wsIdx + 1}` : wsIdx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white">{ws}</h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 font-mono">
                          {total} Deliverables • {completed} Completed • {delayed > 0 ? <span className="text-rose-400 font-bold">{delayed} Delayed</span> : <span className="text-emerald-400 font-semibold">On Track</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="hidden sm:block text-right">
                        <span className="text-xs font-mono text-slate-400 block font-semibold">Progress</span>
                        <span className="text-sm font-mono font-bold text-white">{avgProgress}%</span>
                      </div>
                      <div className="w-24 sm:w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${delayed > 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#95288E] to-[#D667CF]'}`}
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Tasks List in Workstream */}
                  {isExpanded && (
                    <div className="bg-slate-950/80 p-4 pl-12 border-t border-slate-800 space-y-2.5">
                      {wsTasks.map(task => {
                        const rel = dependencyGraph.get(task.id);
                        const deadlineInfo = getTaskDeadlineStatus(task.endDate, task.status, asOfDate);
                        const isOverdue = deadlineInfo.category === 'OVERDUE';
                        const hasCascadeDelay = rel?.hasDelayedPredecessor;

                        return (
                          <div 
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`p-3.5 rounded-lg border text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                              hasCascadeDelay 
                                ? 'bg-rose-950/30 border-rose-600/80 shadow-[0_0_10px_rgba(244,63,94,0.15)]' 
                                : isOverdue 
                                  ? 'bg-rose-950/25 border-rose-800/80' 
                                  : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                                <span className="font-mono font-bold text-slate-300">#{task.sNo}</span>
                                <span className="font-bold text-white text-sm">{task.deliverable}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${deadlineInfo.badgeColor}`}>
                                  {deadlineInfo.label}
                                </span>

                                {hasCascadeDelay && (
                                  <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-300 text-xs font-bold font-mono flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                    <span>⚠️ Delayed Predecessor Impact</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-300 mt-1">
                                Deliverable: <strong className="text-slate-100">{task.deliverable}</strong> • Window: {task.startDate} to {task.endDate} • Leads: {task.backendOwner} / {task.frontendOwner}
                              </div>

                              {/* Dependencies & Impact info */}
                              {rel && rel.predecessors.length > 0 && (
                                <div className="text-xs font-mono text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                                  <span className="text-[#B38D34] flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3 text-[#B38D34]" />
                                    <span>Dependencies:</span>
                                  </span>
                                  {rel.predecessors.map(p => {
                                    const pDelayed = p.status === 'Delayed' || (p.delayDays && p.delayDays > 0);
                                    return (
                                      <span 
                                        key={p.id}
                                        className={`px-1.5 py-0.2 rounded border ${
                                          pDelayed ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                                        }`}
                                      >
                                        #{p.sNo} ({p.status})
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTriggerReminder(task);
                                }}
                                className="px-3 py-1 bg-[#B38D34]/25 hover:bg-[#B38D34]/35 text-[#B38D34] border border-[#B38D34]/60 rounded-md text-xs font-bold cursor-pointer"
                              >
                                Alert
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTask(task);
                                }}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Major Milestone Horizons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map((m, idx) => (
          <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-800 border-l-4 border-l-[#B38D34] shadow-md">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-xs font-mono text-[#D667CF] uppercase font-bold">{m.phase}</span>
              <span className="text-xs font-mono text-[#B38D34] bg-slate-950 px-2.5 py-1 rounded border border-slate-800 flex items-center space-x-1 font-bold">
                <Flag className="w-3 h-3 text-[#B38D34]" />
                <span>{m.date}</span>
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1 mb-1.5">{m.title}</h4>
            <p className="text-xs text-slate-300 font-mono">Lead: <strong className="text-slate-100">{m.owner}</strong></p>
          </div>
        ))}
      </div>

    </div>
  );
};
