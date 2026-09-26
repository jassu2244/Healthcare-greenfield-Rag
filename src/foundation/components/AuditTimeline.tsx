'use client';

import React, { useState } from 'react';
import { AuditEvent } from '../types';

interface AuditTimelineProps {
  events: AuditEvent[];
  chainVerification?: {
    valid: boolean;
    eventCount: number;
    error?: string;
  };
  caseId: string;
}

export function AuditTimeline({
  events,
  chainVerification,
  caseId
}: AuditTimelineProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const handleExport = () => {
    window.open(`/api/foundation/cases/${caseId}/audit/export`, '_blank');
  };

  const isChainValid = chainVerification?.valid ?? true;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Tamper-Evident Audit Trail & Cryptographic Chain
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Chain Integrity Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isChainValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isChainValid ? 'bg-emerald-500' : 'bg-rose-500'}`}
            ></span>
            {isChainValid
              ? `SHA-256 Chain Verified (${events.length} events)`
              : `Chain Broken: ${chainVerification?.error}`}
          </span>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm flex items-center gap-1.5"
            title="Download full signed JSON audit trail"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="p-5">
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No audit events recorded for this case yet.</p>
        ) : (
          <div className="relative border-l border-slate-200 ml-3 space-y-6">
            {events.map((evt) => {
              const isExpanded = expandedEventId === evt.eventId;

              return (
                <div key={evt.eventId} className="relative pl-6">
                  {/* Sequence Node */}
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-400 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">
                    {evt.sequence}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {evt.action}
                        </span>
                        <span className="text-slate-500 font-medium">
                          by <strong className="text-slate-800">{evt.actor.displayName || evt.actor.role}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Data Touched Keys */}
                    {evt.dataAccessed && evt.dataAccessed.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Data Keys:</span>
                        {evt.dataAccessed.map((k) => (
                          <span key={k} className="text-[10px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Details Toggle */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200/60">
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.eventId)}
                        className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Cryptographic Hashes' : 'View Cryptographic Hashes'}</span>
                        <span className="text-slate-400 font-mono">({evt.hash.substring(0, 8)}...)</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Event ID: {evt.eventId}</span>
                    </div>

                    {/* Expanded Hashes & Details */}
                    {isExpanded && (
                      <div className="mt-2 p-2.5 bg-slate-900 text-slate-100 rounded font-mono text-[10px] space-y-1.5 overflow-x-auto">
                        <div>
                          <span className="text-slate-400">prevHash: </span>
                          <span className="text-amber-300">{evt.prevHash}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">currHash: </span>
                          <span className="text-emerald-300">{evt.hash}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">details: </span>
                          <pre className="text-slate-300 inline">{JSON.stringify(evt.details, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
