import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Presentation, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  Layers, 
  Calendar, 
  User, 
  Check, 
  Edit3,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';
import { getTaskDeadlineStatus, formatDateToDisplay } from '../utils/dateUtils';
import { exportCbeDailyReportStatusPpt } from '../utils/exportPpt';
import { exportCbeDailyReportStatusPdf } from '../utils/exportPdf';
import { useAuth } from '../context/AuthContext';

interface DailyReportStatusViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onTaskUpdate?: (updatedTask: TaskItem) => void;
  onEditTask?: (task: TaskItem) => void;
}

export const DailyReportStatusView: React.FC<DailyReportStatusViewProps> = ({
  tasks,
  asOfDate,
  onTaskUpdate,
  onEditTask,
}) => {
  const { canEdit } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'slides'>('table');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Export handlers
  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      await exportCbeDailyReportStatusPpt(tasks, asOfDate);
      setToastMsg('CBE Official Daily Status Report (.pptx) downloaded successfully!');
      setTimeout(() => setToastMsg(null), 5000);
    } catch (e: any) {
      alert(`PowerPoint export failed: ${e.message}`);
    } finally {
      setIsExportingPpt(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportCbeDailyReportStatusPdf(tasks, asOfDate);
      setToastMsg('CBE Official Daily Status Report (.pdf) downloaded successfully!');
      setTimeout(() => setToastMsg(null), 5000);
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Sort tasks by sequence #
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.sNo - b.sNo);
  }, [tasks]);

  // Unique list of owners for filtering
  const allOwners = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.backendOwner && t.backendOwner !== '-') set.add(t.backendOwner);
      if (t.frontendOwner && t.frontendOwner !== '-') set.add(t.frontendOwner);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Filtered tasks for table view
  const filteredTasks = useMemo(() => {
    return sortedTasks.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q) || false;
        const matchDeliverable = t.deliverable?.toLowerCase().includes(q) || false;
        const matchOwner = (t.backendOwner?.toLowerCase().includes(q) || t.frontendOwner?.toLowerCase().includes(q)) || false;
        const matchRemark = t.remark?.toLowerCase().includes(q) || false;
        const matchReason = t.delayReason?.toLowerCase().includes(q) || false;
        const matchSNo = t.sNo.toString() === q.replace('#', '');
        if (!matchTitle && !matchDeliverable && !matchOwner && !matchRemark && !matchReason && !matchSNo) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Delayed') {
          const dl = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
          if (dl.category !== 'OVERDUE' && t.status !== 'Delayed') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Owner
      if (ownerFilter !== 'ALL') {
        if (t.backendOwner !== ownerFilter && t.frontendOwner !== ownerFilter) {
          return false;
        }
      }

      return true;
    });
  }, [sortedTasks, searchQuery, statusFilter, ownerFilter, asOfDate]);

  // Stats calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const delayedCount = tasks.filter(t => {
    const dl = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return dl.category === 'OVERDUE' || t.status === 'Delayed';
  }).length;

  // Slide Pagination chunks (11 tasks per slide)
  const slideChunks = useMemo(() => {
    const chunks: TaskItem[][] = [];
    const size = 11;
    for (let i = 0; i < sortedTasks.length; i += size) {
      chunks.push(sortedTasks.slice(i, i + size));
    }
    return chunks;
  }, [sortedTasks]);

  const batchNames = [
    'Phase 1: Foundation & Auth Security (Tasks #1 - #11)',
    'Phase 2: External Interfaces & Committee Engine (Tasks #12 - #22)',
    'Phase 3: Collateral Valuation & Underwriting Logic (Tasks #23 - #33)',
    'Phase 4: Disbursement, Documents & Governance (Tasks #34 - #44)'
  ];

  // Total slides = 1 (Cover) + slideChunks.length + 1 (Closing)
  const totalSlides = 2 + slideChunks.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOP EXECUTIVE BANNER & ACTION BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#95288E]/25 text-[#D667CF] border border-[#95288E]/50 uppercase tracking-wider">
              CBE Digital Factory Official Template
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono font-bold text-[#B38D34]">Wholesale &amp; Credit Digitization</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
            <span>Daily Report Status</span>
            <span className="text-[#D667CF] font-light text-lg sm:text-xl">| Master 44 Deliverables</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Official daily operational governance report for Technology Sector &amp; Digital Factory steering committees.
          </p>
        </div>

        {/* Action Controls & Format Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* View Mode Toggle: Interactive Table vs Slide Preview */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-[#95288E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 Interactive View (44)
            </button>
            <button
              onClick={() => setViewMode('slides')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'slides'
                  ? 'bg-[#95288E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🖼️ Slide Deck Mode
            </button>
          </div>

          {/* Primary Download Buttons */}
          <button
            onClick={handleExportPpt}
            disabled={isExportingPpt}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#95288E] to-[#701A75] hover:from-[#aa2ea3] hover:to-[#95288E] text-white border border-[#D667CF]/50 rounded-lg text-xs font-bold transition shadow-lg shadow-[#95288E]/40 disabled:opacity-50 cursor-pointer"
            title="Download Official CBE 16:9 Presentation (.pptx) with all 44 tasks formatted as attached"
          >
            <Presentation className="w-4 h-4 text-[#FDE047]" />
            <span>{isExportingPpt ? 'Exporting...' : 'Download CBE Daily PPT (.pptx)'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition shadow-sm hover:border-[#B38D34]/60 disabled:opacity-50 cursor-pointer"
            title="Download Official CBE Daily Report PDF"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>{isExportingPdf ? 'Exporting...' : 'Daily PDF (.pdf)'}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-[#95288E]/20 border border-[#95288E]/60 rounded-lg flex items-center justify-between text-xs text-white animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE PREVIEW MODE */}
      {/* ========================================================================= */}
      {viewMode === 'slides' && (
        <div className="space-y-4">
          
          {/* Slide Navigation Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                disabled={activeSlideIndex === 0}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-200">
                Slide {activeSlideIndex + 1} of {totalSlides}
              </span>
              <button
                onClick={() => setActiveSlideIndex(prev => Math.min(totalSlides - 1, prev + 1))}
                disabled={activeSlideIndex === totalSlides - 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] font-mono">
              <button
                onClick={() => setActiveSlideIndex(0)}
                className={`px-2.5 py-1 rounded ${activeSlideIndex === 0 ? 'bg-[#95288E] text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
              >
                Cover Slide
              </button>
              {slideChunks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx + 1)}
                  className={`px-2.5 py-1 rounded ${activeSlideIndex === idx + 1 ? 'bg-[#95288E] text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  Tasks {(idx * 11) + 1}-{Math.min((idx + 1) * 11, sortedTasks.length)}
                </button>
              ))}
              <button
                onClick={() => setActiveSlideIndex(totalSlides - 1)}
                className={`px-2.5 py-1 rounded ${activeSlideIndex === totalSlides - 1 ? 'bg-[#95288E] text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
              >
                Closing / Thank You
              </button>
            </div>
          </div>

          {/* SLIDE 0: COVER SLIDE */}
          {activeSlideIndex === 0 && (
            <div className="bg-[#3B073F] border border-[#95288E]/40 rounded-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden min-h-[480px] flex flex-col justify-between text-center">
              {/* Top Accent */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full border-2 border-[#B38D34] flex items-center justify-center text-[#B38D34] font-bold text-xs">
                  CBE
                </div>
                <div className="text-right">
                  <div className="text-[#B38D34] font-bold text-sm">የኢትዮጵያ ንግድ ባንክ</div>
                  <div className="text-white text-xs">Commercial Bank of Ethiopia</div>
                </div>
              </div>

              {/* Center Content */}
              <div className="my-auto space-y-3 py-8">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Technology Sector  |  Digital Factory Division
                </h3>
                <div className="text-lg sm:text-xl font-bold text-[#FDE047]">
                  Daily Status Report as of {asOfDate}
                </div>
                <div className="space-y-1 pt-2">
                  <p className="text-lg sm:text-xl font-bold text-white">Wholesale &amp; Credit digitization</p>
                  <p className="text-sm text-slate-300">And</p>
                  <p className="text-lg sm:text-xl font-bold text-white">Retail Lending digitization</p>
                </div>
              </div>

              {/* Bottom Decorative Curve */}
              <div className="w-full pt-4 border-t border-[#B38D34]/50 flex items-center justify-between text-xs text-slate-400">
                <span>WHOLESALE BANKING PMO</span>
                <span className="text-[#B38D34] font-semibold">CONFIDENTIAL &amp; PROPRIETARY</span>
              </div>
            </div>
          )}

          {/* SLIDES 1 to N: TASK BATCH SLIDES */}
          {activeSlideIndex >= 1 && activeSlideIndex <= slideChunks.length && (
            <div className="bg-[#FDFBF7] text-slate-900 border border-slate-300 rounded-xl p-5 shadow-2xl space-y-4 font-sans">
              
              {/* Top Meta Card */}
              <div className="border-2 border-[#B38D34] rounded-lg p-3 bg-white space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-[#701A75] text-sm sm:text-base">
                    Initiative Name: Wholesale and Credit digitization
                  </span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    Current MVP: MVP3 ({batchNames[activeSlideIndex - 1]})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-purple-50/70 p-2 rounded border border-purple-200/60 grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500 font-semibold">Received at:</span> <span className="font-bold text-slate-900">Jan 03, 2026</span></div>
                    <div><span className="text-slate-500 font-semibold">Delivery Lead:</span> <span className="font-bold text-slate-900">Technology Sector</span></div>
                    <div><span className="text-slate-500 font-semibold">Started at:</span> <span className="font-bold text-slate-900">Jun 15, 2026</span></div>
                    <div><span className="text-slate-500 font-semibold">Product Owner:</span> <span className="font-bold text-slate-900">Wholesale &amp; Credit</span></div>
                  </div>

                  <div className="bg-purple-50/70 p-2 rounded border border-purple-200/60 grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500 font-semibold">Planned Status:</span> <span className="font-bold text-slate-900">On Track</span></div>
                    <div><span className="text-slate-500 font-semibold">Lead Time:</span> <span className="font-bold text-slate-900">120 Days</span></div>
                    <div><span className="text-slate-500 font-semibold">Current Status:</span> <span className="font-bold text-emerald-700">In Progress</span></div>
                    <div><span className="text-slate-500 font-semibold">Cycle Time:</span> <span className="font-bold text-slate-900">65 Days</span></div>
                    <div className="col-span-2 text-[#701A75] font-bold"><span className="text-slate-500 font-semibold">Cut-off Date:</span> {asOfDate}</div>
                  </div>
                </div>
              </div>

              {/* Top MVP Descriptions Table */}
              <div className="overflow-x-auto border border-purple-200 rounded-md">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#701A75] text-white uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-3 py-1.5 w-24">MVPs</th>
                      <th className="px-3 py-1.5">MVP Descriptions</th>
                      <th className="px-3 py-1.5 w-44">Status Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    <tr className="bg-purple-50/60 font-semibold">
                      <td className="px-3 py-1.5 text-[#701A75] font-bold">MVP1</td>
                      <td className="px-3 py-1.5">Customer Profile Registration &amp; KYC Intake Gateway</td>
                      <td className="px-3 py-1.5 text-emerald-700 font-bold">Completed</td>
                    </tr>
                    <tr className="bg-white font-semibold">
                      <td className="px-3 py-1.5 text-[#701A75] font-bold">MVP2</td>
                      <td className="px-3 py-1.5">Onboarding Customer &amp; CRM Integration Gateway</td>
                      <td className="px-3 py-1.5 text-emerald-700 font-bold">Completed</td>
                    </tr>
                    <tr className="bg-purple-50/60 font-semibold">
                      <td className="px-3 py-1.5 text-[#701A75] font-bold">MVP3</td>
                      <td className="px-3 py-1.5">Loan System Origination &amp; Credit Underwriting Pipeline</td>
                      <td className="px-3 py-1.5 text-[#701A75] font-bold">In Progress (Active Sprint)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Items Table for this slide */}
              <div className="border border-purple-300 rounded-md overflow-x-auto">
                <div className="bg-[#701A75] text-white text-center font-bold py-1.5 text-xs uppercase tracking-wider">
                  Action Items  (Slide {activeSlideIndex} of {slideChunks.length} • Tasks #{slideChunks[activeSlideIndex - 1][0]?.sNo} to #{slideChunks[activeSlideIndex - 1][slideChunks[activeSlideIndex - 1].length - 1]?.sNo})
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#86198F] text-white font-bold text-[11px]">
                    <tr>
                      <th className="px-2.5 py-1.5">Action Items</th>
                      <th className="px-2.5 py-1.5 w-36">Owner</th>
                      <th className="px-2 py-1.5 w-24 text-center">Planned Start</th>
                      <th className="px-2 py-1.5 w-24 text-center">Planned End</th>
                      <th className="px-2 py-1.5 w-28 text-center">Status</th>
                      <th className="px-2.5 py-1.5 w-56">Reason if Delayed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 font-medium">
                    {slideChunks[activeSlideIndex - 1].map((task, idx) => {
                      const deadlineInfo = getTaskDeadlineStatus(task.endDate, task.status, asOfDate);
                      const isOverdue = deadlineInfo.category === 'OVERDUE' || task.status === 'Delayed';
                      const reasonText = isOverdue
                        ? (task.delayReason || task.mitigationPlan || task.remark || 'Target delivery horizon extended')
                        : (task.status === 'Completed' ? 'Completed & verified' : (task.remark || 'On track with sprint milestones'));

                      return (
                        <tr key={task.id || task.sNo} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/50'}>
                          <td className="px-2.5 py-2 font-bold text-slate-900">
                            #{task.sNo}. {task.deliverable || task.title}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 text-[11px]">
                            {task.backendOwner || '-'} / {task.frontendOwner || '-'}
                          </td>
                          <td className="px-2 py-2 text-center text-slate-600 font-mono text-[11px]">
                            {task.startDate || '15-06-2026'}
                          </td>
                          <td className={`px-2 py-2 text-center font-mono text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {task.endDate || '18-08-2026'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                          <td className={`px-2.5 py-2 text-[11px] ${isOverdue ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>
                            {reasonText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SLIDE CLOSING: THANK YOU / 90 DAYS CHALLENGE */}
          {activeSlideIndex === totalSlides - 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">
              <div className="bg-white p-8 sm:p-12 flex flex-col justify-between text-slate-900">
                <div className="w-10 h-10 rounded-full border border-[#B38D34] flex items-center justify-center text-[#B38D34] font-bold text-xs">
                  CBE
                </div>
                <div className="my-auto py-8">
                  <h2 className="text-5xl sm:text-6xl font-black text-[#B38D34] tracking-tight">
                    Thank You!
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 font-mono uppercase">
                    Commercial Bank of Ethiopia • Digital Factory Division
                  </p>
                </div>
                <div className="h-3 w-full bg-gradient-to-r from-[#B38D34] to-[#701A75] rounded-full"></div>
              </div>

              <div className="bg-[#3B073F] p-8 sm:p-10 text-white space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[#FDE047] text-xs font-mono font-bold uppercase tracking-wider block">
                    ANNOUNCING APRIL 01 – JUNE 30, 2026
                  </span>
                  <div className="border-2 border-[#B38D34] rounded-xl p-4 bg-[#581845] mt-2 text-center">
                    <div className="text-5xl font-black text-white">90</div>
                    <div className="text-sm font-bold text-[#B38D34] uppercase tracking-widest">DAYS CHALLENGE</div>
                    <div className="text-[11px] text-slate-200 mt-1 font-semibold">DRIVING DIGITAL PRODUCT DELIVERY EXCELLENCE</div>
                    <div className="text-[10px] text-[#D667CF] mt-0.5">SPEED • DISCIPLINE • INNOVATION • EXECUTION</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-center">
                  <div className="p-2 bg-[#4A0E4E] rounded border border-[#B38D34]/40 font-semibold">⚡ Fast-Track Delivery</div>
                  <div className="p-2 bg-[#4A0E4E] rounded border border-[#B38D34]/40 font-semibold">🤝 Enhanced Collaboration</div>
                  <div className="p-2 bg-[#4A0E4E] rounded border border-[#B38D34]/40 font-semibold">🧩 Remove Bottlenecks</div>
                  <div className="p-2 bg-[#4A0E4E] rounded border border-[#B38D34]/40 font-semibold">🛡️ Ready for Deployment</div>
                </div>

                <div className="text-center space-y-1 pt-2 border-t border-[#B38D34]/40">
                  <div className="text-xs font-bold text-[#B38D34]">300 DAYS OF DIGITAL FACTORY SUCCESS</div>
                  <div className="text-[11px] text-slate-300">GRAND EVENT COMING AUGUST 2026</div>
                  <div className="text-base font-extrabold text-white">TRANSFORM IDEAS INTO IMPACT</div>
                  <div className="text-xs font-bold text-[#D667CF]">TOGETHER, WE DELIVER RESULTS!</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE TABLE VIEW (ALL 44 DELIVERABLES WITH LIVE FILTERS) */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-6">

          {/* CBE TOP INITIATIVE CARD (Matching Slide 2) */}
          <div className="bg-slate-900 border-2 border-[#B38D34]/70 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-md bg-[#95288E] flex items-center justify-center text-white font-bold text-xs">
                  CBE
                </div>
                <span className="text-base sm:text-lg font-bold text-white">
                  Initiative Name: <span className="text-[#D667CF]">Wholesale and Credit digitization</span>
                </span>
              </div>
              <span className="px-3 py-1 bg-[#95288E]/20 text-[#D667CF] border border-[#95288E]/50 rounded-lg text-xs font-mono font-bold">
                Current MVP: MVP3 (Loan System Origination)
              </span>
            </div>

            {/* Two-box Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Received At</span>
                  <span className="text-slate-100 font-bold">Jan 03, 2026</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Delivery Lead</span>
                  <span className="text-slate-100 font-bold">Technology Sector / Samson</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Started At</span>
                  <span className="text-slate-100 font-bold">Jun 15, 2026</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Product Owner</span>
                  <span className="text-slate-100 font-bold">Wholesale &amp; Credit Group</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Planned Status</span>
                  <span className="text-emerald-400 font-bold">On Track (SteerCo Approved)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Lead Time</span>
                  <span className="text-slate-100 font-bold">120 Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Current Status</span>
                  <span className="text-[#D667CF] font-bold">In Progress ({inProgressCount} Active)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Cycle Time</span>
                  <span className="text-slate-100 font-bold">65 Days</span>
                </div>
              </div>
            </div>

            {/* MVP Summary Table */}
            <div className="border border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#701A75] text-white font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2 w-28">MVPs</th>
                    <th className="px-3.5 py-2">MVP Descriptions</th>
                    <th className="px-3.5 py-2 w-48">Status Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950 font-medium">
                  <tr>
                    <td className="px-3.5 py-2 text-[#D667CF] font-bold">MVP1</td>
                    <td className="px-3.5 py-2 text-slate-200">Customer Profile Registration &amp; KYC Intake Gateway</td>
                    <td className="px-3.5 py-2 text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 text-[#D667CF] font-bold">MVP2</td>
                    <td className="px-3.5 py-2 text-slate-200">Onboarding Customer &amp; CRM Integration Gateway</td>
                    <td className="px-3.5 py-2 text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 text-[#D667CF] font-bold">MVP3</td>
                    <td className="px-3.5 py-2 text-slate-200">Loan System Origination &amp; Credit Underwriting Pipeline</td>
                    <td className="px-3.5 py-2 text-[#D667CF] font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D667CF]" />
                      <span>In Progress (44 Workstreams Active)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables, tasks (#1-44), leads, remarks..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#95288E]"
              />
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  statusFilter === 'ALL'
                    ? 'bg-[#95288E] text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('In Progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  statusFilter === 'In Progress'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setStatusFilter('Delayed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  statusFilter === 'Delayed'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-950 text-rose-400 hover:text-rose-300 border border-slate-800'
                }`}
              >
                Delayed ({delayedCount})
              </button>
              <button
                onClick={() => setStatusFilter('Completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  statusFilter === 'Completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Owner Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Lead:</span>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#95288E]"
              >
                <option value="ALL">All Leads ({allOwners.length})</option>
                {allOwners.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

          </div>

          {/* MAIN 44 ACTION ITEMS TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            
            {/* Table Top Banner */}
            <div className="bg-[#701A75] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#FDE047]" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Action Items — Master Action Plan ({filteredTasks.length} shown of 44 Total)
                </span>
              </div>
              <span className="text-[11px] font-mono text-purple-200">
                Baseline As Of: {asOfDate}
              </span>
            </div>

            {/* Table Data */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#86198F] text-white font-bold text-[11px] uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5 w-16 text-center">#</th>
                    <th className="px-3.5 py-2.5">Action Items / Deliverable</th>
                    <th className="px-3 py-2.5 w-44">Lead Owner (BE / FE)</th>
                    <th className="px-3 py-2.5 w-28 text-center">Planned Start</th>
                    <th className="px-3 py-2.5 w-28 text-center">Planned End</th>
                    <th className="px-3 py-2.5 w-32 text-center">Status</th>
                    <th className="px-3.5 py-2.5 w-72">Reason if Delayed / Remarks</th>
                    {canEdit && <th className="px-3 py-2.5 w-16 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/80 font-medium">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} className="text-center py-8 text-slate-500">
                        No action items match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, idx) => {
                      const deadlineInfo = getTaskDeadlineStatus(task.endDate, task.status, asOfDate);
                      const isOverdue = deadlineInfo.category === 'OVERDUE' || task.status === 'Delayed';
                      const reasonText = isOverdue
                        ? (task.delayReason || task.mitigationPlan || task.remark || 'Target delivery horizon extended')
                        : (task.status === 'Completed' ? 'Completed & verified' : (task.remark || 'On track with sprint milestones'));

                      return (
                        <tr 
                          key={task.id || task.sNo} 
                          className={`transition-colors hover:bg-slate-900 ${idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'}`}
                        >
                          <td className="px-3.5 py-3 text-center font-mono font-bold text-[#D667CF]">
                            {task.sNo}
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="font-bold text-slate-100">{task.deliverable || task.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{task.workstream}</div>
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            <div className="flex items-center space-x-1 font-mono text-[11px]">
                              <span className="font-bold text-white">{task.backendOwner || '-'}</span>
                              <span className="text-slate-500">/</span>
                              <span className="text-slate-300">{task.frontendOwner || '-'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-400 font-mono text-[11px]">
                            {task.startDate || '15-06-2026'}
                          </td>
                          <td className={`px-3 py-3 text-center font-mono text-[11px] ${
                            isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                          }`}>
                            {task.endDate || '18-08-2026'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              task.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : isOverdue
                                ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                                : task.status === 'In Progress'
                                ? 'bg-purple-950 text-[#D667CF] border border-[#95288E]/60'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                          <td className={`px-3.5 py-3 text-xs ${
                            isOverdue ? 'text-rose-300 font-medium' : 'text-slate-400'
                          }`}>
                            {reasonText}
                          </td>
                          {canEdit && (
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => onEditTask && onEditTask(task)}
                                className="p-1.5 bg-slate-800 hover:bg-[#95288E] text-slate-300 hover:text-white rounded-md transition cursor-pointer"
                                title="Edit Deliverable"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="bg-slate-950 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-4">
                <span>Total Deliverables: <strong className="text-white">44</strong></span>
                <span>Completed: <strong className="text-emerald-400">{completedCount}</strong></span>
                <span>In Progress: <strong className="text-[#D667CF]">{inProgressCount}</strong></span>
                <span>Delayed: <strong className="text-rose-400">{delayedCount}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                Technology Sector | Digital Factory Division
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
