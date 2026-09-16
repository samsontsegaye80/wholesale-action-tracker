import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Flame, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Tag, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';

interface DelayReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onSave: (updatedTask: TaskItem) => void;
  asOfDate: string;
}

const COMMON_REASON_PRESETS = [
  'Pending formal BRD sign-off & requirements freeze from Legal / Compliance.',
  'External Central Bank / National Bank of Ethiopia (NBE) API specification interface pending.',
  'Upstream workflow dependency bottleneck from prior stage review.',
  'Engineering lead capacity temporarily diverted to critical hypercare defect triage.',
  'Dynamic Lending Limit (DLL) rule matrix undergoing credit risk revaluation.',
  'Collateral site valuation certificate & title clearance document latency.',
  'Complex frontend route protection & token refresh boundary refactor in progress.',
  'Awaiting final user acceptance sign-off from Wholesale Operations senior management.'
];

const COMMON_MITIGATION_PRESETS = [
  'Scheduled paired architecture session between tech leads to unblock API interfaces.',
  'Escalated to Project SteerCo for fast-tracked BRD sign-off and requirement freeze.',
  'Reassigned dedicated secondary frontend lead to accelerate component delivery.',
  'Established daily 15-minute morning standup with risk and compliance owners.',
  'Adopted mock contract payload response to decouple frontend dev from downstream service.',
  'Parallelized test verification and deployment script automation in staging environment.'
];

export const DelayReasonModal: React.FC<DelayReasonModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  asOfDate,
}) => {
  if (!isOpen || !task) return null;

  const [delayReason, setDelayReason] = useState<string>(task.delayReason || '');
  const [mitigationPlan, setMitigationPlan] = useState<string>(task.mitigationPlan || '');
  const [delayDays, setDelayDays] = useState<number>(task.delayDays || 1);
  const [status, setStatus] = useState<TaskStatus>(task.status || 'Delayed');
  const [remark, setRemark] = useState<string>(task.remark || '');
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on open to write reason immediately
  useEffect(() => {
    if (isOpen) {
      setDelayReason(task.delayReason || '');
      setMitigationPlan(task.mitigationPlan || '');
      setDelayDays(task.delayDays || (task.status === 'Delayed' ? 3 : 1));
      setStatus(task.status || 'Delayed');
      setRemark(task.remark || '');

      // Focus the textarea right away
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, task]);

  const handleApplyReasonPreset = (preset: string) => {
    if (!delayReason.trim()) {
      setDelayReason(preset);
    } else {
      setDelayReason(prev => `${prev} • ${preset}`);
    }
    setCopiedPreset(preset);
    setTimeout(() => setCopiedPreset(null), 2000);
  };

  const handleApplyMitigationPreset = (preset: string) => {
    if (!mitigationPlan.trim()) {
      setMitigationPlan(preset);
    } else {
      setMitigationPlan(prev => `${prev} • ${preset}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TaskItem = {
      ...task,
      delayReason: delayReason.trim(),
      mitigationPlan: mitigationPlan.trim(),
      delayDays: Number(delayDays) || 0,
      status: status,
      remark: remark.trim(),
      lastUpdated: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-xs font-mono font-bold">
                  Task #{task.sNo < 10 ? `0${task.sNo}` : task.sNo}
                </span>
                <span className="px-2 py-0.5 bg-rose-950/90 text-rose-300 border border-rose-800/90 rounded text-xs font-bold font-mono">
                  {task.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target: {task.endDate}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1 line-clamp-1">
                {task.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex-1">
          
          {/* Top row: Delay Days and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 text-xs uppercase font-bold font-mono mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Delay Horizon (Days)</span>
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-rose-400 font-mono font-bold text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs uppercase font-bold font-mono mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#D667CF]" />
                <span>Current Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-[#D667CF]"
              >
                <option value="Delayed">Delayed</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="No BRD">No BRD</option>
                <option value="Partial">Partial</option>
                <option value="Not Started">Not Started</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Primary Field: Reason for Delay (Focused on Open) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-rose-300 text-xs uppercase font-bold font-mono flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Identified Delay Root Cause &amp; Technical Impact *</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Cursor ready — write reason below</span>
            </div>
            <textarea
              ref={textareaRef}
              rows={3}
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="Detail the exact technical, regulatory, or operational blocker causing this deliverable to slip..."
              className="w-full bg-slate-950 border border-rose-500/60 rounded-md p-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 leading-relaxed shadow-inner"
              required
            />
          </div>

          {/* 1-Click Fast Reason Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-mono font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#B38D34]" />
              <span>1-Click Banking PMO Root Cause Presets (Click to insert):</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {COMMON_REASON_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyReasonPreset(preset)}
                  className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 border border-slate-700/80 rounded text-[11px] font-sans text-left transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="text-rose-400 font-bold">+</span>
                  <span className="line-clamp-1">{preset}</span>
                  {copiedPreset === preset && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mitigation / Recovery Plan */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[#D667CF] text-xs uppercase font-bold font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#D667CF]" />
              <span>SteerCo Remediation &amp; Recovery Action Plan</span>
            </label>
            <textarea
              rows={2}
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              placeholder="What immediate corrective action is being taken by technical leads to recover lost sprint time?..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-slate-100 text-sm focus:outline-none focus:border-[#95288E] leading-relaxed"
            />
            
            {/* Quick Mitigation Presets */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMMON_MITIGATION_PRESETS.slice(0, 4).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyMitigationPreset(preset)}
                  className="px-2 py-0.5 bg-slate-950 text-slate-400 hover:text-[#D667CF] border border-slate-800 rounded text-[10px] font-mono transition-colors cursor-pointer"
                >
                  + {preset.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Accountable Leads Summary Banner */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div>
              Accountable: <span className="text-white font-bold">{task.backendOwner}</span> (BE) / <span className="text-white font-bold">{task.frontendOwner}</span> (FE)
            </div>
            <div>
              Workstream: <span className="text-slate-300">{task.workstream}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-lg shadow-rose-900/30 border border-rose-400/40 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Delay Reason &amp; Mitigation</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
