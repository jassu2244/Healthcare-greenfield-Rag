import { NextResponse } from 'next/server';
import { exportAuditTrail } from '@/foundation/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auditPayload = exportAuditTrail(id);

  return new NextResponse(JSON.stringify(auditPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="audit-trail-${id}.json"`
    }
  });
}
