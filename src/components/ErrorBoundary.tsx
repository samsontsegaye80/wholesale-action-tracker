import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('wholesale_banking_action_plan_tasks_v2');
      localStorage.removeItem('action_plan_as_of_date');
      localStorage.removeItem('wb_pmo_auth_session');
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Application Display Notice
            </h1>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              The Wholesale Banking PMO Control Center encountered a rendering exception. You can reload the page or restore the baseline state below.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 text-xs font-mono text-rose-400 overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#95288E] to-[#B38D34] hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-[#95288E]/25 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Baseline</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
