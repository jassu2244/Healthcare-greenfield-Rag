'use client';

import React from 'react';
import { CaseStatus } from '../types';

interface StatusStepperProps {
  status: CaseStatus;
  hasAiResult: boolean;
  hasReview: boolean;
  hasFinalAction: boolean;
}

export function StatusStepper({
  status,
  hasAiResult,
  hasReview,
  hasFinalAction
}: StatusStepperProps) {
  const steps = [
    {
      id: 'input',
      title: '1. Input Intake',
      subtitle: 'Patient & Clinician Records',
      completed: true,
      active: status === 'SUBMITTED' && !hasAiResult
    },
    {
      id: 'ai_process',
      title: '2. AI Minimization & Processing',
      subtitle: 'Data Boundary Filtered',
      completed: hasAiResult,
      active: status === 'AI_PROCESSING'
    },
    {
      id: 'evidence',
      title: '3. Result & Evidence',
      subtitle: 'Grounded Structured Output',
      completed: hasAiResult,
      active: status === 'AI_COMPLETE' && !hasReview
    },
    {
      id: 'review',
      title: '4. Human Review',
      subtitle: 'Clinician Verification & Edit',
      completed: hasReview,
      active: status === 'IN_REVIEW' || (hasAiResult && !hasReview)
    },
    {
      id: 'final',
      title: '5. Final Action',
      subtitle: 'Authorized Clinical Action',
      completed: hasFinalAction,
      active: hasReview && !hasFinalAction
    },
    {
      id: 'audit',
      title: '6. Audit Trail',
      subtitle: 'Tamper-Evident SHA-256',
      completed: true,
      active: hasFinalAction
    }
  ];

  return (
    <div className="w-full bg-slate-50 border-b border-slate-200 py-3 px-4">
      <div className="max-w-7xl mx-auto overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] gap-2">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.completed
                      ? 'bg-teal-700 text-white shadow-sm'
                      : step.active
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="leading-tight">
                  <p className={`text-xs font-semibold ${step.active ? 'text-teal-900 font-bold' : step.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-500">{step.subtitle}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${step.completed ? 'bg-teal-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
