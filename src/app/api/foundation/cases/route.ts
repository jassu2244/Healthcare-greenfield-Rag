import { NextResponse } from 'next/server';
import { getAllCasesAsync, createCase } from '@/foundation/store';

export async function GET() {
  const cases = await getAllCasesAsync();
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputs, metadata } = body;

    if (!inputs || !Array.isArray(inputs)) {
      return NextResponse.json({ error: 'inputs array is required' }, { status: 400 });
    }

    const created = await createCase(inputs, metadata);
    return NextResponse.json({ case: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
