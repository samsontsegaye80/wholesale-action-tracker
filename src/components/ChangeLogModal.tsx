import React from 'react';
import { 
  History, 
  X, 
  Clock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  FileEdit,
  Trash2
} from 'lucide-react';
import { ChangeLogEntry } from '../types';

interface ChangeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeLogs: ChangeLogEntry[];
  onClearLogs?: () => void;
}

export const ChangeLogModal: React.FC<ChangeLogModalProps> = ({
  isOpen,
  onClose,
  changeLogs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  const displayLogs = changeLogs.slice(0, 10);

  const getFieldBadgeColor = (field: string) => {
    switch (field.toLowerCase()) {
      case 'status':
        return 'bg-blue-950/80 text-blue-300 border-blue-600/50';
      case 'delay days':
      case 'delaydays':
      case 'delay':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/50';
      case 'end date':
      case 'target finish':
      case 'enddate':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/50';
      case 'mitigation plan':
      case 'mitigationplan':
        return 'bg-purple-950/80 text-purple-300 border-purple-600/50';
      case 'owner':
      case 'backend owner':
      case 'frontend owner':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatTimestamp = (timestampStr: string) => {
    try {
      const d = new Date(timestampStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestampStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#95288E]/20 border border-[#95288E]/60 flex items-center justify-center text-[#D667CF]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Task Modification Change Log</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#95288E]/30 text-[#D667CF] border border-[#95288E]/50 font-mono">
                  Last 10 Actions
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Audited modification records showing user accountability, modified attributes, and timeline.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Change Log Content */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {displayLogs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-950/50 border border-dashed border-slate-800 rounded-xl">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
              <h4 className="text-base font-semibold text-slate-300">No Modifications Recorded Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Edits made to task statuses, target finish dates, delays, and mitigation plans will be logged here for full PMO accountability.
              </p>
            </div>
          ) : (
            displayLogs.map((log, index) => (
              <div 
                key={log.id || index}
                className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
              >
                {/* Top Row: Task Title & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#D667CF] bg-[#95288E]/20 px-2 py-0.5 rounded border border-[#95288E]/40">
                      Task #{log.taskSNo < 10 ? `0${log.taskSNo}` : log.taskSNo}
                    </span>
                    <span className="font-semibold text-white truncate max-w-[320px]">
                      {log.taskTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#B38D34]" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>

                {/* Middle Row: User & Field Changed */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-300">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Modified by: <strong className="text-white">{log.userName || log.userEmail || 'Team Member'}</strong></span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border font-mono ${getFieldBadgeColor(log.fieldChanged)}`}>
                    {log.fieldChanged}
                  </span>
                </div>

                {/* Bottom Row: Value Diff */}
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/60 rounded-lg p-2.5 text-xs font-mono">
                  <div className="flex-1 truncate text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/40">
                    <span className="text-[10px] text-rose-400 block uppercase">Previous</span>
                    <span className="truncate">{log.oldValue || '(Empty)'}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

                  <div className="flex-1 truncate text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/40">
                    <span className="text-[10px] text-emerald-400 block uppercase">Updated</span>
                    <span className="truncate">{log.newValue || '(Empty)'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono">Total Recorded: {displayLogs.length}</span>
            {onClearLogs && displayLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 ml-4 cursor-pointer"
                title="Clear change history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
