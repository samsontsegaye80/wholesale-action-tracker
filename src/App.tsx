import React, { useState, useEffect } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { KPIBanner } from './components/KPIBanner';
import { TaskTable } from './components/TaskTable';
import { DelayAnalyticsView } from './components/DelayAnalyticsView';
import { WorkloadDistributionView } from './components/WorkloadDistributionView';
import { StrategicRoadmapView } from './components/StrategicRoadmapView';
import { TeamAccountabilityView } from './components/TeamAccountabilityView';
import { TimelineGanttView } from './components/TimelineGanttView';
import { DailyReportStatusView } from './components/DailyReportStatusView';
import { DependencyGraphView } from './components/DependencyGraphView';
import { AiRisksAndResolutionsView } from './components/AiRisksAndResolutionsView';
import { ExecutiveSummaryModal } from './components/ExecutiveSummaryModal';
import { AutomatedRemindersModal } from './components/AutomatedRemindersModal';
import { DailyExportModal } from './components/DailyExportModal';
import { TaskEditModal } from './components/TaskEditModal';
import { ChangeLogModal } from './components/ChangeLogModal';
import { UnlockEditModal } from './components/UnlockEditModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { SignInPage } from './components/SignInPage';
import { TaskItem, ReminderNotification, ChangeLogEntry } from './types';
import { loadTasksFromStorage, saveTasksToStorage, resetTasksToDefault } from './utils/storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  fetchTasksApi, 
  saveTaskApi, 
  deleteTaskApi, 
  resetTasksApi,
  fetchRemindersApi,
  saveReminderApi,
  syncRemoteApi
} from './utils/api';

