/**
 * Seed Additional Clinical Patients directly into PostgreSQL Database
 * RelayMD — Track 04
 */
import { pool, ensureTables } from '../src/foundation/db.ts';

const NEW_PATIENTS = [
  {
    id: 'case_db_005_eleanor',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'SUBMITTED',
    metadata: {
      synthetic: true,
      title: 'Case 5: Severe Inpatient Urosepsis (Eleanor Vance)',
      description: 'Acute sepsis bundle evaluation for 64yo female with suspected pyelonephritis, hypotension, and elevated lactate.',
      category: 'sepsis_intake'
    },
    inputs: [
      {
        id: 'inp_005_name',
        fieldKey: 'patientName',
        label: 'Patient Full Name',
        value: 'Eleanor Vance (64yo Female)',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        sensitivity: 'HIGHLY_SENSITIVE'
      },
      {
        id: 'inp_005_role',
        fieldKey: 'userRole',
        label: 'User Clinical Role',
        value: 'PHYSICIAN',
        source: 'SYSTEM_RECORD',
        capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        sensitivity: 'LOW'
      },
      {
        id: 'inp_005_query',
        fieldKey: 'query',
        label: 'Clinical Inquiry',
        value: 'What is the recommended first-line empiric antibiotic regimen and fluid resuscitation timing for adult sepsis with suspected pyelonephritis?',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        sensitivity: 'LOW'
      },
      {
        id: 'inp_005_context',
        fieldKey: 'clinicalContext',
        label: 'Clinical Presentation Context',
        value: '64yo female admitted from ED with suspected severe bacteremia, fever 39.1°C, HR 112, BP 92/58, lactate 3.4 mmol/L. CrCl 58 mL/min. Attending Dr. Sarah Rivera requested recheck with nurse Priya.',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        sensitivity: 'SENSITIVE'
      }
    ],
    aiResults: []
  },
  {
    id: 'case_db_006_david',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    status: 'SUBMITTED',
    metadata: {
      synthetic: true,
      title: 'Case 6: Acute Decompensated Heart Failure (David Miller)',
      description: 'Cardiology inpatient admission for fluid overload and loop diuretic resistance assessment.',
      category: 'cardiology_intake'
    },
    inputs: [
      {
        id: 'inp_006_name',
        fieldKey: 'patientName',
        label: 'Patient Full Name',
        value: 'David Miller (72yo Male)',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        sensitivity: 'HIGHLY_SENSITIVE'
      },
      {
        id: 'inp_006_role',
        fieldKey: 'userRole',
        label: 'User Clinical Role',
        value: 'PHYSICIAN',
        source: 'SYSTEM_RECORD',
        capturedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        sensitivity: 'LOW'
      },
      {
        id: 'inp_006_query',
        fieldKey: 'query',
        label: 'Clinical Inquiry',
        value: 'What is the recommended intravenous loop diuretic dosing protocol and monitoring requirements for acute decompensated heart failure?',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        sensitivity: 'LOW'
      },
      {
        id: 'inp_006_context',
        fieldKey: 'clinicalContext',
        label: 'Clinical Presentation Context',
        value: '72yo male admitted with orthopnea, bilateral lower extremity pitting edema +3, BNP 1420 pg/mL. Chronic oral furosemide 40mg daily at home. Bedside nurse Priya assigned.',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        sensitivity: 'SENSITIVE'
      }
    ],
    aiResults: []
  },
  {
    id: 'case_db_007_amara',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'SUBMITTED',
    metadata: {
      synthetic: true,
      title: 'Case 7: Severe CAP with Penicillin Anaphylaxis (Amara Okafor)',
      description: 'Pulmonology admission for severe pneumonia requiring beta-lactam sparing therapy.',
      category: 'pulmonology_intake'
    },
    inputs: [
      {
        id: 'inp_007_name',
        fieldKey: 'patientName',
        label: 'Patient Full Name',
        value: 'Amara Okafor (51yo Female)',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000).toISOString(),
        sensitivity: 'HIGHLY_SENSITIVE'
      },
      {
        id: 'inp_007_role',
        fieldKey: 'userRole',
        label: 'User Clinical Role',
        value: 'PHYSICIAN',
        source: 'SYSTEM_RECORD',
        capturedAt: new Date(Date.now() - 3600000).toISOString(),
        sensitivity: 'LOW'
      },
      {
        id: 'inp_007_query',
        fieldKey: 'query',
        label: 'Clinical Inquiry',
        value: 'What is the first-line inpatient antimicrobial coverage for severe community-acquired pneumonia in a patient with severe penicillin anaphylaxis?',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000).toISOString(),
        sensitivity: 'LOW'
      },
      {
        id: 'inp_007_context',
        fieldKey: 'clinicalContext',
        label: 'Clinical Presentation Context',
        value: '51yo female presenting with severe cough, productive rust-colored sputum, SpO2 89% room air, WBC 16.2k. Documented penicillin anaphylaxis (respiratory arrest). Nurse Priya on shift.',
        source: 'CLINICIAN_ENTERED',
        capturedAt: new Date(Date.now() - 3600000).toISOString(),
        sensitivity: 'SENSITIVE'
      }
    ],
    aiResults: []
  }
];

async function seed() {
  console.log('[SEED] Connecting to PostgreSQL database...');
  await ensureTables();

  console.log('[SEED] Inserting patient cases directly into PostgreSQL...');
  for (const patient of NEW_PATIENTS) {
    await pool.query(
      `INSERT INTO cases (id, created_at, status, inputs, ai_results, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         inputs = EXCLUDED.inputs,
         ai_results = EXCLUDED.ai_results,
         metadata = EXCLUDED.metadata`,
      [
        patient.id,
        patient.createdAt,
        patient.status,
        JSON.stringify(patient.inputs),
        JSON.stringify(patient.aiResults),
        JSON.stringify(patient.metadata)
      ]
    );
    console.log(`  ✓ Inserted into PostgreSQL: ${patient.metadata.title} (${patient.id})`);
  }

  const countRes = await pool.query('SELECT count(*) as total FROM cases');
  console.log(`[SEED] Total Patient Cases now in PostgreSQL database: ${countRes.rows[0].total}`);

  await pool.end();
  console.log('[SEED] Database connection closed successfully.');
}

seed().catch((err) => {
  console.error('[SEED] Failed:', err);
  process.exit(1);
});
