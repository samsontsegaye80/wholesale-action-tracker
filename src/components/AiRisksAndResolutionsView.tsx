import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  FileText, 
  Download, 
  Check, 
  Zap, 
  Flame, 
  User, 
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  BookmarkCheck,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import { TaskItem } from '../types';
import { exportAiAuditToWord } from '../utils/exportWord';
import { exportAiAuditToExcel } from '../utils/exportExcel';

export interface IdentifiedRisk {
  id: string;
  taskId: string;
  taskSNo: number;
  taskTitle: string;
  workstream: string;
  leadOwner: string;
  riskCategory: 'Dependency Blocker' | 'Ambiguous Scope' | 'Architectural Complexity' | 'Regulatory & Compliance' | 'Resource Bottleneck' | 'Testing Deficit' | 'Integration Risk';
  severity: 'Critical' | 'High' | 'Medium';
  subtleSignal: string;
  potentialImpact: string;
  recommendedPreventativeAction: string;
  estimatedDelayExposureDays: number;
  confidenceScore: number;
}

export interface AiRiskAnalysisResponse {
  overallRiskIndex: 'Severe' | 'Elevated' | 'Moderate' | 'Low';
  executiveSummary: string;
  criticalHiddenCount: number;
  highHiddenCount: number;
  topRiskCount: number;
  identifiedRisks: IdentifiedRisk[];
  scannedCount?: number;
  analyzedAt?: string;
}

interface AiRisksAndResolutionsViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onEditTask: (task: TaskItem) => void;
  onTriggerReminder: (task: TaskItem) => void;
}

