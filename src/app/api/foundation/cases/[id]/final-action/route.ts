import { NextResponse } from 'next/server';
import { getCaseById, saveCase } from '@/foundation/store';
import { recordAuditEvent } from '@/foundation/audit';
import { FinalAction } from '@/foundation/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type = 'DISPOSITION_RECORDED',
      performedBy = 'clinician_lead',
      summary = 'Case disposition recorded following clinical review'
    } = body;

    const targetCase = getCaseById(id);
    if (!targetCase) {
      return NextResponse.json({ error: `Case "${id}" not found` }, { status: 404 });
    }

    // AI output is ALWAYS a draft. A FinalAction can only be recorded after a ReviewDecision.
    if (!targetCase.review) {
      return NextResponse.json(
        { error: 'Governance violation: A human ReviewDecision is required before recording a FinalAction.' },
        { status: 400 }
      );
    }

    if (targetCase.review.decision === 'REJECTED') {
      return NextResponse.json(
        { error: 'Cannot finalize a rejected case without re-review or override.' },
        { status: 400 }
      );
    }

    const finalAction: FinalAction = {
      type,
      performedBy,
      performedAt: new Date().toISOString(),
      summary
    };

    targetCase.finalAction = finalAction;
    targetCase.status = 'FINALIZED';

    recordAuditEvent({
      caseId: id,
      actor: { id: performedBy, role: 'REVIEWER' },
      action: 'FINAL_ACTION_RECORDED',
      resource: `case_${id}/final_action`,
      details: {
        actionType: type,
        summary
      }
    });

    await saveCase(targetCase);

    return NextResponse.json({ success: true, case: targetCase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
