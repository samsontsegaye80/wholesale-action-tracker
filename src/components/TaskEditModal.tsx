import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Save, 
  Flame, 
  Trash2,
  Tag,
  Calendar,
  Link as LinkIcon,
  Search,
  Check,
  AlertTriangle,
  ChevronDown,
  Plus
} from 'lucide-react';
import { TaskItem, TaskStatus, WorkstreamType } from '../types';
import { CalendarPopup } from './CalendarPopup';
import { calculateCriticalDelayDays } from '../utils/dateUtils';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onSave: (task: TaskItem) => void;
  onDelete?: (taskId: string) => void;
  isNewTask?: boolean;
  allTasks?: TaskItem[];
  asOfDate?: string;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  isNewTask = false,
  allTasks = [],
  asOfDate = '18-08-2026',
}) => {
  if (!isOpen || !task) return null;

  const [formData, setFormData] = useState<TaskItem>({
    ...task,
    priority: task.priority || 'Medium',
    backendStatus: task.backendStatus || task.status,
    frontendStatus: task.frontendStatus || (task.frontendOwner === '-' ? 'Not Started' : task.status),
    actualFinishDate: task.actualFinishDate || '',
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Multiselect dropdown state
  const [isDepDropdownOpen, setIsDepDropdownOpen] = useState(false);
  const [depSearchQuery, setDepSearchQuery] = useState('');
  const [customDepInput, setCustomDepInput] = useState('');
  const depDropdownRef = useRef<HTMLDivElement>(null);

  // Close dependency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (depDropdownRef.current && !depDropdownRef.current.contains(e.target as Node)) {
        setIsDepDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const workstreams: WorkstreamType[] = [
    'Foundation & Analysis',
    'Dynamic User Management & Permission Integration',
    'Existing Workflow Completion',
    'Core Modules',
    'Committee Architecture Refactor',
    'Collateral Valuation Work flow',
    'Post-Approval Requests Workflow',
    'Post-Disbursement Requests Workflow',
    'Collateral Operation Requests Workflow',
    'Credit Operations — BRD Implementation',
    'Decision Communication & Testing',
    'Production Support & Governance'
  ];

  // Candidates for dependencies (exclude self)
  const candidateTasks = useMemo(() => {
    return allTasks.filter(t => t.id !== task.id && t.sNo !== task.sNo);
  }, [allTasks, task]);

  // Filtered candidate tasks based on search
  const filteredCandidates = useMemo(() => {
    if (!depSearchQuery.trim()) return candidateTasks;
    const q = depSearchQuery.toLowerCase();
    return candidateTasks.filter(t => 
      t.title.toLowerCase().includes(q) ||
      t.deliverable.toLowerCase().includes(q) ||
      t.workstream.toLowerCase().includes(q) ||
      `#${t.sNo}`.includes(q) ||
      `task ${t.sNo}`.includes(q)
    );
  }, [candidateTasks, depSearchQuery]);

  // Parse current dependencies from string
  const currentDepEntries = useMemo(() => {
    const raw = formData.dependency || '';
    if (!raw || raw.trim() === '-' || raw.trim() === '') return [];
    // Split by semicolons or commas (if not in parenthesis)
    return raw
      .split(/;|,/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [formData.dependency]);

  // Helper to check if a candidate task is mapped in current dependencies
  const isTaskSelectedAsDep = (candidate: TaskItem) => {
    const raw = (formData.dependency || '').toLowerCase();
    if (raw.includes(`#${candidate.sNo}`) || raw.includes(`task ${candidate.sNo}`)) return true;
    return currentDepEntries.some(e => {
      const lower = e.toLowerCase();
      return lower.includes(`#${candidate.sNo}`) || 
             lower.includes(candidate.deliverable.toLowerCase()) || 
             lower.includes(candidate.title.toLowerCase());
    });
  };

  // Toggle candidate task in dependencies
  const handleToggleTaskDep = (candidate: TaskItem) => {
    const label = `#${candidate.sNo}: ${candidate.deliverable}`;
    const isSelected = isTaskSelectedAsDep(candidate);

    let nextEntries: string[];
    if (isSelected) {
      // Remove candidate reference
      nextEntries = currentDepEntries.filter(e => {
        const lower = e.toLowerCase();
        const matchesSNo = lower.includes(`#${candidate.sNo}`) || lower.includes(`task ${candidate.sNo}`);
        const matchesName = lower.includes(candidate.deliverable.toLowerCase()) || lower.includes(candidate.title.toLowerCase());
        return !matchesSNo && !matchesName;
      });
    } else {
      // Add candidate reference
      nextEntries = [...currentDepEntries, label];
    }

    const nextDepString = nextEntries.length > 0 ? nextEntries.join('; ') : '-';
    setFormData({ ...formData, dependency: nextDepString });
  };

  // Remove specific dependency entry
  const handleRemoveDepEntry = (entryToRemove: string) => {
    const nextEntries = currentDepEntries.filter(e => e !== entryToRemove);
    const nextDepString = nextEntries.length > 0 ? nextEntries.join('; ') : '-';
    setFormData({ ...formData, dependency: nextDepString });
  };

  // Add custom non-task dependency (e.g. external vendor, regulatory approval)
  const handleAddCustomDep = () => {
    if (!customDepInput.trim()) return;
    const nextEntries = [...currentDepEntries, customDepInput.trim()];
    setFormData({ ...formData, dependency: nextEntries.join('; ') });
    setCustomDepInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 border-t-4 border-t-[#95288E]">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {isNewTask ? 'Add New Project Action Deliverable' : `Edit Deliverable #${formData.sNo}: ${formData.deliverable}`}
            </h2>
            <p className="text-xs text-[#D667CF] font-mono mt-0.5 font-semibold">
              WORKSTREAM: {formData.workstream}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto bg-slate-900 text-slate-200 text-sm">
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="sm:col-span-1">
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">S.No</label>
              <input
                type="number"
                value={formData.sNo}
                onChange={(e) => setFormData({ ...formData, sNo: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-[#95288E]"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Workstream</label>
              <select
                value={formData.workstream}
                onChange={(e) => setFormData({ ...formData, workstream: e.target.value as WorkstreamType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
              >
                {workstreams.map(ws => (
                  <option key={ws} value={ws}>{ws}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Task Title / Activity</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Deliverable Output</label>
            <input
              type="text"
              value={formData.deliverable}
              onChange={(e) => setFormData({ ...formData, deliverable: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Start Date (DD-MM-YYYY)</label>
              <input
                type="text"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-[#95288E]"
                placeholder="10-08-2026"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Target Finish Date</label>
              <input
                type="text"
                value={formData.endDate}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  const updated = { ...formData, endDate: newEnd };
                  const crit = calculateCriticalDelayDays(updated, asOfDate);
                  setFormData({ ...updated, delayDays: crit.delayDays });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-[#95288E]"
                placeholder="21-08-2026"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-400 text-xs uppercase font-bold font-mono">Actual Finish Date</label>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-[11px] text-[#D667CF] hover:text-white font-mono font-semibold flex items-center gap-1 cursor-pointer transition"
                  title="Open Calendar Popup (DD-MM-YYYY)"
                >
                  <Calendar className="w-3 h-3 text-[#D667CF]" />
                  <span>Calendar Popup 📅</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.actualFinishDate || ''}
                  onChange={(e) => {
                    const newActual = e.target.value;
                    const updated = { ...formData, actualFinishDate: newActual };
                    const crit = calculateCriticalDelayDays(updated, asOfDate);
                    setFormData({ ...updated, delayDays: crit.delayDays });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 pr-10 text-slate-200 text-sm font-mono focus:outline-none focus:border-[#95288E]"
                  placeholder="DD-MM-YYYY (or click 📅)"
                />
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="absolute right-2.5 text-slate-400 hover:text-[#D667CF] p-1 transition cursor-pointer"
                  title="Select date via calendar popup ((DD-MM-YYYY))"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Critical Delays & Delay Days Count Live Indicator */}
          {(() => {
            const liveCalc = calculateCriticalDelayDays(formData, asOfDate);
            return (
              <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Critical Delay Horizon:</span>
                  {liveCalc.delayDays > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-950/90 border border-rose-500/60 text-rose-300 font-extrabold shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>+{liveCalc.delayDays} Days (Critical Overdue)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>0 Days (On-Track / Resolved)</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>Target: <strong className="text-white">{formData.endDate}</strong> vs Business Date: <strong className="text-[#B38D34]">{asOfDate}</strong></span>
                </div>
              </div>
            );
          })()}

          {/* Mapped Task Dependencies (Multiselect Dropdown) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 border-t-2 border-t-[#B38D34]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-[#B38D34]" />
                <span>Task Dependencies Mapping (Predecessors)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentDepEntries.length} Linked Predecessor{currentDepEntries.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Active Selected Dependency Chips */}
            <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-slate-900 rounded-md border border-slate-800">
              {currentDepEntries.length === 0 ? (
                <span className="text-xs text-slate-500 italic py-1 px-1">
                  No predecessor dependencies linked (Independent task or unmapped)
                </span>
              ) : (
                currentDepEntries.map((dep, idx) => {
                  // Check if this dependency corresponds to an existing task
                  const matchedTask = allTasks.find(t => 
                    dep.includes(`#${t.sNo}`) || 
                    `#${t.sNo}` === dep.trim() ||
                    t.deliverable.toLowerCase() === dep.toLowerCase()
                  );
                  const isDelayed = matchedTask && (matchedTask.status === 'Delayed' || (matchedTask.delayDays && matchedTask.delayDays > 0));

                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                        isDelayed 
                          ? 'bg-rose-950/80 border-rose-700 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                          : 'bg-slate-950 border-slate-700 text-slate-200'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3 text-[#B38D34]" />
                      <span className="font-semibold max-w-[280px] truncate" title={dep}>
                        {dep}
                      </span>
                      {matchedTask && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isDelayed 
                            ? 'bg-rose-900 text-rose-300' 
                            : matchedTask.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-blue-950 text-blue-300'
                        }`}>
                          {matchedTask.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveDepEntry(dep)}
                        className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer p-0.5"
                        title="Remove dependency"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Multiselect Dropdown & Search Bar */}
            <div className="relative" ref={depDropdownRef}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDepDropdownOpen(!isDepDropdownOpen)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-[#B38D34] rounded-md px-3 py-2 text-xs text-left font-mono text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isDepDropdownOpen ? 'Click to close selector' : 'Select from 44 Project Deliverables to link...'}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDepDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Menu */}
              {isDepDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
                  {/* Search inside dropdown */}
                  <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={depSearchQuery}
                      onChange={(e) => setDepSearchQuery(e.target.value)}
                      placeholder="Filter by deliverable name, #sNo, lead, or workstream..."
                      className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                      autoFocus
                    />
                    {depSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDepSearchQuery('')}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Scrollable list of selectable tasks */}
                  <div className="overflow-y-auto divide-y divide-slate-800/60 p-1">
                    {filteredCandidates.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-mono">
                        No matching deliverables found
                      </div>
                    ) : (
                      filteredCandidates.map(candidate => {
                        const isSelected = isTaskSelectedAsDep(candidate);
                        const isDelayed = candidate.status === 'Delayed' || (candidate.delayDays && candidate.delayDays > 0);

                        return (
                          <div
                            key={candidate.id}
                            onClick={() => handleToggleTaskDep(candidate)}
                            className={`p-2 rounded-md flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-[#95288E]/20 border border-[#95288E]/50 text-white' 
                                : 'hover:bg-slate-900 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#95288E] border-[#D667CF] text-white' : 'border-slate-700 bg-slate-950'
                              }`}>
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-200">#{candidate.sNo}</span>
                                  <span className="font-semibold truncate text-slate-100">{candidate.deliverable}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {candidate.workstream} • Leads: {candidate.backendOwner} / {candidate.frontendOwner}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              {isDelayed && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold font-mono">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  <span>Delayed</span>
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                candidate.status === 'Completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : candidate.status === 'In Progress'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}>
                                {candidate.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Custom / External Dependency Footer */}
                  <div className="p-2 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
                    <input
                      type="text"
                      value={customDepInput}
                      onChange={(e) => setCustomDepInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomDep();
                        }
                      }}
                      placeholder="Add external / custom dependency (e.g. Core Banking API, BRD Signoff)..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#B38D34]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDep}
                      className="px-2.5 py-1.5 bg-[#B38D34] hover:bg-[#c99f3d] text-slate-950 font-bold rounded text-xs font-mono cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Raw dependency string editor */}
            <div className="pt-1">
              <label className="block text-[11px] text-slate-400 font-mono mb-1">
                Raw Dependency Value (Saved in Database):
              </label>
              <input
                type="text"
                value={formData.dependency || '-'}
                onChange={(e) => setFormData({ ...formData, dependency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#95288E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Priority Level</label>
              <select
                value={formData.priority || 'Medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Percent Complete (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formData.percentComplete ?? 0}
                  onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) || 0 })}
                  className="flex-1 accent-[#95288E]"
                />
                <span className="w-12 text-center font-mono font-bold text-xs bg-slate-950 px-2 py-1.5 rounded border border-slate-800 text-[#D667CF]">
                  {formData.percentComplete ?? 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Engineering Leads & Dedicated Statuses */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3.5 border-t-2 border-t-[#95288E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#D667CF]" />
                <span>Engineering Ownership & Independent Track Status</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Backend • Frontend • QA</span>
            </div>

            {/* Backend Track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/90 rounded-md border border-slate-800/80">
              <div>
                <label className="block text-[#D667CF] text-xs uppercase font-bold mb-1 font-mono flex items-center justify-between">
                  <span>Backend Lead</span>
                  <span className="text-[10px] text-slate-400 font-normal">API & DB Core</span>
                </label>
                <input
                  type="text"
                  value={formData.backendOwner}
                  onChange={(e) => setFormData({ ...formData, backendOwner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
                  placeholder="Khalid / Yohannes Y."
                />
              </div>

              <div>
                <label className="block text-[#D667CF] text-xs uppercase font-bold mb-1 font-mono">
                  <span>Backend Status</span>
                </label>
                <select
                  value={formData.backendStatus || formData.status}
                  onChange={(e) => setFormData({ ...formData, backendStatus: e.target.value as TaskStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-sm focus:outline-none focus:border-[#95288E] font-semibold"
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

            {/* Frontend Track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/90 rounded-md border border-slate-800/80">
              <div>
                <label className="block text-[#B38D34] text-xs uppercase font-bold mb-1 font-mono flex items-center justify-between">
                  <span>Frontend Lead</span>
                  <span className="text-[10px] text-slate-400 font-normal">UI & Screens</span>
                </label>
                <input
                  type="text"
                  value={formData.frontendOwner}
                  onChange={(e) => setFormData({ ...formData, frontendOwner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-sm focus:outline-none focus:border-[#B38D34]"
                  placeholder="Dewa / Simachew / -"
                />
              </div>

              <div>
                <label className="block text-[#B38D34] text-xs uppercase font-bold mb-1 font-mono">
                  <span>Frontend Status</span>
                </label>
                <select
                  value={formData.frontendStatus || formData.status}
                  onChange={(e) => setFormData({ ...formData, frontendStatus: e.target.value as TaskStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-sm focus:outline-none focus:border-[#B38D34] font-semibold"
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

            {/* QA & Overall Deliverable Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/90 rounded-md border border-slate-800/80">
              <div>
                <label className="block text-slate-300 text-xs uppercase font-bold mb-1 font-mono">
                  QA / Test Owner
                </label>
                <input
                  type="text"
                  value={formData.testOwner}
                  onChange={(e) => setFormData({ ...formData, testOwner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-sm focus:outline-none focus:border-slate-600"
                  placeholder="QA Team / -"
                />
              </div>

              <div>
                <label className="block text-emerald-400 text-xs uppercase font-bold mb-1 font-mono">
                  Overall Deliverable Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TaskStatus;
                    setFormData({ 
                      ...formData, 
                      status: newStatus,
                      percentComplete: newStatus === 'Completed' ? 100 : newStatus === 'Not Started' ? 0 : formData.percentComplete || 50
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
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
          </div>

          {/* Delay & Risk Diagnostic */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-3 border-l-4 border-l-rose-500">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase font-mono">
              <Flame className="w-4 h-4" />
              <span>Delay Diagnostics & Slippage Count</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1">Delay Days Count</label>
                <input
                  type="number"
                  value={formData.delayDays || 0}
                  onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-rose-300 font-bold text-sm font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1">Root Cause Justification</label>
                <input
                  type="text"
                  value={formData.delayReason || ''}
                  onChange={(e) => setFormData({ ...formData, delayReason: e.target.value })}
                  placeholder="e.g. Dependent on Central Bank API specification"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase font-mono mb-1">Mitigation & SteerCo Recovery Plan</label>
              <input
                type="text"
                value={formData.mitigationPlan || ''}
                onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
                placeholder="e.g. Assigned technical lead paired coding sessions"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1.5 font-mono">Project Remarks & Notes</label>
            <textarea
              value={formData.remark || ''}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#95288E]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {onDelete && !isNewTask ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete deliverable #${formData.sNo}?`)) {
                    onDelete(formData.id);
                  }
                }}
                className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-md text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-md shadow-[#95288E]/30 border border-[#D667CF]/40"
              >
                <Save className="w-4 h-4" />
                <span>Save Deliverable</span>
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Calendar Popup for Actual Finish Date */}
      <CalendarPopup
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        value={formData.actualFinishDate || ''}
        onChange={(newDate) => {
          const updated = { ...formData, actualFinishDate: newDate };
          const crit = calculateCriticalDelayDays(updated, asOfDate);
          setFormData({
            ...updated,
            delayDays: crit.delayDays
          });
        }}
        targetFinishDate={formData.endDate}
        businessDate={asOfDate}
        taskTitle={`#${formData.sNo}: ${formData.deliverable}`}
      />
    </div>
  );
};
