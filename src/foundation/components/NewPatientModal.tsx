'use client';

import React, { useState } from 'react';
import { InputRecord } from '../types';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (inputs: InputRecord[], title: string, description: string) => Promise<void>;
}

export function NewPatientModal({ isOpen, onClose, onCreateCase }: NewPatientModalProps) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('54');
  const [gender, setGender] = useState('Female');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalQuery, setClinicalQuery] = useState('');
  const [allergies, setAllergies] = useState('No known drug allergies (NKDA)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!clinicalQuery.trim()) {
      setError('Clinical inquiry is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const now = new Date().toISOString();
    const inputs: InputRecord[] = [
      {
        id: `inp_${Date.now()}_name`,
        fieldKey: 'patientName',
        label: 'Patient Full Name',
        value: `${patientName.trim()} (${age}yo ${gender})`,
        source: 'CLINICIAN_ENTERED',
        capturedAt: now,
        sensitivity: 'HIGHLY_SENSITIVE'
      },
      {
        id: `inp_${Date.now()}_role`,
        fieldKey: 'userRole',
        label: 'User Clinical Role',
        value: 'PHYSICIAN',
        source: 'SYSTEM_RECORD',
        capturedAt: now,
        sensitivity: 'LOW'
      },
      {
        id: `inp_${Date.now()}_query`,
        fieldKey: 'query',
        label: 'Clinical Inquiry',
        value: clinicalQuery.trim(),
        source: 'CLINICIAN_ENTERED',
        capturedAt: now,
        sensitivity: 'LOW'
      },
      {
        id: `inp_${Date.now()}_context`,
        fieldKey: 'clinicalContext',
        label: 'Clinical Presentation Context',
        value: `${chiefComplaint.trim() || 'Acute admission'}. Allergies: ${allergies}. Admitted for clinical observation and therapy evaluation.`,
        source: 'CLINICIAN_ENTERED',
        capturedAt: now,
        sensitivity: 'SENSITIVE'
      }
    ];

    try {
      await onCreateCase(
        inputs,
        `Patient: ${patientName.trim()} (${chiefComplaint.slice(0, 30) || 'Intake'})`,
        `Admitted clinical case: ${chiefComplaint || 'General clinical inquiry'}`
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">New Patient Intake</h3>
              <p className="text-xs text-teal-100">Create a synthetic patient record for AI consultation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white text-xl font-bold w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chief Complaint / Clinical Presentation
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Fever 39.1°C, acute cough, suspected lower respiratory infection"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Known Drug Allergies
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. NKDA or Penicillin anaphylaxis"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Initial Clinical Question / AI Inquiry *
            </label>
            <textarea
              rows={3}
              value={clinicalQuery}
              onChange={(e) => setClinicalQuery(e.target.value)}
              placeholder="e.g. What is the recommended empiric antibiotic regimen and fluid volume timing for adult sepsis?"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Creating Case...' : 'Create & Consult AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
