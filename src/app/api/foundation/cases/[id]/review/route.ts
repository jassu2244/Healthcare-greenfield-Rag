import { NextResponse } from 'next/server';
import { getCaseById, saveCase } from '@/foundation/store';
import { recordAuditEvent } from '@/foundation/audit';
import { ReviewDecision, ReviewDecisionType, FieldDiff } from '@/foundation/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      decision,
      edits = [],
      reason,
      reviewerId = 'clinician_lead',
      reviewerName = 'Attending Physician'
    } = body;
    const typedEdits: FieldDiff[] = Array.isArray(edits) ? edits : [];

    const validDecisions: ReviewDecisionType[] = ['APPROVED', 'EDITED_AND_APPROVED', 'REJECTED'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      );
    }

    if (decision === 'REJECTED' && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'A specific reason is strictly required when rejecting a case.' },
        { status: 400 }
      );
    }

    const targetCase = getCaseById(id);
    if (!targetCase) {
      return NextResponse.json({ error: `Case "${id}" not found` }, { status: 404 });
    }

    const reviewRecord: ReviewDecision = {
      reviewerId,
      decision,
      edits: typedEdits,
      reason,
      decidedAt: new Date().toISOString()
    };

    targetCase.review = reviewRecord;
    targetCase.status = decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';

    // Record HUMAN_EDITED audit event if edits were made
    if (typedEdits.length > 0) {
      recordAuditEvent({
        caseId: id,
        actor: { id: reviewerId, role: 'REVIEWER', displayName: reviewerName },
        action: 'HUMAN_EDITED',
        resource: `case_${id}/review`,
        dataAccessed: typedEdits.map((e: FieldDiff) => e.field),
        details: {
          editedFieldsCount: typedEdits.length,
          fields: typedEdits.map((e: FieldDiff) => e.field)
        }
      });
    }

    // Record review decision audit event
    const auditAction = decision === 'REJECTED' ? 'HUMAN_REJECTED' : 'HUMAN_APPROVED';
    recordAuditEvent({
      caseId: id,
      actor: { id: reviewerId, role: 'REVIEWER', displayName: reviewerName },
      action: auditAction,
      resource: `case_${id}/review`,
      dataAccessed: typedEdits.map((e: FieldDiff) => e.field),
      details: {
        decision,
        hasEdits: typedEdits.length > 0,
        hasReason: Boolean(reason)
      }
    });

    await saveCase(targetCase);

    return NextResponse.json({ success: true, case: targetCase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
