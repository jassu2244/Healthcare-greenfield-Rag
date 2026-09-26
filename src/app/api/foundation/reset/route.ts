import { NextResponse } from 'next/server';
import { resetDemo } from '@/foundation/store';

export async function POST() {
  try {
    const result = await resetDemo();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
