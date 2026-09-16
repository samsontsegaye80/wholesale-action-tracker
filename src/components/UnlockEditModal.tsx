import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResetPasswordModal } from './ResetPasswordModal';

interface UnlockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UnlockEditModal: React.FC<UnlockEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { signInWithCredentials } = useAuth();
  const [username, setUsername] = useState('samson');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await signInWithCredentials(username, password);
    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || 'Authorization failed. Please enter authorized editor credentials.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#95288E]/25 border border-[#95288E]/60 flex items-center justify-center text-[#D667CF]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Unlock Edit Permissions</h3>
              <p className="text-xs text-slate-400 font-mono">Authorized PMO Administrator Access</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Editing deliverables, batch status updates, and schedule modifications require administrator authentication. Please enter your credentials below.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#95288E] font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono text-slate-300 font-bold uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] text-[#D667CF] hover:text-[#f395ee] hover:underline font-mono cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-[#B38D34]" />
                  <span>Forgot / Reset?</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#95288E] font-mono pr-10"
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

            {/* Quick Helper */}
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Default: <strong className="text-white">samson</strong> / <strong className="text-[#B38D34]">sam2026</strong></span>
              <button
                type="button"
                onClick={() => {
                  setUsername('samson');
                  setPassword('sam2026');
                }}
                className="text-[#D667CF] hover:text-white font-bold hover:underline cursor-pointer"
              >
                Auto-Fill
              </button>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#95288E] hover:bg-[#aa2ea3] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#95288E]/40"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#B38D34]" />
                <span>{isSubmitting ? 'Verifying...' : 'Unlock Edit Mode'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={(newPass) => {
          setUsername('samson');
          if (newPass) setPassword(newPass);
          setIsResetModalOpen(false);
          if (onSuccess) onSuccess();
          onClose();
        }}
      />
    </>
  );
};
