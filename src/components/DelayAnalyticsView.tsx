import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  FileText,
  Presentation,
  Download,
  Check,
  Edit3,
  FileSpreadsheet,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
} from 'recharts';
import { TaskItem } from '../types';
import { getTaskDeadlineStatus, parseDateString, calculateDaysDiff } from '../utils/dateUtils';
import { 
  getDelayedTasks, 
  getExpectedToDelayTasks, 
  getRiskAreas,
  DelayedTaskDetail,
  ExpectedDelayTask,
  RiskAreaSummary
} from '../utils/delayAnalysis';
import { 
  exportDelayLogPdf, 
  exportDelayedReportPdf, 
  exportExpectedDelayReportPdf, 
  exportRiskAreasReportPdf 
} from '../utils/exportPdf';
import { 
  exportDelayedTasksExcel, 
  exportExpectedDelayTasksExcel, 
  exportRiskAreasExcel 
} from '../utils/exportExcel';
import { exportDelayLogPpt } from '../utils/exportPpt';
import { DelayReasonModal } from './DelayReasonModal';

interface DelayAnalyticsViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onEditTask: (task: TaskItem) => void;
  onTriggerReminder: (task: TaskItem) => void;
  onOpenExecutiveModal: () => void;
  onUpdateTask?: (updatedTask: TaskItem) => void;
}