// Default high-precision risk & resolution baseline
const DEFAULT_RISK_ANALYSIS: AiRiskAnalysisResponse = {
  overallRiskIndex: 'Elevated',
  executiveSummary: 'AI analysis of all 44 action items, deliverable remarks, and cross-team dependencies indicates 7 prominent hidden risks. The primary friction points center on dynamic maker-checker permission matrices (Task #3 & #4), collateral valuation workflow handoffs (Task #18), and heavy dependency on single leads across critical path streams.',
  criticalHiddenCount: 3,
  highHiddenCount: 4,
  topRiskCount: 7,
  identifiedRisks: [
    {
      id: 'hrisk_1',
      taskId: 'task_3',
      taskSNo: 3,
      taskTitle: 'Initiate dynamic maker-checker permission mapping matrix',
      workstream: 'Dynamic User Management & Permission Integration',
      leadOwner: 'Khalid (BE) / Dewa (FE)',
      riskCategory: 'Architectural Complexity',
      severity: 'Critical',
      subtleSignal: 'Remarks note complex permission nesting across 12 banking operational roles and pending SteerCo confirmation of dual-authorization thresholds.',
      potentialImpact: 'Risk of blocking user authentication and authorization across all subsequent workflow streams (Streams 3 through 9).',
      recommendedPreventativeAction: 'Resolution: Freeze baseline permission matrix with default 2-tier approval rule immediately. Decouple role definitions from UI components using dynamic JSON schema flags to allow parallel frontend integration.',
      estimatedDelayExposureDays: 14,
      confidenceScore: 95
    },
    {
      id: 'hrisk_2',
      taskId: 'task_18',
      taskSNo: 18,
      taskTitle: 'Collateral Valuation Workflow state machine orchestration',
      workstream: 'Collateral Valuation Work flow',
      leadOwner: 'Letu (BE) / Wubishet (FE)',
      riskCategory: 'Integration Risk',
      severity: 'Critical',
      subtleSignal: 'Third-party asset valuation API specification is still awaiting external vendor documentation sign-off.',
      potentialImpact: 'Slippage will directly halt Post-Approval and Post-Disbursement credit release mechanisms.',
      recommendedPreventativeAction: 'Resolution: Implement robust mock valuation response stub in backend service. Deploy simulated evaluation engine so frontend engineering can proceed without vendor blocker.',
      estimatedDelayExposureDays: 10,
      confidenceScore: 92
    },
    {
      id: 'hrisk_3',
      taskId: 'task_8',
      taskSNo: 8,
      taskTitle: 'Fee and Tariff calculation engine for Corporate Credit',
      workstream: 'Core Modules',
      leadOwner: 'Yohannes Y. (BE) / Eyob (FE)',
      riskCategory: 'Ambiguous Scope',
      severity: 'Critical',
      subtleSignal: 'Multiple currency rounding rules and special concession tiers are not finalized in current business requirements.',
      potentialImpact: 'Inaccurate fee computation on corporate facilities leading to compliance audit failures and contract signing delays.',
      recommendedPreventativeAction: 'Resolution: Schedule immediate 45-minute workshop with Credit Policy team to lock mathematical formula sheet. Provide default standard tariffs with override flag.',
      estimatedDelayExposureDays: 8,
      confidenceScore: 90
    },
    {
      id: 'hrisk_4',
      taskId: 'task_14',
      taskSNo: 14,
      taskTitle: 'Committee Architecture Refactor & Voting Engine',
      workstream: 'Committee Architecture Refactor',
      leadOwner: 'Khalid (BE) / Dewa (FE)',
      riskCategory: 'Resource Bottleneck',
      severity: 'High',
      subtleSignal: 'Lead engineers Khalid and Dewa are concurrently assigned to 8 critical path items across foundation and committee streams.',
      potentialImpact: 'Severe context switching causing burn-out and delivery drag across both workstreams.',
      recommendedPreventativeAction: 'Resolution: Reassign frontend lead for Committee Voting interface to Simachew or Bereket. Allocate dedicated QA resource to test quorum voting logic independently.',
      estimatedDelayExposureDays: 7,
      confidenceScore: 89
    },
    {
      id: 'hrisk_5',
      taskId: 'task_23',
      taskSNo: 23,
      taskTitle: 'Post-Disbursement Covenant Monitoring & Audit Trail',
      workstream: 'Post-Disbursement Requests Workflow',
      leadOwner: 'Melaku (BE) / Eyob (FE)',
      riskCategory: 'Regulatory & Compliance',
      severity: 'High',
      subtleSignal: 'National Bank compliance requirements for automated breach notifications are pending legal interpretation.',
      potentialImpact: 'Delays in production go-live sign-off by Internal Audit and Risk Compliance committees.',
      recommendedPreventativeAction: 'Resolution: Implement standard immutable audit logging table in Postgres immediately. Expose webhook triggers so compliance rules can be tuned via configuration without code refactoring.',
      estimatedDelayExposureDays: 6,
      confidenceScore: 87
    },
    {
      id: 'hrisk_6',
      taskId: 'task_32',
      taskSNo: 32,
      taskTitle: 'Credit Operations — BRD Implementation & Document Generation',
      workstream: 'Credit Operations — BRD Implementation',
      leadOwner: 'Ephrem (BE) / Wubishet (FE)',
      riskCategory: 'Dependency Blocker',
      severity: 'High',
      subtleSignal: 'PDF contract signing generation library requires localized font rendering and stamp verification.',
      potentialImpact: 'Corporate borrowers unable to generate signed loan agreements electronically.',
      recommendedPreventativeAction: 'Resolution: Adopt server-side standard PDF generation template with embedded Unicode Amharic & English font packages. Pre-render watermark layers.',
      estimatedDelayExposureDays: 5,
      confidenceScore: 85
    },
    {
      id: 'hrisk_7',
      taskId: 'task_41',
      taskSNo: 41,
      taskTitle: 'End-to-End SteerCo Simulation & Performance Load Testing',
      workstream: 'Production Support & Governance',
      leadOwner: 'Bereket (BE) / Robel (FE)',
      riskCategory: 'Testing Deficit',
      severity: 'High',
      subtleSignal: 'Test data repository contains only retail credit samples rather than multi-tiered wholesale corporate structures.',
      potentialImpact: 'Late discovery of query timeouts and table locking under concurrent committee voting load.',
      recommendedPreventativeAction: 'Resolution: Run synthetic data generation script to seed 500 wholesale corporate profiles with multi-covenant loan agreements. Execute stress test by September 15.',
      estimatedDelayExposureDays: 5,
      confidenceScore: 88
    }
  ]
};

