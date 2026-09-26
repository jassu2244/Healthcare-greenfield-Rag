'use client';

import React from 'react';
import { InputRecord } from '../types';
import { SourceTag } from './Badges';

interface PrivacyPanelProps {
  inputs: InputRecord[];
  caseId: string;
}

export function PrivacyPanel({ inputs, caseId }: PrivacyPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Privacy Architecture & Data Touchpoint Governance
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          Privacy-by-Design Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Principle 1 */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Data Minimization
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            The AI task registry enforces strict field allow-lists. Identifiers (e.g. patient name) are pseudonymized to <code className="bg-slate-200 text-slate-800 px-1 rounded font-mono text-[10px]">PATIENT_REF_{caseId.slice(-6)}</code> prior to transmission.
          </p>
        </div>

        {/* Principle 2 */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visibility & Control
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Every access to case fields records field keys (never clinical values) in the tamper-evident audit ledger. Clinicians review exact boundaries before taking action.
          </p>
        </div>

        {/* Principle 3 */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Safe Logging & Telemetry
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All server logs pass through deep redaction masking sensitive keys (symptoms, medications, notes, names). Only operational metadata and status codes are preserved.
          </p>
        </div>
      </div>

      {/* Case Data Inventory Table */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Case Data Inventory ({inputs.length} fields captured)
        </h4>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Sensitivity</th>
                <th className="px-3 py-2">Access Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inputs.map((inp) => (
                <tr key={inp.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {inp.label}
                    <span className="block text-[10px] font-mono text-slate-400">{inp.fieldKey}</span>
                  </td>
                  <td className="px-3 py-2">
                    <SourceTag source={inp.source} />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      inp.sensitivity === 'HIGHLY_SENSITIVE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : inp.sensitivity === 'SENSITIVE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inp.sensitivity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-600">
                    Clinicians & System
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
