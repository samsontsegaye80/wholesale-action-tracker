import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Bell, 
  AlertCircle, 
  Flame, 
  ArrowUpDown,
  ShieldAlert,
  Tag,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  MessageSquare,
  CheckSquare,
  Square,
  MinusSquare,
  Layers,
  XCircle,
  Zap,
  Check,
  FileText,
  Presentation,
  Download,
  Users,
  UserCheck,
  UserPlus,
  Plus
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';
import { getTaskDeadlineStatus, compareFinishDates, formatDateToDisplay } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { exportMasterActionPlanPdf } from '../utils/exportPdf';
import { exportMasterActionPlanPpt } from '../utils/exportPpt';
import { DelayReasonModal } from './DelayReasonModal';

interface TaskTableProps {
  tasks: TaskItem[];
  asOfDate: string;
  onUpdateTask: (task: TaskItem, fieldChanged?: string, oldValue?: string, newValue?: string) => void;
  onBulkUpdateTasks?: (taskIds: string[], updates: Partial<TaskItem>, changeSummary: string) => void;
  onEditTaskClick: (task: TaskItem) => void;
  onTriggerReminder: (task: TaskItem) => void;
  onUnlockEdit?: () => void;
  filterStatusPreset?: string;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  asOfDate,
  onUpdateTask,
  onBulkUpdateTasks,
  onEditTaskClick,
  onTriggerReminder,
  onUnlockEdit,
  filterStatusPreset,
}) => {
  const { canEdit } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkstream, setSelectedWorkstream] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(filterStatusPreset || 'ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileViewStyle, setMobileViewStyle] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<keyof TaskItem>('sNo');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedTaskForReason, setSelectedTaskForReason] = useState<TaskItem | null>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [exportToastMsg, setExportToastMsg] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportMasterActionPlanPdf(tasks, asOfDate);
      setExportToastMsg('Master Action Plan (44) PDF downloaded successfully!');
      setTimeout(() => setExportToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      await exportMasterActionPlanPpt(tasks, asOfDate);
      setExportToastMsg('Master Action Plan (44) 16:9 Presentation (.pptx) downloaded!');
      setTimeout(() => setExportToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PPT export failed: ${e.message}`);
    } finally {
      setIsExportingPpt(false);
    }
  };

  // Bulk Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkFeedbackMsg, setBulkFeedbackMsg] = useState<string | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (filterStatusPreset) {
      setSelectedStatus(filterStatusPreset);
    }
  }, [filterStatusPreset]);

  const workstreams = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.workstream)));
  }, [tasks]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.backendOwner && t.backendOwner !== '-') set.add(t.backendOwner);
      if (t.frontendOwner && t.frontendOwner !== '-') set.add(t.frontendOwner);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Detected & standard backend and frontend engineering leads
  const backendLeads = useMemo(() => {
    const defaultLeads = ['Khalid', 'Yohannes Y.', 'Samson', 'Eyob', 'Robel', 'Amanuel', 'Letu', 'Yohannes S.', 'Melaku', 'Ephrem', 'Bereket'];
    const set = new Set<string>(defaultLeads);
    tasks.forEach(t => {
      if (t.backendOwner && t.backendOwner !== '-') set.add(t.backendOwner);
    });
    return Array.from(set).sort();
  }, [tasks]);

  const frontendLeads = useMemo(() => {
    const defaultLeads = ['Dewa', 'Simachew', 'Eyob', 'Wubishet', 'Samson', 'Bereket', 'Robel'];
    const set = new Set<string>(defaultLeads);
    tasks.forEach(t => {
      if (t.frontendOwner && t.frontendOwner !== '-') set.add(t.frontendOwner);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Bulk Reassignment State
  const [bulkReassignTarget, setBulkReassignTarget] = useState<'backend' | 'frontend' | 'both'>('backend');
  const [bulkSelectedBackendLead, setBulkSelectedBackendLead] = useState<string>('Khalid');
  const [bulkSelectedFrontendLead, setBulkSelectedFrontendLead] = useState<string>('Dewa');
  const [isHeaderReassignModalOpen, setIsHeaderReassignModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match = 
          t.title.toLowerCase().includes(query) ||
          t.deliverable.toLowerCase().includes(query) ||
          t.backendOwner.toLowerCase().includes(query) ||
          t.frontendOwner.toLowerCase().includes(query) ||
          t.workstream.toLowerCase().includes(query) ||
          (t.priority && t.priority.toLowerCase().includes(query)) ||
          (t.remark && t.remark.toLowerCase().includes(query)) ||
          `task ${t.sNo}`.includes(query) ||
          `#${t.sNo}`.includes(query);
        if (!match) return false;
      }

      // Workstream
      if (selectedWorkstream !== 'ALL' && t.workstream !== selectedWorkstream) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'ALL') {
        const taskPri = t.priority || 'Medium';
        if (taskPri !== selectedPriority) return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OVERDUE') {
          const deadline = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
          if (deadline.category !== 'OVERDUE' && (!t.delayDays || t.delayDays <= 0)) return false;
        } else if (selectedStatus === 'DUE_SOON') {
          const deadline = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
          if (deadline.category !== 'DUE_SOON_3D' && deadline.category !== 'DUE_TODAY') return false;
        } else if (selectedStatus === 'DELAY_HORIZON') {
          if (!t.delayDays || t.delayDays <= 0) return false;
        } else if (t.status !== selectedStatus) {
          return false;
        }
      }

      // Owner
      if (selectedOwner !== 'ALL') {
        if (t.backendOwner !== selectedOwner && t.frontendOwner !== selectedOwner) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [tasks, searchTerm, selectedWorkstream, selectedStatus, selectedPriority, selectedOwner, sortField, sortAsc, asOfDate]);

  // Handle header checkbox indeterminate state
  const isAllFilteredSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedTaskIds.includes(t.id));
  const isSomeFilteredSelected = filteredTasks.some(t => selectedTaskIds.includes(t.id)) && !isAllFilteredSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered
      const filteredIds = new Set(filteredTasks.map(t => t.id));
      setSelectedTaskIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      // Select all filtered
      const currentSet = new Set(selectedTaskIds);
      filteredTasks.forEach(t => currentSet.add(t.id));
      setSelectedTaskIds(Array.from(currentSet));
    }
  };

  const handleToggleSelectTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const [bulkTrackTarget, setBulkTrackTarget] = useState<'overall' | 'backend' | 'frontend' | 'all'>('overall');

  const handleBulkStatusChange = (newStatus: TaskStatus) => {
    if (!canEdit) {
      if (onUnlockEdit) onUnlockEdit();
      return;
    }
    if (selectedTaskIds.length === 0) return;

    const updates: Partial<TaskItem> = {
      lastUpdated: new Date().toISOString(),
    };

    if (bulkTrackTarget === 'overall' || bulkTrackTarget === 'all') {
      updates.status = newStatus;
      if (newStatus === 'Completed') {
        updates.delayDays = 0;
        updates.actualFinishDate = asOfDate;
        updates.percentComplete = 100;
      } else if (newStatus === 'Delayed') {
        updates.delayDays = 7;
      } else if (newStatus === 'In Progress') {
        updates.percentComplete = 50;
      } else if (newStatus === 'Not Started') {
        updates.percentComplete = 0;
      }
    }

    if (bulkTrackTarget === 'backend' || bulkTrackTarget === 'all') {
      updates.backendStatus = newStatus;
    }

    if (bulkTrackTarget === 'frontend' || bulkTrackTarget === 'all') {
      updates.frontendStatus = newStatus;
    }

    const trackLabel = bulkTrackTarget === 'backend' ? 'Backend Status' : bulkTrackTarget === 'frontend' ? 'Frontend Status' : bulkTrackTarget === 'all' ? 'All Tracks (BE+FE+Overall)' : 'Overall Status';

    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(selectedTaskIds, updates, `${trackLabel} set to '${newStatus}' for ${selectedTaskIds.length} tasks`);
    } else {
      // Fallback to updating individually
      selectedTaskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          onUpdateTask({ ...task, ...updates }, trackLabel, task.status, newStatus);
        }
      });
    }

    setBulkFeedbackMsg(`Successfully updated ${trackLabel} for ${selectedTaskIds.length} deliverables to "${newStatus}"`);
    setTimeout(() => setBulkFeedbackMsg(null), 3000);
  };

  const handleQuickStatusChange = (task: TaskItem, newStatus: TaskStatus) => {
    if (!canEdit) {
      if (onUnlockEdit) onUnlockEdit();
      return;
    }
    const oldStatus = task.status;
    let newDelay = task.delayDays;
    let actualFinish = task.actualFinishDate;

    if (newStatus === 'Completed') {
      newDelay = 0;
      actualFinish = asOfDate;
    } else if (newStatus === 'Delayed' && (!newDelay || newDelay === 0)) {
      newDelay = 7; // default estimated delay
    }

    const updated: TaskItem = {
      ...task,
      status: newStatus,
      delayDays: newDelay,
      actualFinishDate: actualFinish,
      percentComplete: newStatus === 'Completed' ? 100 : newStatus === 'Not Started' ? 0 : task.percentComplete || 50,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateTask(updated, 'Status', oldStatus, newStatus);
  };

  const handleQuickBackendStatusChange = (task: TaskItem, newBeStatus: TaskStatus) => {
    if (!canEdit) {
      if (onUnlockEdit) onUnlockEdit();
      return;
    }
    const oldBeStatus = task.backendStatus || task.status;
    const updated: TaskItem = {
      ...task,
      backendStatus: newBeStatus,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateTask(updated, 'Backend Status', oldBeStatus, newBeStatus);
  };

  const handleQuickFrontendStatusChange = (task: TaskItem, newFeStatus: TaskStatus) => {
    if (!canEdit) {
      if (onUnlockEdit) onUnlockEdit();
      return;
    }
    const oldFeStatus = task.frontendStatus || task.status;
    const updated: TaskItem = {
      ...task,
      frontendStatus: newFeStatus,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateTask(updated, 'Frontend Status', oldFeStatus, newFeStatus);
  };

  const handleBulkPriorityChange = (newPriority: 'Critical' | 'High' | 'Medium' | 'Low') => {
    if (!canEdit) {
      if (onUnlockEdit) onUnlockEdit();
      return;
    }
    if (selectedTaskIds.length === 0) return;
    const updates: Partial<TaskItem> = {
      priority: newPriority,
      lastUpdated: new Date().toISOString(),
    };

    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(selectedTaskIds, updates, `Priority set to '${newPriority}' for ${selectedTaskIds.length} tasks`);
    } else {
      selectedTaskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          onUpdateTask({ ...task, ...updates }, 'Priority', task.priority, newPriority);
        }
      });
    }

    setBulkFeedbackMsg(`Updated priority of ${selectedTaskIds.length} tasks to "${newPriority}"`);
    setTimeout(() => setBulkFeedbackMsg(null), 3000);
  };

  const handleBulkReassign = (
    targetType: 'backend' | 'frontend' | 'both',
    newBe: string,
    newFe: string
  ) => {
    if (!canEdit) {
      if (onUnlockEdit) onUnlockEdit();
      return;
    }
    if (selectedTaskIds.length === 0) return;

    const updates: Partial<TaskItem> = {
      lastUpdated: new Date().toISOString(),
    };

    let summaryParts: string[] = [];
    if (targetType === 'backend' || targetType === 'both') {
      updates.backendOwner = newBe;
      summaryParts.push(`Backend Owner ➔ "${newBe}"`);
    }
    if (targetType === 'frontend' || targetType === 'both') {
      updates.frontendOwner = newFe;
      summaryParts.push(`Frontend Owner ➔ "${newFe}"`);
    }

    const summaryText = summaryParts.join(' & ');

    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(
        selectedTaskIds,
        updates,
        `Reassigned ${summaryText} for ${selectedTaskIds.length} deliverables in one click`
      );
    } else {
      selectedTaskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          onUpdateTask(
            { ...task, ...updates },
            'Ownership Reassignment',
            `${task.backendOwner}/${task.frontendOwner}`,
            summaryText
          );
        }
      });
    }

    setBulkFeedbackMsg(`⚡ Reassigned ${selectedTaskIds.length} deliverable(s): ${summaryText}`);
    setIsHeaderReassignModalOpen(false);
    setTimeout(() => setBulkFeedbackMsg(null), 4000);
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleSort = (field: keyof TaskItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
      case 'In Progress':
        return 'bg-blue-950/80 text-[#D667CF] border-[#95288E]/70 shadow-[0_0_8px_rgba(149,40,142,0.2)]';
      case 'Partial':
        return 'bg-amber-950/80 text-[#B38D34] border-[#B38D34]/70';
      case 'Delayed':
        return 'bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse';
      case 'Blocked':
        return 'bg-purple-950/80 text-purple-300 border-purple-600/70';
      case 'No BRD':
        return 'bg-red-950/90 text-red-300 border-red-600/80 font-mono';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-rose-950 text-rose-300 border border-rose-600">CRITICAL</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-600">HIGH</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-blue-950 text-blue-300 border border-blue-800">MED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-slate-900 text-slate-400 border border-slate-800">LOW</span>;
    }
  };

  const [tableViewMode, setTableViewMode] = useState<'table' | 'kanban'>('table');

  const handleAlignOrderByPriority = () => {
    setSortField('priority');
    setSortAsc(false);
  };

  return (
    <div className="space-y-3.5">
      
      {/* Top View Mode Switcher & Align Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setTableViewMode('table');
              setMobileViewStyle('table');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              tableViewMode === 'table'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => {
              setTableViewMode('kanban');
              setMobileViewStyle('cards');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              tableViewMode === 'kanban'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>Status Columns (Kanban)</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center text-xs font-mono text-slate-400 gap-1.5">
          <Plus className="w-3 h-3 text-[#D667CF]" />
          <span>Drag rows or cards to reorder priority &amp; change status</span>
        </div>

        <button
          onClick={handleAlignOrderByPriority}
          className="px-3.5 py-1.5 bg-gradient-to-r from-[#95288E] via-[#a82da1] to-[#c039b7] hover:brightness-110 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#95288E]/40 border border-[#D667CF]"
          title="Align all tasks automatically by priority"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
          <span>Align Order by Priority</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg space-y-3">
        
        {/* Search & Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search deliverables, tasks, owners (Khalid, Dewa...)"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#95288E] transition-colors"
            />
          </div>

          {/* Workstream Filter */}
          <select
            value={selectedWorkstream}
            onChange={(e) => setSelectedWorkstream(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Workstreams ({workstreams.length})</option>
            {workstreams.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">🚨 Critical Overdue</option>
            <option value="DUE_SOON">⚡ Due Next 72h</option>
            <option value="DELAY_HORIZON">🔥 Delay &gt; 0d</option>
            <option value="Completed">✓ Completed</option>
            <option value="In Progress">⏳ In Progress</option>
            <option value="Partial">⚠️ Partial</option>
            <option value="Delayed">🛑 Delayed</option>
            <option value="Blocked">🔒 Blocked</option>
            <option value="No BRD">📋 No BRD</option>
            <option value="Not Started">⚪ Not Started</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Owner Filter */}
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Leads / Owners</option>
            {owners.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          {/* Plan PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-bold transition shadow-sm hover:border-[#95288E]/60 disabled:opacity-50 cursor-pointer"
            title="Download Master Action Plan (44) as PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>Plan PDF</span>
          </button>

          {/* Plan PPT Button */}
          <button
            onClick={handleExportPpt}
            disabled={isExportingPpt}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#95288E]/20 hover:bg-[#95288E]/40 text-[#D667CF] border border-[#95288E]/50 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
            title="Download Master Action Plan (44) 16:9 Presentation (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>Plan PPT</span>
          </button>

        </div>

        {/* Dropdown Filters (Always visible on Desktop, collapsible on Mobile) */}
        <div className={`flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 ${isMobileFiltersOpen ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Workstream Filter */}
          <select
            value={selectedWorkstream}
            onChange={(e) => setSelectedWorkstream(e.target.value)}
            className="flex-1 min-w-[140px] sm:flex-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">All Workstreams ({workstreams.length})</option>
            {workstreams.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">🚨 Critical Overdue</option>
            <option value="DUE_SOON">⚡ Due Next 72h</option>
            <option value="DELAY_HORIZON">🔥 Delay &gt; 0d</option>
            <option value="Completed">✓ Completed</option>
            <option value="In Progress">⏳ In Progress</option>
            <option value="Partial">⚠️ Partial</option>
            <option value="Delayed">🛑 Delayed</option>
            <option value="Blocked">🔒 Blocked</option>
            <option value="No BRD">📋 No BRD</option>
            <option value="Not Started">⚪ Not Started</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="flex-1 min-w-[100px] sm:flex-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Owner Filter */}
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer max-w-[160px] truncate"
          >
            <option value="ALL">All Leads</option>
            {owners.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {(searchTerm || selectedWorkstream !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || selectedOwner !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedWorkstream('ALL');
                setSelectedStatus('ALL');
                setSelectedPriority('ALL');
                setSelectedOwner('ALL');
              }}
              className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 font-mono underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {exportToastMsg && (
        <div className="p-3 bg-[#95288E]/20 border border-[#95288E]/60 rounded-lg flex items-center justify-between text-xs text-white animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{exportToastMsg}</span>
          </div>
          <button onClick={() => setExportToastMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* BULK UPDATE FLOATING / STICKY ACTION TOOLBAR */}
      {selectedTaskIds.length > 0 && (
        <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 border-2 border-[#95288E] rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3.5 sticky top-14 z-30 backdrop-blur-md">
          
          {/* Left: Selection Count */}
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#95288E] text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#95288E]/40">
              <CheckSquare className="w-4 h-4 text-[#B38D34]" />
              <span>{selectedTaskIds.length} Deliverable{selectedTaskIds.length > 1 ? 's' : ''} Selected</span>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Selection</span>
            </button>
          </div>

          {/* Center & Right: Bulk Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold">Apply To:</span>
              <select
                value={bulkTrackTarget}
                onChange={(e) => setBulkTrackTarget(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-xs text-[#D667CF] font-mono font-bold rounded px-1.5 py-0.5 focus:outline-none focus:border-[#95288E] cursor-pointer"
              >
                <option value="overall">Overall Status</option>
                <option value="backend">Backend Status</option>
                <option value="frontend">Frontend Status</option>
                <option value="all">All Tracks (BE+FE+Overall)</option>
              </select>
            </div>
            
            <button
              onClick={() => handleBulkStatusChange('Completed')}
              className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80 rounded-md text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              title="Mark selected as Completed (100% complete, delay reset to 0d)"
            >
              ✓ Completed
            </button>

            <button
              onClick={() => handleBulkStatusChange('In Progress')}
              className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-[#D667CF] border border-[#95288E]/80 rounded-md text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              title="Mark selected as In Progress"
            >
              ⏳ In Progress
            </button>

            <button
              onClick={() => handleBulkStatusChange('Partial')}
              className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-[#B38D34] border border-[#B38D34]/80 rounded-md text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              title="Mark selected as Partial"
            >
              ⚠️ Partial
            </button>

            <button
              onClick={() => handleBulkStatusChange('Delayed')}
              className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-600/80 rounded-md text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              title="Mark selected as Delayed (+7d)"
            >
              🛑 Delayed
            </button>

            <button
              onClick={() => handleBulkStatusChange('Blocked')}
              className="px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-600/80 rounded-md text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              title="Mark selected as Blocked"
            >
              🔒 Blocked
            </button>

            <button
              onClick={() => handleBulkStatusChange('Not Started')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              title="Reset selected to Not Started"
            >
              ⚪ Not Started
            </button>

            {/* Bulk Priority Setter */}
            <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-700">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold">Priority:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkPriorityChange(e.target.value as any);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#95288E] cursor-pointer"
              >
                <option value="" disabled>Set Priority...</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* 1-CLICK BULK REASSIGNMENT CONTROLS */}
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-700 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-[#B38D34]/40">
              <span className="text-xs font-mono uppercase text-[#B38D34] font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#B38D34] fill-current" />
                <span>Reassign Lead:</span>
              </span>

              <select
                value={bulkReassignTarget}
                onChange={(e) => setBulkReassignTarget(e.target.value as any)}
                className="px-1.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded focus:outline-none focus:border-[#B38D34] cursor-pointer"
              >
                <option value="backend">BE Lead</option>
                <option value="frontend">FE Lead</option>
                <option value="both">Both (BE+FE)</option>
              </select>

              {(bulkReassignTarget === 'backend' || bulkReassignTarget === 'both') && (
                <select
                  value={bulkSelectedBackendLead}
                  onChange={(e) => setBulkSelectedBackendLead(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 text-emerald-300 text-xs font-mono font-bold rounded focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[120px]"
                  title="Select new Backend Lead"
                >
                  {backendLeads.map(lead => (
                    <option key={lead} value={lead}>{lead}</option>
                  ))}
                </select>
              )}

              {(bulkReassignTarget === 'frontend' || bulkReassignTarget === 'both') && (
                <select
                  value={bulkSelectedFrontendLead}
                  onChange={(e) => setBulkSelectedFrontendLead(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 text-purple-300 text-xs font-mono font-bold rounded focus:outline-none focus:border-purple-500 cursor-pointer max-w-[120px]"
                  title="Select new Frontend Lead"
                >
                  {frontendLeads.map(lead => (
                    <option key={lead} value={lead}>{lead}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => handleBulkReassign(bulkReassignTarget, bulkSelectedBackendLead, bulkSelectedFrontendLead)}
                className="px-2.5 py-1 bg-[#B38D34] hover:bg-[#c99f3d] text-slate-950 font-mono font-bold text-xs rounded transition-all cursor-pointer shadow-md flex items-center gap-1 active:scale-95"
                title={`Reassign all ${selectedTaskIds.length} selected deliverables in one click`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Apply</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Bulk Feedback Banner */}
      {bulkFeedbackMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 font-bold" />
            <span>{bulkFeedbackMsg}</span>
          </div>
          <button 
            onClick={() => setBulkFeedbackMsg(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Task Summary Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredTasks.length}</strong> of <strong className="text-white">{tasks.length}</strong> Deliverables
          {selectedTaskIds.length > 0 && (
            <span className="text-[#D667CF] font-bold ml-2">
              ({selectedTaskIds.length} selected for bulk update)
            </span>
          )}
        </span>
        <div className="hidden sm:flex items-center space-x-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Target vs Actual Finish Comparison: Active</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE CARDS VIEW (< md) */}
      {/* ========================================================================= */}
      <div className={`space-y-2.5 ${mobileViewStyle === 'cards' ? 'block md:hidden' : 'hidden'}`}>
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-base font-semibold text-slate-400">No matching action items found</p>
            <p className="text-xs text-slate-600 mt-1">Try broadening your search or resetting filters</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const deadlineInfo = getTaskDeadlineStatus(task.endDate, task.status, asOfDate);
            const isOverdue = deadlineInfo.category === 'OVERDUE' || (task.delayDays && task.delayDays > 0);
            const isExpanded = expandedTaskId === task.id;
            const isSelected = selectedTaskIds.includes(task.id);
            const delayDays = task.delayDays || (deadlineInfo.category === 'OVERDUE' ? Math.abs(deadlineInfo.daysDiff || 0) : 0);
            const finishComparison = compareFinishDates(task, asOfDate);

            return (
              <div 
                key={`mobile-${task.id}`}
                className={`bg-slate-900 border rounded-xl p-3 shadow-md transition-all ${
                  isSelected
                    ? 'border-[#95288E] bg-purple-950/30 ring-1 ring-[#95288E]/50'
                    : isOverdue
                      ? 'border-rose-500/60 bg-rose-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Checkbox, #S.No, Priority & Quick Action Menu */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleSelectTask(task.id, e as any)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#95288E] focus:ring-[#95288E] cursor-pointer accent-[#95288E]"
                    />
                    <span className="font-mono text-xs font-bold text-[#D667CF] bg-[#95288E]/20 px-1.5 py-0.5 rounded border border-[#95288E]/40">
                      #{task.sNo < 10 ? `0${task.sNo}` : task.sNo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                      {task.workstream}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {getPriorityIndicator(task.priority)}
                    <button
                      onClick={() => onEditTaskClick(task)}
                      className="p-1 bg-slate-950 border border-slate-800 hover:border-[#D667CF] rounded text-slate-300 hover:text-white"
                      title="Edit deliverable"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className={`text-xs sm:text-sm font-bold leading-snug cursor-pointer ${
                    isOverdue ? 'text-rose-200' : 'text-white hover:text-[#D667CF]'
                  }`}
                >
                  {task.title}
                </h3>

                {/* Status and Timeline Bar */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={task.status}
                      onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border focus:outline-none transition-colors cursor-pointer ${getStatusBadge(task.status)}`}
                    >
                      <option value="Not Started" className="bg-slate-900 text-slate-300">Not Started</option>
                      <option value="In Progress" className="bg-slate-900 text-[#D667CF]">In Progress</option>
                      <option value="Partial" className="bg-slate-900 text-[#B38D34]">Partial</option>
                      <option value="Completed" className="bg-slate-900 text-emerald-400">Completed</option>
                      <option value="Delayed" className="bg-slate-900 text-rose-400">Delayed</option>
                      <option value="Blocked" className="bg-slate-900 text-purple-400">Blocked</option>
                      <option value="No BRD" className="bg-slate-900 text-red-400">No BRD</option>
                      <option value="Ongoing" className="bg-slate-900 text-slate-300">Ongoing</option>
                    </select>

                    {finishComparison.hasWarning && (
                      <span className="p-0.5 rounded bg-rose-950 border border-rose-600 text-rose-400 animate-pulse" title={finishComparison.warningMessage}>
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Delay / Timeline pill */}
                  <div className="text-right font-mono text-[10px]">
                    {delayDays > 0 ? (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5 justify-end">
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>+{delayDays}d slip</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">On-Track</span>
                    )}
                    <span className="text-slate-400 block text-[9px]">Due {task.endDate}</span>
                  </div>
                </div>

                {/* Track Leads (BE & FE) */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800/80 text-xs">
                  {/* BE */}
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 flex items-center justify-between">
                    <div className="truncate mr-1">
                      <span className="text-[8px] font-bold text-[#D667CF] uppercase font-mono block">BE</span>
                      <span className="text-slate-200 font-semibold text-[10px] truncate block">{task.backendOwner}</span>
                    </div>
                    <select
                      value={task.backendStatus || task.status}
                      onChange={(e) => handleQuickBackendStatusChange(task, e.target.value as TaskStatus)}
                      className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#D667CF]"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Partial">Partial</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  {/* FE */}
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 flex items-center justify-between">
                    <div className="truncate mr-1">
                      <span className="text-[8px] font-bold text-[#B38D34] uppercase font-mono block">FE</span>
                      <span className="text-slate-200 font-semibold text-[10px] truncate block">{task.frontendOwner}</span>
                    </div>
                    <select
                      value={task.frontendStatus || (task.frontendOwner === '-' ? 'Not Started' : task.status)}
                      onChange={(e) => handleQuickFrontendStatusChange(task, e.target.value as TaskStatus)}
                      className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#B38D34]"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Partial">Partial</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {/* Expand / Details Toggle Button */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="text-[11px] text-[#D667CF] hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Specs' : 'Specs & Notes'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTriggerReminder(task)}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-[#B38D34] rounded text-[10px] text-[#B38D34] font-semibold flex items-center gap-1"
                      title="Send Reminder"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Reminder</span>
                    </button>
                    {(isOverdue || task.status === 'Delayed' || (task.delayDays && task.delayDays > 0)) && (
                      <button
                        onClick={() => {
                          setSelectedTaskForReason(task);
                          setIsReasonModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-rose-950/80 border border-rose-700 text-rose-300 rounded text-[10px] font-semibold flex items-center gap-0.5"
                        title="Document delay root cause"
                      >
                        <Flame className="w-2.5 h-2.5" />
                        <span>Reason</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2 text-xs animate-in fade-in duration-150">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-0.5">Deliverable Output:</span>
                      <p className="text-slate-200 text-[11px]">{task.deliverable || 'Standard sprint deliverable.'}</p>
                    </div>

                    {task.dependency && task.dependency !== '-' && (
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Dependency:</span>
                        <span className="px-1.5 py-0.5 bg-[#95288E]/25 text-[#D667CF] border border-[#95288E]/60 rounded font-mono font-bold text-[10px]">
                          {task.dependency}
                        </span>
                      </div>
                    )}

                    {task.delayReason && (
                      <div className="bg-rose-950/30 p-2 rounded border border-rose-900/60">
                        <span className="text-[9px] uppercase font-bold text-rose-400 font-mono block mb-0.5">Delay Reason:</span>
                        <p className="text-rose-200 text-[11px]">{task.delayReason}</p>
                      </div>
                    )}

                    {task.mitigationPlan && (
                      <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-[#B38D34] font-mono block mb-0.5">Mitigation Plan:</span>
                        <p className="text-slate-300 text-[11px]">{task.mitigationPlan}</p>
                      </div>
                    )}

                    {task.remark && (
                      <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-0.5">Operational Remark:</span>
                        <p className="text-slate-300 text-[11px]">{task.remark}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Main Table Card (Desktop / Tablet or Table View) */}
      <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden ${mobileViewStyle === 'cards' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-800 font-mono">
                
                {/* SELECT ALL CHECKBOX COLUMN */}
                <th className="py-3.5 px-3 w-10 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      ref={selectAllCheckboxRef}
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      title={isAllFilteredSelected ? "Deselect all filtered deliverables" : "Select all filtered deliverables for bulk actions"}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#95288E] focus:ring-[#95288E] focus:ring-offset-slate-950 cursor-pointer accent-[#95288E]"
                    />
                  </div>
                </th>

                <th className="py-3.5 px-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('sNo')}>
                  <div className="flex items-center space-x-1">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5 cursor-pointer hover:text-white min-w-[240px]" onClick={() => handleSort('title')}>
                  <div className="flex items-center space-x-1">
                    <span>Action Item & Workstream</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5 min-w-[180px]">Deliverable Output</th>
                <th className="py-3.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>
                  <div className="flex items-center space-x-1">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('endDate')}>
                  <div className="flex items-center space-x-1">
                    <span>Timeline (DD-MM)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('delayDays')}>
                  <div className="flex items-center space-x-1">
                    <span>Delay Horizon</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5 min-w-[240px]">
                  <div className="flex items-center justify-between gap-2">
                    <span>BE &amp; FE Track Ownership &amp; Status</span>
                    {selectedTaskIds.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsHeaderReassignModalOpen(true);
                        }}
                        className="px-2 py-1 bg-[#B38D34] hover:bg-[#c99f3d] text-slate-950 text-[10px] font-mono font-bold rounded shadow flex items-center gap-1 cursor-pointer transition-transform active:scale-95 animate-pulse"
                        title="1-Click Bulk Reassign selected deliverables to a different Backend or Frontend Lead"
                      >
                        <Zap className="w-3 h-3 text-slate-950 fill-current" />
                        <span>Reassign ({selectedTaskIds.length})</span>
                      </button>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-3">Dep</th>
                <th className="py-3.5 px-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                  <div className="flex items-center space-x-1">
                    <span>Overall Deliverable Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-base font-semibold text-slate-400">No matching action items found</p>
                    <p className="text-xs text-slate-600 mt-1">Try broadening your search or resetting filters</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const deadlineInfo = getTaskDeadlineStatus(task.endDate, task.status, asOfDate);
                  const isOverdue = deadlineInfo.category === 'OVERDUE' || (task.delayDays && task.delayDays > 0);
                  const isExpanded = expandedTaskId === task.id;
                  const isSelected = selectedTaskIds.includes(task.id);
                  const delayDays = task.delayDays || (deadlineInfo.category === 'OVERDUE' ? Math.abs(deadlineInfo.daysDiff || 0) : 0);

                  // Calculate Actual Finish vs Target Finish comparison result
                  const finishComparison = compareFinishDates(task, asOfDate);

                  return (
                    <React.Fragment key={task.id}>
                      <tr 
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-purple-950/40 border-l-4 border-l-[#95288E] shadow-[inset_0_0_16px_rgba(149,40,142,0.2)]'
                            : isOverdue 
                              ? 'bg-rose-950/30 hover:bg-rose-900/35 border-l-4 border-l-rose-500 shadow-[inset_0_0_16px_rgba(244,63,94,0.12)]' 
                              : isExpanded 
                                ? 'bg-slate-800/60 hover:bg-slate-800/80' 
                                : 'hover:bg-slate-800/50'
                        }`}
                      >
                        {/* ROW CHECKBOX */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectTask(task.id, e as any)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#95288E] focus:ring-[#95288E] focus:ring-offset-slate-950 cursor-pointer accent-[#95288E]"
                            />
                          </div>
                        </td>

                        {/* S.No */}
                        <td className="py-3 px-3.5 font-mono text-xs text-slate-400 font-bold">
                          <button
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className="flex items-center space-x-1 hover:text-[#D667CF] focus:outline-none cursor-pointer"
                          >
                            {isOverdue && (
                              <span className="relative flex h-2 w-2 mr-1" title="Critical Overdue Bottleneck">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>
                              </span>
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[#D667CF]" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                            <span>{task.sNo < 10 ? `0${task.sNo}` : task.sNo}</span>
                          </button>
                        </td>

                        {/* Title & Workstream */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div 
                              className={`font-bold text-sm sm:text-base cursor-pointer ${
                                isOverdue ? 'text-rose-100 hover:text-white' : 'text-white hover:text-[#D667CF]'
                              }`}
                              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            >
                              {task.title}
                            </div>
                            {isOverdue && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.35)] animate-pulse tracking-wide"
                                title={`Critical Bottleneck: Overdue by ${delayDays} days`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                                <span>OVERDUE (+{delayDays}d)</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                            <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[240px]">
                              {task.workstream}
                            </span>
                            {task.percentComplete !== undefined && (
                              <span className="text-xs font-mono text-[#B38D34] font-bold">
                                {task.percentComplete}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Deliverable */}
                        <td className="py-3 px-3.5 font-medium text-slate-200 text-sm">
                          <span className="truncate max-w-[200px] block" title={task.deliverable}>
                            {task.deliverable}
                          </span>
                        </td>

                        {/* Priority Indicator */}
                        <td className="py-3 px-3">
                          {getPriorityIndicator(task.priority)}
                        </td>

                        {/* Timeline */}
                        <td className="py-3 px-3.5 font-mono text-xs text-slate-300 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">{task.startDate}</div>
                          <div className="text-slate-400">to {task.endDate}</div>
                        </td>

                        {/* Delay Count */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5">
                            {delayDays > 0 ? (
                              <span className="font-mono text-sm font-extrabold text-rose-300 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.25)] w-fit">
                                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                                <span>+{delayDays} Days</span>
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-emerald-400 font-semibold">
                                0 Days (On-Track)
                              </span>
                            )}
                            <div className="text-[11px] text-slate-400 font-mono">
                              Target: {task.endDate}
                            </div>
                          </div>
                        </td>

                        {/* BE & FE Track Ownership & Track Statuses */}
                        <td className="py-3 px-3.5 text-xs">
                          <div className="space-y-1.5 min-w-[190px]">
                            
                            {/* Backend Track */}
                            <div className="flex items-center justify-between gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80">
                              <div className="flex items-center space-x-1.5 truncate max-w-[100px]" title={`Backend Lead: ${task.backendOwner}`}>
                                <span className="text-[9px] font-bold text-[#D667CF] uppercase font-mono px-1 py-0.2 rounded bg-[#95288E]/20">BE</span>
                                <span className="text-slate-200 font-semibold truncate text-[11px]">{task.backendOwner}</span>
                              </div>
                              <select
                                value={task.backendStatus || task.status}
                                onChange={(e) => handleQuickBackendStatusChange(task, e.target.value as TaskStatus)}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#D667CF] focus:outline-none cursor-pointer focus:border-[#95288E]"
                                title="Click to change Backend Track Status"
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Partial">Partial</option>
                                <option value="Completed">Completed</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Blocked">Blocked</option>
                                <option value="No BRD">No BRD</option>
                                <option value="Ongoing">Ongoing</option>
                              </select>
                            </div>

                            {/* Frontend Track */}
                            <div className="flex items-center justify-between gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80">
                              <div className="flex items-center space-x-1.5 truncate max-w-[100px]" title={`Frontend Lead: ${task.frontendOwner}`}>
                                <span className="text-[9px] font-bold text-[#B38D34] uppercase font-mono px-1 py-0.2 rounded bg-[#B38D34]/20">FE</span>
                                <span className="text-slate-300 truncate text-[11px]">{task.frontendOwner}</span>
                              </div>
                              <select
                                value={task.frontendStatus || (task.frontendOwner === '-' ? 'Not Started' : task.status)}
                                onChange={(e) => handleQuickFrontendStatusChange(task, e.target.value as TaskStatus)}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#B38D34] focus:outline-none cursor-pointer focus:border-[#B38D34]"
                                title="Click to change Frontend Track Status"
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Partial">Partial</option>
                                <option value="Completed">Completed</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Blocked">Blocked</option>
                                <option value="No BRD">No BRD</option>
                                <option value="Ongoing">Ongoing</option>
                              </select>
                            </div>

                          </div>
                        </td>

                        {/* Dependency */}
                        <td className="py-3 px-3 font-mono text-xs">
                          {task.dependency !== '-' ? (
                            <span className="px-2 py-0.5 bg-[#95288E]/25 text-[#D667CF] border border-[#95288E]/60 rounded font-semibold">
                              {task.dependency}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Status Dropdown & Date Comparison Tooltip */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-md border focus:outline-none transition-colors cursor-pointer ${getStatusBadge(task.status)}`}
                            >
                              <option value="Not Started" className="bg-slate-900 text-slate-300">Not Started</option>
                              <option value="In Progress" className="bg-slate-900 text-[#D667CF]">In Progress</option>
                              <option value="Partial" className="bg-slate-900 text-[#B38D34]">Partial</option>
                              <option value="Completed" className="bg-slate-900 text-emerald-400">Completed</option>
                              <option value="Delayed" className="bg-slate-900 text-rose-400">Delayed</option>
                              <option value="Blocked" className="bg-slate-900 text-purple-400">Blocked</option>
                              <option value="No BRD" className="bg-slate-900 text-red-400">No BRD</option>
                              <option value="Ongoing" className="bg-slate-900 text-slate-300">Ongoing</option>
                            </select>

                            {/* Date Comparison Slippage Warning Tooltip Indicator */}
                            <div className="relative group">
                              {finishComparison.hasWarning ? (
                                <div className="p-1 rounded bg-rose-950 border border-rose-500 text-rose-400 cursor-help animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              ) : task.status === 'Completed' ? (
                                <div className="p-1 rounded bg-emerald-950 border border-emerald-600 text-emerald-400 cursor-help">
                                  <Info className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-400 cursor-help opacity-60 group-hover:opacity-100">
                                  <Info className="w-3.5 h-3.5" />
                                </div>
                              )}

                              {/* Interactive Warning Tooltip Popup */}
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-72 p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-none">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                  <span className={`font-bold font-mono text-[11px] uppercase ${
                                    finishComparison.hasWarning ? 'text-rose-400' : 'text-emerald-400'
                                  }`}>
                                    {finishComparison.warningTitle}
                                  </span>
                                  {finishComparison.varianceDays > 0 && (
                                    <span className="bg-rose-950 text-rose-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-800 font-extrabold">
                                      +{finishComparison.varianceDays}d Variance
                                    </span>
                                  )}
                                </div>

                                <p className="text-slate-300 text-[11px] leading-relaxed">
                                  {finishComparison.warningMessage}
                                </p>

                                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 font-mono text-[10px]">
                                  <div className="bg-slate-900 p-1.5 rounded">
                                    <span className="text-slate-400 block">Target Finish</span>
                                    <span className="text-white font-bold">{finishComparison.targetFinishDisplay}</span>
                                  </div>
                                  <div className="bg-slate-900 p-1.5 rounded">
                                    <span className="text-slate-400 block">Actual / Est.</span>
                                    <span className={`font-bold ${finishComparison.varianceDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                      {finishComparison.actualFinishDisplay}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onTriggerReminder(task)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              title="Send Google Chat / Email Alert"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onTriggerReminder(task)}
                              className="p-1.5 text-slate-400 hover:text-[#B38D34] hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              title="Compose automated reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditTaskClick(task)}
                              className="p-1.5 text-slate-400 hover:text-[#D667CF] hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              title="Edit deliverable"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {(isOverdue || task.status === 'Delayed' || (task.delayDays && task.delayDays > 0)) && (
                              <button
                                onClick={() => {
                                  setSelectedTaskForReason(task);
                                  setIsReasonModalOpen(true);
                                }}
                                className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-md transition-colors cursor-pointer"
                                title="Write / Edit Delay Reason"
                              >
                                <Flame className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={11} className="p-4 sm:p-5 space-y-4">
                            
                            {/* Track Synchronizer & Progress Controller */}
                            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 border-t-2 border-t-[#95288E]">
                              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200 uppercase">
                                <Tag className="w-3.5 h-3.5 text-[#D667CF]" />
                                <span>Track Control &amp; Status Synch:</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                {/* Backend Status Controller */}
                                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                                  <span className="text-[10px] font-bold text-[#D667CF] uppercase font-mono">BE ({task.backendOwner}):</span>
                                  <select
                                    value={task.backendStatus || task.status}
                                    onChange={(e) => handleQuickBackendStatusChange(task, e.target.value as TaskStatus)}
                                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-[#D667CF] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#95288E] cursor-pointer"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="No BRD">No BRD</option>
                                    <option value="Ongoing">Ongoing</option>
                                  </select>
                                </div>

                                {/* Frontend Status Controller */}
                                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                                  <span className="text-[10px] font-bold text-[#B38D34] uppercase font-mono">FE ({task.frontendOwner}):</span>
                                  <select
                                    value={task.frontendStatus || (task.frontendOwner === '-' ? 'Not Started' : task.status)}
                                    onChange={(e) => handleQuickFrontendStatusChange(task, e.target.value as TaskStatus)}
                                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-[#B38D34] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#B38D34] cursor-pointer"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="No BRD">No BRD</option>
                                    <option value="Ongoing">Ongoing</option>
                                  </select>
                                </div>

                                {/* Overall Deliverable Status Controller */}
                                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Overall Deliverable:</span>
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="No BRD">No BRD</option>
                                    <option value="Ongoing">Ongoing</option>
                                  </select>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedTaskForReason(task);
                                    setIsReasonModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded text-xs font-mono font-bold transition-colors cursor-pointer border border-rose-800 flex items-center gap-1.5"
                                >
                                  <Flame className="w-3 h-3 text-rose-400" />
                                  <span>Write Reason</span>
                                </button>

                                <button
                                  onClick={() => onEditTaskClick(task)}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono font-bold transition-colors cursor-pointer border border-slate-700"
                                >
                                  Full Edit Modal →
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              
                              {/* Left Column: Delay Diagnostics */}
                              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Delay Root Cause &amp; Impact</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedTaskForReason(task);
                                      setIsReasonModalOpen(true);
                                    }}
                                    className="text-[10px] text-rose-300 hover:text-white bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-mono cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                    <span>Write Reason</span>
                                  </button>
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                  {task.delayReason || (
                                    <span className="italic text-rose-400/80 font-mono text-[11px]">
                                      * Pending root cause justification. Click 'Write Reason' to update.
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* Middle Column: Mitigation Plan */}
                              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
                                <span className="font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5 text-[#B38D34]" />
                                  <span>PMO Mitigation &amp; Action Plan</span>
                                </span>
                                <p className="text-slate-300 leading-relaxed">
                                  {task.mitigationPlan || 'Standard sprint cycle review in place. No escalation required at this stage.'}
                                </p>
                              </div>

                              {/* Right Column: Remarks & Governance */}
                              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
                                <span className="font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-[#D667CF]" />
                                  <span>Operational Notes &amp; Architecture</span>
                                </span>
                                <p className="text-slate-300 leading-relaxed">
                                  {task.remark || 'Baseline action item defined for Wholesale Banking Operations onboarding flow.'}
                                </p>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-CLICK BULK REASSIGNMENT MODAL */}
      {isHeaderReassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full p-6 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#B38D34]/20 border border-[#B38D34]/40 flex items-center justify-center text-[#B38D34]">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    1-Click Bulk Lead Reassignment
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Reassign all {selectedTaskIds.length} selected deliverables instantaneously
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHeaderReassignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Scope Target Selection */}
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[11px] mb-2">
                  Target Track to Reassign
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkReassignTarget('backend')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      bulkReassignTarget === 'backend'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Backend Lead Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkReassignTarget('frontend')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      bulkReassignTarget === 'frontend'
                        ? 'bg-purple-950 text-purple-300 border-purple-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Frontend Lead Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkReassignTarget('both')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      bulkReassignTarget === 'both'
                        ? 'bg-[#95288E]/40 text-[#D667CF] border-[#95288E] shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Both Tracks
                  </button>
                </div>
              </div>

              {/* Select Backend Lead */}
              {(bulkReassignTarget === 'backend' || bulkReassignTarget === 'both') && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <label className="block text-emerald-400 font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Select New Backend Owner</span>
                  </label>
                  <select
                    value={bulkSelectedBackendLead}
                    onChange={(e) => setBulkSelectedBackendLead(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {backendLeads.map(lead => (
                      <option key={lead} value={lead}>{lead}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Frontend Lead */}
              {(bulkReassignTarget === 'frontend' || bulkReassignTarget === 'both') && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <label className="block text-purple-400 font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-purple-400" />
                    <span>Select New Frontend Owner</span>
                  </label>
                  <select
                    value={bulkSelectedFrontendLead}
                    onChange={(e) => setBulkSelectedFrontendLead(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {frontendLeads.map(lead => (
                      <option key={lead} value={lead}>{lead}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Deliverables Preview */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold uppercase block mb-1">
                  Deliverables to be Updated ({selectedTaskIds.length}):
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-900">
                  {selectedTaskIds.map(id => {
                    const task = tasks.find(t => t.id === id);
                    if (!task) return null;
                    return (
                      <div key={id} className="pt-1 text-[11px] flex items-center justify-between text-slate-300">
                        <span className="truncate max-w-[280px]">
                          <strong className="text-white">#{task.sNo}</strong>: {task.deliverable}
                        </span>
                        <span className="text-slate-500 font-mono shrink-0 ml-2">
                          BE: {task.backendOwner} | FE: {task.frontendOwner}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsHeaderReassignModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkReassign(bulkReassignTarget, bulkSelectedBackendLead, bulkSelectedFrontendLead)}
                className="px-5 py-2 bg-[#B38D34] hover:bg-[#c99f3d] text-slate-950 rounded-lg text-xs font-mono font-bold cursor-pointer shadow-lg flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-current" />
                <span>Reassign All in 1-Click</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Delay Reason Modal */}
      <DelayReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        task={selectedTaskForReason}
        onSave={(updatedTask) => {
          onUpdateTask(updatedTask, 'delayReason', selectedTaskForReason?.delayReason || '', updatedTask.delayReason || '');
          setSelectedTaskForReason(null);
        }}
        asOfDate={asOfDate}
      />

    </div>
  );
};
