import { NextResponse } from 'next/server';
import { listAuditEvents, verifyAuditChain } from '@/foundation/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = listAuditEvents(id);
  const verification = verifyAuditChain(id, events);

  return NextResponse.json({
    caseId: id,
    events,
    verification
  });
}
