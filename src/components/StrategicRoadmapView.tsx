import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Flag, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  GitBranch, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Milestone as MilestoneIcon,
  Workflow,
  FileText,
  Presentation,
  Download
} from 'lucide-react';
import { TaskItem, StrategicMilestone } from '../types';
import { getTaskDeadlineStatus } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { exportStrategicRoadmapPdf } from '../utils/exportPdf';
import { exportStrategicRoadmapPpt } from '../utils/exportPpt';

interface StrategicRoadmapViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onEditTask: (task: TaskItem) => void;
  onTriggerReminder: (task: TaskItem) => void;
  onSwitchToGantt?: () => void;
}

export const StrategicRoadmapView: React.FC<StrategicRoadmapViewProps> = ({
  tasks,
  asOfDate,
  onEditTask,
  onTriggerReminder,
  onSwitchToGantt,
}) => {
  const { canEdit } = useAuth();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('m1');
  const [activeMonthFilter, setActiveMonthFilter] = useState<number | 'ALL'>('ALL');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportStrategicRoadmapPdf(tasks, asOfDate);
      setToastMsg('Strategic Roadmap PDF downloaded successfully!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      await exportStrategicRoadmapPpt(tasks, asOfDate);
      setToastMsg('Strategic Roadmap 16:9 Presentation (.pptx) downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PPT export failed: ${e.message}`);
    } finally {
      setIsExportingPpt(false);
    }
  };

  // Baseline 6-month Strategic Milestones definition
  const rawMilestones: Omit<StrategicMilestone, 'progressPercent' | 'deliverableCount' | 'completedCount' | 'delayedCount' | 'status'>[] = useMemo(() => [
    {
      id: 'm1',
      code: 'M1',
      monthIndex: 1,
      monthLabel: 'Month 1 (Aug 2026)',
      title: 'Foundation & Core Security Gate',
      phase: 'Phase 1: Architecture & Access',
      category: 'Foundation',
      targetDate: '23-08-2026',
      leadOwners: ['Khalid', 'Yohannes Y.', 'Dewa'],
      workstreams: ['Foundation & Analysis', 'Dynamic User Management & Permission Integration', 'Existing Workflow Completion'],
      keyDeliverables: [
        'Dynamic maker-checker permission matrix (#3)',
        'Delegation of Lending Limits (DLL) rule engine (#5)',
        'Appraisal file viewer for LAF & DDR review (#13)',
        'Role-based dynamic UI rendering framework (#2)'
      ],
      dependencies: ['Core IAM Provider & Postgres DB Provisioning'],
      criticalPath: true,
      impactSummary: 'Prerequisite for all downstream credit workflows and committee voting access.'
    },
    {
      id: 'm2',
      code: 'M2',
      monthIndex: 2,
      monthLabel: 'Month 2 (Sep 2026)',
      title: 'Workflow Engine Refactor & Credit Operations BRD',
      phase: 'Phase 2: Core Processing Engine',
      category: 'Workflows',
      targetDate: '24-09-2026',
      leadOwners: ['Khalid', 'Eyob', 'Ephrem', 'Letu', 'Wubishet'],
      workstreams: ['Core Modules', 'Committee Architecture Refactor', 'Credit Operations — BRD Implementation'],
      keyDeliverables: [
        'Committee voting engine & quorum aggregation (#16)',
        'Fee management engine & tariff matrix (#14)',
        'Credit operations BRD contract signing & booking (#33)',
        'Maker-checker approval chains for credit disbursement (#34)'
      ],
      dependencies: ['M1: Foundation & Core Security Gate'],
      criticalPath: true,
      impactSummary: 'Establishes central banking decisioning core and automated fee schedules.'
    },
    {
      id: 'm3',
      code: 'M3',
      monthIndex: 3,
      monthLabel: 'Month 3 (Oct 2026)',
      title: 'Collateral Valuation & Feasibility Pipeline',
      phase: 'Phase 3: Asset Risk & Appeals',
      category: 'Valuation',
      targetDate: '30-10-2026',
      leadOwners: ['Amanuel', 'Yohannes S.', 'Melaku', 'Raeye'],
      workstreams: ['Collateral Valuation Work flow', 'Post-Approval Requests Workflow'],
      keyDeliverables: [
        'Collateral revaluation trigger logic & asset valuation (#23)',
        'Feasibility review & condition lifting appeals (#26)',
        'Valuation document upload & OCR processing (#22)',
        'Legal condition verification before loan issuance (#27)'
      ],
      dependencies: ['M2: Workflow Engine Refactor & Credit Operations BRD'],
      criticalPath: true,
      impactSummary: 'Protects collateral asset ratios and automates loan condition waivers.'
    },
    {
      id: 'm4',
      code: 'M4',
      monthIndex: 4,
      monthLabel: 'Month 4 (Nov 2026)',
      title: 'Post-Disbursement Suite & Collateral Operations',
      phase: 'Phase 4: Lifecycle Operations',
      category: 'Disbursement',
      targetDate: '25-11-2026',
      leadOwners: ['Eyob', 'Simachew', 'Ephrem', 'Natnael'],
      workstreams: ['Post-Disbursement Requests Workflow', 'Collateral Operation Requests Workflow'],
      keyDeliverables: [
        'Post-disbursement loan restructuring & rescheduling (#29)',
        'Collateral release, substitution, and partial discharge (#31)',
        'Principal repayment & amortized interest schedule tracking (#30)',
        'Collateral custody audit & security document vaulting (#32)'
      ],
      dependencies: ['M3: Collateral Valuation & Feasibility Pipeline'],
      criticalPath: false,
      impactSummary: 'Full-lifecycle post-funding loan servicing, collateral replacement, and audit compliance.'
    },
    {
      id: 'm5',
      code: 'M5',
      monthIndex: 5,
      monthLabel: 'Month 5 (Dec 2026)',
      title: 'End-to-End Testing, UAT & Decision Communication',
      phase: 'Phase 5: Validation & Quality Gate',
      category: 'Testing & UAT',
      targetDate: '20-12-2026',
      leadOwners: ['All Team', 'Executive SteerCo', 'Quality Assurance'],
      workstreams: ['Decision Communication & Testing', 'Production Support & Governance'],
      keyDeliverables: [
        'Automated regression testing across all 12 modules (#37)',
        'Multi-branch UAT simulation with wholesale credit officers (#38)',
        'Decision communication SMS/Email dispatch engine (#36)',
        'Performance benchmarking (sub-second response on 10k deals) (#39)'
      ],
      dependencies: ['M4: Post-Disbursement Suite', 'M3: Collateral Valuation Pipeline'],
      criticalPath: true,
      impactSummary: 'Mandatory quality gate for SteerCo sign-off and regulatory readiness.'
    },
    {
      id: 'm6',
      code: 'M6',
      monthIndex: 6,
      monthLabel: 'Month 6 (Jan 2027)',
      title: 'Production Cutover, Hypercare & Executive Go-Live',
      phase: 'Phase 6: Deployment & Operations',
      category: 'Go-Live',
      targetDate: '28-01-2027',
      leadOwners: ['SteerCo Program Director', 'Khalid', 'All Team'],
      workstreams: ['Production Support & Governance'],
      keyDeliverables: [
        'Production data migration & cutover weekend dry-run (#42)',
        'Enterprise live deployment with active failover (#43)',
        '30-day hypercare support & operational runbook handover (#44)',
        'Executive SteerCo final project closure sign-off (#41)'
      ],
      dependencies: ['M5: End-to-End Testing & UAT Sign-off'],
      criticalPath: true,
      impactSummary: 'Full commercial production launch across all wholesale banking branches.'
    }
  ], []);

  // Compute live progress and deliverable linkage from task data
  const strategicMilestones: StrategicMilestone[] = useMemo(() => {
    return rawMilestones.map(m => {
      // Find all tasks linked to this milestone's workstreams
      const linkedTasks = tasks.filter(t => m.workstreams.includes(t.workstream));
      const totalCount = linkedTasks.length || 1;
      const completed = linkedTasks.filter(t => t.status === 'Completed').length;
      const delayed = linkedTasks.filter(t => {
        const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
        return info.category === 'OVERDUE' || t.status === 'Delayed' || t.status === 'No BRD';
      }).length;

      const progress = Math.round((completed / totalCount) * 100);

      let status: StrategicMilestone['status'] = 'Scheduled';
      if (progress === 100) {
        status = 'Completed';
      } else if (delayed > 0) {
        status = 'At Risk';
      } else if (progress > 0 || m.monthIndex === 1) {
        status = 'In Progress';
      } else {
        status = 'On Track';
      }

      return {
        ...m,
        deliverableCount: totalCount,
        completedCount: completed,
        delayedCount: delayed,
        progressPercent: progress,
        status,
      };
    });
  }, [rawMilestones, tasks, asOfDate]);

  const filteredMilestones = useMemo(() => {
    if (activeMonthFilter === 'ALL') return strategicMilestones;
    return strategicMilestones.filter(m => m.monthIndex === activeMonthFilter);
  }, [strategicMilestones, activeMonthFilter]);

  const activeMilestone = strategicMilestones.find(m => m.id === selectedMilestoneId) || strategicMilestones[0];

  // Get tasks belonging to the active selected milestone
  const activeMilestoneTasks = useMemo(() => {
    if (!activeMilestone) return [];
    return tasks.filter(t => activeMilestone.workstreams.includes(t.workstream));
  }, [tasks, activeMilestone]);

  return (
    <div className="space-y-6 mb-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#B38D34] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-[#B38D34] text-xs uppercase font-bold tracking-widest font-mono">
            <Compass className="w-4 h-4" />
            <span>Executive Program Vision & Dependency Architecture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            6-Month Strategic Roadmap & Major Milestones
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            High-level sequence horizons spanning August 2026 to January 2027. Complements tactical sprint Gantt charts with enterprise steerco milestone gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSwitchToGantt && (
            <button
              onClick={onSwitchToGantt}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D667CF]" />
              <span>Gantt View</span>
            </button>
          )}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition shadow-sm hover:border-[#B38D34]/60 disabled:opacity-50"
            title="Download Strategic Roadmap as PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>{isExportingPdf ? 'Exporting...' : 'Roadmap PDF'}</span>
          </button>
          <button
            onClick={handleExportPpt}
            disabled={isExportingPpt}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#B38D34]/20 hover:bg-[#B38D34]/40 text-[#B38D34] hover:text-white border border-[#B38D34]/50 rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
            title="Download Strategic Roadmap 16:9 Presentation (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>{isExportingPpt ? 'Exporting...' : 'Roadmap PPT'}</span>
          </button>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Baseline Reference</span>
            <span className="text-xs font-mono font-bold text-[#B38D34]">{asOfDate}</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-[#B38D34]/20 border border-[#B38D34]/60 rounded-lg flex items-center justify-between text-xs text-white animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* 6-MONTH DEPENDENCY SEQUENCE FLOWCHART */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#D667CF]" />
              <span>Sequential Stage-Gate Dependency Flow (M1 ➔ M6)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any stage node to inspect linked deliverables, critical path buffers, and upstream blockers
            </p>
          </div>

          {/* Month Pills */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveMonthFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                activeMonthFilter === 'ALL' ? 'bg-[#95288E] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All 6 Months
            </button>
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <button
                key={idx}
                onClick={() => setActiveMonthFilter(idx as any)}
                className={`px-2 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                  activeMonthFilter === idx ? 'bg-[#95288E] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                M{idx}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Sequential Flow Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          {strategicMilestones.map((m, idx) => {
            const isSelected = selectedMilestoneId === m.id;
            const isCompleted = m.status === 'Completed';
            const isAtRisk = m.status === 'At Risk';
            const isInProgress = m.status === 'In Progress';

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`relative bg-slate-950 border rounded-xl p-3.5 flex flex-col justify-between transition-all cursor-pointer group shadow-md ${
                  isSelected 
                    ? 'border-[#95288E] ring-2 ring-[#95288E]/50 bg-slate-900/90' 
                    : isAtRisk 
                    ? 'border-rose-800/80 hover:border-rose-600' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Connecting Arrow for desktop (except last item) */}
                {idx < 5 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}

                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-xs font-bold text-[#D667CF] bg-[#95288E]/20 px-2 py-0.5 rounded border border-[#95288E]/40">
                      {m.code}
                    </span>

                    {m.criticalPath && (
                      <span className="text-[10px] font-mono font-bold text-[#B38D34] bg-[#B38D34]/15 px-1.5 py-0.5 rounded">
                        Critical
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-300 font-mono">{m.monthLabel.split(' ')[0]}</div>
                  <h4 className="text-xs font-bold text-white mt-1 leading-snug line-clamp-2" title={m.title}>
                    {m.title}
                  </h4>
                </div>

                {/* Progress & Target Date */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-400">{m.targetDate}</span>
                    <span className={`font-bold ${isAtRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {m.progressPercent}%
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAtRisk ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'bg-[#95288E]'
                      }`}
                      style={{ width: `${m.progressPercent}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* SELECTED MILESTONE DEEP-DIVE & DEPENDENCY CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Milestone Specification & Architecture (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#95288E] text-white">
                  {activeMilestone.code}
                </span>
                <span className="text-xs font-mono text-[#B38D34] uppercase font-bold">
                  {activeMilestone.phase}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5">
                {activeMilestone.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {activeMilestone.impactSummary}
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeMilestone.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              activeMilestone.status === 'At Risk' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-blue-950 text-blue-400 border border-blue-800'
            }`}>
              {activeMilestone.status}
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Target Date</span>
              <span className="text-xs font-bold text-[#B38D34]">{activeMilestone.targetDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Deliverables Done</span>
              <span className="text-xs font-bold text-white">
                {activeMilestone.completedCount} / {activeMilestone.deliverableCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Delayed Items</span>
              <span className={`text-xs font-bold ${activeMilestone.delayedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeMilestone.delayedCount} Tasks
              </span>
            </div>
          </div>

          {/* Dependency Sequencing Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D667CF] font-bold uppercase tracking-wider">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Upstream Dependency Gate</span>
            </div>
            <div className="space-y-1.5">
              {activeMilestone.dependencies.map((dep, dIdx) => (
                <div key={dIdx} className="flex items-center gap-2 text-xs text-slate-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B38D34]"></div>
                  <span>{dep}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Deliverables Checklist */}
          <div>
            <h4 className="text-xs font-mono uppercase font-bold text-slate-300 tracking-wider mb-2.5">
              Core Deliverable Outputs:
            </h4>
            <div className="space-y-2">
              {activeMilestone.keyDeliverables.map((deliv, dIdx) => (
                <div key={dIdx} className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">{deliv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Owners */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Primary Accountability:</span>
            <div className="flex items-center gap-1.5">
              {activeMilestone.leadOwners.map((owner, oIdx) => (
                <span key={oIdx} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                  {owner}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Linked Deliverable Tasks Table (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Linked Deliverables ({activeMilestoneTasks.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Tasks across {activeMilestone.workstreams.length} workstreams
              </p>
            </div>

            <span className="text-xs font-mono text-[#D667CF] font-bold">
              {activeMilestone.monthLabel}
            </span>
          </div>

          {/* Scrollable Tasks list */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {activeMilestoneTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                No active tasks linked to this milestone.
              </div>
            ) : (
              activeMilestoneTasks.map(t => {
                const deadlineInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
                const isOverdue = deadlineInfo.category === 'OVERDUE' || t.status === 'Delayed';

                return (
                  <div 
                    key={t.id}
                    className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#D667CF]">#{t.sNo}</span>
                        <span className="font-bold text-white line-clamp-1">{t.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        t.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        isOverdue ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {t.deliverable}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-850">
                      <span>Owner: <strong className="text-slate-200">{t.backendOwner || t.frontendOwner}</strong></span>
                      <span>Target: <strong className="text-[#B38D34]">{t.endDate}</strong></span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onTriggerReminder(t)}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-[#B38D34] rounded text-[10px] font-mono border border-slate-800 cursor-pointer"
                      >
                        Remind Lead
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => onEditTask(t)}
                          className="px-2 py-0.5 bg-[#95288E]/20 hover:bg-[#95288E]/40 text-[#D667CF] rounded text-[10px] font-mono border border-[#95288E]/50 cursor-pointer"
                        >
                          Edit Task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* 6-MONTH CHRONOLOGICAL SUMMARY TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <MilestoneIcon className="w-4 h-4 text-[#B38D34]" />
              <span>Chronological 6-Month Master Horizon Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">
              SteerCo executive review summary with critical path dependencies
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <th className="py-3 px-3">Gate</th>
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-4">Milestone Title & Scope</th>
                <th className="py-3 px-3">Target Date</th>
                <th className="py-3 px-3">Key Lead Owners</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {strategicMilestones.map(m => (
                <tr 
                  key={m.id}
                  onClick={() => setSelectedMilestoneId(m.id)}
                  className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                    selectedMilestoneId === m.id ? 'bg-slate-800/80' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-[#D667CF]">{m.code}</td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{m.monthLabel.split(' ')[0]}</td>
                  <td className="py-3 px-4 font-sans font-bold text-white">
                    <div>{m.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal font-sans">{m.phase}</div>
                  </td>
                  <td className="py-3 px-3 text-[#B38D34] whitespace-nowrap font-bold">{m.targetDate}</td>
                  <td className="py-3 px-3 text-slate-300">{m.leadOwners.join(', ')}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      m.status === 'At Risk' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-white font-bold">{m.progressPercent}%</span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#95288E] rounded-full"
                          style={{ width: `${m.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
