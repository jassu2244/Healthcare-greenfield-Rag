'use client';

import React from 'react';
import { SourceTag } from './Badges';

interface BoundaryItem {
  fieldKey: string;
  label: string;
  sensitivity: string;
  source: string;
}

interface DataAccessPanelProps {
  boundaryReport?: {
    sent: BoundaryItem[];
    withheld: BoundaryItem[];
  };
  inputFieldsSent?: string[];
  totalFieldsCount?: number;
}

export function DataAccessPanel({
  boundaryReport,
  inputFieldsSent = [],
  totalFieldsCount = 0
}: DataAccessPanelProps) {
  const sent = boundaryReport?.sent || [];
  const withheld = boundaryReport?.withheld || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            AI Data Boundary (Data Minimization)
          </h3>
        </div>
        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
          Sent: {sent.length} | Withheld: {withheld.length}
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sent Fields */}
        <div className="border border-teal-200 rounded-lg p-4 bg-teal-50/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Exposed to AI Provider (Allow-listed)
            </span>
            <span className="text-[11px] text-teal-700 font-semibold">{sent.length} fields</span>
          </div>

          <p className="text-[11px] text-slate-600 mb-3">
            Only explicit clinical indicators required for synthesis are sent. Identifiers are pseudonymized.
          </p>

          <div className="space-y-2">
            {sent.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No fields sent yet.</p>
            ) : (
              sent.map((item) => (
                <div key={item.fieldKey} className="bg-white p-2.5 rounded border border-teal-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="ml-1.5 text-[10px] font-mono text-slate-400">({item.fieldKey})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SourceTag source={item.source as any} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {item.sensitivity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Withheld Fields */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Withheld from AI Boundary (Protected)
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">{withheld.length} fields</span>
          </div>

          <p className="text-[11px] text-slate-500 mb-3">
            Unnecessary demographics, contact details, and out-of-scope fields remain strictly on-premise/in-app.
          </p>

          <div className="space-y-2">
            {withheld.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No withheld fields.</p>
            ) : (
              withheld.map((item) => (
                <div key={item.fieldKey} className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between text-xs opacity-75">
                  <div>
                    <span className="font-semibold text-slate-700 line-through text-slate-500">{item.label}</span>
                    <span className="ml-1.5 text-[10px] font-mono text-slate-400">({item.fieldKey})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                      BLOCKED
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {item.sensitivity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