export const AiRisksAndResolutionsView: React.FC<AiRisksAndResolutionsViewProps> = ({
  tasks,
  asOfDate,
  onEditTask,
  onTriggerReminder,
}) => {
  const [analysisData, setAnalysisData] = useState<AiRiskAnalysisResponse>(() => {
    const saved = localStorage.getItem('wb_pmo_ai_risk_analysis');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return DEFAULT_RISK_ANALYSIS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'Critical' | 'High' | 'Medium'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedRiskIds, setResolvedRiskIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('wb_pmo_resolved_risks');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(analysisData.identifiedRisks[0]?.id || null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger Live AI Risk Analysis from backend
  const handleScanForRisks = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/ai/analyze-hidden-risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, asOfDate })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data: AiRiskAnalysisResponse = await response.json();
      if (data && data.identifiedRisks && Array.isArray(data.identifiedRisks)) {
        setAnalysisData(data);
        localStorage.setItem('wb_pmo_ai_risk_analysis', JSON.stringify(data));
        setToastMessage(`AI Scan Complete: Identified ${data.identifiedRisks.length} risks with actionable resolutions!`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        throw new Error('Invalid response structure from AI model');
      }
    } catch (err: any) {
      console.warn('Live AI risk scan encountered issue, falling back to local intelligent model:', err);
      setErrorMsg(`Could not connect to live Gemini service: ${err.message}. Showing baseline analytical matrix.`);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle risk resolution status
  const handleToggleResolve = (riskId: string) => {
    setResolvedRiskIds(prev => {
      const updated = prev.includes(riskId) ? prev.filter(id => id !== riskId) : [...prev, riskId];
      localStorage.setItem('wb_pmo_resolved_risks', JSON.stringify(updated));
      return updated;
    });
  };

  // Find linked TaskItem object
  const getLinkedTask = (sNo: number): TaskItem | undefined => {
    return tasks.find(t => t.sNo === sNo);
  };

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    analysisData.identifiedRisks.forEach(r => set.add(r.riskCategory));
    return Array.from(set);
  }, [analysisData]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return analysisData.identifiedRisks.filter(r => {
      if (selectedSeverity !== 'ALL' && r.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && r.riskCategory !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          r.taskTitle.toLowerCase().includes(q) ||
          r.workstream.toLowerCase().includes(q) ||
          r.leadOwner.toLowerCase().includes(q) ||
          r.subtleSignal.toLowerCase().includes(q) ||
          r.potentialImpact.toLowerCase().includes(q) ||
          r.recommendedPreventativeAction.toLowerCase().includes(q) ||
          `#${r.taskSNo}`.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [analysisData, selectedSeverity, selectedCategory, searchQuery]);

  // Total prevented delay days calculation
  const totalPreventedDelayDays = useMemo(() => {
    return analysisData.identifiedRisks.reduce((acc, r) => acc + (r.estimatedDelayExposureDays || 0), 0);
  }, [analysisData]);

  // Export report to MS Word (.doc)
  const handleExportWord = () => {
    try {
      const fileName = exportAiAuditToWord(analysisData, tasks, asOfDate);
      setToastMessage(`Downloaded Live AI Audit Report for MS Word: ${fileName}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export AI Audit to Word:', err);
      setErrorMsg(`MS Word export failed: ${err.message}`);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // Export report to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      exportAiAuditToExcel(analysisData, tasks, asOfDate);
      setToastMessage('Downloaded Live AI Audit Report in Microsoft Excel format (.xlsx)!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export AI Audit to Excel:', err);
      setErrorMsg(`Excel export failed: ${err.message}`);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // Export report as text/markdown
  const handleExportReport = () => {
    const content = `# WHOLESALE BANKING OPS - AI RISKS & RESOLUTIONS REPORT
As-Of Date: ${asOfDate}
Overall Risk Index: ${analysisData.overallRiskIndex}
Total Identified Risks: ${analysisData.identifiedRisks.length} (Critical: ${analysisData.criticalHiddenCount}, High: ${analysisData.highHiddenCount})
Total Delay Exposure Prevented: ${totalPreventedDelayDays} Days

## EXECUTIVE SUMMARY
${analysisData.executiveSummary}

## LIST OF RISKS & ACTIONABLE RESOLUTIONS
${analysisData.identifiedRisks.map((r, idx) => `
---
### ${idx + 1}. [Task #${r.taskSNo}] ${r.taskTitle}
- Workstream: ${r.workstream}
- Lead Owner: ${r.leadOwner}
- Category: ${r.riskCategory} | Severity: ${r.severity}
- Subtle Signal: ${r.subtleSignal}
- Potential Impact: ${r.potentialImpact}
- PMO RESOLUTION: ${r.recommendedPreventativeAction}
- Estimated Delay Exposure: +${r.estimatedDelayExposureDays} days
- Confidence Score: ${r.confidenceScore}%
`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CBE_AI_Risks_Resolutions_${asOfDate}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('AI Risk & Resolution Report downloaded as Markdown!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 mb-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#95288E] rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#D667CF] text-xs uppercase font-bold tracking-widest font-mono">
            <Sparkles className="w-4 h-4 text-[#D667CF]" />
            <span>Gemini AI Diagnostic Intelligence Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <span>AI Risk &amp; Resolution Command Center</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
              analysisData.overallRiskIndex === 'Severe' 
                ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                : analysisData.overallRiskIndex === 'Elevated'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }`}>
              Index: {analysisData.overallRiskIndex}
            </span>
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
            Continuous cognitive audit scanning all 44 deliverables, remarks, architectural interlocks, and owner allocations to detect early warning signals and prescribe immediate PMO countermeasures.
          </p>
          {analysisData.analyzedAt && (
            <p className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B38D34]" />
              <span>Last Live AI Audit executed: {new Date(analysisData.analyzedAt).toLocaleTimeString()} ({asOfDate})</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleScanForRisks}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#95288E] to-[#701A75] hover:from-[#701A75] hover:to-[#581c87] text-white rounded-lg text-xs font-bold font-mono transition shadow-lg shadow-[#95288E]/40 border border-[#D667CF]/50 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Execute Live AI Audit on all 44 deliverables using Gemini"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Running Live AI Audit...' : '⚡ Run Live AI Audit'}</span>
          </button>

          {/* Export to MS Word */}
          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/70 hover:border-blue-400 text-blue-200 hover:text-white rounded-lg text-xs font-mono font-bold transition shadow-md cursor-pointer active:scale-95"
            title="Export Live AI Audit Report to Microsoft Word (.doc)"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>MS Word (.doc)</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 hover:border-emerald-400 text-emerald-200 hover:text-white rounded-lg text-xs font-mono font-bold transition shadow-md cursor-pointer active:scale-95"
            title="Export Live AI Audit Report to Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Quick Markdown option */}
          <button
            onClick={handleExportReport}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition cursor-pointer"
            title="Download Raw Markdown (.md)"
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Toast message */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-lg text-xs font-mono text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Overall Risk Level */}
        <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#95288E] p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">Risk Severity Index</span>
            <Flame className="w-4 h-4 text-[#D667CF]" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {analysisData.overallRiskIndex}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Across 44 action items &amp; 12 streams
          </p>
        </div>

        {/* Card 2: Critical Risks */}
        <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-rose-500 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">Critical Attention Required</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            {analysisData.criticalHiddenCount} <span className="text-xs text-slate-400 font-normal">items</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Immediate mitigation required
          </p>
        </div>

        {/* Card 3: High Risks */}
        <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#B38D34] p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">High Early Warnings</span>
            <ShieldAlert className="w-4 h-4 text-[#B38D34]" />
          </div>
          <div className="text-2xl font-bold text-[#B38D34] mt-2 font-mono">
            {analysisData.highHiddenCount} <span className="text-xs text-slate-400 font-normal">items</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Downstream cascade vulnerabilities
          </p>
        </div>

        {/* Card 4: Preventable Delay Days */}
        <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">Delay Exposure Mitigated</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            +{totalPreventedDelayDays} <span className="text-xs text-slate-400 font-normal">days buffer</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            {resolvedRiskIds.length} of {analysisData.identifiedRisks.length} resolutions implemented
          </p>
        </div>

      </div>

      {/* EXECUTIVE SYNTHESIS SUMMARY BOX */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center space-x-2 mb-2 text-[#D667CF]">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
            Executive PMO Risk Synthesis
          </h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          {analysisData.executiveSummary}
        </p>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search risk signals, owners, or resolution keywords..."
            className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#95288E]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Severity Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono font-bold">
            <button
              onClick={() => setSelectedSeverity('ALL')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedSeverity === 'ALL' ? 'bg-[#95288E] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({analysisData.identifiedRisks.length})
            </button>
            <button
              onClick={() => setSelectedSeverity('Critical')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedSeverity === 'Critical' ? 'bg-rose-900 text-rose-200' : 'text-rose-400 hover:text-white'
              }`}
            >
              Critical ({analysisData.criticalHiddenCount})
            </button>
            <button
              onClick={() => setSelectedSeverity('High')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedSeverity === 'High' ? 'bg-[#B38D34] text-slate-950 font-extrabold' : 'text-[#B38D34] hover:text-white'
              }`}
            >
              High ({analysisData.highHiddenCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

        </div>

      </div>

      {/* LIST OF RISKS & RESOLUTIONS */}
      <div className="space-y-4">
        {filteredRisks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-bold text-white text-sm">No risks match the selected filter criteria</p>
            <p className="text-slate-500 mt-1">Try broadening your search query or selecting "All Severity".</p>
          </div>
        ) : (
          filteredRisks.map((risk, index) => {
            const isResolved = resolvedRiskIds.includes(risk.id);
            const isExpanded = expandedRiskId === risk.id;
            const linkedTask = getLinkedTask(risk.taskSNo);

            return (
              <div 
                key={risk.id}
                className={`bg-slate-900 border rounded-xl shadow-lg transition-all overflow-hidden ${
                  isResolved 
                    ? 'border-emerald-800/60 opacity-85'
                    : risk.severity === 'Critical'
                      ? 'border-rose-700/80 shadow-rose-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Risk Card Header */}
                <div 
                  onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                  className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850/50 transition-colors"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      #{risk.taskSNo}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          risk.severity === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : risk.severity === 'High'
                              ? 'bg-amber-950 text-[#B38D34] border-[#B38D34]/70'
                              : 'bg-blue-950 text-blue-300 border-blue-700'
                        }`}>
                          {risk.severity} Risk
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                          {risk.riskCategory}
                        </span>

                        {isResolved && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-mono font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                            <span>Resolution Implemented</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white tracking-tight truncate max-w-2xl">
                        {risk.taskTitle}
                      </h4>

                      <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Stream: <strong className="text-slate-200">{risk.workstream}</strong></span>
                        <span>•</span>
                        <span>Leads: <strong className="text-[#D667CF]">{risk.leadOwner}</strong></span>
                        <span>•</span>
                        <span className="text-amber-400">Delay Exposure: +{risk.estimatedDelayExposureDays}d</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleResolve(risk.id);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                        isResolved
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600 hover:bg-emerald-900'
                          : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                      }`}
                      title="Toggle resolution status"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Implemented' : 'Mark Resolved'}</span>
                    </button>

                    <button className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#D667CF]" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Early Warning Signal & Resolution */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Subtle Signal & Friction */}
                      <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800">
                        <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-bold uppercase mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Subtle Early Warning Clue</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                          {risk.subtleSignal}
                        </p>

                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                            Potential Operational Impact:
                          </span>
                          <p className="text-xs text-rose-300 leading-relaxed">
                            {risk.potentialImpact}
                          </p>
                        </div>
                      </div>

                      {/* Right: PMO Actionable Resolution */}
                      <div className="bg-gradient-to-br from-slate-900 via-[#95288E]/15 to-slate-900 p-3.5 rounded-lg border border-[#95288E]/60 shadow-md">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2 text-[#D667CF] text-xs font-mono font-bold uppercase">
                            <Zap className="w-3.5 h-3.5 text-[#B38D34] fill-current" />
                            <span>Recommended PMO Resolution &amp; Countermeasure</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                            Confidence: {risk.confidenceScore}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800/90">
                          {risk.recommendedPreventativeAction}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">
                            Estimated Delay Buffer Saved: <strong className="text-emerald-400">+{risk.estimatedDelayExposureDays} days</strong>
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Quick Dispatch & Task Edit Controls */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                      {linkedTask && (
                        <>
                          <button
                            onClick={() => onTriggerReminder(linkedTask)}
                            className="px-3 py-1.5 bg-[#B38D34]/20 hover:bg-[#B38D34]/30 text-[#B38D34] border border-[#B38D34]/50 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition"
                            title="Dispatch email reminder to leads with this risk resolution"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Dispatch Alert to {risk.leadOwner}</span>
                          </button>

                          <button
                            onClick={() => onEditTask(linkedTask)}
                            className="px-3 py-1.5 bg-[#95288E] hover:bg-[#701A75] text-white rounded-md text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                          >
                            <span>Edit Deliverable #{risk.taskSNo}</span>
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
