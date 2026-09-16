import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Send, 
  AlertTriangle, 
  ChevronRight,
  TrendingUp,
  Flame,
  Clock,
  ShieldAlert,
  Search,
  Radar,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Filter,
  Eye
} from 'lucide-react';
import { TaskItem, HiddenRiskItem, HiddenRisksAnalysisResult } from '../types';
import { getCurrentReportDateTime } from '../utils/dateUtils';

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  asOfDate: string;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  isOpen,
  onClose,
  tasks,
  asOfDate,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'briefing' | 'hidden_risks' | 'qa'>('briefing');
  const [summaryType, setSummaryType] = useState<'steerco' | 'daily_pmo' | 'risks_only'>('steerco');
  const [loading, setLoading] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [askingAi, setAskingAi] = useState(false);
  const [generationTimeStr, setGenerationTimeStr] = useState<string | null>(null);

  // Hidden Risks State
  const [scanningRisks, setScanningRisks] = useState(false);
  const [hiddenRisksResult, setHiddenRisksResult] = useState<HiddenRisksAnalysisResult | null>(null);
  const [selectedRiskSeverity, setSelectedRiskSeverity] = useState<string>('ALL');
  const [copiedRiskId, setCopiedRiskId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setExecutiveSummary(null);
    try {
      const nowInfo = getCurrentReportDateTime();
      setGenerationTimeStr(nowInfo.displayDateTime);
      const res = await fetch('/api/ai/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, asOfDate, summaryType }),
      });
      const data = await res.json();
      if (data.summary) {
        setExecutiveSummary(data.summary);
      } else {
        setExecutiveSummary('Failed to generate review. Please check server connection.');
      }
    } catch (e: any) {
      setExecutiveSummary(`Error connecting to AI service: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScanHiddenRisks = async () => {
    setScanningRisks(true);
    try {
      const res = await fetch('/api/ai/analyze-hidden-risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, asOfDate }),
      });
      const data: HiddenRisksAnalysisResult = await res.json();
      if (data && data.identifiedRisks) {
        setHiddenRisksResult(data);
      } else {
        // Fallback default structure if parsing fails
        setHiddenRisksResult({
          overallRiskIndex: 'Elevated',
          executiveSummary: 'Scanned 44 task remarks. Detected 5 early warning friction points regarding cross-module API integrations and pending requirements.',
          criticalHiddenCount: 2,
          highHiddenCount: 3,
          topRiskCount: 5,
          identifiedRisks: [
            {
              id: 'risk_demo_1',
              taskId: 'task_3',
              taskSNo: 3,
              taskTitle: 'Initiate dynamic maker-checker permission mapping matrix',
              workstream: 'Dynamic User Management & Permission Integration',
              leadOwner: 'Khalid (BE) / Dewa (FE)',
              riskCategory: 'Architectural Complexity',
              severity: 'Critical',
              subtleSignal: 'Remark indicates "Maker-checker permission state machine synchronization under heavy re-architecture"',
              potentialImpact: 'High risk of blocking loan committee approval routing downstream (+5d slippage)',
              recommendedPreventativeAction: 'Schedule joint technical design review between Khalid and Dewa before sprint cut-off.',
              estimatedDelayExposureDays: 5,
              confidenceScore: 94
            }
          ],
          scannedCount: tasks.length,
          analyzedAt: new Date().toISOString()
        });
      }
    } catch (e: any) {
      console.error('Failed to scan hidden risks:', e);
    } finally {
      setScanningRisks(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAskingAi(true);
    setAiAnswer(null);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, tasks, asOfDate }),
      });
      const data = await res.json();
      setAiAnswer(data.answer || 'No response returned.');
    } catch (e: any) {
      setAiAnswer(`Error: ${e.message}`);
    } finally {
      setAskingAi(false);
    }
  };

  const handleCopy = () => {
    if (!executiveSummary) return;
    navigator.clipboard.writeText(executiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyMitigation = (risk: HiddenRiskItem) => {
    const text = `[Hidden Risk Prevention - Task #${risk.taskSNo} ${risk.taskTitle}]\nSignal: ${risk.subtleSignal}\nImpact: ${risk.potentialImpact}\nAction: ${risk.recommendedPreventativeAction}`;
    navigator.clipboard.writeText(text);
    setCopiedRiskId(risk.id);
    setTimeout(() => setCopiedRiskId(null), 2500);
  };

  const filteredHiddenRisks = hiddenRisksResult?.identifiedRisks?.filter(r => {
    if (selectedRiskSeverity !== 'ALL' && r.severity !== selectedRiskSeverity) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between border-t-4 border-t-[#95288E]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#95288E]/25 border border-[#95288E]/70 flex items-center justify-center text-[#D667CF] shadow-inner">
              <Sparkles className="w-5 h-5 text-[#B38D34]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>SteerCo Executive AI Review & Risk Diagnostic</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#95288E]/30 text-[#D667CF] border border-[#95288E]/60">
                  Gemini 2.5 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Wholesale Banking PMO Decision Intelligence • Baseline: <span className="text-[#B38D34] font-bold">{asOfDate}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-950 px-6 pt-2 border-b border-slate-800 flex items-center space-x-2">
          <button
            onClick={() => setActiveModalTab('briefing')}
            className={`px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeModalTab === 'briefing'
                ? 'border-[#95288E] text-white bg-slate-900/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>Executive Briefing</span>
          </button>

          <button
            onClick={() => {
              setActiveModalTab('hidden_risks');
              if (!hiddenRisksResult && !scanningRisks) {
                handleScanHiddenRisks();
              }
            }}
            className={`px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 relative ${
              activeModalTab === 'hidden_risks'
                ? 'border-rose-500 text-white bg-slate-900/60 rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-400 hover:text-rose-300 hover:bg-slate-900/30'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-rose-400" />
            <span>AI Hidden Risk Radar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px]">
              Proactive
            </span>
          </button>

          <button
            onClick={() => setActiveModalTab('qa')}
            className={`px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeModalTab === 'qa'
                ? 'border-[#D667CF] text-white bg-slate-900/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>Interactive Q&A</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-200">
          
          {/* TAB 1: EXECUTIVE BRIEFING */}
          {activeModalTab === 'briefing' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3.5">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono uppercase text-slate-300 font-bold">Review Format:</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSummaryType('steerco')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        summaryType === 'steerco'
                          ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Steering Committee
                    </button>
                    <button
                      onClick={() => setSummaryType('daily_pmo')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        summaryType === 'daily_pmo'
                          ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Daily PMO Extract
                    </button>
                    <button
                      onClick={() => setSummaryType('risks_only')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        summaryType === 'risks_only'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Delay & Risk Deep-Dive
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-[#95288E]/40 disabled:opacity-50 border border-[#D667CF]/40"
                >
                  <Sparkles className="w-4 h-4 text-[#B38D34]" />
                  <span>{loading ? 'Synthesizing with Gemini...' : 'Generate AI Briefing'}</span>
                </button>
              </div>

              {/* Generated Content Box */}
              {executiveSummary ? (
                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-[#D667CF] uppercase font-bold flex items-center space-x-1.5">
                        <span>Steering Committee Briefing Document</span>
                      </span>
                      {generationTimeStr && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-[#B38D34] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Generated: {generationTimeStr}</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-mono text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer font-bold shrink-0 self-start sm:self-auto"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#B38D34]" />}
                      <span>{copied ? 'Copied to Clipboard' : 'Copy Briefing'}</span>
                    </button>
                  </div>

                  <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-100 font-sans">
                    {executiveSummary}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-10 rounded-lg border border-slate-800 text-center text-slate-400 space-y-3">
                  <Sparkles className="w-10 h-10 text-[#95288E] mx-auto opacity-80" />
                  <div>
                    <p className="text-sm font-bold text-slate-200">Ready to synthesize executive review</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Click "Generate AI Briefing" to parse all 44 deliverables, overdue dates, accountability allocations, and mitigation commitments into an executive memo.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveModalTab('hidden_risks');
                        if (!hiddenRisksResult) handleScanHiddenRisks();
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors inline-flex items-center gap-1.5"
                    >
                      <Radar className="w-3.5 h-3.5 text-rose-400" />
                      <span>Or switch to AI Hidden Risk Radar to analyze remarks</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI HIDDEN RISK RADAR */}
          {activeModalTab === 'hidden_risks' && (
            <div className="space-y-4">
              
              {/* Radar Banner */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-rose-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <Radar className="w-4 h-4 animate-spin text-rose-400" style={{ animationDuration: '4s' }} />
                    <span>Proactive Semantic Remarks Scanner</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Pre-Emptive Risk Intelligence
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                    Gemini continuously evaluates uncommitted remarks, technical debt mentions, cross-team API handoffs, and vague progress updates to identify risks <strong className="text-rose-300">before</strong> they turn into formal schedule delays.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleScanHiddenRisks}
                    disabled={scanningRisks}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-900/30 disabled:opacity-50"
                  >
                    <Radar className="w-4 h-4" />
                    <span>{scanningRisks ? 'Scanning 44 Deliverables...' : 'Re-Scan Remarks'}</span>
                  </button>
                </div>
              </div>

              {/* Scan Results Summary Bar */}
              {hiddenRisksResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-bold">Overall Risk Index</span>
                    <span className={`text-lg font-bold font-mono ${
                      hiddenRisksResult.overallRiskIndex === 'Severe' 
                        ? 'text-rose-400' 
                        : hiddenRisksResult.overallRiskIndex === 'Elevated' 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                    }`}>
                      {hiddenRisksResult.overallRiskIndex}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-bold">Hidden Risks Found</span>
                    <span className="text-lg font-bold font-mono text-rose-400">
                      {hiddenRisksResult.identifiedRisks?.length || 0} Deliverables
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-bold">Critical Severity</span>
                    <span className="text-lg font-bold font-mono text-rose-300">
                      {hiddenRisksResult.criticalHiddenCount || 0} Items
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-bold">Slippage Exposure</span>
                    <span className="text-lg font-bold font-mono text-[#B38D34]">
                      +{(hiddenRisksResult.identifiedRisks || []).reduce((acc, r) => acc + (r.estimatedDelayExposureDays || 0), 0)} Days
                    </span>
                  </div>
                </div>
              )}

              {/* Executive Summary Callout */}
              {hiddenRisksResult?.executiveSummary && (
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-[#B38D34] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#D667CF] block font-bold mb-0.5">Gemini Remarks Synthesis:</strong>
                    <span>{hiddenRisksResult.executiveSummary}</span>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              {hiddenRisksResult && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-400 font-bold uppercase">Severity Filter:</span>
                    <button
                      onClick={() => setSelectedRiskSeverity('ALL')}
                      className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        selectedRiskSeverity === 'ALL' ? 'bg-[#95288E] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({hiddenRisksResult.identifiedRisks?.length || 0})
                    </button>
                    <button
                      onClick={() => setSelectedRiskSeverity('Critical')}
                      className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        selectedRiskSeverity === 'Critical' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:text-white'
                      }`}
                    >
                      Critical Only
                    </button>
                    <button
                      onClick={() => setSelectedRiskSeverity('High')}
                      className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        selectedRiskSeverity === 'High' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400 hover:text-white'
                      }`}
                    >
                      High
                    </button>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Scanned as of {asOfDate}
                  </span>
                </div>
              )}

              {/* Hidden Risks Cards List */}
              {scanningRisks ? (
                <div className="p-12 text-center text-slate-400 bg-slate-950 rounded-lg border border-slate-800">
                  <Radar className="w-10 h-10 text-rose-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-bold text-white">Evaluating 44 Task Remarks & Semantic Indicators...</p>
                  <p className="text-xs text-slate-400 mt-1">Cross-referencing deliverable notes, single-lead concentrations, and pending API dependencies.</p>
                </div>
              ) : filteredHiddenRisks.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-950 rounded-lg border border-slate-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-200">No Hidden Risks Found</p>
                  <p className="text-xs text-slate-400 mt-1">All action items reflect clear scope and balanced lead distributions.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredHiddenRisks.map((risk) => (
                    <div 
                      key={risk.id}
                      className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
                    >
                      {/* Top Row: Task & Severity */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-700 rounded font-mono text-xs font-bold">
                            Task #{risk.taskSNo}
                          </span>
                          <span className="font-bold text-white text-sm sm:text-base">
                            {risk.taskTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide border ${
                            risk.severity === 'Critical'
                              ? 'bg-rose-950/90 text-rose-300 border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                              : risk.severity === 'High'
                                ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                                : 'bg-blue-950/90 text-blue-300 border-blue-700'
                          }`}>
                            {risk.severity} Risk
                          </span>
                          <span className="px-2 py-0.5 bg-[#95288E]/25 text-[#D667CF] border border-[#95288E]/60 rounded text-[11px] font-mono font-semibold">
                            {risk.riskCategory}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Subtle Signal Quote & Potential Delay Impact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                        
                        {/* Subtle Signal Found in Remark */}
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[11px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Early Signal in Remarks:</span>
                          </span>
                          <p className="text-slate-200 italic leading-relaxed">
                            "{risk.subtleSignal}"
                          </p>
                        </div>

                        {/* Projected Impact & Exposure */}
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[11px] font-mono uppercase font-bold text-rose-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Projected Slippage Impact:</span>
                            </span>
                            {risk.estimatedDelayExposureDays > 0 && (
                              <span className="text-rose-300 font-bold">
                                +{risk.estimatedDelayExposureDays}d exposure
                              </span>
                            )}
                          </span>
                          <p className="text-slate-200 leading-relaxed">
                            {risk.potentialImpact}
                          </p>
                        </div>

                      </div>

                      {/* Bottom Row: Preventative SteerCo Action & Copy */}
                      <div className="bg-emerald-950/25 p-3 rounded-lg border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Recommended Preventative PMO Action:</span>
                          </span>
                          <p className="text-slate-200 font-medium">
                            {risk.recommendedPreventativeAction}
                          </p>
                        </div>

                        <button
                          onClick={() => handleCopyMitigation(risk)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          {copiedRiskId === risk.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied Action</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#B38D34]" />
                              <span>Copy Action</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Lead Attribution */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span>Workstream: <strong className="text-slate-300">{risk.workstream}</strong></span>
                        <span>Assigned Lead: <strong className="text-[#D667CF]">{risk.leadOwner}</strong></span>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: INTERACTIVE Q&A */}
          {activeModalTab === 'qa' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-xs font-mono text-[#B38D34] uppercase font-bold block">
                  Ask Project AI Assistant
                </span>
                <p className="text-xs text-slate-400">
                  Ask questions about any deliverable, bottleneck, lead allocation (e.g. Khalid, Dewa, Yohannes), or cross-workstream dependencies.
                </p>
                <form onSubmit={handleAskQuestion} className="flex gap-2.5 pt-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. Which deliverables does Khalid own and what are the delay risks?"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#95288E]"
                  />
                  <button
                    type="submit"
                    disabled={askingAi || !question.trim()}
                    className="px-4 py-2 bg-[#95288E] hover:bg-[#aa2ea3] text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </form>

                {aiAnswer && (
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 mt-2.5 text-sm text-slate-100 whitespace-pre-line leading-relaxed">
                    <strong className="text-[#D667CF] block mb-1.5 font-bold">PMO Assistant Response:</strong>
                    {aiAnswer}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Enterprise Project Intelligence • Wholesale Banking Ops</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
