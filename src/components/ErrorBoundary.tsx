import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9F4] text-slate-900 flex flex-col items-center justify-center p-6 text-center antialiased">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-[24px] border border-[#FF7A1A]/30 p-8 shadow-xl space-y-6">
            <div className="w-16 h-16 bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">
                เกิดข้อผิดพลาด กดโหลดใหม่
              </h1>
              <p className="text-base text-slate-600 font-medium">
                ระบบพบปัญหาในการแสดงผล กรุณากดปุ่มด้านล่างเพื่อเริ่มการทำงานใหม่ ข้อมูลของคุณถูกบันทึกอย่างปลอดภัย
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full min-h-[56px] rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] hover:from-[#E8670C] hover:to-[#FF8024] shadow-md flex items-center justify-center gap-2.5 transition cursor-pointer active:scale-[0.97]"
            >
              <RotateCcw className="w-5 h-5 text-white" />
              <span>โหลดหน้าเว็บใหม่</span>
            </button>

            {this.state.error && (
              <details className="text-left text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-600 font-mono">
                <summary className="cursor-pointer font-bold text-slate-700">
                  รายละเอียดข้อผิดพลาด (สำหรับผู้ดูแลระบบ)
                </summary>
                <div className="mt-2 whitespace-pre-wrap break-words text-rose-700">
                  {this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
