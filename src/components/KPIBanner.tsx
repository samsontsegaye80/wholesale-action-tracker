import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  AlertTriangle, 
  TrendingUp, 
  FileQuestion 
} from 'lucide-react';
import { TaskItem } from '../types';
import { getTaskDeadlineStatus } from '../utils/dateUtils';

interface KPIBannerProps {
  tasks: TaskItem[];
  asOfDate: string;
  onFilterClick?: (status: string) => void;
}

export const KPIBanner: React.FC<KPIBannerProps> = ({ tasks, asOfDate, onFilterClick }) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const partial = tasks.filter(t => t.status === 'Partial').length;
  const notStarted = tasks.filter(t => t.status === 'Not Started').length;
  const noBrd = tasks.filter(t => t.status === 'No BRD').length;

  const delayedTasks = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'OVERDUE' || t.status === 'Delayed' || (t.delayDays && t.delayDays > 0);
  });

  const dueSoonTasks = tasks.filter(t => {
    const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return info.category === 'DUE_SOON_3D' || info.category === 'DUE_TODAY';
  });

  const totalDelayDays = delayedTasks.reduce((acc, curr) => {
    const info = getTaskDeadlineStatus(curr.endDate, curr.status, asOfDate);
    const count = info.category === 'OVERDUE' ? Math.abs(info.daysDiff || 0) : (curr.delayDays || 0);
    return acc + count;
  }, 0);

  const overallProgress = total > 0 
    ? Math.round(tasks.reduce((acc, curr) => {
        if (curr.status === 'Completed') return acc + 100;
        if (curr.percentComplete !== undefined) return acc + curr.percentComplete;
        if (curr.status === 'In Progress') return acc + 50;
        if (curr.status === 'Partial') return acc + 25;
        return acc;
      }, 0) / total)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
      
      {/* 1. Overall Progress - Deep Plum & Orchid */}
      <div 
        onClick={() => onFilterClick && onFilterClick('ALL')}
        className="bg-slate-900/95 p-3 sm:p-4 border border-slate-800 border-l-4 border-l-[#95288E] rounded-r-lg hover:border-slate-700 transition-all cursor-pointer group shadow-md active:scale-[0.98]"
      >
        <div className="text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span className="group-hover:text-[#D667CF] transition-colors truncate">Progress</span>
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D667CF] shrink-0" />
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-mono text-white font-extrabold">{overallProgress}%</div>
        <div className="w-full bg-slate-800 h-1.5 sm:h-2 mt-1.5 sm:mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#95288E] to-[#D667CF] h-full rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="text-[11px] sm:text-xs text-slate-300 mt-1.5 sm:mt-2 font-mono font-medium truncate">
          <strong className="text-[#D667CF] text-xs sm:text-sm font-bold">{completed}</strong>/{total} done
        </div>
      </div>

      {/* 2. On-Track Completed */}
      <div 
        onClick={() => onFilterClick && onFilterClick('Completed')}
        className="bg-slate-900/95 p-3 sm:p-4 border border-slate-800 border-l-4 border-l-emerald-500 rounded-r-lg hover:border-slate-700 transition-all cursor-pointer group shadow-md active:scale-[0.98]"
      >
        <div className="text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span className="group-hover:text-emerald-400 transition-colors truncate">Completed</span>
          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-mono text-white font-extrabold">
          {completed} <span className="text-xs sm:text-sm text-slate-400 font-sans font-normal">/ {total}</span>
        </div>
        <div className="text-[11px] sm:text-xs text-emerald-400 mt-1.5 sm:mt-2.5 font-bold font-mono truncate">
          {notStarted} next
        </div>
      </div>

      {/* 3. Critical Delays */}
      <div 
        onClick={() => onFilterClick && onFilterClick('DELAYED')}
        className="bg-slate-900/95 p-3 sm:p-4 border border-slate-800 border-l-4 border-l-rose-500 rounded-r-lg hover:border-slate-700 transition-all cursor-pointer group shadow-md active:scale-[0.98]"
      >
        <div className="text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span className="group-hover:text-rose-400 transition-colors truncate">Delays</span>
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-mono text-rose-400 font-extrabold">
          {delayedTasks.length < 10 ? `0${delayedTasks.length}` : delayedTasks.length}
        </div>
        <div className="text-[11px] sm:text-xs text-rose-300 mt-1.5 sm:mt-2.5 font-bold underline underline-offset-4 cursor-pointer font-mono truncate">
          +{totalDelayDays}d slip
        </div>
      </div>

      {/* 4. Active Delivery Sprint - Orchid Highlight */}
      <div 
        onClick={() => onFilterClick && onFilterClick('In Progress')}
        className="bg-slate-900/95 p-3 sm:p-4 border border-slate-800 border-l-4 border-l-[#D667CF] rounded-r-lg hover:border-slate-700 transition-all cursor-pointer group shadow-md active:scale-[0.98]"
      >
        <div className="text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span className="group-hover:text-[#D667CF] transition-colors truncate">Active Sprint</span>
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D667CF] shrink-0" />
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-mono text-white font-extrabold">
          {inProgress + partial}
        </div>
        <div className="text-[11px] sm:text-xs text-[#D667CF] mt-1.5 sm:mt-2.5 font-mono font-medium truncate">
          {inProgress} act • {partial} part
        </div>
      </div>

      {/* 5. Due Next 72 Hours - Executive Gold */}
      <div 
        onClick={() => onFilterClick && onFilterClick('DUE_SOON')}
        className="bg-slate-900/95 p-3 sm:p-4 border border-slate-800 border-l-4 border-l-[#B38D34] rounded-r-lg hover:border-slate-700 transition-all cursor-pointer group shadow-md active:scale-[0.98]"
      >
        <div className="text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span className="group-hover:text-[#B38D34] transition-colors truncate">Due ≤ 72h</span>
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B38D34] shrink-0" />
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-mono text-[#B38D34] font-extrabold">
          {dueSoonTasks.length < 10 ? `0${dueSoonTasks.length}` : dueSoonTasks.length}
        </div>
        <div className="text-[11px] sm:text-xs text-[#B38D34] mt-1.5 sm:mt-2.5 font-mono font-semibold truncate">
          Alerts armed
        </div>
      </div>

      {/* 6. Blocked / Missing Specs - Brand Plum */}
      <div 
        onClick={() => onFilterClick && onFilterClick('No BRD')}
        className="bg-slate-900/95 p-3 sm:p-4 border border-slate-800 border-l-4 border-l-[#D667CF] rounded-r-lg hover:border-slate-700 transition-all cursor-pointer group shadow-md active:scale-[0.98]"
      >
        <div className="text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span className="group-hover:text-[#D667CF] transition-colors truncate">MISSING SPECS</span>
          <FileQuestion className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D667CF] shrink-0" />
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-mono text-[#D667CF] font-extrabold">
          {noBrd < 10 ? `0${noBrd}` : noBrd}
        </div>
        <div className="text-[11px] sm:text-xs text-[#D667CF] mt-1.5 sm:mt-2.5 font-mono font-semibold truncate">
          Task #12, #44
        </div>
      </div>

    </div>
  );
};
