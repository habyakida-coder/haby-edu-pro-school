import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-rose-100 max-w-sm">
            <h2 className="text-xl font-black text-rose-600 mb-2">Hitilafu imetokea</h2>
            <p className="text-sm text-slate-600 mb-6">Mfumo umepata tatizo la kiufundi. Tafadhali refresh ukurasa.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
            >
              Refresh Ukurasa
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
