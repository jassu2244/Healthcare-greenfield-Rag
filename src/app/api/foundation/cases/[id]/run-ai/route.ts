import { NextResponse } from 'next/server';
import { getCaseById, saveCase } from '@/foundation/store';
import { runTask } from '@/foundation/ai-service';
import { Actor } from '@/foundation/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      taskName = 'clinical_enterprise_rag',
      actor = { id: 'clinician_reviewer', role: 'REVIEWER', displayName: 'Staff Reviewer' },
      forceMode,
      inputs
    } = body;

    const targetCase = getCaseById(id);
    if (!targetCase) {
      return NextResponse.json({ error: `Case "${id}" not found` }, { status: 404 });
    }

    if (inputs && Array.isArray(inputs)) {
      targetCase.inputs = inputs;
    }

    // Ensure userRole input reflects the acting role
    if (actor && actor.role) {
      const roleInp = targetCase.inputs.find((i) => i.fieldKey === 'userRole');
      if (roleInp) {
        roleInp.value = actor.role;
      }
    }

    targetCase.status = 'AI_PROCESSING';
    await saveCase(targetCase);

    const result = await runTask(taskName, targetCase, actor as Actor, { forceMode });

    targetCase.status = 'AI_COMPLETE';
    targetCase.aiResults = [result.envelope, ...targetCase.aiResults];
    await saveCase(targetCase);

    return NextResponse.json({
      success: true,
      case: targetCase,
      result: result.envelope,
      boundaryReport: result.boundaryReport
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
