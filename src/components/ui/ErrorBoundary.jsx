import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // ignore
    }
    const url = new URL(window.location.href);
    url.searchParams.set('reload', Date.now());
    window.location.replace(url.toString());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-2xl mb-4 border border-red-200 shadow-xs">
            !
          </div>
          <h1 className="text-xl font-bold text-[#222222] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[#6B7280] max-w-sm mb-6 leading-relaxed">
            A temporary display error occurred while loading. Tap the button below to clear cached data and reload the latest version.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-6 py-2.5 bg-[#358FFF] hover:bg-[#2572D6] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Refresh & Update
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
