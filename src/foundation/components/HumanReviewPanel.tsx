'use client';

import React, { useState } from 'react';
import { ReviewDecision, FieldDiff } from '../types';
import { SourceTag } from './Badges';

interface HumanReviewPanelProps {
  initialSummary: string;
  initialNextStep: string;
  existingReview?: ReviewDecision;
  onApproveAsIs: () => void;
  onEditAndApprove: (edits: FieldDiff[]) => void;
  onReject: (reason: string) => void;
  isSubmitting?: boolean;
}

export function HumanReviewPanel({
  initialSummary,
  initialNextStep,
  existingReview,
  onApproveAsIs,
  onEditAndApprove,
  onReject,
  isSubmitting = false
}: HumanReviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(initialSummary);
  const [editedNextStep, setEditedNextStep] = useState(initialNextStep);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // If already reviewed, display the completed review badge and details
  if (existingReview) {
    const isApproved = existingReview.decision !== 'REJECTED';
    return (
      <div className={`rounded-xl border p-5 shadow-sm ${isApproved ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SourceTag source="HUMAN_EDITED" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Clinician Review Decision Recorded
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
            existingReview.decision === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800'
              : existingReview.decision === 'EDITED_AND_APPROVED'
              ? 'bg-teal-100 text-teal-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {existingReview.decision.replace(/_/g, ' ')}
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-2">
          Decided by <span className="font-semibold text-slate-800">{existingReview.reviewerId}</span> on{' '}
          {new Date(existingReview.decidedAt).toLocaleString()}
        </p>

        {existingReview.reason && (
          <div className="p-3 bg-white rounded border border-rose-200 text-xs text-rose-900">
            <span className="font-bold">Rejection Reason:</span> {existingReview.reason}
          </div>
        )}

        {existingReview.edits && existingReview.edits.length > 0 && (
          <div className="mt-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinician Edits (Audit Diffs)</h4>
            {existingReview.edits.map((diff, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-slate-200 text-xs space-y-1">
                <span className="font-mono text-teal-800 font-semibold">{diff.field}</span>
                <div className="text-slate-400 line-through text-[11px]">Original AI Draft: {diff.aiValue}</div>
                <div className="text-emerald-900 font-medium text-xs">Human Approved: {diff.humanValue}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const handleSaveEdits = () => {
    const diffs: FieldDiff[] = [];
    if (editedSummary !== initialSummary) {
      diffs.push({
        field: 'summary',
        aiValue: initialSummary,
        humanValue: editedSummary
      });
    }
    if (editedNextStep !== initialNextStep) {
      diffs.push({
        field: 'suggestedNextStep',
        aiValue: initialNextStep,
        humanValue: editedNextStep
      });
    }

    if (diffs.length > 0) {
      onEditAndApprove(diffs);
    } else {
      onApproveAsIs();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Human-in-the-Loop Clinical Review
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">Step 4 of 6</span>
      </div>

      <p className="text-xs text-slate-600">
        Review the AI-generated draft before authorizing final action. You can approve as-is, make targeted clinical edits with tracked diffs, or reject with a formal reason.
      </p>

      {isEditing ? (
        <div className="space-y-4 border border-teal-200 bg-teal-50/20 p-4 rounded-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Edit Clinical Summary
            </label>
            <textarea
              rows={3}
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Edit Suggested Next Action
            </label>
            <input
              type="text"
              value={editedNextStep}
              onChange={(e) => setEditedNextStep(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSaveEdits}
              disabled={isSubmitting}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Edits...' : 'Save Edits & Approve'}
            </button>
            <button
              onClick={() => {
                setEditedSummary(initialSummary);
                setEditedNextStep(initialNextStep);
                setIsEditing(false);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel Editing
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onApproveAsIs}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Approve As-Is</span>
          </button>

          <button
            onClick={() => setIsEditing(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Fields & Approve</span>
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isSubmitting}
            className="px-3 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Reject with Reason...
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3 mt-3">
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
            Rejection Reason (Required for Audit Trail)
          </h4>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Specify why this draft is rejected (e.g., inaccurate medication interpretation, conflicting notes)..."
            className="w-full text-xs p-2.5 border border-rose-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (rejectReason.trim().length > 0) {
                  onReject(rejectReason);
                  setShowRejectModal(false);
                }
              }}
              disabled={isSubmitting || rejectReason.trim().length === 0}
              className="px-3.5 py-1.5 bg-rose-700 text-white text-xs font-semibold rounded hover:bg-rose-800 disabled:opacity-50"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
