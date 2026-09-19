import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none no-print"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white border border-gray-200/80 rounded-xl shadow-lg shadow-black/5 text-[#222222] transition-all transform animate-in fade-in slide-in-from-top-3 duration-200"
          >
            {t.type === 'success' && (
              <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 size={18} />
              </div>
            )}
            {t.type === 'error' && (
              <div className="p-1 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <AlertCircle size={18} />
              </div>
            )}
            {t.type === 'warning' && (
              <div className="p-1 rounded-full bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle size={18} />
              </div>
            )}
            {t.type === 'info' && (
              <div className="p-1 rounded-full bg-blue-50 text-[#358FFF] shrink-0">
                <Info size={18} />
              </div>
            )}

            <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {t.message}
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
