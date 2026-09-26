import { NextResponse } from 'next/server';
import { getCaseById } from '@/foundation/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetCase = getCaseById(id);

  if (!targetCase) {
    return NextResponse.json({ error: `Case "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ case: targetCase });
}
