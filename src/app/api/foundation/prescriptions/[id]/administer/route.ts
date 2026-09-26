import { NextResponse } from 'next/server';
import { administerPrescription } from '@/foundation/store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { administeredBy = 'Nurse Priya Sharma, RN' } = body;

    const prescription = await administerPrescription(id, administeredBy);

    if (!prescription) {
      return NextResponse.json({ error: `Prescription "${id}" not found.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Medication administration recorded in database.',
      prescription
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
