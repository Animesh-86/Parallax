import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EditorErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#09090B] text-white/70 gap-4 p-8">
          <div className="text-4xl mb-2">💥</div>
          <h2 className="text-lg font-semibold text-white/90">Editor crashed</h2>
          <p className="text-sm text-white/50 text-center max-w-md">
            Something went wrong while rendering this file. This can happen with 
            unsupported language servers or malformed file content.
          </p>
          {this.state.error && (
            <pre className="text-xs text-[#EF6461]/70 bg-[#EF6461]/10 border border-[#EF6461]/20 rounded-lg px-4 py-2 max-w-lg overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-2 px-4 py-2 bg-[#D4AF37] text-black font-medium rounded-lg text-sm hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
