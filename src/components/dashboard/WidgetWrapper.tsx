'use client';

import { ReactNode } from 'react';

interface WidgetWrapperProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  headerAction?: ReactNode;
}

export default function WidgetWrapper({
  title, children, loading, error, empty, emptyMessage, className, headerAction,
}: WidgetWrapperProps) {
  return (
    <div className={"bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full " + (className || '')}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
        {headerAction}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-5 text-center">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        ) : empty ? (
          <div className="p-5 text-center">
            <p className="text-xs text-slate-400">{emptyMessage || 'Nessun dato'}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