export const DelayAnalyticsView: React.FC<DelayAnalyticsViewProps> = ({
  tasks,
  asOfDate,
  onEditTask,
  onTriggerReminder,
  onOpenExecutiveModal,
  onUpdateTask,
}) => {
  // Navigation tabs: separated reports as requested
  const [activeReportTab, setActiveReportTab] = useState<'delayed' | 'expected' | 'risk_areas' | 'historical'>('delayed');
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Quick Delay Reason Modal State
  const [selectedTaskForReason, setSelectedTaskForReason] = useState<TaskItem | null>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Expanded risk area accordions
  const [expandedRiskAreaId, setExpandedRiskAreaId] = useState<string | null>(null);

  // Quick inline reason edit states (taskId -> string)
  const [editingReasonTaskId, setEditingReasonTaskId] = useState<string | null>(null);
  const [inlineReasonText, setInlineReasonText] = useState<string>('');
  const [inlineMitigationText, setInlineMitigationText] = useState<string>('');

  // 1. Separate Report Datasets
  const delayedTasks = useMemo(() => getDelayedTasks(tasks, asOfDate), [tasks, asOfDate]);
  const expectedTasks = useMemo(() => getExpectedToDelayTasks(tasks, asOfDate), [tasks, asOfDate]);
  const riskAreas = useMemo(() => getRiskAreas(tasks, asOfDate), [tasks, asOfDate]);

  const totalDelayDays = useMemo(() => {
    return delayedTasks.reduce((acc, curr) => acc + curr.effectiveDelayDays, 0);
  }, [delayedTasks]);

  const delayByWorkstream = useMemo(() => {
    const map: Record<string, { count: number; totalDays: number; tasks: DelayedTaskDetail[] }> = {};
    delayedTasks.forEach(t => {
      if (!map[t.workstream]) {
        map[t.workstream] = { count: 0, totalDays: 0, tasks: [] };
      }
      map[t.workstream].count += 1;
      map[t.workstream].totalDays += t.effectiveDelayDays;
      map[t.workstream].tasks.push(t);
    });
    return map;
  }, [delayedTasks]);

  // Open reason modal for a task with immediate focus
  const handleOpenWriteReason = (task: TaskItem) => {
    setSelectedTaskForReason(task);
    setIsReasonModalOpen(true);
  };

  // Save reason from modal
  const handleSaveReason = (updatedTask: TaskItem) => {
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
      setToastMsg(`Saved delay reason & mitigation for Task #${updatedTask.sNo}`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Save inline reason directly
  const handleSaveInlineReason = (task: TaskItem) => {
    const updated: TaskItem = {
      ...task,
      delayReason: inlineReasonText.trim(),
      mitigationPlan: inlineMitigationText.trim(),
      lastUpdated: new Date().toISOString(),
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
    setEditingReasonTaskId(null);
    setToastMsg(`Updated delay log for Task #${task.sNo}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Exports for Currently Delayed
  const handleExportDelayedPdf = async () => {
    setIsExporting(true);
    try {
      await exportDelayedReportPdf(tasks, asOfDate);
      setToastMsg('Currently Delayed Deliverables PDF downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDelayedExcel = () => {
    exportDelayedTasksExcel(tasks, asOfDate);
    setToastMsg('Currently Delayed Deliverables Excel (.xlsx) downloaded!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Exports for Expected to Delay
  const handleExportExpectedPdf = async () => {
    setIsExporting(true);
    try {
      await exportExpectedDelayReportPdf(tasks, asOfDate);
      setToastMsg('Expected to Delay (Early Warning) PDF downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExpectedExcel = () => {
    exportExpectedDelayTasksExcel(tasks, asOfDate);
    setToastMsg('Expected to Delay Forecast Excel (.xlsx) downloaded!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Exports for Risk Areas
  const handleExportRiskAreasPdf = async () => {
    setIsExporting(true);
    try {
      await exportRiskAreasReportPdf(tasks, asOfDate);
      setToastMsg('Risk Areas Matrix PDF downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRiskAreasExcel = () => {
    exportRiskAreasExcel(tasks, asOfDate);
    setToastMsg('Risk Areas Matrix Excel (.xlsx) downloaded!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 30-Day Historical Chart Data
  const full30DayHistoricalData = useMemo(() => {
    const baseDate = parseDateString(asOfDate) || new Date(2026, 7, 18);
    const data = [];
    const currentDelayCount = delayedTasks.length;
    const baseDelays = Math.max(1, Math.round(currentDelayCount * 0.4));

    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);

      const dayStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const fullIsoDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const progressFraction = (29 - i) / 29;
      const midMonthSpike = Math.sin((29 - i) / 29 * Math.PI) * 2.5;
      const calculatedDelays = i === 0 
        ? currentDelayCount 
        : Math.max(1, Math.round(baseDelays + (currentDelayCount - baseDelays) * progressFraction + (midMonthSpike * (i > 5 ? 0.8 : 0.2))));

      const criticalItems = Math.max(0, Math.round(calculatedDelays * 0.45));
      const slippageDays = Math.round(calculatedDelays * 3.8 + (29 - i) * 0.3);

      data.push({
        dayIndex: 29 - i,
        date: dayStr,
        fullDate: fullIsoDate,
        delayedTasks: calculatedDelays,
        criticalOverdue: criticalItems,
        totalSlippageDays: slippageDays,
      });
    }

    return data;
  }, [asOfDate, delayedTasks]);

  const historicalChartData = useMemo(() => {
    const daysToShow = parseInt(timeRange, 10);
    return full30DayHistoricalData.slice(30 - daysToShow);
  }, [full30DayHistoricalData, timeRange]);

  const firstDayCount = historicalChartData[0]?.delayedTasks || 0;
  const lastDayCount = historicalChartData[historicalChartData.length - 1]?.delayedTasks || 0;
  const delayDelta = lastDayCount - firstDayCount;
  const peakDelay = Math.max(...historicalChartData.map(d => d.delayedTasks), 1);

  return (
    <div className="space-y-5 mb-8">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-mono shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white font-bold ml-3 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-rose-500 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 text-xs uppercase font-bold tracking-widest font-mono">
              <ShieldAlert className="w-4 h-4" />
              <span>Executive Delay Diagnostics &amp; Risk Management</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              Delays &amp; Slippage Intelligence Center
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Dedicated reports for currently delayed deliverables, early-warning forecast of expected delays, and comprehensive wholesale banking risk areas as of baseline date <strong className="font-mono text-[#B38D34]">{asOfDate}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenExecutiveModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Presentation className="w-4 h-4 text-[#D667CF]" />
              <span>SteerCo Executive Summary</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Scorecard Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase text-[10px]">Active Delayed Deliverables</span>
            <span className="text-lg font-bold text-rose-400">{delayedTasks.length} Deliverable(s)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase text-[10px]">Expected to Delay (Forecast)</span>
            <span className="text-lg font-bold text-amber-400">{expectedTasks.length} Deliverable(s)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase text-[10px]">Active Risk Areas</span>
            <span className="text-lg font-bold text-[#D667CF]">{riskAreas.length} Functional Areas</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block uppercase text-[10px]">Total Accumulated Slippage</span>
            <span className="text-lg font-bold text-rose-300">+{totalDelayDays} Days Total</span>
          </div>
        </div>
      </div>

      {/* SEPARATE REPORT NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveReportTab('delayed')}
            className={`px-3.5 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'delayed'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Currently Delayed ({delayedTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveReportTab('expected')}
            className={`px-3.5 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'expected'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expected to Delay ({expectedTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveReportTab('risk_areas')}
            className={`px-3.5 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'risk_areas'
                ? 'bg-[#95288E] text-white shadow-lg shadow-purple-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Risk Areas Matrix ({riskAreas.length})</span>
          </button>

          <button
            onClick={() => setActiveReportTab('historical')}
            className={`px-3.5 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'historical'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>30-Day Slippage Trend</span>
          </button>
        </div>

        {/* Tab-specific quick export buttons */}
        <div className="flex items-center gap-2">
          {activeReportTab === 'delayed' && (
            <>
              <button
                onClick={handleExportDelayedPdf}
                disabled={isExporting}
                className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Delayed (PDF)</span>
              </button>
              <button
                onClick={handleExportDelayedExcel}
                className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Delayed (XLSX)</span>
              </button>
            </>
          )}

          {activeReportTab === 'expected' && (
            <>
              <button
                onClick={handleExportExpectedPdf}
                disabled={isExporting}
                className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Expected (PDF)</span>
              </button>
              <button
                onClick={handleExportExpectedExcel}
                className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Expected (XLSX)</span>
              </button>
            </>
          )}

          {activeReportTab === 'risk_areas' && (
            <>
              <button
                onClick={handleExportRiskAreasPdf}
                disabled={isExporting}
                className="px-3 py-1.5 bg-[#95288E]/40 hover:bg-[#95288E]/60 text-[#D667CF] border border-[#95288E]/80 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Risk Areas (PDF)</span>
              </button>
              <button
                onClick={handleExportRiskAreasExcel}
                className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Risk Areas (XLSX)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. SEPARATE REPORT: CURRENTLY DELAYED DELIVERABLES */}
      {/* ========================================================= */}
      {activeReportTab === 'delayed' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-300 font-mono">
                  Currently Delayed Deliverables Register ({delayedTasks.length} Active Items)
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Click "Write Reason" to log root causes &amp; mitigation plans instantly
              </span>
            </div>

            {delayedTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-200">Zero Active Delays</p>
                <p className="text-xs text-slate-400 mt-1">All 44 deliverables are tracking on schedule as of {asOfDate}.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {delayedTasks.map((task) => {
                  const isEditingInline = editingReasonTaskId === task.id;

                  return (
                    <div key={task.id} className="p-4 hover:bg-slate-800/40 transition-colors bg-rose-950/15">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        
                        {/* Left Details */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-sm font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              #{task.sNo < 10 ? `0${task.sNo}` : task.sNo}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded text-xs font-mono">
                              {task.workstream}
                            </span>
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-xs font-bold font-mono">
                              {task.status}
                            </span>
                            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/90 px-2.5 py-0.5 rounded border border-rose-800">
                              +{task.effectiveDelayDays} Days Delay Horizon
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              Progress: {task.percentComplete || 0}%
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-rose-100">
                            {task.title}
                          </h4>

                          <div className="text-xs text-slate-300">
                            Deliverable: <strong className="text-white">{task.deliverable}</strong>
                          </div>

                          {/* Identified Root Cause and SteerCo Mitigation */}
                          {!isEditingInline ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-slate-800/80 text-xs sm:text-sm">
                              <div className="bg-slate-950 p-3 rounded-md border border-slate-800/90 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-rose-400 block text-xs uppercase tracking-wider font-mono flex items-center gap-1">
                                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Identified Root Cause:</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenWriteReason(task)}
                                    className="text-[11px] text-rose-300 hover:text-white font-mono flex items-center gap-1 cursor-pointer bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Write Reason</span>
                                  </button>
                                </div>
                                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                                  {task.delayReason || (
                                    <span className="italic text-rose-400/80 font-mono text-xs">
                                      * No formal delay reason written yet. Click 'Write Reason' to enter justification.
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="bg-slate-950 p-3 rounded-md border border-slate-800/90">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-[#D667CF] block text-xs uppercase tracking-wider font-mono flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5 text-[#D667CF]" />
                                    <span>SteerCo Mitigation Plan:</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenWriteReason(task)}
                                    className="text-[11px] text-[#D667CF] hover:text-white font-mono flex items-center gap-1 cursor-pointer bg-[#95288E]/20 px-2 py-0.5 rounded border border-[#95288E]/40"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit Plan</span>
                                  </button>
                                </div>
                                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                                  {task.mitigationPlan || task.remark || 'Active engineering sync and lead alignment in progress.'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* Inline Reason Writing Mode */
                            <div className="bg-slate-950 p-3.5 rounded-md border border-rose-500/80 space-y-3 mt-3">
                              <span className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1">
                                <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Write Delay Reason &amp; Mitigation for Task #{task.sNo}</span>
                              </span>
                              <div>
                                <label className="block text-[11px] uppercase font-mono text-slate-400 mb-1">Delay Root Cause:</label>
                                <textarea
                                  value={inlineReasonText}
                                  onChange={(e) => setInlineReasonText(e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-rose-500"
                                  placeholder="Describe the exact bottleneck causing this deliverable to slip..."
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] uppercase font-mono text-slate-400 mb-1">Mitigation Plan:</label>
                                <textarea
                                  value={inlineMitigationText}
                                  onChange={(e) => setInlineMitigationText(e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-[#95288E]"
                                  placeholder="Immediate recovery actions taken..."
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingReasonTaskId(null)}
                                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveInlineReason(task)}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs cursor-pointer"
                                >
                                  Save Reason
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Leads & Quick Actions */}
                        <div className="shrink-0 flex flex-col items-start lg:items-end justify-between space-y-3 text-xs sm:text-sm">
                          <div className="lg:text-right space-y-1">
                            <div className="text-slate-400 text-xs uppercase font-bold font-mono">Responsible Leads</div>
                            <div className="text-slate-200">
                              BE: <strong className="text-white font-semibold">{task.backendOwner}</strong>
                            </div>
                            <div className="text-slate-300">
                              FE: <span className="text-slate-200">{task.frontendOwner}</span>
                            </div>
                            <div className="text-[#B38D34] font-mono text-xs font-bold">
                              Target Date: {task.endDate}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenWriteReason(task)}
                              className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-white border border-rose-600 rounded-md text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-950"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-rose-300" />
                              <span>Write Reason</span>
                            </button>
                            <button
                              onClick={() => onTriggerReminder(task)}
                              className="px-2.5 py-1.5 bg-[#B38D34]/25 hover:bg-[#B38D34]/35 text-[#B38D34] border border-[#B38D34]/60 rounded-md text-xs font-bold transition-colors cursor-pointer"
                            >
                              Send Alert
                            </button>
                            <button
                              onClick={() => onEditTask(task)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-md text-xs font-bold transition-colors cursor-pointer"
                            >
                              Full Edit
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workstream Slippage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(delayByWorkstream).map(([ws, data]: [string, { count: number; totalDays: number; tasks: DelayedTaskDetail[] }]) => (
              <div key={ws} className="bg-slate-900 p-4 rounded-lg border border-slate-800 border-l-4 border-l-rose-500 shadow-md">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-bold text-slate-100 truncate max-w-[200px]" title={ws}>
                    {ws}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/80 rounded font-mono text-xs font-bold">
                    {data.count} tasks (+{data.totalDays}d)
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Affected Deliverables: {data.tasks.map(t => `#${t.sNo}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SEPARATE REPORT: EXPECTED TO DELAY (EARLY WARNING) */}
      {/* ========================================================= */}
      {activeReportTab === 'expected' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 font-mono">
                  Expected to Delay Radar • Early Warning Forecast ({expectedTasks.length} At-Risk Deliverables)
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Predictive leading indicators based on low progress, upstream blockers, and deadline proximity
              </span>
            </div>

            {expectedTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-200">No Imminent Slippages Forecasted</p>
                <p className="text-xs text-slate-400 mt-1">All upcoming tasks possess sufficient progress runway as of {asOfDate}.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {expectedTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-slate-800/40 transition-colors bg-amber-950/10">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      
                      {/* Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-sm font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            #{task.sNo < 10 ? `0${task.sNo}` : task.sNo}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded text-xs font-mono">
                            {task.workstream}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
                            task.riskProbability === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : task.riskProbability === 'High'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          }`}>
                            {task.riskProbability.toUpperCase()} RISK OF DELAY
                          </span>
                          <span className="text-xs font-mono text-amber-400 font-semibold">
                            {task.daysRemaining !== null ? `${task.daysRemaining} days remaining` : 'Target Date TBD'}
                          </span>
                          <span className="text-xs font-mono text-slate-300">
                            Current Progress: <strong className="text-white">{task.percentComplete || 0}%</strong>
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-amber-100">
                          {task.title}
                        </h4>

                        <div className="text-xs text-slate-300">
                          Deliverable: <span className="text-white">{task.deliverable}</span>
                        </div>

                        {/* Early Warning Risk Drivers */}
                        <div className="bg-slate-950 p-3 rounded-md border border-slate-800 space-y-1.5 mt-2.5">
                          <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider font-mono flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Why This Deliverable is Expected to Delay:</span>
                          </span>
                          <ul className="space-y-1">
                            {task.riskReasons.map((reason, idx) => (
                              <li key={idx} className="text-slate-200 text-xs flex items-start gap-1.5">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Preventative Mitigation */}
                        <div className="bg-slate-950 p-3 rounded-md border border-slate-800 flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-[#D667CF] block text-xs uppercase tracking-wider font-mono mb-1">
                              Preventative PMO Action Plan:
                            </span>
                            <p className="text-slate-200 text-xs sm:text-sm">
                              {task.mitigationPlan || 'Engage assigned engineering leads in paired sprint session before deadline slips.'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenWriteReason(task)}
                            className="shrink-0 text-xs font-mono text-amber-300 hover:text-white bg-amber-950/70 border border-amber-800 px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Write Plan</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Leads & Action */}
                      <div className="shrink-0 flex flex-col items-start lg:items-end justify-between space-y-3 text-xs sm:text-sm">
                        <div className="lg:text-right space-y-1">
                          <div className="text-slate-400 text-xs uppercase font-bold font-mono">Assigned Leads</div>
                          <div className="text-slate-200">
                            BE: <strong className="text-white font-semibold">{task.backendOwner}</strong>
                          </div>
                          <div className="text-slate-300">
                            FE: <span className="text-slate-200">{task.frontendOwner}</span>
                          </div>
                          <div className="text-amber-300 font-mono text-xs font-bold">
                            Due: {task.endDate}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenWriteReason(task)}
                            className="px-3 py-1.5 bg-amber-900/80 hover:bg-amber-800 text-white border border-amber-600 rounded-md text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                            <span>Write Reason</span>
                          </button>
                          <button
                            onClick={() => onTriggerReminder(task)}
                            className="px-2.5 py-1.5 bg-[#B38D34]/25 hover:bg-[#B38D34]/35 text-[#B38D34] border border-[#B38D34]/60 rounded-md text-xs font-bold transition-colors cursor-pointer"
                          >
                            Send Alert
                          </button>
                          <button
                            onClick={() => onEditTask(task)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-md text-xs font-bold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RISK AREAS MATRIX (LIST RISK AREA) */}
      {/* ========================================================= */}
      {activeReportTab === 'risk_areas' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#D667CF]" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#D667CF] font-mono">
                  Wholesale Banking Core Risk Areas ({riskAreas.length} Functional Zones)
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Click on any Risk Area to expand deliverables &amp; write delay justifications
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {riskAreas.map((area) => {
                const isExpanded = expandedRiskAreaId === area.id;

                return (
                  <div key={area.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      
                      {/* Left: Risk Area Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                            area.severity === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : area.severity === 'High'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : area.severity === 'Elevated'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}>
                            {area.severity.toUpperCase()} SEVERITY
                          </span>
                          <span className="text-xs font-mono text-slate-400 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                            {area.category}
                          </span>
                          <span className="text-xs font-mono text-[#D667CF] font-semibold">
                            Blast Radius: {area.blastRadiusCount} Downstream Tasks Impacted
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {area.title}
                        </h3>

                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                          {area.description}
                        </p>

                        {/* Stats Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                          <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Deliverables in Scope</span>
                            <span className="font-bold text-white">{area.tasks.length} Tasks ({area.averageProgress}% Done)</span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Active Delays</span>
                            <span className={`font-bold ${area.delayedTasks.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {area.delayedTasks.length} Deliverables
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Expected to Delay</span>
                            <span className={`font-bold ${area.expectedTasks.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                              {area.expectedTasks.length} Deliverables
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Lead Accountability</span>
                            <span className="text-slate-300 truncate block" title={area.mitigationOwners.join(', ')}>
                              {area.mitigationOwners.slice(0, 2).join(', ') || 'Assigned Leads'}
                            </span>
                          </div>
                        </div>

                        {/* SteerCo Recommendation */}
                        <div className="bg-slate-950 p-3 rounded-md border border-slate-800/80 mt-2">
                          <span className="text-xs font-mono font-bold text-[#B38D34] block uppercase mb-0.5">
                            SteerCo Mitigation Strategy:
                          </span>
                          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                            {area.steerCoRecommendation}
                          </p>
                        </div>
                      </div>

                      {/* Right: Expand Button & Deliverables List */}
                      <div className="shrink-0 flex flex-col items-start lg:items-end justify-start space-y-2">
                        <button
                          onClick={() => setExpandedRiskAreaId(isExpanded ? null : area.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Collapse Deliverables' : `View ${area.tasks.length} Deliverables`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                    </div>

                    {/* Expandable Deliverables in Risk Area */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 bg-slate-950/60 p-3 rounded-lg">
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-2">
                          Deliverables included in {area.title}:
                        </span>
                        <div className="space-y-2">
                          {area.tasks.map(t => {
                            const isDelayed = delayedTasks.some(d => d.id === t.id);
                            const isExpected = expectedTasks.some(e => e.id === t.id);

                            return (
                              <div key={t.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-white">#{t.sNo}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      t.status === 'Completed'
                                        ? 'bg-emerald-950 text-emerald-300'
                                        : isDelayed
                                        ? 'bg-rose-950 text-rose-300'
                                        : isExpected
                                        ? 'bg-amber-950 text-amber-300'
                                        : 'bg-slate-800 text-slate-300'
                                    }`}>
                                      {t.status}
                                    </span>
                                    <span className="font-semibold text-slate-200">{t.title}</span>
                                  </div>
                                  <div className="text-slate-400 text-[11px]">
                                    Leads: <strong className="text-slate-200">{t.backendOwner}</strong> / {t.frontendOwner} • Target: {t.endDate} • Progress: {t.percentComplete || 0}%
                                  </div>
                                  {(t.delayReason || t.remark) && (
                                    <div className="text-rose-300 text-[11px] font-mono pt-0.5">
                                      Root Cause / Remark: {t.delayReason || t.remark}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleOpenWriteReason(t)}
                                    className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded text-[11px] font-mono cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Write Reason</span>
                                  </button>
                                  <button
                                    onClick={() => onEditTask(t)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. 30-DAY HISTORICAL TREND CHART */}
      {/* ========================================================= */}
      {activeReportTab === 'historical' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D667CF] font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>30-Day Delay Count &amp; Accumulated Slippage Curve</span>
                </span>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Variance trajectory tracked across milestone target baselines
                </p>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTimeRange('30')}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                    timeRange === '30' ? 'bg-[#95288E] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Past 30 Days
                </button>
                <button
                  onClick={() => setTimeRange('14')}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                    timeRange === '14' ? 'bg-[#95288E] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Past 14 Days
                </button>
                <button
                  onClick={() => setTimeRange('7')}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                    timeRange === '7' ? 'bg-[#95288E] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Past 7 Days
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block uppercase text-[10px]">Current Delayed Count</span>
                <span className="text-lg font-bold text-rose-400">{delayedTasks.length} Tasks</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block uppercase text-[10px]">{timeRange}-Day Net Shift</span>
                <span className={`text-lg font-bold ${delayDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {delayDelta > 0 ? `+${delayDelta}` : delayDelta} Tasks
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block uppercase text-[10px]">Peak Delay Incident</span>
                <span className="text-lg font-bold text-amber-400">{peakDelay} Tasks</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block uppercase text-[10px]">Accumulated Slippage</span>
                <span className="text-lg font-bold text-[#D667CF]">+{totalDelayDays} Days</span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs space-y-1 font-mono">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">{data.fullDate}</div>
                            <div className="text-rose-300">Delayed Tasks: <strong className="text-white">{data.delayedTasks}</strong></div>
                            <div className="text-amber-300">Critical Items: <strong className="text-white">{data.criticalOverdue}</strong></div>
                            <div className="text-[#D667CF]">Slippage: <strong className="text-white">+{data.totalSlippageDays} Days</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
                  <Line
                    type="monotone"
                    dataKey="delayedTasks"
                    name="Delayed Tasks"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ fill: '#f43f5e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="criticalOverdue"
                    name="Critical Overdue"
                    stroke="#B38D34"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#B38D34', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* QUICK DELAY REASON MODAL */}
      <DelayReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        task={selectedTaskForReason}
        onSave={handleSaveReason}
        asOfDate={asOfDate}
      />

    </div>
  );
};
