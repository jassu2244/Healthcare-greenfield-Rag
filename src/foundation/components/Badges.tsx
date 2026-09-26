'use client';

import React from 'react';
import { UncertaintyLevel, InputSource } from '../types';

export function AIModeBadge({
  mode,
  model,
  fallbackReason
}: {
  mode: 'LIVE' | 'MOCK' | 'FALLBACK';
  model?: string;
  fallbackReason?: string;
}) {
  if (mode === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        LIVE · {model || 'Provider'}
      </span>
    );
  }

  if (mode === 'FALLBACK') {
    return (
      <span
        title={fallbackReason || 'Safely degraded to deterministic fallback'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 cursor-help"
      >
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        FALLBACK · {fallbackReason ? fallbackReason.substring(0, 32) + '...' : 'Deterministic'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
      MOCK · Deterministic Engine
    </span>
  );
}

export function UncertaintyBadge({ level }: { level: UncertaintyLevel }) {
  const styles = {
    LOW: 'bg-teal-50 text-teal-800 border-teal-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    HIGH: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[level]}`}>
      Uncertainty: {level}
    </span>
  );
}

export function SourceTag({
  source
}: {
  source: InputSource | 'HUMAN_EDITED';
}) {
  const labels: Record<string, { label: string; style: string }> = {
    PATIENT_REPORTED: {
      label: 'Patient-Reported',
      style: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    CLINICIAN_ENTERED: {
      label: 'Clinician-Entered',
      style: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    SYSTEM_RECORD: {
      label: 'System Record',
      style: 'bg-gray-50 text-gray-700 border-gray-200'
    },
    AI_GENERATED: {
      label: 'AI-Generated (Draft)',
      style: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    HUMAN_EDITED: {
      label: 'Human-Edited',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-300'
    }
  };

  const config = labels[source] || { label: source, style: 'bg-slate-50 text-slate-600 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.style}`}>
      {config.label}
    </span>
  );
}

export function SyntheticDataBanner() {
  return (
    <div className="w-full bg-slate-900 text-slate-300 px-4 py-1.5 text-[11px] font-medium flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full font-mono text-[10px] font-bold border border-teal-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          SIMULATION ENVIRONMENT
        </span>
        <span className="text-slate-300 hidden sm:inline">
          Enterprise Clinical Knowledge & Decision Support · 100% Synthetic Healthcare Fixtures
        </span>
        <span className="text-slate-300 sm:hidden">
          Synthetic Clinical Decision Support
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
        <span className="hidden md:inline">Pre-Retrieval RBAC</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">1-Click Citations</span>
        <span className="hidden md:inline">•</span>
        <span className="text-emerald-400 font-mono font-medium">SHA-256 Validated</span>
      </div>
    </div>
  );
}
