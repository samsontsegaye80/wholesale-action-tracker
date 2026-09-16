import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  FileText,
  Calendar,
  Sparkles, 
  Plus, 
  Bell, 
  RotateCcw, 
  Clock, 
  ShieldCheck,
  LogOut,
  History,
  Lock,
  KeyRound,
  UserCheck,
  BarChart3,
  Compass,
  Workflow,
  RefreshCw,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTabType = 'daily_report' | 'tasks' | 'dependencies' | 'delays' | 'workload' | 'roadmap' | 'team' | 'timeline' | 'ai_risks';

interface NavbarProps {
  asOfDate: string;
  onAsOfDateChange: (newDate: string) => void;
  onOpenExecutiveSummary: () => void;
  onOpenReminders: () => void;
  onOpenDailyExport: () => void;
  onOpenChangeLog: () => void;
  onAddNewTask: () => void;
  onResetData: () => void;
  onSyncRemote?: () => void;
  isSyncingRemote?: boolean;
  onUnlockEdit: () => void;
  onOpenResetPassword?: () => void;
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  asOfDate,
  onAsOfDateChange,
  onOpenExecutiveSummary,
  onOpenReminders,
  onOpenDailyExport,
  onOpenChangeLog,
  onAddNewTask,
  onResetData,
  onSyncRemote,
  isSyncingRemote,
  onUnlockEdit,
  onOpenResetPassword,
  activeTab,
  onTabChange,
}) => {
  const { user, signOut, canEdit, loading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAddNewTaskClick = () => {
    if (!canEdit) {
      onUnlockEdit();
      return;
    }
    onAddNewTask();
  };

  const handleResetDataClick = () => {
    if (!canEdit) {
      onUnlockEdit();
      return;
    }
    onResetData();
  };

  return (
    <header className="bg-slate-900/95 text-slate-100 border-b border-slate-800 shadow-xl backdrop-blur-md w-full pt-[env(safe-area-inset-top,0px)] sticky top-0 z-40">
      
      {/* Top Bar - Mobile & Desktop Responsive Header */}
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
        
        {/* Mobile Header Row */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Brand & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#95288E]/25 border border-[#95288E]/70 flex items-center justify-center text-[#D667CF] shadow-md shadow-[#95288E]/40 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white flex items-center">
                <span>WHOLESALE OPS</span>
                <span className="text-[#D667CF] font-light ml-1.5 text-base sm:text-xl hidden xs:inline">Control Center</span>
              </h1>
              <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span className="text-[#B38D34] flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B38D34] animate-pulse"></span>
                  LIVE OPS
                </span>
                <span className="text-slate-600">•</span>
                <span className="truncate text-slate-300">As-Of {asOfDate}</span>
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Action Trigger & Menu Toggle */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenExecutiveSummary}
              className="px-2.5 py-1.5 bg-gradient-to-r from-[#95288E] to-[#7e1f77] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-[#95288E]/40 border border-[#D667CF]/50 active:scale-95"
              title="SteerCo AI Review"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B38D34]" />
              <span className="text-[11px]">AI</span>
            </button>

            <button
              onClick={handleAddNewTaskClick}
              className="p-1.5 bg-slate-800 border border-slate-700 hover:border-[#D667CF]/60 text-slate-100 rounded-lg transition-all active:scale-95"
              title="Add Deliverable"
            >
              <Plus className="w-4 h-4 text-[#D667CF]" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                isMobileMenuOpen 
                  ? 'bg-[#95288E]/30 border-[#D667CF] text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
              }`}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-[#D667CF]" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Desktop Controls (Hidden on Mobile) */}
        <div className="hidden md:flex flex-wrap items-center gap-3">
          
          {/* As-Of Baseline Date Simulator */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider font-mono">Baseline Date</span>
            <div className="flex items-center gap-1.5 mt-0.5 bg-slate-950 border border-slate-800 hover:border-[#B38D34]/70 transition-colors rounded-md px-2.5 py-1 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[#B38D34]" />
              <input
                type="text"
                value={asOfDate}
                onChange={(e) => onAsOfDateChange(e.target.value)}
                placeholder="18-08-2026"
                className="w-20 bg-transparent text-xs text-[#B38D34] font-mono font-bold focus:outline-none"
                title="Change project baseline reference date (DD-MM-YYYY)"
              />
            </div>
          </div>

          {/* Export Buttons: PDF, XLSX, PPTX, ICS */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider font-mono">System Export</span>
            <div className="flex items-center gap-1 mt-0.5">
              <button 
                onClick={onOpenDailyExport}
                className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-[#D667CF]/80 rounded text-[11px] font-mono font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Export executive PDF boardroom report"
              >
                <FileText className="w-3 h-3 text-[#D667CF]" />
                <span>PDF</span>
              </button>
              <button 
                onClick={onOpenDailyExport}
                className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-emerald-500/70 rounded text-[11px] font-mono font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Export multi-sheet Excel workbook"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>XLSX</span>
              </button>
              <button 
                onClick={onOpenDailyExport}
                className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-[#B38D34]/70 rounded text-[11px] font-mono font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Export executive PowerPoint presentation"
              >
                <Presentation className="w-3 h-3 text-[#B38D34]" />
                <span>PPTX</span>
              </button>
              <button 
                onClick={onOpenDailyExport}
                className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-cyan-500/70 rounded text-[11px] font-mono font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Sync deadlines with Outlook & Google Calendar (.ics)"
              >
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>ICS</span>
              </button>
            </div>
          </div>

          {/* Quick AI, Reminders & Change Log Actions */}
          <div className="flex items-center gap-1.5 pt-0 self-end">
            <button
              onClick={onOpenChangeLog}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:border-[#95288E]/70 rounded-md text-xs font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="View Last 10 Task Modifications Change Log"
            >
              <History className="w-3.5 h-3.5 text-[#D667CF]" />
              <span>Log</span>
            </button>

            <button
              onClick={onOpenReminders}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:border-[#B38D34]/70 rounded-md text-xs font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Daily Task Reminders"
            >
              <Bell className="w-3.5 h-3.5 text-[#B38D34]" />
              <span>Reminders</span>
            </button>

            <button
              onClick={onOpenExecutiveSummary}
              className="px-3 py-1.5 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#95288E]/40 border border-[#D667CF]/50"
              title="Generate Executive SteerCo AI Review & Risk Radar"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B38D34]" />
              <span>SteerCo AI</span>
            </button>

            <button
              onClick={handleAddNewTaskClick}
              className={`px-3 py-1.5 border rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                canEdit 
                  ? 'bg-slate-800 border-slate-700 hover:border-[#D667CF]/60 text-slate-100 hover:bg-slate-750'
                  : 'bg-slate-850 border-slate-800 text-slate-400'
              }`}
              title={canEdit ? "Add New Action Item" : "Requires Samson credentials to add tasks"}
            >
              {canEdit ? <Plus className="w-3.5 h-3.5 text-[#D667CF]" /> : <Lock className="w-3 h-3 text-amber-400" />}
              <span>Add</span>
            </button>

            <button
              onClick={handleResetDataClick}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:text-[#D667CF] hover:bg-slate-700 transition-colors cursor-pointer"
              title={canEdit ? "Reset to 44 Baseline Deliverables" : "Requires Samson credentials"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onSyncRemote && (
              <button
                onClick={onSyncRemote}
                disabled={isSyncingRemote}
                className="p-1.5 bg-slate-800 border border-slate-700 hover:border-cyan-500/70 rounded-md text-xs font-mono font-bold text-slate-100 hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                title="Sync live deliverables & reminders from remote server"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingRemote ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Authentication / Samson Editor Permissions Badge */}
            {!authLoading && (
              canEdit ? (
                <div className="flex items-center gap-1.5 bg-[#95288E]/20 border border-[#95288E]/60 rounded-md px-2 py-1 text-xs">
                  <div className="w-5 h-5 rounded-full bg-[#95288E] text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                    S
                  </div>
                  <div className="text-left font-mono leading-none">
                    <span className="text-white font-bold block text-[10px]">Samson</span>
                  </div>
                  {onOpenResetPassword && (
                    <button
                      onClick={onOpenResetPassword}
                      className="text-slate-400 hover:text-[#B38D34] transition-colors p-0.5 cursor-pointer"
                      title="Reset or Change Admin Password"
                    >
                      <KeyRound className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onUnlockEdit}
                  className="flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 rounded-md px-2 py-1 text-xs text-amber-300 transition-colors cursor-pointer shadow-sm font-mono font-bold text-[11px]"
                  title="Unlock Edit Rights"
                >
                  <KeyRound className="w-3 h-3 text-amber-400" />
                  <span>Unlock</span>
                </button>
              )
            )}
          </div>

        </div>

      </div>

      {/* Expandable Mobile Quick Action Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-3 py-3 bg-slate-950 border-b border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Mobile Baseline Date Simulator */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B38D34]" />
              <span>Baseline Date:</span>
            </span>
            <input
              type="text"
              value={asOfDate}
              onChange={(e) => onAsOfDateChange(e.target.value)}
              placeholder="18-08-2026"
              className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-[#B38D34] font-mono font-bold text-right focus:outline-none focus:border-[#B38D34]"
            />
          </div>

          {/* Mobile Export Grid */}
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1.5">System Exports & Reports</span>
            <div className="grid grid-cols-4 gap-1.5">
              <button 
                onClick={() => { onOpenDailyExport(); setIsMobileMenuOpen(false); }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 flex flex-col items-center gap-1 active:bg-slate-800"
              >
                <FileText className="w-4 h-4 text-[#D667CF]" />
                <span className="text-[10px]">PDF</span>
              </button>
              <button 
                onClick={() => { onOpenDailyExport(); setIsMobileMenuOpen(false); }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 flex flex-col items-center gap-1 active:bg-slate-800"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">Excel</span>
              </button>
              <button 
                onClick={() => { onOpenDailyExport(); setIsMobileMenuOpen(false); }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 flex flex-col items-center gap-1 active:bg-slate-800"
              >
                <Presentation className="w-4 h-4 text-[#B38D34]" />
                <span className="text-[10px]">PPTX</span>
              </button>
              <button 
                onClick={() => { onOpenDailyExport(); setIsMobileMenuOpen(false); }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 flex flex-col items-center gap-1 active:bg-slate-800"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">Calendar</span>
              </button>
            </div>
          </div>

          {/* Mobile Admin Tools & Links */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onOpenReminders(); setIsMobileMenuOpen(false); }}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 active:bg-slate-800"
            >
              <Bell className="w-3.5 h-3.5 text-[#B38D34]" />
              <span>Reminders</span>
            </button>

            <button
              onClick={() => { onOpenChangeLog(); setIsMobileMenuOpen(false); }}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 active:bg-slate-800"
            >
              <History className="w-3.5 h-3.5 text-[#D667CF]" />
              <span>Change Log</span>
            </button>

            {onSyncRemote && (
              <button
                onClick={() => { onSyncRemote(); setIsMobileMenuOpen(false); }}
                disabled={isSyncingRemote}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 active:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRemote ? 'animate-spin' : ''}`} />
                <span>{isSyncingRemote ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            )}

            <button
              onClick={() => { handleResetDataClick(); setIsMobileMenuOpen(false); }}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 active:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset 44</span>
            </button>
          </div>

          {/* User Auth Info on Mobile */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            {canEdit ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Samson (Editor Active)</span>
                </span>
                <div className="flex items-center gap-2">
                  {onOpenResetPassword && (
                    <button
                      onClick={() => { onOpenResetPassword(); setIsMobileMenuOpen(false); }}
                      className="text-slate-400 hover:text-white underline text-[11px]"
                    >
                      Password
                    </button>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-rose-400 hover:text-rose-300 font-bold text-[11px] flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { onUnlockEdit(); setIsMobileMenuOpen(false); }}
                className="w-full py-2 bg-amber-950/40 border border-amber-800/80 rounded-lg text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlock Edit Rights (Admin Samson)</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Navigation Sub-bar with Horizontal Scroll for Mobile */}
      <div className="w-full px-2.5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between overflow-x-auto scrollbar-none py-2 -webkit-overflow-scrolling-touch">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTabChange('daily_report')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'daily_report'
                ? 'bg-gradient-to-r from-[#95288E] to-[#701A75] text-white shadow-md shadow-[#95288E]/60 border border-[#FDE047]/70 ring-1 ring-[#FDE047]/50'
                : 'text-[#FDE047] bg-[#95288E]/20 hover:bg-[#95288E]/40 border border-[#B38D34]/50 hover:text-white'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>📊 Daily Report Status (CBE)</span>
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                : 'text-slate-300 hover:text-[#D667CF] hover:bg-slate-800/80'
            }`}
          >
            📋 Master Action Plan (44)
          </button>

          <button
            onClick={() => onTabChange('dependencies')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dependencies'
                ? 'bg-gradient-to-r from-[#95288E] to-[#B38D34] text-white shadow-md shadow-[#95288E]/60 border border-[#FDE047]/80 ring-1 ring-[#FDE047]/50'
                : 'text-slate-300 hover:text-[#FDE047] hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>🕸️ Dependency Graph</span>
          </button>

          <button
            onClick={() => onTabChange('delays')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'delays'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/50'
            }`}
          >
            🚨 Delay Log &amp; Root Cause
          </button>

          <button
            onClick={() => onTabChange('workload')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'workload'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                : 'text-slate-300 hover:text-[#D667CF] hover:bg-slate-800/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>Workload &amp; Burnout</span>
          </button>

          <button
            onClick={() => onTabChange('roadmap')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'roadmap'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                : 'text-slate-300 hover:text-[#D667CF] hover:bg-slate-800/80'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>Strategic Roadmap (6M)</span>
          </button>

          <button
            onClick={() => onTabChange('team')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                : 'text-slate-300 hover:text-[#D667CF] hover:bg-slate-800/80'
            }`}
          >
            👥 Department Matrix
          </button>

          <button
            onClick={() => onTabChange('timeline')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/50 border border-[#D667CF]/50'
                : 'text-slate-300 hover:text-[#D667CF] hover:bg-slate-800/80'
            }`}
          >
            📅 Tactical Gantt
          </button>

          <button
            onClick={() => onTabChange('ai_risks')}
            className={`px-3.5 py-2 rounded-md text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ai_risks'
                ? 'bg-gradient-to-r from-[#95288E] to-[#701A75] text-white shadow-md shadow-[#95288E]/60 border border-[#FDE047]/80 ring-1 ring-[#FDE047]/60'
                : 'text-[#D667CF] bg-[#95288E]/15 hover:bg-[#95288E]/30 border border-[#95288E]/50 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FDE047] animate-pulse" />
            <span>⚡ AI Risks &amp; Resolutions</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-300">
          <span>ACCESS: <strong className={canEdit ? "text-emerald-400" : "text-amber-400"}>{canEdit ? "SAMSON (EDITOR)" : "VIEWER (READ-ONLY)"}</strong></span>
          <span>•</span>
          <span>PROJECT: <strong className="text-[#D667CF]">WB-ORIG-2026</strong></span>
        </div>
      </div>
    </header>
  );
};
