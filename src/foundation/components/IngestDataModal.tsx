'use client';

import React, { useState } from 'react';

interface IngestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded: () => void;
}

const SAMPLE_PDF_DATA = {
  title: 'Hospital Clinical Guideline: Pediatric Acute Bacterial Meningitis (2026 Inpatient Protocol)',
  docType: 'guideline' as const,
  clauseNumber: 'Guideline-Meningitis-2026-1.1',
  accessLevel: 'CLINICAL_STAFF' as const,
  content: `For pediatric patients presenting with suspected acute bacterial meningitis, initiate empiric parenteral therapy immediately after lumbar puncture (or blood cultures if LP is delayed):
1. First-line therapy: Ceftriaxone 100 mg/kg/day IV divided every 12 hours (maximum 4000 mg/day) PLUS Vancomycin 15 mg/kg IV every 6 hours (target AUC/MIC 400-600).
2. For neonates under 1 month: Ampicillin 100 mg/kg IV q8h plus Cefotaxime 50 mg/kg IV q8h. Ceftriaxone is contraindicated in neonates due to biliary sludging and bilirubin displacement.
3. Adjunctive Dexamethasone: Administer 0.15 mg/kg IV 15-20 minutes before or concurrent with the initial antibiotic dose for proven or suspected Streptococcus pneumoniae or H. influenzae type b.`
};

export const IngestDataModal: React.FC<IngestDataModalProps> = ({ isOpen, onClose, onDocumentAdded }) => {
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'guideline' | 'sop' | 'formulary_table' | 'restricted_policy'>('guideline');
  const [clauseNumber, setClauseNumber] = useState('');
  const [accessLevel, setAccessLevel] = useState<'CLINICAL_STAFF' | 'RESTRICTED_ATTENDING'>('CLINICAL_STAFF');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setTitle(SAMPLE_PDF_DATA.title);
    setDocType(SAMPLE_PDF_DATA.docType);
    setClauseNumber(SAMPLE_PDF_DATA.clauseNumber);
    setAccessLevel(SAMPLE_PDF_DATA.accessLevel);
    setContent(SAMPLE_PDF_DATA.content);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }
    if (!content.trim()) {
      setError('Please provide extracted text or PDF content.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const minRequiredRole = accessLevel === 'RESTRICTED_ATTENDING'
        ? ['PHYSICIAN', 'PHARMACIST', 'ATTENDING']
        : ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'];

      const res = await fetch('/api/foundation/corpus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          docType,
          clauseNumber: clauseNumber || `Guideline-${Date.now().toString().slice(-4)}`,
          accessLevel,
          minRequiredRole,
          content
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      onDocumentAdded();
      onClose();
    } catch (err: any) {
      setError(`Failed to ingest document: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-teal-300 uppercase tracking-wider block">
              Knowledge Base Ingestion
            </span>
            <h3 className="font-bold text-base">Add Clinical Guideline or Extracted PDF</h3>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white text-xl font-bold w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Paste extracted text from medical PDFs, hospital policies, or formulary updates into the database.
            </p>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              📋 Load Sample PDF
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hospital Clinical Guideline: Pediatric Meningitis Management"
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="guideline">Clinical Guideline</option>
                <option value="formulary_table">Formulary Table</option>
                <option value="sop">Clinical SOP</option>
                <option value="restricted_policy">Restricted ICU Policy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="CLINICAL_STAFF">Clinical Staff (Nurse & Doctor)</option>
                <option value="RESTRICTED_ATTENDING">Attending Physician Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clause / Section Identifier (Optional)
            </label>
            <input
              type="text"
              value={clauseNumber}
              onChange={(e) => setClauseNumber(e.target.value)}
              placeholder="e.g. Guideline-2026-1.1 or Table 1"
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Extracted Document Content / Text *
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste extracted text from clinical PDF guideline, dosage table, contraindications, or hospital protocol..."
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Ingesting into DB...' : '📥 Ingest into Hospital DB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
