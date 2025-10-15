import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './toastContextBase';
import type { Toast, ToastContextType } from './toastContextBase';

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRef = useRef<Map<string, number>>(new Map());

  const clearScheduledRemoval = useCallback((id: string) => {
    const handle = timeoutRef.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timeoutRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    clearScheduledRemoval(id);
  }, [clearScheduledRemoval]);

  const addToast = useCallback(
    (message: string, type: Toast['type'], duration = 2500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        const handle = window.setTimeout(() => {
          removeToast(id);
        }, duration);
        timeoutRef.current.set(id, handle);
      }
    },
    [removeToast]
  );

  const clearToasts = useCallback(() => {
    timeoutRef.current.forEach((handle) => window.clearTimeout(handle));
    timeoutRef.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => () => {
    timeoutRef.current.forEach((handle) => window.clearTimeout(handle));
    timeoutRef.current.clear();
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export type { Toast, ToastContextType } from './toastContextBase';
