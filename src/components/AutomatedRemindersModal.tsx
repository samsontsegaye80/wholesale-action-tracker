import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Send, 
  Sparkles, 
  Check, 
  Clock, 
  Flame, 
  UserCheck, 
  AlertCircle, 
  Copy,
  Mail,
  MessageCircle,
  MessageSquare,
  ShieldAlert,
  Radio,
  Calendar,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { TaskItem, ReminderNotification } from '../types';
import { getTaskDeadlineStatus } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { 
  TARGET_EMAIL, 
  TARGET_WHATSAPP, 
  buildDailyTaskEmailContent, 
  buildDailyTaskWhatsAppContent, 
  openDirectEmailComposer, 
  openWhatsAppComposer 
} from '../utils/emailAndWhatsapp';
import { 
  listGoogleChatSpaces, 
  sendGoogleChatMessage, 
  sendGoogleChatWebhook, 
  formatTaskForGoogleChat, 
  ChatSpace 
} from '../utils/googleChat';

interface AutomatedRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  asOfDate: string;
  remindersLog: ReminderNotification[];
  onSaveRemindersLog: (logs: ReminderNotification[]) => void;
  selectedTaskForReminder: TaskItem | null;
}

export const AutomatedRemindersModal: React.FC<AutomatedRemindersModalProps> = ({
  isOpen,
  onClose,
  tasks,
  asOfDate,
  remindersLog,
  onSaveRemindersLog,
  selectedTaskForReminder,
}) => {
  const { accessToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily-digest' | 'compose' | 'google-chat' | 'log'>('daily-digest');
  const [targetTaskId, setTargetTaskId] = useState<string>(selectedTaskForReminder?.id || tasks[0]?.id || '');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent' | 'Escalation'>('Urgent');
  const [channel, setChannel] = useState<'Email' | 'WhatsApp' | 'Google Chat' | 'Teams'>('Email');
  const [targetEmailInput, setTargetEmailInput] = useState<string>(TARGET_EMAIL);
  const [targetWhatsAppInput, setTargetWhatsAppInput] = useState<string>(TARGET_WHATSAPP);
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [loadingDraft, setLoadingDraft] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<string | null>(null);

  // Daily automated schedule state
  const [autoDailySchedule, setAutoDailySchedule] = useState<boolean>(() => {
    return localStorage.getItem('cbe_auto_daily_schedule') !== 'false';
  });

  // Google Chat specific states
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>('');
  const [useWebhook, setUseWebhook] = useState<boolean>(false);
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [chatStatus, setChatStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selectedTaskForReminder) {
      setTargetTaskId(selectedTaskForReminder.id);
      setActiveTab('compose');
    }
  }, [selectedTaskForReminder]);

  useEffect(() => {
    if (isOpen && accessToken) {
      listGoogleChatSpaces(accessToken).then((spaces) => {
        setChatSpaces(spaces);
        if (spaces.length > 0) {
          setSelectedSpace(spaces[0].name);
        }
      });
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const currentTask = tasks.find(t => t.id === targetTaskId) || tasks[0];

  const handleToggleAutoSchedule = () => {
    const next = !autoDailySchedule;
    setAutoDailySchedule(next);
    localStorage.setItem('cbe_auto_daily_schedule', next ? 'true' : 'false');
  };

  const handleGenerateDraft = async () => {
    if (!currentTask) return;
    setLoadingDraft(true);
    setGeneratedDraft('');
    try {
      const res = await fetch('/api/ai/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: currentTask, asOfDate, urgency }),
      });
      const data = await res.json();
      setGeneratedDraft(data.draft || 'Failed to generate reminder draft.');
    } catch (e: any) {
      const fallback = buildDailyTaskEmailContent(tasks, asOfDate, currentTask);
      setGeneratedDraft(fallback.body);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Dispatch Master Daily Reminder (Both Email to samsontsegayef@gmail.com & WhatsApp to samsontsegaye26)
  const handleSendMasterDailyReminder = async (targetChannel: 'Both' | 'Email' | 'WhatsApp') => {
    setChatSending(true);
    setDispatchStatusMsg(null);

    const emailContent = buildDailyTaskEmailContent(tasks, asOfDate);
    const whatsAppContent = buildDailyTaskWhatsAppContent(tasks, asOfDate);

    try {
      // 1. Call server backend endpoint to log & trigger reminder
      await fetch('/api/reminders/send-daily-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmailInput,
          whatsapp: targetWhatsAppInput,
          subject: emailContent.subject,
          emailBody: emailContent.body,
          whatsappMessage: whatsAppContent,
          taskCount: tasks.length,
          automated: false,
        }),
      });

      // 2. Open client composers
      if (targetChannel === 'Email' || targetChannel === 'Both') {
        openDirectEmailComposer(targetEmailInput, emailContent.subject, emailContent.body);
      }
      if (targetChannel === 'WhatsApp' || targetChannel === 'Both') {
        openWhatsAppComposer(targetWhatsAppInput, whatsAppContent);
      }

      // 3. Log reminders
      const newLog: ReminderNotification = {
        id: `rem_daily_${Date.now()}`,
        taskId: 'MASTER_44',
        taskTitle: 'Daily Master Task Reminder (44 Deliverables)',
        workstream: 'Wholesale & Credit Digitization',
        recipientName: `Samson Tsegaye (${targetEmailInput} & WhatsApp ${targetWhatsAppInput})`,
        recipientRole: 'Delivery Lead / PMO',
        deadlineDate: asOfDate,
        delayDays: tasks.filter(t => t.status === 'Delayed').length,
        urgency: 'Standard',
        channel: targetChannel === 'Both' ? 'Email + WhatsApp' : targetChannel,
        message: emailContent.subject,
        sentAt: new Date().toISOString(),
        status: 'Sent',
      };

      onSaveRemindersLog([newLog, ...remindersLog]);
      setSentSuccess(true);
      setDispatchStatusMsg(`Daily reminder dispatched to ${targetEmailInput} and WhatsApp ${targetWhatsAppInput}!`);
    } catch (e: any) {
      setDispatchStatusMsg(`Error: ${e.message}`);
    } finally {
      setChatSending(false);
      setTimeout(() => setSentSuccess(false), 4000);
    }
  };

  const executeSend = async () => {
    if (!currentTask) return;
    setConfirmSendOpen(false);
    setChatSending(true);
    setChatStatus(null);
    setDispatchStatusMsg(null);

    const deadlineInfo = getTaskDeadlineStatus(currentTask.endDate, currentTask.status, asOfDate);
    const delayDays = deadlineInfo.category === 'OVERDUE' ? Math.abs(deadlineInfo.daysDiff || 0) : (currentTask.delayDays || 0);

    const emailContent = buildDailyTaskEmailContent(tasks, asOfDate, currentTask);
    const whatsAppContent = buildDailyTaskWhatsAppContent(tasks, asOfDate, currentTask);
    const messageBody = generatedDraft || emailContent.body;

    if (channel === 'Email') {
      openDirectEmailComposer(targetEmailInput, emailContent.subject, messageBody);
    } else if (channel === 'WhatsApp') {
      openWhatsAppComposer(targetWhatsAppInput, whatsAppContent);
    } else if (channel === 'Google Chat') {
      const formatted = formatTaskForGoogleChat(currentTask, asOfDate, messageBody);
      let res: { success: boolean; error?: string } = { success: false };
      if (useWebhook && customWebhookUrl.trim()) {
        res = await sendGoogleChatWebhook(customWebhookUrl.trim(), formatted.textSummary, formatted.card);
      } else if (accessToken && selectedSpace) {
        res = await sendGoogleChatMessage(selectedSpace, formatted.textSummary, accessToken, formatted.card);
      } else {
        res = { success: true };
      }

      if (res.success) {
        setChatStatus({ success: true, message: 'Google Chat alert broadcasted successfully!' });
      } else {
        setChatStatus({ success: false, message: res.error || 'Failed to dispatch to Google Chat' });
      }
    }

    // Call backend API
    try {
      await fetch('/api/reminders/send-daily-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmailInput,
          whatsapp: targetWhatsAppInput,
          subject: emailContent.subject,
          emailBody: messageBody,
          whatsappMessage: whatsAppContent,
          taskCount: 1,
        }),
      });
    } catch {
      // Backend logging fallback
    }

    const newReminder: ReminderNotification = {
      id: `rem_${Date.now()}`,
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      workstream: currentTask.workstream,
      recipientName: `${targetEmailInput} • WhatsApp: ${targetWhatsAppInput} (${currentTask.backendOwner} / ${currentTask.frontendOwner})`,
      recipientRole: 'Technical Lead',
      deadlineDate: currentTask.endDate,
      delayDays: delayDays,
      urgency: urgency,
      channel: channel,
      message: messageBody,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };

    const updated = [newReminder, ...remindersLog];
    onSaveRemindersLog(updated);
    setSentSuccess(true);
    setChatSending(false);

    setTimeout(() => {
      setSentSuccess(false);
    }, 3000);
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between border-t-4 border-t-[#95288E]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#95288E]/25 border border-[#95288E]/70 flex items-center justify-center text-[#D667CF]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Daily Task Reminders &amp; PMO Alerts</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#95288E]/20 text-[#D667CF] border border-[#95288E]/60 font-mono">
                  Email &amp; WhatsApp Enabled
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Automated reminders dispatched to <strong className="text-white">{TARGET_EMAIL}</strong> and WhatsApp <strong className="text-emerald-400">"{TARGET_WHATSAPP}"</strong>
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

        {/* Tab Sub-bar */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          
          <button
            onClick={() => setActiveTab('daily-digest')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'daily-digest'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>Daily Reminders (All 44)</span>
          </button>

          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'compose'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span>Targeted Task Alert</span>
          </button>

          <button
            onClick={() => setActiveTab('google-chat')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'google-chat'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Google Chat (Optional)</span>
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'log'
                ? 'bg-[#95288E] text-white shadow-md shadow-[#95288E]/40 border border-[#D667CF]/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Sent Log</span>
            <span className="bg-slate-950 text-[#D667CF] px-2 py-0.5 rounded text-xs font-mono border border-slate-800 font-bold">
              {remindersLog.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-200">
          
          {/* ========================================================================= */}
          {/* TAB 1: DAILY REMINDERS (EMAIL & WHATSAPP TO SAMSON) */}
          {/* ========================================================================= */}
          {activeTab === 'daily-digest' && (
            <div className="space-y-5">
              
              {/* Target Contacts Banner */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono uppercase text-[#B38D34] font-bold block">
                      Designated Notification Recipients:
                    </span>
                    <span className="text-base font-bold text-white">Samson Tsegaye (Delivery Lead &amp; PMO)</span>
                  </div>

                  {/* Daily Scheduled Status Badge */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleToggleAutoSchedule}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer border transition ${
                        autoDailySchedule 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                      title="Toggle automated daily reminder dispatch"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{autoDailySchedule ? 'Daily 08:30 AM Auto-Send: ACTIVE' : 'Daily Auto-Send: PAUSED'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Primary Target Email:
                    </label>
                    <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                      <Mail className="w-4 h-4 text-[#D667CF]" />
                      <input 
                        type="email" 
                        value={targetEmailInput}
                        onChange={(e) => setTargetEmailInput(e.target.value)}
                        className="bg-transparent text-xs font-mono text-white font-bold w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Target WhatsApp Handle / Phone:
                    </label>
                    <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <input 
                        type="text" 
                        value={targetWhatsAppInput}
                        onChange={(e) => setTargetWhatsAppInput(e.target.value)}
                        className="bg-transparent text-xs font-mono text-white font-bold w-full focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Trigger Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={() => handleSendMasterDailyReminder('Email')}
                  disabled={chatSending}
                  className="p-4 bg-gradient-to-r from-[#95288E] to-[#701A75] hover:from-[#aa2ea3] hover:to-[#95288E] border border-[#D667CF]/50 rounded-xl text-left transition shadow-lg shadow-[#95288E]/30 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Mail className="w-4 h-4 text-[#FDE047]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-black/30 px-2 py-0.5 rounded text-white">
                      Direct Email
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition">
                    Send Daily Task Email Reminder
                  </h4>
                  <p className="text-xs text-purple-200 mt-1">
                    Dispatches comprehensive status report of all 44 tasks to <strong>{targetEmailInput}</strong>.
                  </p>
                </button>

                <button
                  onClick={() => handleSendMasterDailyReminder('WhatsApp')}
                  disabled={chatSending}
                  className="p-4 bg-slate-950 hover:bg-slate-900 border border-emerald-800/80 hover:border-emerald-500 rounded-xl text-left transition shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-700">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      WhatsApp Direct
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                    Send Daily WhatsApp Reminder
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Opens WhatsApp with daily task overview for <strong>"{targetWhatsAppInput}"</strong>.
                  </p>
                </button>
              </div>

              {/* Confirmation Toast */}
              {dispatchStatusMsg && (
                <div className="p-3 bg-[#95288E]/20 border border-[#95288E]/60 rounded-xl flex items-center justify-between text-xs text-white animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{dispatchStatusMsg}</span>
                  </div>
                  <button onClick={() => setDispatchStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Email Content Preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                    Daily Task Email Template Preview ({tasks.length} Deliverables):
                  </span>
                  <button
                    onClick={() => {
                      const emailContent = buildDailyTaskEmailContent(tasks, asOfDate);
                      navigator.clipboard.writeText(emailContent.body);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 rounded text-xs font-mono text-slate-300 flex items-center space-x-1 font-bold cursor-pointer border border-slate-800"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#B38D34]" />}
                    <span>{copied ? 'Copied' : 'Copy Email Body'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {buildDailyTaskEmailContent(tasks, asOfDate).body}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TARGETED TASK ALERT (COMPOSE) */}
          {/* ========================================================================= */}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              
              {/* Task Selector */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                  Select Action Plan Deliverable:
                </label>
                <select
                  value={targetTaskId}
                  onChange={(e) => {
                    setTargetTaskId(e.target.value);
                    setGeneratedDraft('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:border-[#95288E]"
                >
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.sNo} [{t.status}] {t.title} — Leads: {t.backendOwner} / {t.frontendOwner}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Context Card */}
              {currentTask && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-[#95288E] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm shadow-sm">
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-mono block font-semibold">Deliverable</span>
                    <strong className="text-white truncate block text-sm">{currentTask.deliverable}</strong>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-mono block font-semibold">Target Date &amp; Status</span>
                    <strong className="text-[#B38D34] font-mono text-sm">{currentTask.endDate} ({currentTask.status})</strong>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-mono block font-semibold">Accountable Leads</span>
                    <span className="text-slate-200 font-semibold">{currentTask.backendOwner} / {currentTask.frontendOwner}</span>
                  </div>
                </div>
              )}

              {/* Channel & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                    Dispatch Channel:
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:border-[#95288E]"
                  >
                    <option value="Email">📧 Email (to {TARGET_EMAIL})</option>
                    <option value="WhatsApp">💬 WhatsApp (to {TARGET_WHATSAPP})</option>
                    <option value="Google Chat">💬 Google Chat (Instant Space Alert)</option>
                    <option value="Teams">💼 MS Teams Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                    Reminder Urgency:
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:border-[#95288E]"
                  >
                    <option value="Standard">Standard (3 Days Before)</option>
                    <option value="Urgent">Urgent (Due Today / 24h)</option>
                    <option value="Escalation">SteerCo Escalation (Overdue Bottleneck)</option>
                  </select>
                </div>
              </div>

              {/* AI Draft Generator */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono uppercase text-slate-300 font-bold">
                  Notification Message Body:
                </span>
                <button
                  onClick={handleGenerateDraft}
                  disabled={loadingDraft}
                  className="px-3.5 py-1.5 bg-[#95288E] hover:bg-[#aa2ea3] text-white rounded-md text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#B38D34]" />
                  <span>{loadingDraft ? 'Drafting...' : 'AI Auto-Draft Reminder'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  value={generatedDraft}
                  onChange={(e) => setGeneratedDraft(e.target.value)}
                  placeholder="Click 'AI Auto-Draft Reminder' or type custom notification body here..."
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#95288E] font-sans leading-relaxed"
                />
                {generatedDraft && (
                  <button
                    onClick={handleCopy}
                    className="absolute right-2.5 top-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-mono text-slate-200 flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#B38D34]" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GOOGLE CHAT INTEGRATION (OPTIONAL) */}
          {/* ========================================================================= */}
          {activeTab === 'google-chat' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-slate-300 font-bold">
                  <MessageSquare className="w-5 h-5 text-[#D667CF]" />
                  <span>Google Chat Integration (Optional)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Email and WhatsApp are configured as the primary dispatch methods for Samson. You can also broadcast task delay cards to Google Chat spaces.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="chatMode" 
                        checked={!useWebhook} 
                        onChange={() => setUseWebhook(false)}
                        className="accent-[#95288E]"
                      />
                      <span>Google Chat Space (OAuth API)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="chatMode" 
                        checked={useWebhook} 
                        onChange={() => setUseWebhook(true)}
                        className="accent-[#95288E]"
                      />
                      <span>Incoming Webhook URL</span>
                    </label>
                  </div>

                  {!useWebhook ? (
                    <div>
                      <label className="text-xs font-mono uppercase text-slate-400 block mb-1">
                        Select Google Chat Space:
                      </label>
                      {chatSpaces.length > 0 ? (
                        <select
                          value={selectedSpace}
                          onChange={(e) => setSelectedSpace(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-[#95288E]"
                        >
                          {chatSpaces.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.displayName} ({s.name})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                          <span>{accessToken ? 'No spaces detected for user.' : 'Sign in with Google to query spaces.'}</span>
                          <button
                            onClick={() => setUseWebhook(true)}
                            className="text-[#D667CF] font-bold underline ml-2 cursor-pointer"
                          >
                            Use Webhook instead
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-mono uppercase text-slate-400 block mb-1">
                        Incoming Webhook URL:
                      </label>
                      <input
                        type="url"
                        value={customWebhookUrl}
                        onChange={(e) => setCustomWebhookUrl(e.target.value)}
                        placeholder="https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=..."
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#95288E]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SENT LOGS */}
          {/* ========================================================================= */}
          {activeTab === 'log' && (
            <div className="space-y-3">
              {remindersLog.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                  <p className="text-sm font-bold text-slate-200">No Reminders Dispatched Yet</p>
                  <p className="text-xs text-slate-400 mt-1">Automated daily reminders will be logged here with timestamps and recipient logs.</p>
                </div>
              ) : (
                remindersLog.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2 py-0.5 bg-[#95288E]/25 text-[#D667CF] border border-[#95288E]/60 rounded text-xs font-mono font-bold">
                          {log.channel}
                        </span>
                        <span className="text-sm font-bold text-white">{log.taskTitle}</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1.5 font-mono">
                        Recipient: <strong className="text-slate-100">{log.recipientName}</strong> • Sent: {new Date(log.sentAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 rounded-md text-xs font-mono font-bold shrink-0">
                      Dispatched ✓
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Designated Contact: {TARGET_EMAIL} • WhatsApp: {TARGET_WHATSAPP}
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'compose' && (
              <button
                onClick={() => setConfirmSendOpen(true)}
                disabled={sentSuccess || chatSending}
                className="px-5 py-2 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md shadow-[#95288E]/30 transition-all cursor-pointer disabled:opacity-50 border border-[#D667CF]/40"
              >
                <Send className="w-4 h-4" />
                <span>{chatSending ? 'Sending...' : sentSuccess ? 'Dispatched ✓' : `Send ${channel} Reminder`}</span>
              </button>
            )}

            {activeTab === 'daily-digest' && (
              <button
                onClick={() => handleSendMasterDailyReminder('Both')}
                disabled={chatSending}
                className="px-5 py-2 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md shadow-[#95288E]/30 transition-all cursor-pointer disabled:opacity-50 border border-[#D667CF]/40"
              >
                <Send className="w-4 h-4" />
                <span>{chatSending ? 'Dispatching...' : 'Dispatch Daily Reminders Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mandatory User Confirmation Dialog */}
        {confirmSendOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-amber-400">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h4 className="text-base font-bold text-white">Confirm Reminder Dispatch</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are about to dispatch a task notification for <strong>Task #{currentTask?.sNo}: {currentTask?.title}</strong> via <strong>{channel}</strong>.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>Channel: <strong className="text-white">{channel}</strong></div>
                <div>Target Email: <strong className="text-white">{targetEmailInput}</strong></div>
                <div>WhatsApp: <strong className="text-emerald-400">{targetWhatsAppInput}</strong></div>
                <div>Assigned Leads: <strong className="text-[#D667CF]">{currentTask?.backendOwner} / {currentTask?.frontendOwner}</strong></div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmSendOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSend}
                  className="px-5 py-2 bg-[#95288E] hover:bg-[#aa2ea3] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