function MainApp() {
  const { user, idToken, canEdit, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasksFromStorage());
  const [asOfDate, setAsOfDate] = useState<string>(() => loadAsOfDateFromStorage());
  const [activeTab, setActiveTab] = useState<NavTabType>('tasks');
  const [filterStatusPreset, setFilterStatusPreset] = useState<string>('ALL');

  // Reminders Log
  const [remindersLog, setRemindersLog] = useState<ReminderNotification[]>(() => {
    try {
      const saved = localStorage.getItem('wb_pmo_reminders_log');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Change Log State (Last modifications with user accountability)
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('wb_pmo_change_logs');
      if (saved) return JSON.parse(saved);
      // Seed default initial demo log for PMO accountability
      return [
        {
          id: 'log_seed_1',
          taskId: 'task_3',
          taskSNo: 3,
          taskTitle: 'Initiate dynamic maker-checker permission mapping matrix',
          userName: 'Samson (Lead PMO Admin)',
          userEmail: 'samson.pmo@wholesalebank.internal',
          fieldChanged: 'Status',
          oldValue: 'In Progress',
          newValue: 'Delayed (+5d)',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'log_seed_2',
          taskId: 'task_23',
          taskSNo: 23,
          taskTitle: 'Collateral revaluation trigger logic',
          userName: 'Samson (Lead PMO Admin)',
          userEmail: 'samson.pmo@wholesalebank.internal',
          fieldChanged: 'Mitigation Plan',
          oldValue: 'Under review',
          newValue: 'Paired architectural session with risk core team scheduled',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        }
      ];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangeLogModalOpen, setIsChangeLogModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedTaskForReminder, setSelectedTaskForReminder] = useState<TaskItem | null>(null);
  const [isSyncingRemote, setIsSyncingRemote] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Initialize tasks from Cloud SQL API with fallback to local storage
  useEffect(() => {
    const initData = async () => {
      // 1. Initial fast local load
      const local = loadTasksFromStorage();
      if (local && local.length > 0) {
        setTasks(local);
      }

      // 2. Fetch from Cloud SQL API
      const remoteTasks = await fetchTasksApi(idToken);
      if (remoteTasks && remoteTasks.length > 0) {
        setTasks(remoteTasks);
        saveTasksToStorage(remoteTasks);
      }

      // 3. Fetch reminders from Cloud SQL
      const remoteReminders = await fetchRemindersApi(idToken);
      if (remoteReminders && remoteReminders.length > 0) {
        setRemindersLog(remoteReminders);
      }
    };

    initData();
  }, [idToken]);

  const recordChangeLog = (entry: Omit<ChangeLogEntry, 'id' | 'timestamp' | 'userName' | 'userEmail'>) => {
    const newEntry: ChangeLogEntry = {
      ...entry,
      id: `chg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userName: user?.displayName || 'Samson (Lead PMO Admin)',
      userEmail: user?.email || 'samson.pmo@wholesalebank.internal',
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...changeLogs].slice(0, 50);
    setChangeLogs(updated);
    try {
      localStorage.setItem('wb_pmo_change_logs', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Status or Field update from TaskTable
  const handleUpdateTask = async (
    updatedTask: TaskItem, 
    fieldChanged?: string, 
    oldValue?: string, 
    newValue?: string
  ) => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }

    const updatedList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedList);
    saveTasksToStorage(updatedList);

    if (fieldChanged) {
      recordChangeLog({
        taskId: updatedTask.id,
        taskSNo: updatedTask.sNo,
        taskTitle: updatedTask.title,
        fieldChanged: fieldChanged,
        oldValue: oldValue || '',
        newValue: newValue || '',
      });
    }

    await saveTaskApi(updatedTask, idToken);
  };

  // Save from TaskEditModal
  const handleSaveTask = async (savedTask: TaskItem) => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }

    let updatedList: TaskItem[];
    const existing = tasks.find(t => t.id === savedTask.id);

    if (existing) {
      updatedList = tasks.map(t => t.id === savedTask.id ? savedTask : t);
      // Determine what changed for change log
      if (existing.status !== savedTask.status) {
        recordChangeLog({
          taskId: savedTask.id,
          taskSNo: savedTask.sNo,
          taskTitle: savedTask.title,
          fieldChanged: 'Status',
          oldValue: existing.status,
          newValue: savedTask.status,
        });
      } else if (existing.endDate !== savedTask.endDate) {
        recordChangeLog({
          taskId: savedTask.id,
          taskSNo: savedTask.sNo,
          taskTitle: savedTask.title,
          fieldChanged: 'Target Finish Date',
          oldValue: existing.endDate,
          newValue: savedTask.endDate,
        });
      } else if (existing.actualFinishDate !== savedTask.actualFinishDate) {
        recordChangeLog({
          taskId: savedTask.id,
          taskSNo: savedTask.sNo,
          taskTitle: savedTask.title,
          fieldChanged: 'Actual Finish Date',
          oldValue: existing.actualFinishDate || '(None)',
          newValue: savedTask.actualFinishDate || '(None)',
        });
      } else if (existing.delayDays !== savedTask.delayDays) {
        recordChangeLog({
          taskId: savedTask.id,
          taskSNo: savedTask.sNo,
          taskTitle: savedTask.title,
          fieldChanged: 'Delay Horizon',
          oldValue: `${existing.delayDays || 0}d`,
          newValue: `${savedTask.delayDays || 0}d`,
        });
      } else {
        recordChangeLog({
          taskId: savedTask.id,
          taskSNo: savedTask.sNo,
          taskTitle: savedTask.title,
          fieldChanged: 'Task Parameters',
          oldValue: 'Previous revision',
          newValue: 'Updated deliverable configuration',
        });
      }
    } else {
      updatedList = [...tasks, savedTask];
      recordChangeLog({
        taskId: savedTask.id,
        taskSNo: savedTask.sNo,
        taskTitle: savedTask.title,
        fieldChanged: 'Created Deliverable',
        oldValue: '(New)',
        newValue: `Created #${savedTask.sNo}: ${savedTask.title}`,
      });
    }

    setTasks(updatedList);
    saveTasksToStorage(updatedList);
    await saveTaskApi(savedTask, idToken);
    setIsEditModalOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }

    const target = tasks.find(t => t.id === taskId);
    const updatedList = tasks.filter(t => t.id !== taskId);
    setTasks(updatedList);
    saveTasksToStorage(updatedList);

    if (target) {
      recordChangeLog({
        taskId: target.id,
        taskSNo: target.sNo,
        taskTitle: target.title,
        fieldChanged: 'Deleted Deliverable',
        oldValue: `Task #${target.sNo}`,
        newValue: 'Removed from Action Plan',
      });
    }

    await deleteTaskApi(taskId, idToken);
    setIsEditModalOpen(false);
  };

  const handleBulkUpdateTasks = async (taskIds: string[], updates: Partial<TaskItem>, changeSummary: string) => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }

    const idSet = new Set(taskIds);
    const updatedList = tasks.map(t => {
      if (idSet.has(t.id)) {
        return {
          ...t,
          ...updates,
          lastUpdated: new Date().toISOString()
        };
      }
      return t;
    });

    setTasks(updatedList);
    saveTasksToStorage(updatedList);

    recordChangeLog({
      taskId: `bulk_${Date.now()}`,
      taskSNo: taskIds.length,
      taskTitle: `${taskIds.length} Selected Deliverables`,
      fieldChanged: 'Bulk Status/Priority Update',
      oldValue: 'Previous configuration',
      newValue: changeSummary,
    });

    for (const id of taskIds) {
      const updated = updatedList.find(t => t.id === id);
      if (updated) {
        saveTaskApi(updated, idToken).catch(err => console.error('Bulk save error for task:', id, err));
      }
    }
  };

  const handleResetData = async () => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }

    if (confirm('Reset all 44 tasks to the original baseline project action plan in Cloud SQL?')) {
      const reset = await resetTasksApi(idToken);
      setTasks(reset);
      saveTasksToStorage(reset);
      recordChangeLog({
        taskId: 'all',
        taskSNo: 0,
        taskTitle: 'All 44 Deliverables',
        fieldChanged: 'System Reset',
        oldValue: 'Custom plan',
        newValue: 'Baseline 44 Deliverables Restored',
      });
    }
  };

  const handleSyncRemote = async () => {
    try {
      setIsSyncingRemote(true);
      const res = await syncRemoteApi('https://wholsaleprojectmvp3.ai.studio', idToken);
      if (res && res.success && Array.isArray(res.tasks) && res.tasks.length > 0) {
        setTasks(res.tasks);
        saveTasksToStorage(res.tasks);
        if (Array.isArray(res.reminders) && res.reminders.length > 0) {
          setRemindersLog(res.reminders);
          try {
            localStorage.setItem('wb_pmo_reminders_log', JSON.stringify(res.reminders));
          } catch (e) {
            console.error(e);
          }
        }
        recordChangeLog({
          taskId: 'sync_remote',
          taskSNo: 0,
          taskTitle: 'Master Deliverables Sync',
          fieldChanged: 'Cloud Sync',
          oldValue: 'Local Baseline',
          newValue: 'Synced from https://wholsaleprojectmvp3.ai.studio',
        });
        setSyncNotification(`Successfully synchronized ${res.tasks.length} deliverables from https://wholsaleprojectmvp3.ai.studio`);
        setTimeout(() => setSyncNotification(null), 5000);
      } else {
        setSyncNotification('Sync completed, but no changes were returned from remote server.');
        setTimeout(() => setSyncNotification(null), 4000);
      }
    } catch (e: any) {
      console.error('Failed to sync remote:', e);
      setSyncNotification(`Sync failed: ${e.message || 'Unknown network error'}`);
      setTimeout(() => setSyncNotification(null), 5000);
    } finally {
      setIsSyncingRemote(false);
    }
  };

  const handleSaveRemindersLog = async (logs: ReminderNotification[]) => {
    setRemindersLog(logs);
    try {
      localStorage.setItem('wb_pmo_reminders_log', JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
    // Save newest reminder to Cloud SQL
    if (logs.length > 0) {
      await saveReminderApi(logs[0], idToken);
    }
  };

  const handleOpenReminderForTask = (task: TaskItem) => {
    setSelectedTaskForReminder(task);
    setIsReminderModalOpen(true);
  };

  const handleEditTaskClick = (task: TaskItem) => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleAddNewTaskClick = () => {
    if (!canEdit) {
      setIsUnlockModalOpen(true);
      return;
    }
    setEditingTask({
      id: `task_new_${Date.now()}`,
      sNo: tasks.length + 1,
      workstream: 'Core Modules',
      title: '',
      deliverable: '',
      startDate: asOfDate,
      endDate: asOfDate,
      priority: 'Medium',
      backendOwner: 'Khalid',
      frontendOwner: 'Dewa',
      dependency: '-',
      status: 'Not Started',
      delayDays: 0,
      remark: '',
      mitigationPlan: '',
      delayReason: '',
      percentComplete: 0,
      actualFinishDate: '',
      lastUpdated: new Date().toISOString(),
    });
    setIsEditModalOpen(true);
  };

  const handleFilterClick = (filter: string) => {
    setFilterStatusPreset(filter);
    if (activeTab !== 'tasks') {
      setActiveTab('tasks');
    }
  };

  // Sign-in gate check: require sign-in to access app
  if (!user && !authLoading) {
    return <SignInPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        asOfDate={asOfDate}
        onAsOfDateChange={setAsOfDate}
        onOpenExecutiveSummary={() => setIsExecutiveModalOpen(true)}
        onOpenReminders={() => {
          setSelectedTaskForReminder(null);
          setIsReminderModalOpen(true);
        }}
        onOpenDailyExport={() => setIsExportModalOpen(true)}
        onOpenChangeLog={() => setIsChangeLogModalOpen(true)}
        onAddNewTask={handleAddNewTaskClick}
        onResetData={handleResetData}
        onSyncRemote={handleSyncRemote}
        isSyncingRemote={isSyncingRemote}
        onUnlockEdit={() => setIsUnlockModalOpen(true)}
        onOpenResetPassword={() => setIsResetPasswordModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Sync status toast / alert banner */}
      {syncNotification && (
        <div className="w-full px-2.5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 pt-2 sm:pt-3">
          <div className="bg-cyan-950/80 border border-cyan-700/80 text-cyan-200 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-mono shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{syncNotification}</span>
            </div>
            <button
              onClick={() => setSyncNotification(null)}
              className="text-cyan-400 hover:text-white transition-colors cursor-pointer text-sm font-bold ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container - Responsive Width */}
      <main className="flex-1 w-full px-2.5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 sm:py-5">
        
        {/* Real-time KPI Scorecard */}
        <KPIBanner
          tasks={tasks}
          asOfDate={asOfDate}
          onFilterClick={handleFilterClick}
        />

        {/* Tab Views */}
        {activeTab === 'daily_report' && (
          <DailyReportStatusView
            tasks={tasks}
            asOfDate={asOfDate}
            onTaskUpdate={handleUpdateTask}
            onEditTask={handleEditTaskClick}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskTable
            tasks={tasks}
            asOfDate={asOfDate}
            onUpdateTask={handleUpdateTask}
            onBulkUpdateTasks={handleBulkUpdateTasks}
            onEditTaskClick={handleEditTaskClick}
            onTriggerReminder={handleOpenReminderForTask}
            onUnlockEdit={() => setIsUnlockModalOpen(true)}
            filterStatusPreset={filterStatusPreset}
          />
        )}

        {activeTab === 'dependencies' && (
          <DependencyGraphView
            tasks={tasks}
            asOfDate={asOfDate}
            onEditTask={handleEditTaskClick}
          />
        )}

        {activeTab === 'delays' && (
          <DelayAnalyticsView
            tasks={tasks}
            asOfDate={asOfDate}
            onEditTask={handleEditTaskClick}
            onTriggerReminder={handleOpenReminderForTask}
            onOpenExecutiveModal={() => setIsExecutiveModalOpen(true)}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {activeTab === 'workload' && (
          <WorkloadDistributionView
            tasks={tasks}
            asOfDate={asOfDate}
            onTriggerReminder={handleOpenReminderForTask}
            onEditTask={handleEditTaskClick}
          />
        )}

        {activeTab === 'roadmap' && (
          <StrategicRoadmapView
            tasks={tasks}
            asOfDate={asOfDate}
            onEditTask={handleEditTaskClick}
            onTriggerReminder={handleOpenReminderForTask}
            onSwitchToGantt={() => setActiveTab('timeline')}
          />
        )}

        {activeTab === 'team' && (
          <TeamAccountabilityView
            tasks={tasks}
            asOfDate={asOfDate}
            onTriggerReminder={handleOpenReminderForTask}
            onEditTask={handleEditTaskClick}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineGanttView
            tasks={tasks}
            asOfDate={asOfDate}
            onEditTask={handleEditTaskClick}
            onTriggerReminder={handleOpenReminderForTask}
          />
        )}

        {activeTab === 'ai_risks' && (
          <AiRisksAndResolutionsView
            tasks={tasks}
            asOfDate={asOfDate}
            onEditTask={handleEditTaskClick}
            onTriggerReminder={handleOpenReminderForTask}
          />
        )}

      </main>

      {/* Global Modals */}
      
      {/* 1. Executive AI Review */}
      <ExecutiveSummaryModal
        isOpen={isExecutiveModalOpen}
        onClose={() => setIsExecutiveModalOpen(false)}
        tasks={tasks}
        asOfDate={asOfDate}
      />

      {/* 2. Automated Reminders & Escalation Dispatch */}
      <AutomatedRemindersModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        tasks={tasks}
        asOfDate={asOfDate}
        remindersLog={remindersLog}
        onSaveRemindersLog={handleSaveRemindersLog}
        selectedTaskForReminder={selectedTaskForReminder}
      />

      {/* 3. Daily Export (Excel & PPT) */}
      <DailyExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
        asOfDate={asOfDate}
      />

      {/* 4. Edit / Add Task */}
      <TaskEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={editingTask}
        allTasks={tasks}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* 5. Change Log Modal (Last 10 Modifications) */}
      <ChangeLogModal
        isOpen={isChangeLogModalOpen}
        onClose={() => setIsChangeLogModalOpen(false)}
        changeLogs={changeLogs}
        onClearLogs={() => {
          setChangeLogs([]);
          localStorage.removeItem('wb_pmo_change_logs');
        }}
      />

      {/* 6. Unlock Edit Modal */}
      <UnlockEditModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
      />

      {/* 7. Admin Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
      />

      {/* Persistent Status Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">WHOLESALE BANKING PMO</span>
          <span>•</span>
          <span className="text-slate-400">Project Action Tracker &amp; Executive Follow-up System</span>
        </div>
        <div className="flex items-center space-x-4 text-[10px] text-slate-400">
          <span>44 DELIVERABLES</span>
          <span>•</span>
          <span>12 WORKSTREAMS</span>
          <span>•</span>
          <span className="text-emerald-400">RESTRICTED SAMSON EDIT ACCESS</span>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
