import React, { useState } from 'react';
import { 
  Users, 
  Flame, 
  Search, 
  ChevronRight, 
  Mail, 
  CheckCircle2, 
  Clock,
  FileText,
  Presentation,
  Download,
  Check
} from 'lucide-react';
import { TaskItem, TeamMemberStats } from '../types';
import { getTaskDeadlineStatus } from '../utils/dateUtils';
import { exportDepartmentMatrixPdf } from '../utils/exportPdf';
import { exportDepartmentMatrixPpt } from '../utils/exportPpt';

interface TeamAccountabilityViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onTriggerReminder: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
}

export const TeamAccountabilityView: React.FC<TeamAccountabilityViewProps> = ({
  tasks,
  asOfDate,
  onTriggerReminder,
  onEditTask,
}) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [searchMember, setSearchMember] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportDepartmentMatrixPdf(tasks, asOfDate);
      setToastMsg('Department Matrix PDF downloaded successfully!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPpt = async () => {
    setIsExportingPpt(true);
    try {
      await exportDepartmentMatrixPpt(tasks, asOfDate);
      setToastMsg('Department Matrix 16:9 Presentation (.pptx) downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PPT export failed: ${e.message}`);
    } finally {
      setIsExportingPpt(false);
    }
  };

  const membersList = [
    { name: 'Khalid Mohammed', role: 'Backend Lead', focus: 'User Mgmt, API Auth, DLL Rules, Committee Engine' },
    { name: 'Yohannes Yilma', role: 'Backend Lead', focus: 'CRM LAF/DDR, Appraisal, Committee Bundle, Credit Info' },
    { name: 'Dewan Asefa', role: 'Frontend Lead', focus: 'CRM UI, Appraisal File Viewer, Committee Case Bundle' },
    { name: 'Eyob Girma', role: 'Backend Lead', focus: 'Fee Management & Post-Disbursement Suite' },
    { name: 'Simachew Bekele', role: 'Frontend Lead', focus: 'Post-Disbursement UI & Workflows' },
    { name: 'Yohannes Sahle', role: 'Backend Lead', focus: 'Feasibility Review & Post-Approval Appeals' },
    { name: 'Melaku Tefera', role: 'Frontend Lead', focus: 'Feasibility UI, Appeals & Condition Lifting' },
    { name: 'Amanuel Getachew', role: 'Backend Lead', focus: 'Collateral Valuation Pipeline & Asset Reports' },
    { name: 'Raeye Daniel', role: 'Frontend Lead', focus: 'Fee Engine & Valuation Upload Interfaces' },
    { name: 'Letarik (Letu) Tadesse', role: 'Frontend Lead', focus: 'Committee Voting UI & Meeting Management' },
    { name: 'Ephrem Worku', role: 'Backend Lead', focus: 'Collateral Operations & Credit Operations BRD' },
    { name: 'Natnael Hailu', role: 'Frontend Lead', focus: 'Collateral Release & Replacement Interfaces' },
    { name: 'Wubishet Alemu', role: 'Frontend Lead', focus: 'Credit Operations UI & Contract Execution' },
    { name: 'All Engineering Team', role: 'Cross-Functional', focus: 'BRD Review, Technical Design, E2E Integration' },
  ];

  const memberStats: Array<TeamMemberStats & { focus: string; tasks: TaskItem[] }> = membersList.map(m => {
    const firstName = m.name.split(' ')[0];
    const assignedTasks = tasks.filter(t => 
      t.backendOwner.includes(m.name) || 
      t.frontendOwner.includes(m.name) || 
      t.testOwner.includes(m.name) ||
      t.backendOwner.includes(firstName) || 
      t.frontendOwner.includes(firstName) ||
      (m.name.includes('All') && (t.backendOwner.includes('All') || t.frontendOwner.includes('All')))
    );
    const completed = assignedTasks.filter(t => t.status === 'Completed').length;
    const inProgress = assignedTasks.filter(t => t.status === 'In Progress').length;
    const partial = assignedTasks.filter(t => t.status === 'Partial').length;
    const delayed = assignedTasks.filter(t => {
      const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
      return info.category === 'OVERDUE' || t.status === 'Delayed';
    }).length;
    const notStarted = assignedTasks.filter(t => t.status === 'Not Started').length;
    const completionRate = assignedTasks.length > 0 ? Math.round((completed / assignedTasks.length) * 100) : 0;

    return {
      name: m.name,
      role: m.role as any,
      focus: m.focus,
      totalAssigned: assignedTasks.length,
      completed,
      inProgress,
      partial,
      delayed,
      notStarted,
      completionRate,
      tasks: assignedTasks,
    };
  });

  const filteredMembers = memberStats.filter(m => 
    m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.focus.toLowerCase().includes(searchMember.toLowerCase())
  );

  const activeMemberData = selectedMember ? memberStats.find(m => m.name === selectedMember) : null;

  return (
    <div className="space-y-5 mb-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#95288E] rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-[#D667CF] text-xs uppercase font-bold tracking-widest font-mono">
            <Users className="w-4 h-4" />
            <span>Cross-Departmental Delivery & Responsibility Matrix</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Team Accountability & Workload Dashboard
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Real-time deliverable ownership, on-time completion rates, active work streams, and delayed commitments across leads.
          </p>
        </div>

        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md text-xs font-medium transition shadow-sm hover:border-[#95288E]/60 disabled:opacity-50"
              title="Download Department Matrix as PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>{isExportingPdf ? 'Exporting...' : 'Matrix PDF'}</span>
            </button>
            <button
              onClick={handleExportPpt}
              disabled={isExportingPpt}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#95288E]/20 hover:bg-[#95288E]/40 text-[#D667CF] hover:text-white border border-[#95288E]/50 rounded-md text-xs font-medium transition shadow-sm disabled:opacity-50"
              title="Download Department Matrix 16:9 Presentation (.pptx)"
            >
              <Presentation className="w-3.5 h-3.5 text-[#D667CF]" />
              <span>{isExportingPpt ? 'Exporting...' : 'Matrix PPT'}</span>
            </button>
          </div>
          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Search lead or domain..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#95288E] font-sans"
            />
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-[#95288E]/20 border border-[#95288E]/60 rounded-lg flex items-center justify-between text-xs text-white animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const isSelected = selectedMember === member.name;
          return (
            <div
              key={member.name}
              onClick={() => setSelectedMember(isSelected ? null : member.name)}
              className={`p-4 rounded-lg border transition-all cursor-pointer bg-slate-900 ${
                isSelected
                  ? 'border-[#D667CF] ring-2 ring-[#D667CF]/50 shadow-lg'
                  : 'border-slate-800 hover:border-slate-700 shadow-md'
              } border-l-4 ${member.delayed > 0 ? 'border-l-rose-500' : 'border-l-[#95288E]'}`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white group-hover:text-[#D667CF]">{member.name}</h3>
                    <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                      {member.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {member.focus}
                  </p>
                </div>

                {member.delayed > 0 && (
                  <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/80 rounded font-mono font-bold text-xs flex items-center space-x-1 shrink-0">
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>{member.delayed} Delayed</span>
                  </span>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-1.5 py-2.5 my-2 border-y border-slate-800/80 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                  <strong className="text-slate-100 text-sm">{member.totalAssigned}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Done</span>
                  <strong className="text-emerald-400 text-sm">{member.completed}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#D667CF] block uppercase font-bold">Active</span>
                  <strong className="text-[#D667CF] text-sm">{member.inProgress + member.partial}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#B38D34] block uppercase font-bold">Next</span>
                  <strong className="text-[#B38D34] text-sm">{member.notStarted}</strong>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${member.delayed > 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#95288E] to-[#D667CF]'}`}
                  style={{ width: `${member.completionRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 mt-2.5 font-mono">
                <span>Progress: <strong className="text-[#D667CF] text-sm font-bold">{member.completionRate}%</strong></span>
                <span className="text-[#D667CF] flex items-center space-x-1 hover:underline font-bold">
                  <span>{isSelected ? 'Collapse' : 'View Tasks'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Member Deep Dive Panel */}
      {activeMemberData && (
        <div className="bg-slate-900 border border-[#95288E]/70 rounded-lg p-5 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Deliverables Assigned to: <span className="text-[#D667CF]">{activeMemberData.name}</span> ({activeMemberData.role})
                </h3>
                <span className="text-xs text-[#B38D34] bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 font-mono font-bold">
                  {activeMemberData.totalAssigned} Total Tasks
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Core domain focus: {activeMemberData.focus}
              </p>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="text-xs sm:text-sm text-slate-300 hover:text-[#D667CF] font-mono cursor-pointer font-bold px-2 py-1 bg-slate-800 rounded"
            >
              Close ✕
            </button>
          </div>

          <div className="space-y-2.5">
            {activeMemberData.tasks.map((task) => {
              const deadlineInfo = getTaskDeadlineStatus(task.endDate, task.status, asOfDate);
              const isOverdue = deadlineInfo.category === 'OVERDUE';
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue ? 'bg-rose-950/25 border-rose-800/80' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-mono font-bold text-slate-300">#{task.sNo}</span>
                      <span className="text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                        {task.workstream}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${deadlineInfo.badgeColor}`}>
                        {deadlineInfo.label}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white">
                      {task.title}
                    </div>

                    <div className="text-xs text-slate-300">
                      Deliverable: <strong className="text-slate-100">{task.deliverable}</strong> • Window: {task.startDate} to {task.endDate}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onTriggerReminder(task)}
                      className="px-3 py-1.5 bg-[#B38D34]/25 hover:bg-[#B38D34]/35 text-[#B38D34] border border-[#B38D34]/60 rounded-md text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#B38D34]" />
                      <span>Send Alert</span>
                    </button>
                    <button
                      onClick={() => onEditTask(task)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
