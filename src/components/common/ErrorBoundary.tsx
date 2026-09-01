import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React ErrorBoundary:", error, errorInfo);
  }

  private handleResetStorage = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/30">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 font-serif">
              Đã có lỗi xảy ra
            </h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Ứng dụng gặp sự cố khi hiển thị giao diện. Vui lòng tải lại trang hoặc làm mới dữ liệu bộ nhớ đệm (localStorage).
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-400 font-semibold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap">
                    {this.state.error.stack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Tải lại trang</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-all border border-slate-600 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Xóa Cache & Đăng nhập lại</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
