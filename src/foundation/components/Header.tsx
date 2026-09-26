'use client';

import React from 'react';
import { Role } from '../types';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (newRole: Role) => void;
  onResetDemo: () => void;
  onOpenAudit: () => void;
  isResetting?: boolean;
}

export function Header({
  currentRole,
  onRoleChange,
  onResetDemo,
  onOpenAudit,
  isResetting = false
}: HeaderProps) {
  const isDoctor = currentRole === 'PHYSICIAN' || currentRole === 'REVIEWER';
  const isNurse = currentRole === 'NURSE';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ℞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  RelayMD
                </span>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  Hospital AI Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Clinical Decision Support & Prescription Workflow
              </p>
            </div>
          </div>

          {/* Quick One-Click Role Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => onRoleChange('PHYSICIAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isDoctor
                  ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🩺</span>
              <span>Dr. Rivera (Doctor)</span>
              {isDoctor && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={() => onRoleChange('NURSE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isNurse
                  ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👩‍⚕️</span>
              <span>Nurse Priya (Nurse)</span>
              {isNurse && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              )}
            </button>

            {/* Doctor and Nurse Roles Only */}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAudit}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open audit ledger and safety verification"
            >
              <span>🛡️</span>
              <span className="hidden md:inline">Audit & Safety</span>
            </button>

            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="text-xs font-medium px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              title="Reset cases back to default"
            >
              {isResetting ? 'Resetting...' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
