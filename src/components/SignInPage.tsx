import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Database, 
  MessageSquare, 
  KeyRound,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResetPasswordModal } from './ResetPasswordModal';

export const SignInPage: React.FC = () => {
  const { signInWithCredentials, signInAsViewer, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    setIsSigningIn(true);
    setErrorMsg(null);

    try {
      const res = await signInWithCredentials(username, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred during sign-in.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#95288E]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#B38D34]/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 w-full">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#95288E]/30 border border-[#95288E]/70 flex items-center justify-center text-[#D667CF] shadow-lg shadow-[#95288E]/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">WHOLESALE BANKING OPS</span>
              <span className="text-[#D667CF] font-light ml-2 text-sm sm:text-base hidden sm:inline">Project Control Center</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>RESTRICTED EDIT ACCESS</span>
          </div>
        </div>
      </header>

      {/* Main Sign-In Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Project Identity & Highlights */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#95288E]/20 border border-[#95288E]/50 text-[#D667CF] text-xs font-mono font-bold mb-5">
                <Lock className="w-3.5 h-3.5" />
                <span>ENTERPRISE PMO ACCESS PORTAL</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Customer Onboarding & Loan Origination System
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                Mission-critical follow-up and action tracker for executive steerco oversight, deliverable bottleneck accountability, and automated alerts.
              </p>

              {/* Capability Matrix */}
              <div className="mt-8 space-y-3.5">
                <div className="flex items-start gap-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">44 Baseline Deliverables & Cloud SQL</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time status tracking with automated Postgres synchronization and historical changes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#95288E]/20 text-[#D667CF] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Executive SteerCo Reviews</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Intelligent root-cause diagnostics, delay horizons, and remediation briefings.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Workload & Strategic Roadmap</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Burnout risk radar, cross-team workload distribution, and 6-month strategic milestones.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>PROJECT CODE: <strong className="text-slate-200">WB-ORIG-2026</strong></span>
              <span>BASELINE: <strong className="text-[#B38D34]">18-AUG-2026</strong></span>
            </div>
          </div>

          {/* Right Column: Corporate Credentials Authentication */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs text-[#B38D34] font-mono font-bold uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Secure Authentication</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">Sign In to Dashboard</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter authorized administrator credentials to unlock full editing and modification rights.
                </p>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 shadow-md">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#95288E] focus:ring-1 focus:ring-[#95288E] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono text-slate-300 font-bold uppercase">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(true)}
                      className="text-[11px] text-[#D667CF] hover:text-[#f395ee] hover:underline font-mono cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-[#B38D34]" />
                      <span>Forgot / Reset Password?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#95288E] focus:ring-1 focus:ring-[#95288E] font-mono pr-10"
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

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSigningIn || loading}
                    className="w-full py-3 bg-gradient-to-r from-[#95288E] to-[#7e1f77] hover:from-[#aa2ea3] hover:to-[#95288E] text-white font-bold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#95288E]/40 border border-[#D667CF]/50 cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4 text-[#B38D34]" />
                    <span>{isSigningIn ? 'Authenticating...' : 'Sign In as Editor'}</span>
                  </button>
                </div>

                {/* Default Credentials Quick Helper */}
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">
                    Default PMO: <strong className="text-white">samson</strong> / <strong className="text-[#B38D34]">sam2026</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('samson');
                        setPassword('sam2026');
                      }}
                      className="text-[#D667CF] hover:text-white font-bold hover:underline cursor-pointer"
                    >
                      Fill
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(true)}
                      className="text-[#B38D34] hover:text-amber-300 font-bold hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-mono">
                  <span className="bg-slate-900 px-3 text-slate-500 font-bold">Or View Only</span>
                </div>
              </div>

              {/* Instant Read-Only Viewer Access */}
              <button
                type="button"
                onClick={signInAsViewer}
                className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-slate-200">Enter as SteerCo Stakeholder (Read-Only)</div>
                    <div className="text-[10px] text-slate-400 font-normal">View all 44 deliverables, analytics &amp; roadmap</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-400 font-mono">
                🔒 Protected PMO Governance Portal. Authorized administrator credentials required for modifications.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 py-3 px-6 text-center text-xs font-mono text-slate-400">
        Wholesale Banking Program Management Office (PMO) &copy; 2026. All rights reserved.
      </footer>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={(newPass) => {
          setUsername('samson');
          if (newPass) setPassword(newPass);
          setIsResetModalOpen(false);
        }}
      />
    </div>
  );
};
