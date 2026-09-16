import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Mail, 
  Copy, 
  Check, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, ADMIN_EMAIL } from '../context/AuthContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPassword?: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { 
    adminPassword, 
    resetPasswordToDefault, 
    updateAdminPassword, 
    signInWithCredentials 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'reset_default' | 'set_custom'>('reset_default');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityEmailInput, setSecurityEmailInput] = useState(ADMIN_EMAIL);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleResetToDefault = async (autoSignIn: boolean = false) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const result = resetPasswordToDefault();
      setStatusMessage({
        type: 'success',
        text: `Password has been reset to default "${DEFAULT_ADMIN_PASSWORD}".`,
      });

      if (autoSignIn) {
        await signInWithCredentials(DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
      }

      if (onSuccess) {
        onSuccess(DEFAULT_ADMIN_PASSWORD);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to reset password. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetCustomPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!newPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid new password.' });
      return;
    }

    if (newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsProcessing(true);
    try {
      const result = updateAdminPassword(newPassword.trim());
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Password updated successfully! You can now log in with your new password.`,
        });
        await signInWithCredentials(DEFAULT_ADMIN_USERNAME, newPassword.trim());
        if (onSuccess) {
          onSuccess(newPassword.trim());
        }
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error updating password.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCredentials = () => {
    const textToCopy = `Username: ${DEFAULT_ADMIN_USERNAME}\nPassword: ${adminPassword || DEFAULT_ADMIN_PASSWORD}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#95288E]/25 border border-[#95288E]/70 flex items-center justify-center text-[#D667CF] shadow-md shadow-[#95288E]/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Admin Password Recovery & Reset</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Account: <strong className="text-slate-200">samson</strong> (Lead PMO Admin)
            </p>
          </div>
        </div>

        {/* PMO Security Context Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="w-4 h-4 text-[#B38D34] shrink-0" />
            <span className="truncate">Registered: <strong className="text-white">{ADMIN_EMAIL}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
            VERIFIED PMO
          </span>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div className={`mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-800 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 mb-4 font-mono text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('reset_default');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'reset_default'
                ? 'border-[#95288E] text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D667CF]" />
            <span>Reset to Default (sam2026)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('set_custom');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'set_custom'
                ? 'border-[#95288E] text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#B38D34]" />
            <span>Set New Password</span>
          </button>
        </div>

        {/* Tab 1: Reset to Default sam2026 */}
        {activeTab === 'reset_default' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Current Active Password:</span>
                <span className="font-mono font-bold text-[#B38D34] bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                  {adminPassword || DEFAULT_ADMIN_PASSWORD}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Authorized Username:</span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                  {DEFAULT_ADMIN_USERNAME}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Default Baseline Password:</span>
                <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                  {DEFAULT_ADMIN_PASSWORD}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Clicking below will immediately reset the administrator password to the standard system default: <strong className="text-emerald-400 font-mono">{DEFAULT_ADMIN_PASSWORD}</strong> and unlock editor permissions for Samson.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleResetToDefault(true)}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#95288E]/40 border border-[#D667CF]/40 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-[#B38D34]" />
                <span>Reset to Default &amp; Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Set New Custom Password */}
        {activeTab === 'set_custom' && (
          <form onSubmit={handleSetCustomPassword} className="space-y-3.5 animate-fade-in">
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1">
                New Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 4 characters)"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#95288E] font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#95288E] font-mono"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-[#95288E] hover:bg-[#aa2ea3] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#95288E]/40 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-[#B38D34]" />
                <span>{isProcessing ? 'Updating...' : 'Save New Password & Log In'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Target Lead: Samson Tsegaye</span>
          <span className="text-[#D667CF]">Wholesale Banking PMO</span>
        </div>

      </div>
    </div>
  );
};
