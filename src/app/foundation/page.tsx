'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Case, Role, AuditEvent, InputRecord } from '@/foundation/types';
import { Header } from '@/foundation/components/Header';
import { ClinicalCopilotChat } from '@/foundation/components/ClinicalCopilotChat';
import { NewPatientModal } from '@/foundation/components/NewPatientModal';
import { DataAccessPanel } from '@/foundation/components/DataAccessPanel';
import { AuditTimeline } from '@/foundation/components/AuditTimeline';
import { PrivacyPanel } from '@/foundation/components/PrivacyPanel';
import { IngestDataModal } from '@/foundation/components/IngestDataModal';

export default function FoundationDemoPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('PHYSICIAN');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [chainVerification, setChainVerification] = useState<{ valid: boolean; eventCount: number; error?: string } | undefined>(undefined);
  const [boundaryReport, setBoundaryReport] = useState<any>(undefined);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [corpusCount, setCorpusCount] = useState<number>(5);
  const [ingestNotice, setIngestNotice] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const autoRunInitiated = useRef<Record<string, boolean>>({});

  // Fetch all cases
  const loadCases = useCallback(async (preferredCaseId?: string) => {
    try {
      setErrorMessage(null);
      const res = await fetch('/api/foundation/cases');
      if (!res.ok) throw new Error('Failed to load cases');
      const data = await res.json();
      setCases(data.cases || []);

      if (data.cases && data.cases.length > 0) {
        const target = preferredCaseId
          ? data.cases.find((c: Case) => c.id === preferredCaseId) || data.cases[0]
          : data.cases[0];
        setSelectedCase(target);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch audit trail for selected case
  const loadAuditTrail = useCallback(async (caseId: string) => {
    try {
      const res = await fetch(`/api/foundation/cases/${caseId}/audit`);
      if (res.ok) {
        const data = await res.json();
        setAuditEvents(data.events || []);
        setChainVerification(data.verification);
      }
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
  }, []);

  // Fetch hospital corpus document count from DB
  const loadCorpusCount = useCallback(async () => {
    try {
      const res = await fetch('/api/foundation/corpus');
      if (res.ok) {
        const data = await res.json();
        setCorpusCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to load corpus count:', err);
    }
  }, []);

  useEffect(() => {
    loadCases();
    loadCorpusCount();
  }, [loadCases, loadCorpusCount]);

  useEffect(() => {
    if (selectedCase) {
      loadAuditTrail(selectedCase.id);
    }
  }, [selectedCase, loadAuditTrail]);

  // Handle running AI task
  const handleRunAI = async (forceMode?: 'auto' | 'mock' | 'live', customQuery?: string, targetCaseToRun?: Case) => {
    const caseToProcess = targetCaseToRun || selectedCase;
    if (!caseToProcess) return;
    setIsProcessingAI(true);
    setErrorMessage(null);

    try {
      let inputsToSend = caseToProcess.inputs;
      if (customQuery) {
        inputsToSend = caseToProcess.inputs.map((inp) =>
          inp.fieldKey === 'query' ? { ...inp, value: customQuery } : inp
        );
      }

      // Update role
      inputsToSend = inputsToSend.map((inp) =>
        inp.fieldKey === 'userRole' ? { ...inp, value: currentRole } : inp
      );

      const res = await fetch(`/api/foundation/cases/${caseToProcess.id}/run-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: 'clinical_enterprise_rag',
          actor: {
            id: currentRole === 'NURSE' ? 'nurse_priya' : 'dr_rivera',
            role: currentRole,
            displayName: currentRole === 'NURSE' ? 'Nurse Priya Sharma' : 'Dr. Sarah Rivera'
          },
          forceMode,
          inputs: inputsToSend
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSelectedCase(data.case);
      setBoundaryReport(data.boundaryReport);
      await loadAuditTrail(caseToProcess.id);
      await loadCases(caseToProcess.id);
    } catch (err: any) {
      setErrorMessage(`AI synthesis failed: ${err.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Note: We deliberately do NOT auto-synthesize on patient switch so the clinician
  // can start the conversation naturally with a greeting or specific query.

  // Handle Doctor Prescription & Order Sign-off
  const handleApproveAndPrescribe = async () => {
    if (!selectedCase) return;
    setIsFinalizing(true);
    setErrorMessage(null);

    try {
      const summaryText = selectedCase.aiResults?.[0]?.output?.summary || 'Standard empiric antimicrobial protocol and IV fluid resuscitation.';

      // 1. Human Review Approval
      const reviewRes = await fetch(`/api/foundation/cases/${selectedCase.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'APPROVED',
          reviewerId: 'dr_rivera',
          reviewerName: 'Dr. Sarah Rivera (Attending Physician)'
        })
      });

      if (!reviewRes.ok) {
        const err = await reviewRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record clinical review approval');
      }

      // 2. Final Action: Clinical Order Approved
      const finalRes = await fetch(`/api/foundation/cases/${selectedCase.id}/final-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLINICAL_ORDER_APPROVED',
          performedBy: 'Dr. Sarah Rivera (Attending Physician)',
          summary: `Prescription Order Authorized: ${summaryText}`
        })
      });

      if (!finalRes.ok) {
        const err = await finalRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to sign clinical order');
      }

      const finalData = await finalRes.json();

      // 3. Persist prescription in Database (this automatically creates the authoritative nurse directive in DB)
      const patientName = (selectedCase.inputs.find((i) => i.fieldKey === 'patientName')?.value as string) || 'Inpatient';
      await fetch('/api/foundation/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase.id,
          patientName,
          medication: summaryText.slice(0, 140),
          dosage: 'Per clinical guideline standard protocol',
          instructions: 'Administer via IV infusion with continuous bedside monitoring.',
          prescribedBy: 'Dr. Sarah Rivera (Attending Physician)'
        })
      }).catch((e) => console.error('Prescription DB error:', e));

      setSelectedCase(finalData.case);
      await loadAuditTrail(selectedCase.id);
      await loadCases(selectedCase.id);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Handle New Patient Intake
  const handleCreateNewCase = async (inputs: InputRecord[], title: string, description: string) => {
    try {
      const res = await fetch('/api/foundation/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs,
          metadata: {
            synthetic: true,
            title,
            description,
            category: 'custom_intake'
          }
        })
      });

      if (!res.ok) throw new Error('Failed to create patient case');
      const data = await res.json();
      await loadCases(data.case.id);
      setSelectedCase(data.case);

      // Ready for clinician consultation
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handle Demo Reset
  const handleResetDemo = async () => {
    setIsResetting(true);
    setErrorMessage(null);
    autoRunInitiated.current = {};

    try {
      const res = await fetch('/api/foundation/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset demo');
      setBoundaryReport(undefined);
      await loadCases();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">Loading RelayMD...</p>
        </div>
      </div>
    );
  }

  const latestAiResult = selectedCase?.aiResults?.[0];
  // Focus on 1 patient as requested ("one doctor and one patient")
  const displayCases = cases.slice(0, 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(newRole) => {
          setCurrentRole(newRole);
        }}
        onResetDemo={handleResetDemo}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        isResetting={isResetting}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 text-sm font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Patients Queue (1 Patient Focus) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Patients ({displayCases.length})
              </span>
              <button
                onClick={() => setIsNewPatientModalOpen(true)}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>+</span> Add Patient
              </button>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-0.5">
              {displayCases.map((c) => {
                const isSelected = c.id === selectedCase?.id;
                const patientName = c.inputs.find((i) => i.fieldKey === 'patientName')?.value as string || 'Patient';
                const isOrderSigned = Boolean(c.finalAction);

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCase(c);
                      setBoundaryReport(undefined);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {patientName.split('(')[0].trim()}
                      </span>
                      {isOrderSigned ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>✓</span> Signed
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {c.metadata?.title?.split(':')[1] || c.inputs.find((i) => i.fieldKey === 'query')?.value as string}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* HOSPITAL KNOWLEDGE BASE INGESTION (Database-driven) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block">
                    Hospital Guidelines DB
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {corpusCount} active institutional protocols
                  </span>
                </div>
                <button
                  onClick={() => setIsIngestModalOpen(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <span>📄</span> + Ingest Data / PDF
                </button>
              </div>

              {ingestNotice && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] flex items-center justify-between animate-in fade-in">
                  <span>{ingestNotice}</span>
                  <button onClick={() => setIngestNotice(null)} className="font-bold text-emerald-700 ml-1 cursor-pointer">×</button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Clinical Chat & Prescribing */}
          <div className="lg:col-span-8">
            <ClinicalCopilotChat
              selectedCase={selectedCase}
              onRunAI={handleRunAI}
              onApproveAndPrescribe={handleApproveAndPrescribe}
              isProcessingAI={isProcessingAI}
              isFinalizing={isFinalizing}
              currentRole={currentRole}
            />
          </div>
        </div>
      </main>

      {/* Ingest Knowledge Base / PDF Data Modal */}
      <IngestDataModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onDocumentAdded={async () => {
          await loadCorpusCount();
          setIngestNotice('✓ Clinical guideline saved in DB! Copilot can now retrieve it.');
          setTimeout(() => setIngestNotice(null), 6000);
        }}
      />

      {/* New Patient Modal */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onCreateCase={handleCreateNewCase}
      />

      {/* Audit & Compliance Modal Drawer (For Judges / Compliance inspection) */}
      {isAuditModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-slate-200 flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Hospital Safety & Audit Ledger (Track 04)</h3>
                <p className="text-xs text-slate-400">Cryptographic SHA-256 chain & pre-retrieval RBAC boundary verification</p>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <DataAccessPanel
                boundaryReport={boundaryReport}
                inputFieldsSent={latestAiResult?.meta.inputFieldsSent}
                totalFieldsCount={selectedCase.inputs.length}
              />

              <AuditTimeline
                events={auditEvents}
                chainVerification={chainVerification}
                caseId={selectedCase.id}
              />

              <PrivacyPanel
                inputs={selectedCase.inputs}
                caseId={selectedCase.id}
              />
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
