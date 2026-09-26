import { NextResponse } from 'next/server';
import { getAllPrescriptions, getPrescriptionsForCase, createPrescription } from '@/foundation/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    const prescriptions = caseId
      ? getPrescriptionsForCase(caseId)
      : getAllPrescriptions();

    return NextResponse.json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      caseId,
      patientName,
      medication,
      dosage,
      instructions = 'Administer per standard inpatient protocol.',
      prescribedBy = 'Dr. Sarah Rivera (Attending Physician)'
    } = body;

    if (!caseId || !medication || !dosage) {
      return NextResponse.json(
        { error: 'Fields "caseId", "medication", and "dosage" are required.' },
        { status: 400 }
      );
    }

    const prescription = await createPrescription({
      caseId,
      patientName: patientName || 'Inpatient Record',
      medication,
      dosage,
      instructions,
      prescribedBy
    });

    return NextResponse.json({
      success: true,
      message: 'Prescription recorded in PostgreSQL database with SHA-256 seal.',
      prescription
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
