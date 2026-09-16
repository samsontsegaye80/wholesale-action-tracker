import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  FileText,
  Calendar,
  X, 
  Download, 
  Check, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Printer,
  CalendarDays,
  BellRing,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { TaskItem } from '../types';
import { exportMasterPlanToExcel } from '../utils/exportExcel';
import { exportExecutivePresentation, exportCbeDailyReportStatusPpt } from '../utils/exportPpt';
import { exportDashboardToPdf, exportCbeDailyReportStatusPdf } from '../utils/exportPdf';
import { exportDeadlinesToIcs, generateIcsCalendarContent } from '../utils/exportIcs';
import { getCurrentReportDateTime, calculateDaysDiff } from '../utils/dateUtils';

interface DailyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  asOfDate: string;
}

export const DailyExportModal: React.FC<DailyExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  asOfDate,
}) => {
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPpt, setExportingPpt] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingIcs, setExportingIcs] = useState(false);
  const [exportingCbePpt, setExportingCbePpt] = useState(false);
  const [exportingCbePdf, setExportingCbePdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ICS specific options
  const [icsScope, setIcsScope] = useState<'upcoming' | 'active' | 'high_priority' | 'all'>('upcoming');
  const [icsIncludeAlarms, setIcsIncludeAlarms] = useState<boolean>(true);
  const [icsLeadFilter, setIcsLeadFilter] = useState<string>('All');
  
  // Real-time generation date & time tracker
  const [currentReportTime, setCurrentReportTime] = useState(() => getCurrentReportDateTime());

  useEffect(() => {
    if (!isOpen) return;
    setCurrentReportTime(getCurrentReportDateTime());
    const interval = setInterval(() => {
      setCurrentReportTime(getCurrentReportDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handlers for CBE Official Daily Status Report
  const handleExportCbePpt = async () => {
    setExportingCbePpt(true);
    setSuccessMessage(null);
    try {
      await exportCbeDailyReportStatusPpt(tasks, asOfDate);
      setSuccessMessage(`Official CBE Daily Status Report (.pptx) with all 44 tasks downloaded!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`CBE PowerPoint export failed: ${e.message}`);
    } finally {
      setExportingCbePpt(false);
    }
  };

  const handleExportCbePdf = async () => {
    setExportingCbePdf(true);
    setSuccessMessage(null);
    try {
      await exportCbeDailyReportStatusPdf(tasks, asOfDate);
      setSuccessMessage(`Official CBE Daily Report (.pdf) with all 44 tasks downloaded!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`CBE PDF export failed: ${e.message}`);
    } finally {
      setExportingCbePdf(false);
    }
  };

  // Compute live ICS event count preview
  const icsPreview = generateIcsCalendarContent(tasks, asOfDate, {
    scope: icsScope,
    includeAlarms: icsIncludeAlarms,
    leadFilter: icsLeadFilter === 'All' ? undefined : icsLeadFilter
  });

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setSuccessMessage(null);
    try {
      await exportDashboardToPdf(tasks, asOfDate);
      setSuccessMessage(`Executive PDF Report generated at ${currentReportTime.displayTime} and downloaded!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    setSuccessMessage(null);
    try {
      exportMasterPlanToExcel(tasks, asOfDate);
      setSuccessMessage(`Excel Master Workbook generated at ${currentReportTime.displayTime} and downloaded!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`Excel export failed: ${e.message}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPpt = async () => {
    setExportingPpt(true);
    setSuccessMessage(null);
    try {
      await exportExecutivePresentation(tasks, asOfDate);
      setSuccessMessage(`16:9 SteerCo Deck generated at ${currentReportTime.displayTime} and downloaded!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`PowerPoint export failed: ${e.message}`);
    } finally {
      setExportingPpt(false);
    }
  };

  const handleExportIcs = () => {
    setExportingIcs(true);
    setSuccessMessage(null);
    try {
      const result = exportDeadlinesToIcs(tasks, asOfDate, {
        scope: icsScope,
        includeAlarms: icsIncludeAlarms,
        leadFilter: icsLeadFilter === 'All' ? undefined : icsLeadFilter
      });
      setSuccessMessage(`Calendar .ics file generated with ${result.eventCount} task deadlines for Outlook & Google Calendar!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`Calendar export failed: ${e.message}`);
    } finally {
      setExportingIcs(false);
    }
  };

  // Collect unique team lead names for filtering
  const allLeads = Array.from(new Set(
    tasks.flatMap(t => [t.backendOwner, t.frontendOwner])
      .filter(o => o && o !== '-' && o !== 'All Team')
  )).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between border-t-4 border-t-[#95288E]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#95288E]/20 border border-[#95288E]/60 flex items-center justify-center text-[#D667CF]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Daily Extraction &amp; Executive Governance Export</span>
                <span className="px-2 py-0.5 rounded bg-[#95288E]/30 text-[#D667CF] text-[10px] font-mono font-bold border border-[#95288E]/50">
                  PDF / XLS / PPT / ICS
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Generate executive boardroom reports, multi-tab Excel workbooks, 16:9 presentations, and Outlook/Google Calendar sync.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
          
          {/* Real-time Report Generation Date & Time Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-[#95288E]/20 border border-[#95288E]/40 flex items-center justify-center text-[#D667CF] shrink-0">
                <Clock className="w-4 h-4 text-[#B38D34] animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#D667CF] tracking-wider flex items-center gap-1.5">
                  <span>Report Generation Timestamp (Live System Clock)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {currentReportTime.displayDateTime}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 bg-slate-900 px-3.5 py-1.5 rounded border border-slate-800">
              <div className="text-[9px] uppercase font-mono text-slate-400">Schedule Baseline</div>
              <div className="text-xs font-bold text-[#B38D34] font-mono">{asOfDate}</div>
            </div>
          </div>

          {/* Notification Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium text-xs">{successMessage}</span>
            </div>
          )}

          {/* FEATURED: CBE OFFICIAL DAILY STATUS REPORT (ATTACHED PPT TEMPLATE) */}
          <div className="bg-gradient-to-r from-[#4A0E4E]/40 via-slate-950 to-[#4A0E4E]/30 p-5 rounded-xl border-2 border-[#B38D34] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-[#95288E] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  Official CBE Format
                </span>
                <span className="text-xs font-bold text-[#FDE047] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Wholesale &amp; Credit Digitization
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Daily Status Report Presentation (.pptx) &amp; Document (.pdf)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Complete slide deck covering <strong>all 44 deliverables</strong> with the exact CBE Digital Factory template: Initiative metadata card, MVP descriptions table, Action items table with owners, dates, statuses, and reasons if delayed.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                onClick={handleExportCbePpt}
                disabled={exportingCbePpt}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-gradient-to-r from-[#95288E] to-[#701A75] hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-[#95288E]/40 border border-[#D667CF]/50 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Presentation className="w-4 h-4 text-[#FDE047]" />
                <span>{exportingCbePpt ? 'Generating PPT...' : 'Download CBE PPT (.pptx)'}</span>
              </button>
              <button
                onClick={handleExportCbePdf}
                disabled={exportingCbePdf}
                className="flex-1 md:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition border border-slate-700 hover:border-[#B38D34]/50 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>{exportingCbePdf ? 'Compiling PDF...' : 'CBE PDF'}</span>
              </button>
            </div>
          </div>

          {/* Export Options 4-Card (2x2) Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. PDF Executive Report */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-[#D667CF] flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-[#D667CF]">
                    <FileText className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-xs">Executive PDF Report (.pdf)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Landscape A4</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Formatted boardroom report ready for printing, leadership briefings, and distribution:
                </p>
                <ul className="text-[10px] text-slate-400 mt-2 space-y-1 font-mono list-disc list-inside">
                  <li>Executive Scorecard, Bento KPIs &amp; Delivery Confidence</li>
                  <li>Critical Risk Radar &amp; Delay Root Causes</li>
                  <li>Engineering Leads Workload Matrix</li>
                  <li>Full 44 Deliverables Table with Progress % &amp; Delay Days</li>
                </ul>
              </div>

              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="w-full py-2.5 bg-gradient-to-r from-[#95288E] via-[#aa2ea3] to-[#7e1f77] hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-[#95288E]/30 border border-[#D667CF]/40"
              >
                <Printer className="w-3.5 h-3.5 text-[#B38D34]" />
                <span>{exportingPdf ? 'Compiling PDF...' : 'Download Boardroom PDF'}</span>
              </button>
            </div>

            {/* 2. Excel Workbook */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-emerald-500 flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-xs">Excel Master Workbook (.xlsx)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">5 Worksheets</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Deep operational data workbook with dedicated sheets and audit metadata:
                </p>
                <ul className="text-[10px] text-slate-400 mt-2 space-y-1 font-mono list-disc list-inside">
                  <li>Sheet 1: Governance Cover &amp; Audit Timestamps</li>
                  <li>Sheet 2: Master Action Plan (44 Tasks, BE/FE Statuses)</li>
                  <li>Sheet 3: Executive Delay &amp; Escalation Log</li>
                  <li>Sheet 4: Team Accountability &amp; Workload Matrix</li>
                  <li>Sheet 5: Workstream Summary &amp; Progress Metrics</li>
                </ul>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingExcel ? 'Generating Workbook...' : 'Download Excel Extract'}</span>
              </button>
            </div>

            {/* 3. PowerPoint Presentation */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-[#B38D34] flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-[#B38D34]">
                    <Presentation className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-xs">16:9 SteerCo Deck (.pptx)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">6 Slides Widescreen</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  High-impact executive slide deck in 16:9 widescreen format for board reviews:
                </p>
                <ul className="text-[10px] text-slate-400 mt-2 space-y-1 font-mono list-disc list-inside">
                  <li>Executive Title Deck with Live Generation Timestamp</li>
                  <li>Delivery Scorecard &amp; Portfolio KPIs</li>
                  <li>Critical Delays &amp; Remediation Matrix</li>
                  <li>Engineering Team Accountability &amp; 6-Month Gate Horizon</li>
                </ul>
              </div>

              <button
                onClick={handleExportPpt}
                disabled={exportingPpt}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md border border-[#B38D34]/40"
              >
                <Presentation className="w-3.5 h-3.5 text-[#B38D34]" />
                <span>{exportingPpt ? 'Rendering Slides...' : 'Download SteerCo PPTX'}</span>
              </button>
            </div>

            {/* 4. Calendar Sync (.ICS) for Outlook & Google Calendar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-cyan-500 flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-xs">Outlook / Google Calendar (.ics)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {icsPreview.eventCount} Deliverables Queued
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sync upcoming deliverable deadlines and milestones directly into Outlook, Google Calendar, or Apple Calendar:
                </p>

                {/* Calendar Config Controls */}
                <div className="mt-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2.5">
                  
                  {/* Scope Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Sync Scope:</label>
                    <select
                      value={icsScope}
                      onChange={(e) => setIcsScope(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="upcoming">Upcoming Deadlines (Next 30 Days)</option>
                      <option value="active">All Active Deliverables (Incomplete)</option>
                      <option value="high_priority">Critical &amp; High Priority Only</option>
                      <option value="all">All 44 Deliverables</option>
                    </select>
                  </div>

                  {/* Lead Filter */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Filter Lead:</label>
                    <select
                      value={icsLeadFilter}
                      onChange={(e) => setIcsLeadFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="All">All Engineering Leads</option>
                      {allLeads.map(lead => (
                        <option key={lead} value={lead}>{lead}</option>
                      ))}
                    </select>
                  </div>

                  {/* Alarm Checkbox */}
                  <label className="flex items-center space-x-2 text-[10px] text-slate-300 font-mono cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={icsIncludeAlarms}
                      onChange={(e) => setIcsIncludeAlarms(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <BellRing className="w-3 h-3 text-[#B38D34]" />
                      <span>Include 1-day &amp; 3-day notification alarms in calendar</span>
                    </span>
                  </label>

                </div>
              </div>

              <button
                onClick={handleExportIcs}
                disabled={exportingIcs || icsPreview.eventCount === 0}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-700 hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-cyan-900/30 border border-cyan-400/40"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-200" />
                <span>{exportingIcs ? 'Generating .ICS...' : `Sync ${icsPreview.eventCount} Deadlines to Calendar (.ics)`}</span>
              </button>
            </div>

          </div>

          {/* Daily Extraction Info Box */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#B38D34]" />
              <span>Automated Daily Extraction Cron: <strong className="text-white">Active at 04:00 UTC</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Audit Stamp:</span>
              <span className="text-[#D667CF] font-mono">{currentReportTime.fileTimestamp}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Governance Export Engine • jsPDF / SheetJS / PptxGenJS / iCalendar RFC 5545
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
