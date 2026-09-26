'use client';

import React, { useState } from 'react';
import { Case, Role } from '../types';

interface PatientOrdersPanelProps {
  selectedCase: Case | null;
  currentRole: Role;
  onNavigateToCopilot: () => void;
}

export function PatientOrdersPanel({
  selectedCase,
  currentRole,
  onNavigateToCopilot
}: PatientOrdersPanelProps) {
  const [adminNotes, setAdminNotes] = useState<Record<string, { administeredAt: string; administeredBy: string }>>({});

  if (!selectedCase) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-semibold">No patient selected.</p>
      </div>
    );
  }

  const patientName = selectedCase.inputs.find((i) => i.fieldKey === 'patientName')?.value as string || 'Patient Record';
  const clinicalContext = selectedCase.inputs.find((i) => i.fieldKey === 'clinicalContext')?.value as string || 'General clinical admission';
  const latestResult = selectedCase.aiResults?.[0];
  const hasFinalAction = Boolean(selectedCase.finalAction);
  const isNurse = currentRole === 'NURSE';
  const isDoctor = currentRole === 'PHYSICIAN' || currentRole === 'REVIEWER';

  const orderKey = `${selectedCase.id}_final_order`;
  const isOrderAdministered = Boolean(adminNotes[orderKey]);

  const handleAdminister = () => {
    setAdminNotes((prev) => ({
      ...prev,
      [orderKey]: {
        administeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        administeredBy: 'Nurse Priya Sharma, RN'
      }
    }));
  };

  // Generate synthetic medication line items from the latest recommendation or context
  const medicationList = latestResult?.output?.keyInformation?.filter((k: string) =>
    k.toLowerCase().includes('mg') || k.toLowerCase().includes('iv') || k.toLowerCase().includes('dose') || k.toLowerCase().includes('vancomycin') || k.toLowerCase().includes('meropenem') || k.toLowerCase().includes('ceftriaxone')
  ) || [];

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xl flex-shrink-0">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{patientName}</h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                  hasFinalAction ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {hasFinalAction ? 'Order Authorized' : 'Pending Physician Order'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Case ID: {selectedCase.id} · Admitted to Clinical Inpatient Unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToCopilot}
              className="text-xs font-semibold px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              💬 Open Clinical Copilot Chat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Clinical Context / Presentation
            </span>
            <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed">
              {clinicalContext}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Guideline Track
            </span>
            <p className="text-xs text-slate-800 font-medium">
              {selectedCase.metadata?.title || 'Hospital Enterprise Formulary & Sepsis SOP'}
            </p>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono mt-1.5 inline-block">
              2024 Institutional Protocol
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Safety Verification
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Audit Chain Validated (SHA-256)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Pre-retrieval RBAC boundary verified. No unauthorized leaks.
            </p>
          </div>
        </div>
      </div>

      {/* Doctor Prescribed Orders (Visible to Nurse & Doctor) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Physician Authorized Orders & Prescription</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                MAR RECORD
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Orders authorized by the attending physician for bedside nurse administration
            </p>
          </div>

          <span className="text-xs text-slate-500">
            Viewing as: <strong className="text-slate-800">{currentRole}</strong>
          </span>
        </div>

        {hasFinalAction && selectedCase.finalAction ? (
          <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-2 border-emerald-500/40 rounded-2xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    {selectedCase.finalAction.type}
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Ordered by <strong>{selectedCase.finalAction.performedBy}</strong> on{' '}
                    {new Date(selectedCase.finalAction.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200 shadow-2xs">
                  SHA-256 SIGNED
                </span>
              </div>
            </div>

            {/* Prescribed Dosage & Protocol */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Prescription Instructions & Regimen:
              </span>
              <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                {selectedCase.finalAction.summary}
              </p>
            </div>

            {/* Nurse Administration Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                {isOrderAdministered ? (
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300">
                    <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Administered to patient by {adminNotes[orderKey].administeredBy} at {adminNotes[orderKey].administeredAt}</span>
                  </div>
                ) : (
                  <span className="text-amber-800 font-medium bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                    ⏳ Ready for bedside nurse administration
                  </span>
                )}
              </div>

              {isNurse && !isOrderAdministered && (
                <button
                  onClick={handleAdminister}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Mark as Administered (Nurse Sign)</span>
                </button>
              )}

              {isDoctor && !isOrderAdministered && (
                <span className="text-[11px] text-slate-500 italic">
                  Order is broadcast to nursing station. Switch to Nurse Priya to simulate administration.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center font-bold text-sm">
              📋
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">No Authorized Orders Yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {isDoctor
                  ? "As the Attending Physician, go to the Clinical Copilot Chat, review the AI-synthesized clinical recommendations, and click 'Sign & Authorize Order'."
                  : "Awaiting attending physician sign-off. Once Dr. Rivera authorizes the recommendation in the Clinical Copilot, the signed prescription will appear here."}
              </p>
            </div>
            <button
              onClick={onNavigateToCopilot}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl hover:bg-teal-800 transition-colors shadow-2xs inline-flex items-center gap-1.5"
            >
              Go to Clinical Copilot Chat →
            </button>
          </div>
        )}

        {/* Detailed MAR Table */}
        <div className="pt-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Active Medication Schedule & Verification
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Medication</th>
                  <th className="py-2.5 px-3">Standard Dosing & Route</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Formulary Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Vancomycin IV</td>
                  <td className="py-2.5 px-3">15–20 mg/kg IV in Normal Saline</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">q8–12h</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      hasFinalAction ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {hasFinalAction ? (isOrderAdministered ? 'Administered' : 'Authorized') : 'Draft / Suggested'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">Tier 1 (Covered)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Ceftriaxone IV</td>
                  <td className="py-2.5 px-3">2g IV piggyback</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">q24h</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      hasFinalAction ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {hasFinalAction ? (isOrderAdministered ? 'Administered' : 'Authorized') : 'Draft / Suggested'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">Tier 1 (Covered)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Crystalloid Fluids</td>
                  <td className="py-2.5 px-3">30 mL/kg IV bolus</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">Within 3h of intake</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      Standard Protocol
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">ED Bundle</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
