'use client';

import React from 'react';
import { EvidenceItem, UncertaintyLevel } from '../types';
import { UncertaintyBadge } from './Badges';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  warnings: string[];
  missingInformation: string[];
  uncertainty: UncertaintyLevel;
}

export function EvidencePanel({
  evidence,
  warnings,
  missingInformation,
  uncertainty
}: EvidencePanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Provenance, Evidence & Clinical Safety Signals
          </h3>
        </div>
        <UncertaintyBadge level={uncertainty} />
      </div>

      {/* Warnings & Safety Alerts */}
      {warnings.length > 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Clinical Safety & Advisory Warnings
          </div>
          <ul className="list-disc list-inside text-xs text-rose-900 space-y-1 pl-1">
            {warnings.map((w, idx) => (
              <li key={idx} className="leading-relaxed">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information */}
      {missingInformation.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Identified Missing Information (Anti-Hallucination)
          </div>
          <p className="text-[11px] text-amber-700">
            The AI explicitly noted the following required clinical data points are absent in the intake:
          </p>
          <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 pl-1">
            {missingInformation.map((m, idx) => (
              <li key={idx} className="leading-relaxed">{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grounded Evidence Items */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Grounded Source Evidence ({evidence.length} items)</span>
          <span className="text-[11px] font-normal text-slate-500 lowercase">linked to input records</span>
        </h4>

        {evidence.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No evidence items recorded.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {evidence.map((ev) => (
              <div key={ev.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{ev.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {ev.sourceRef}
                  </span>
                </div>
                {ev.excerpt && (
                  <p className="text-slate-600 text-[11px] italic bg-white p-1.5 rounded border border-slate-100 mb-1">
                    &ldquo;{ev.excerpt}&rdquo;
                  </p>
                )}
                <p className="text-[10px] text-slate-500">
                  <span className="font-medium text-slate-700">Used for:</span> {ev.usedFor}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
