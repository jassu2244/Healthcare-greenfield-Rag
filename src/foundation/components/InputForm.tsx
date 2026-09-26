'use client';

import React from 'react';
import { Case, Role } from '../types';
import { SourceTag } from './Badges';

interface InputFormProps {
  cases: Case[];
  selectedCase: Case | null;
  onSelectCase: (c: Case) => void;
  onRunAI: (forceMode?: 'auto' | 'mock' | 'live') => void;
  onFinalize: () => void;
  onUpdateInput?: (fieldKey: string, newValue: any) => void;
  isProcessingAI: boolean;
  isFinalizing: boolean;
  currentRole: Role;
}

export function InputForm({
  cases,
  selectedCase,
  onSelectCase,
  onRunAI,
  onFinalize,
  onUpdateInput,
  isProcessingAI,
  isFinalizing,
  currentRole
}: InputFormProps) {
  if (!selectedCase) {
    return <div className="p-8 text-center text-slate-500">Loading cases...</div>;
  }

  const hasReview = Boolean(selectedCase.review);
  const isFinalized = selectedCase.status === 'FINALIZED';
  const canFinalize = hasReview && selectedCase.review?.decision !== 'REJECTED' && !isFinalized;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-5">
      {/* Case Selector Tabs */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Synthetic Fixture Case
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {cases.map((c) => {
            const isSelected = c.id === selectedCase.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCase(c)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50/50 shadow-sm ring-1 ring-teal-700'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {c.metadata?.title?.split(':')[0] || c.id}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    c.status === 'FINALIZED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {c.metadata?.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Details */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {selectedCase.metadata?.title}
            </h3>
            <p className="text-xs text-slate-500 font-mono">Case ID: {selectedCase.id}</p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2">
            {/* Run AI Button */}
            <button
              onClick={() => onRunAI()}
              disabled={isProcessingAI}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessingAI ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Minimizing & Synthesizing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Run AI Synthesis</span>
                </>
              )}
            </button>

            {/* Finalize Button */}
            {canFinalize && (
              <button
                onClick={onFinalize}
                disabled={isFinalizing}
                className="px-4 py-2 bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:bg-indigo-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isFinalizing ? 'Recording Action...' : 'Record Final Action'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="space-y-2.5">
          {selectedCase.inputs.map((inp) => (
            <div
              key={inp.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {inp.fieldKey === 'query' ? 'Clinical Inquiry (Editable for Live Testing)' : inp.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <SourceTag source={inp.source} />
                  <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {inp.fieldKey}
                  </span>
                </div>
              </div>

              {inp.fieldKey === 'query' ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={String(inp.value)}
                    onChange={(e) => onUpdateInput && onUpdateInput(inp.fieldKey, e.target.value)}
                    placeholder="Type any clinical inquiry to test live RAG retrieval..."
                    className="w-full text-slate-900 text-xs p-2.5 rounded-lg border border-teal-300 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none font-medium bg-white shadow-inner"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Try Unseen Queries:</span>
                    <button
                      type="button"
                      onClick={() => onUpdateInput && onUpdateInput('query', 'What is the recommended dose and renal adjustment for Meropenem?')}
                      className="text-[10px] bg-white hover:bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded border border-teal-300 transition-colors"
                    >
                      Meropenem Dosing (Formulary)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateInput && onUpdateInput('query', 'What are the emergency department triage activation criteria for sepsis SOP-ED-402?')}
                      className="text-[10px] bg-white hover:bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded border border-teal-300 transition-colors"
                    >
                      ED Sepsis SOP-ED-402
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateInput && onUpdateInput('query', 'Can bedside nurse independently titrate fentanyl infusion SEC-901?')}
                      className="text-[10px] bg-white hover:bg-rose-50 text-rose-800 font-semibold px-2 py-0.5 rounded border border-rose-300 transition-colors"
                    >
                      ICU Narcotic SEC-901 (RBAC)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateInput && onUpdateInput('query', 'What is the dosage for investigational pediatric antiviral Compound-X?')}
                      className="text-[10px] bg-white hover:bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-300 transition-colors"
                    >
                      Compound-X (Loud Refusal)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-700 font-medium bg-white p-2 rounded border border-slate-100">
                  {Array.isArray(inp.value) ? inp.value.join(', ') : String(inp.value)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
