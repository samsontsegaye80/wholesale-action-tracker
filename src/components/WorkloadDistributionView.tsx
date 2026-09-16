import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight, 
  Filter, 
  Users, 
  Sparkles, 
  Info, 
  TrendingUp, 
  Activity, 
  Send,
  FileText,
  Presentation,
  Download,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { TaskItem, TeamWorkloadMetric } from '../types';
import { getTaskDeadlineStatus } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { exportWorkloadBurnoutPdf } from '../utils/exportPdf';
import { exportWorkloadBurnoutPpt } from '../utils/exportPpt';

interface WorkloadDistributionViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onTriggerReminder: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
}

export const WorkloadDistributionView: React.FC<WorkloadDistributionViewProps> = ({
  tasks,
  asOfDate,
  onTriggerReminder,
  onEditTask,
}) => {
  const { canEdit } = useAuth();
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'Backend' | 'Frontend' | 'BURNOUT'>('ALL');
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportWorkloadBurnoutPdf(tasks, asOfDate);
      setToastMsg('Workload & Burnout PDF downloaded successfully!');
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
      await exportWorkloadBurnoutPpt(tasks, asOfDate);
      setToastMsg('Workload & Burnout 16:9 Presentation (.pptx) downloaded!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      alert(`PPT export failed: ${e.message}`);
    } finally {
      setIsExportingPpt(false);
    }
  };

  const teamRoster = useMemo(() => [
    { name: 'Khalid Mohammed', role: 'Backend Lead', dept: 'Core Architecture', targetCap: 4 },
    { name: 'Yohannes Yilma', role: 'Backend Lead', dept: 'Credit & Appraisal', targetCap: 4 },
    { name: 'Dewan Asefa', role: 'Frontend Lead', dept: 'Portal & UI Suite', targetCap: 4 },
    { name: 'Eyob Girma', role: 'Backend Lead', dept: 'Post-Disbursement', targetCap: 4 },
    { name: 'Simachew Bekele', role: 'Frontend Lead', dept: 'Post-Disbursement UI', targetCap: 4 },
    { name: 'Yohannes Sahle', role: 'Backend Lead', dept: 'Feasibility & Appeals', targetCap: 4 },
    { name: 'Melaku Tefera', role: 'Frontend Lead', dept: 'Feasibility UI', targetCap: 4 },
    { name: 'Amanuel Getachew', role: 'Backend Lead', dept: 'Collateral Valuation', targetCap: 4 },
    { name: 'Raeye Daniel', role: 'Frontend Lead', dept: 'Fee & Valuation UI', targetCap: 4 },
    { name: 'Letarik (Letu) Tadesse', role: 'Frontend Lead', dept: 'Committee Voting UI', targetCap: 4 },
    { name: 'Ephrem Worku', role: 'Backend Lead', dept: 'Credit Operations', targetCap: 4 },
    { name: 'Natnael Hailu', role: 'Frontend Lead', dept: 'Collateral Operations UI', targetCap: 4 },
    { name: 'Wubishet Alemu', role: 'Frontend Lead', dept: 'Contracts & Signing UI', targetCap: 4 },
    { name: 'All Engineering Team', role: 'Cross-Functional', dept: 'Integration & Governance', targetCap: 6 },
  ], []);

  // Compute workload metrics and burnout risk index for each lead
  const workloadMetrics: TeamWorkloadMetric[] = useMemo(() => {
    return teamRoster.map(member => {
      const firstName = member.name.split(' ')[0];
      const assigned = tasks.filter(t => 
        (t.backendOwner && (t.backendOwner.includes(member.name) || t.backendOwner.includes(firstName))) ||
        (t.frontendOwner && (t.frontendOwner.includes(member.name) || t.frontendOwner.includes(firstName))) ||
        (t.testOwner && (t.testOwner.includes(member.name) || t.testOwner.includes(firstName))) ||
        (member.name.includes('All') && ((t.backendOwner && t.backendOwner.includes('All')) || (t.frontendOwner && t.frontendOwner.includes('All'))))
      );

      const completed = assigned.filter(t => t.status === 'Completed').length;
      const delayed = assigned.filter(t => {
        const info = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
        return info.category === 'OVERDUE' || t.status === 'Delayed' || t.status === 'No BRD';
      }).length;

      const inProgress = assigned.filter(t => t.status === 'In Progress').length;
      const partial = assigned.filter(t => t.status === 'Partial').length;
      const notStarted = assigned.filter(t => t.status === 'Not Started').length;
      const activeTasks = assigned.length - completed;

      const criticalHigh = assigned.filter(t => t.priority === 'Critical' || t.priority === 'High').length;

      // Burnout formula: active tasks weight (x10) + delayed tasks pressure (x15) + critical items (x8)
      let score = (activeTasks * 10) + (delayed * 15) + (criticalHigh * 8);
      score = Math.min(100, Math.max(10, score));

      let burnoutRisk: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
      let capacityWarning = 'Workload within optimal delivery capacity.';
      let recommendedAction = 'Maintain current sprint pace; ready to absorb Phase 4 deliverables.';

      if (activeTasks >= 6 || delayed >= 3 || score >= 75) {
        burnoutRisk = 'Severe';
        capacityWarning = `Critical Overload: Carrying ${activeTasks} active deliverables (${delayed} delayed). High risk of sprint fatigue & delivery bottleneck.`;
        recommendedAction = `Immediate PMO load-shedding required: reassign 2 secondary deliverables or assign dedicated pair-programming support.`;
      } else if (activeTasks >= 4 || delayed >= 1 || score >= 50) {
        burnoutRisk = 'High';
        capacityWarning = `Elevated Load: Operating at ${activeTasks} active tasks, at the ceiling of target capacity (${member.targetCap}).`;
        recommendedAction = `Freeze new scope intake; focus exclusively on clearing the ${delayed} delayed milestone(s).`;
      } else if (activeTasks >= 3 || score >= 35) {
        burnoutRisk = 'Moderate';
        capacityWarning = `Moderate Workload: Balanced execution (${activeTasks} active tasks, ${completed} completed).`;
        recommendedAction = `Track upcoming milestone deadlines in Phase 3 SteerCo review.`;
      }

      return {
        name: member.name,
        role: member.role,
        department: member.dept,
        totalAssigned: assigned.length,
        activeTasks,
        completedTasks: completed,
        delayedTasks: delayed,
        criticalHighPriority: criticalHigh,
        burnoutScore: score,
        burnoutRisk,
        capacityWarning,
        recommendedAction,
        assignedTasks: assigned,
      };
    });
  }, [tasks, asOfDate, teamRoster]);

  // Filtered members list
  const filteredMetrics = useMemo(() => {
    return workloadMetrics.filter(m => {
      if (selectedRoleFilter === 'Backend') return m.role.includes('Backend');
      if (selectedRoleFilter === 'Frontend') return m.role.includes('Frontend');
      if (selectedRoleFilter === 'BURNOUT') return m.burnoutRisk === 'High' || m.burnoutRisk === 'Severe';
      return true;
    });
  }, [workloadMetrics, selectedRoleFilter]);

  // Overall PMO Burnout KPIs
  const highRiskMembers = workloadMetrics.filter(m => m.burnoutRisk === 'High' || m.burnoutRisk === 'Severe');
  const totalActiveTasks = workloadMetrics.reduce((acc, curr) => acc + curr.activeTasks, 0);
  const avgTasksPerLead = (totalActiveTasks / Math.max(1, teamRoster.length - 1)).toFixed(1);

  // Selected member for detail view
  const activeMemberDetail = selectedMemberName 
    ? workloadMetrics.find(m => m.name === selectedMemberName) || null
    : null;

  // Custom Chart Tooltip
  const CustomWorkloadTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[220px]">
          <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <div>
              <span className="font-bold text-white font-mono text-sm">{data.name}</span>
              <div className="text-[11px] text-slate-400">{data.role} • {data.department}</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              data.burnoutRisk === 'Severe' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              data.burnoutRisk === 'High' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
              data.burnoutRisk === 'Moderate' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {data.burnoutRisk} Risk
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#95288E]"></span>
                <span>Active Uncompleted:</span>
              </span>
              <strong className="text-white">{data.activeTasks} Tasks</strong>
            </div>

            <div className="flex justify-between text-rose-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                <span>Delayed / Overdue:</span>
              </span>
              <strong className="text-rose-400 font-bold">{data.delayedTasks} Tasks</strong>
            </div>

            <div className="flex justify-between text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Completed Deliverables:</span>
              </span>
              <strong className="text-emerald-400">{data.completedTasks} Tasks</strong>
            </div>

            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Total Assigned:</span>
              <strong className="text-slate-200">{data.totalAssigned} Deliverables</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800">
            Click bar to view full task assignments
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 mb-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-[#95288E] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-[#D667CF] text-xs uppercase font-bold tracking-widest font-mono">
            <BarChart3 className="w-4 h-4" />
            <span>Resource Capacity & Health Monitoring</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Workload Distribution & Burnout Risk Radar
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Real-time deliverable allocation across engineering leads, active sprint load thresholds, and preventative burnout alerts as of reference date <span className="font-mono text-[#B38D34] font-bold">{asOfDate}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition shadow-sm hover:border-[#95288E]/60 disabled:opacity-50"
            title="Download Workload & Burnout as PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>{isExportingPdf ? 'Exporting...' : 'Workload PDF'}</span>
          </button>
          <button
            onClick={handleExportPpt}
            disabled={isExportingPpt}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#95288E]/20 hover:bg-[#95288E]/40 text-[#D667CF] hover:text-white border border-[#95288E]/50 rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
            title="Download Workload & Burnout 16:9 Presentation (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>{isExportingPpt ? 'Exporting...' : 'Workload PPT'}</span>
          </button>
          <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-right">
            <span className="text-[11px] text-slate-400 font-mono uppercase block">Active Sprint Bandwidth</span>
            <span className="text-sm font-mono font-bold text-[#D667CF]">{avgTasksPerLead} Tasks / Lead Avg</span>
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

      {/* Burnout KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>BURNOUT DANGER ZONE</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {highRiskMembers.length} Leads
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exceeding safe sprint capacity of 4 active deliverables
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>TOP OVERLOADED LEAD</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-1 truncate">
            {highRiskMembers[0]?.name || 'None'} ({highRiskMembers[0]?.activeTasks || 0} active)
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {highRiskMembers[0]?.department || 'Balanced team distribution'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>TOTAL ACTIVE DELIVERABLES</span>
            <Activity className="w-4 h-4 text-[#D667CF]" />
          </div>
          <div className="text-2xl font-black text-[#D667CF] font-mono mt-1">
            {totalActiveTasks} Tasks
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Currently undergoing active development / testing
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>BALANCED CAPACITY LEADS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {workloadMetrics.filter(m => m.burnoutRisk === 'Low' || m.burnoutRisk === 'Moderate').length} Leads
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operating in healthy workload range
          </p>
        </div>
      </div>

      {/* WORKLOAD BAR CHART SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        
        {/* Chart Filter & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D667CF]" />
              <span>Deliverables per Team Member vs. Safe Capacity</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of active uncompleted tasks vs. completed work. Dotted red line indicates the 4-task safe workload threshold.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                selectedRoleFilter === 'ALL' 
                  ? 'bg-[#95288E] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Leads ({workloadMetrics.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('BURNOUT')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                selectedRoleFilter === 'BURNOUT' 
                  ? 'bg-rose-600 text-white shadow-md' 
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>High Risk ({highRiskMembers.length})</span>
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Backend')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                selectedRoleFilter === 'Backend' 
                  ? 'bg-[#95288E] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Backend
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Frontend')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                selectedRoleFilter === 'Frontend' 
                  ? 'bg-[#95288E] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Frontend
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredMetrics}
              margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  setSelectedMemberName(state.activePayload[0].payload.name);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'monospace' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomWorkloadTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontFamily: 'monospace' }}
              />
              
              {/* Safe Capacity Threshold Reference Line */}
              <ReferenceLine 
                y={4} 
                stroke="#f43f5e" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ 
                  value: 'Safe Sprint Capacity (4 Tasks)', 
                  fill: '#f43f5e', 
                  fontSize: 11, 
                  position: 'top',
                  fontFamily: 'monospace' 
                }} 
              />

              {/* Stacked Bars */}
              <Bar 
                dataKey="activeTasks" 
                name="Active Uncompleted Tasks" 
                stackId="a" 
                fill="#95288E" 
                radius={[0, 0, 0, 0]}
              >
                {filteredMetrics.map((entry, index) => (
                  <Cell 
                    key={`cell-active-${index}`} 
                    fill={entry.burnoutRisk === 'Severe' ? '#e11d48' : entry.burnoutRisk === 'High' ? '#f97316' : '#95288E'} 
                  />
                ))}
              </Bar>

              <Bar 
                dataKey="completedTasks" 
                name="Completed Tasks" 
                stackId="a" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#e11d48]"></span>
              <span>Severe Burnout Risk (&gt;5 Active)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#f97316]"></span>
              <span>High Load (4-5 Active)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#95288E]"></span>
              <span>Balanced Load</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#10b981]"></span>
              <span>Completed</span>
            </span>
          </div>
          <span className="text-slate-500 italic">Click on any bar to inspect task details below</span>
        </div>

      </div>

      {/* TEAM MEMBER CAPACITY BREAKDOWN CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B38D34]" />
            <span>Lead Burnout Assessments &amp; Load Balancing Recommendations</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredMetrics.length} leads
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMetrics.map(member => {
            const isSelected = selectedMemberName === member.name;
            const isSevere = member.burnoutRisk === 'Severe';
            const isHigh = member.burnoutRisk === 'High';

            return (
              <div 
                key={member.name}
                onClick={() => setSelectedMemberName(isSelected ? null : member.name)}
                className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer shadow-md relative ${
                  isSelected 
                    ? 'border-[#95288E] ring-2 ring-[#95288E]/40' 
                    : isSevere 
                    ? 'border-rose-800/80 hover:border-rose-600' 
                    : isHigh 
                    ? 'border-orange-800/80 hover:border-orange-600' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{member.name}</h4>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{member.department}</p>
                  </div>

                  {/* Burnout Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm ${
                    isSevere 
                      ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse' 
                      : isHigh 
                      ? 'bg-orange-950 text-orange-300 border border-orange-700' 
                      : member.burnoutRisk === 'Moderate' 
                      ? 'bg-amber-950 text-amber-300 border border-amber-700' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}>
                    {isSevere || isHigh ? <Flame className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{member.burnoutRisk} Burnout Risk</span>
                  </span>
                </div>

                {/* Metrics Stats Row */}
                <div className="grid grid-cols-4 gap-2 my-3 py-2.5 px-3 bg-slate-950 rounded-lg border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total</span>
                    <span className="text-sm font-bold text-white">{member.totalAssigned}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Active</span>
                    <span className={`text-sm font-bold ${member.activeTasks > 4 ? 'text-rose-400' : 'text-[#D667CF]'}`}>
                      {member.activeTasks}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Delayed</span>
                    <span className={`text-sm font-bold ${member.delayedTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {member.delayedTasks}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Done</span>
                    <span className="text-sm font-bold text-emerald-400">{member.completedTasks}</span>
                  </div>
                </div>

                {/* Warning & Recommendation */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Info className="w-3.5 h-3.5 text-[#D667CF] shrink-0 mt-0.5" />
                    <span>{member.capacityWarning}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[#B38D34] font-medium bg-[#B38D34]/10 p-2 rounded-lg border border-[#B38D34]/30">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span><strong>PMO Action:</strong> {member.recommendedAction}</span>
                  </div>
                </div>

                {/* Click toggle prompt */}
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{member.assignedTasks.length} Deliverables Assigned</span>
                  <span className="text-[#D667CF] hover:underline flex items-center gap-1">
                    <span>{isSelected ? 'Hide Deliverables ▲' : 'View Deliverables ▼'}</span>
                  </span>
                </div>

                {/* Expanded Member Task Deliverables List */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fade-in">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Active Tasks for {member.name}:
                    </h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {member.assignedTasks.map(t => {
                        const statusInfo = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
                        return (
                          <div 
                            key={t.id}
                            className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white">#{t.sNo}</span>
                                <span className="font-bold text-slate-100">{t.title}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{t.workstream}</span>
                                <span>•</span>
                                <span>Target: <strong className="text-slate-300 font-mono">{t.endDate}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                t.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                t.status === 'In Progress' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                t.status === 'Delayed' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {t.status}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTriggerReminder(t);
                                }}
                                className="p-1 text-slate-400 hover:text-[#B38D34] bg-slate-900 border border-slate-800 rounded cursor-pointer"
                                title="Send reminder / escalation notice"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTask(t);
                                  }}
                                  className="p-1 text-slate-400 hover:text-[#D667CF] bg-slate-900 border border-slate-800 rounded cursor-pointer"
                                  title="Edit deliverable"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
