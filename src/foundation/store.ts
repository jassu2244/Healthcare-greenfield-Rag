/**
 * Case Repository & Demo Store — RelayMD Healthcare Foundation
 * PostgreSQL-backed persistence for corpus, prescriptions, cases, and doctor messages.
 * Falls back to in-memory + JSON files only if PostgreSQL is unreachable.
 */

import crypto from 'crypto';
import { pool, ensureTables } from './db';
import { Case, InputRecord, CorpusDocument, PrescriptionRecord } from './types';
import { CLINICAL_CORPUS } from './corpus';
import { getSyntheticFixtures } from './fixtures';
import { clearAuditEvents, recordAuditEvent } from './audit';
import { safeLog } from './safe-logging';

// ─── In-Memory Cache (syncs with PostgreSQL) ────────────────────────────────
let inMemoryCases: Case[] = getSyntheticFixtures();
let inMemoryCorpus: CorpusDocument[] = [...CLINICAL_CORPUS];
let inMemoryPrescriptions: PrescriptionRecord[] = [];
let dbReady = false;

// ─── Initialization ─────────────────────────────────────────────────────────

async function initializeDB(): Promise<void> {
  try {
    await ensureTables();
    dbReady = true;
    console.log('[STORE] PostgreSQL connection established.');

    // Seed corpus if empty
    const corpusCheck = await pool.query('SELECT COUNT(*) as cnt FROM corpus_documents');
    if (parseInt(corpusCheck.rows[0].cnt, 10) === 0) {
      console.log('[STORE] Seeding corpus into PostgreSQL from built-in clinical guidelines...');
      for (const doc of CLINICAL_CORPUS) {
        await insertCorpusDocToDB(doc);
      }
    }

    // Seed cases if empty
    const casesCheck = await pool.query('SELECT COUNT(*) as cnt FROM cases');
    if (parseInt(casesCheck.rows[0].cnt, 10) === 0) {
      console.log('[STORE] Seeding synthetic patient fixtures into PostgreSQL...');
      const fixtures = getSyntheticFixtures();
      for (const c of fixtures) {
        await insertCaseToDB(c);
      }
    }

    // Load everything into memory cache for fast reads
    await refreshMemoryCacheFromDB();
  } catch (err) {
    console.error('[STORE] PostgreSQL init failed, falling back to in-memory:', err);
    dbReady = false;
    // Fallback: load from static data
    inMemoryCases = getSyntheticFixtures();
    inMemoryCorpus = [...CLINICAL_CORPUS];
    inMemoryPrescriptions = [];
  }
}

async function refreshMemoryCacheFromDB(): Promise<void> {
  if (!dbReady) return;
  try {
    const [corpusRes, casesRes, rxRes] = await Promise.all([
      pool.query('SELECT * FROM corpus_documents ORDER BY created_at ASC'),
      pool.query('SELECT * FROM cases ORDER BY created_at DESC'),
      pool.query('SELECT * FROM prescriptions ORDER BY created_at DESC'),
    ]);

    inMemoryCorpus = corpusRes.rows.map(rowToCorpusDocument);
    inMemoryCases = casesRes.rows.map(rowToCase);
    inMemoryPrescriptions = rxRes.rows.map(rowToPrescription);
  } catch (err) {
    console.error('[STORE] Failed to refresh cache from DB:', err);
  }
}

// ─── Row ↔ Object Mappers ───────────────────────────────────────────────────

function rowToCorpusDocument(row: any): CorpusDocument {
  return {
    id: row.id,
    title: row.title,
    docType: row.doc_type,
    version: row.version,
    effectiveDate: row.effective_date || '',
    isSuperseded: row.is_superseded || false,
    supersedingDocId: row.superseding_doc || undefined,
    accessLevel: row.access_level,
    minRequiredRole: row.min_required_role || [],
    summary: row.summary || '',
    sections: row.sections || [],
  };
}

function rowToCase(row: any): Case {
  return {
    id: row.id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    status: row.status,
    inputs: row.inputs || [],
    aiResults: row.ai_results || [],
    review: row.review || undefined,
    finalAction: row.final_action || undefined,
    metadata: row.metadata || undefined,
  };
}

function rowToPrescription(row: any): PrescriptionRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    patientName: row.patient_name,
    medication: row.medication,
    dosage: row.dosage,
    instructions: row.instructions || '',
    prescribedBy: row.prescribed_by,
    prescribedAt: row.prescribed_at instanceof Date ? row.prescribed_at.toISOString() : row.prescribed_at,
    status: row.status,
    administeredBy: row.administered_by || undefined,
    administeredAt: row.administered_at instanceof Date ? row.administered_at.toISOString() : (row.administered_at || undefined),
    sha256Seal: row.sha256_seal,
  };
}

// ─── DB Insert Helpers ──────────────────────────────────────────────────────

async function insertCorpusDocToDB(doc: CorpusDocument): Promise<void> {
  await pool.query(
    `INSERT INTO corpus_documents (id, title, doc_type, version, effective_date, is_superseded, superseding_doc, access_level, min_required_role, summary, sections)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO NOTHING`,
    [
      doc.id,
      doc.title,
      doc.docType,
      doc.version,
      doc.effectiveDate || null,
      doc.isSuperseded || false,
      doc.supersedingDocId || null,
      doc.accessLevel,
      doc.minRequiredRole,
      doc.summary || '',
      JSON.stringify(doc.sections),
    ]
  );
}

async function insertCaseToDB(c: Case): Promise<void> {
  await pool.query(
    `INSERT INTO cases (id, created_at, status, inputs, ai_results, review, final_action, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      c.id,
      c.createdAt,
      c.status,
      JSON.stringify(c.inputs),
      JSON.stringify(c.aiResults),
      c.review ? JSON.stringify(c.review) : null,
      c.finalAction ? JSON.stringify(c.finalAction) : null,
      c.metadata ? JSON.stringify(c.metadata) : null,
    ]
  );
}

async function insertPrescriptionToDB(rx: PrescriptionRecord): Promise<void> {
  await pool.query(
    `INSERT INTO prescriptions (id, case_id, patient_name, medication, dosage, instructions, prescribed_by, prescribed_at, status, administered_by, administered_at, sha256_seal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO NOTHING`,
    [
      rx.id,
      rx.caseId,
      rx.patientName,
      rx.medication,
      rx.dosage,
      rx.instructions,
      rx.prescribedBy,
      rx.prescribedAt,
      rx.status,
      rx.administeredBy || null,
      rx.administeredAt || null,
      rx.sha256Seal,
    ]
  );
}

// ─── Kick off initialization ────────────────────────────────────────────────
const initPromise = initializeDB();

// Helper to ensure DB is initialized before any read/write
async function waitForInit(): Promise<void> {
  await initPromise;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API — Corpus Documents (Hospital Guidelines / Extracted PDFs)
// ═══════════════════════════════════════════════════════════════════════════

export function getAllCorpusDocs(): CorpusDocument[] {
  return [...inMemoryCorpus];
}

export async function getAllCorpusDocsAsync(): Promise<CorpusDocument[]> {
  await waitForInit();
  if (dbReady) {
    const res = await pool.query('SELECT * FROM corpus_documents ORDER BY created_at ASC');
    return res.rows.map(rowToCorpusDocument);
  }
  return [...inMemoryCorpus];
}

export async function addCorpusDocument(docData: {
  title: string;
  docType?: 'guideline' | 'sop' | 'formulary_table' | 'restricted_policy';
  version?: string;
  accessLevel?: 'PUBLIC_CLINICAL' | 'CLINICAL_STAFF' | 'RESTRICTED_ATTENDING';
  minRequiredRole?: string[];
  summary?: string;
  content: string;
  clauseNumber?: string;
}): Promise<CorpusDocument> {
  await waitForInit();

  const id = `doc_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const title = docData.title.trim() || 'Custom Hospital Clinical Guideline';
  const clauseNumber = docData.clauseNumber?.trim() || `Guideline-User-${Date.now().toString().slice(-4)}`;
  const textContent = docData.content.trim();

  const newDoc: CorpusDocument = {
    id,
    title,
    docType: docData.docType || 'guideline',
    version: docData.version || 'v1.0-Ingested',
    effectiveDate: new Date().toISOString().split('T')[0],
    isSuperseded: false,
    accessLevel: docData.accessLevel || 'CLINICAL_STAFF',
    minRequiredRole: docData.minRequiredRole && docData.minRequiredRole.length > 0
      ? docData.minRequiredRole
      : ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'],
    summary: docData.summary || textContent.slice(0, 160) + '...',
    sections: [
      {
        id: `sec_1_${id}`,
        heading: 'Clinical Protocol & Administration Rules',
        clauseNumber,
        text: textContent,
      },
    ],
  };

  // Write to PostgreSQL
  if (dbReady) {
    await insertCorpusDocToDB(newDoc);
  }

  // Update in-memory cache
  inMemoryCorpus.push(newDoc);

  safeLog('CORPUS_DOCUMENT_INGESTED', { docId: newDoc.id, title: newDoc.title, storedIn: dbReady ? 'PostgreSQL' : 'in-memory' });
  return newDoc;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API — Prescriptions (Doctor Orders → Nurse Administration)
// ═══════════════════════════════════════════════════════════════════════════

export function getAllPrescriptions(): PrescriptionRecord[] {
  return [...inMemoryPrescriptions];
}

export function getPrescriptionsForCase(caseId: string): PrescriptionRecord[] {
  return inMemoryPrescriptions.filter((p) => p.caseId === caseId);
}

export async function getPrescriptionsForCaseAsync(caseId: string): Promise<PrescriptionRecord[]> {
  await waitForInit();
  if (dbReady) {
    const res = await pool.query(
      'SELECT * FROM prescriptions WHERE case_id = $1 ORDER BY created_at DESC',
      [caseId]
    );
    return res.rows.map(rowToPrescription);
  }
  return inMemoryPrescriptions.filter((p) => p.caseId === caseId);
}

export async function createPrescription(data: {
  caseId: string;
  patientName: string;
  medication: string;
  dosage: string;
  instructions: string;
  prescribedBy: string;
}): Promise<PrescriptionRecord> {
  await waitForInit();

  const id = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const prescribedAt = new Date().toISOString();
  const rawSeal = `${id}|${data.caseId}|${data.medication}|${data.dosage}|${data.prescribedBy}|${prescribedAt}`;
  const sha256Seal = crypto.createHash('sha256').update(rawSeal).digest('hex');

  const newRx: PrescriptionRecord = {
    id,
    caseId: data.caseId,
    patientName: data.patientName,
    medication: data.medication,
    dosage: data.dosage,
    instructions: data.instructions,
    prescribedBy: data.prescribedBy,
    prescribedAt,
    status: 'PENDING_ADMINISTRATION',
    sha256Seal,
  };

  // Write to PostgreSQL
  if (dbReady) {
    await insertPrescriptionToDB(newRx);

    // Also write a single authoritative doctor message for the assigned nurse
    const targetCase = inMemoryCases.find((c) => c.id === data.caseId);
    const clinicalContext = (targetCase?.inputs.find((i) => i.fieldKey === 'clinicalContext')?.value as string) || '';
    let targetNurse = 'Nurse Priya Sharma, RN';
    const nurseMatch = clinicalContext.match(/nurse\s+([A-Za-z]+)/i);
    if (nurseMatch) {
      const rawName = nurseMatch[1];
      targetNurse = rawName.toLowerCase() === 'priya' ? 'Nurse Priya Sharma, RN' : `Nurse ${rawName}, RN`;
    }

    await pool.query(
      `INSERT INTO doctor_messages (case_id, patient_name, doctor_name, target_nurse, message, message_type, prescription_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.caseId,
        data.patientName,
        data.prescribedBy,
        targetNurse,
        `Prescription Order: ${data.medication} — ${data.dosage}. ${data.instructions}`,
        'PRESCRIPTION_ORDER',
        id,
      ]
    );
  }

  inMemoryPrescriptions.unshift(newRx);

  recordAuditEvent({
    caseId: data.caseId,
    actor: { id: 'physician_actor', role: 'PHYSICIAN', displayName: data.prescribedBy },
    action: 'PRESCRIPTION_ORDERED_DB',
    resource: id,
    details: { medication: data.medication, dosage: data.dosage, sha256Seal: sha256Seal.slice(0, 10) + '...', storage: dbReady ? 'PostgreSQL' : 'in-memory' },
  });

  return newRx;
}

export async function administerPrescription(rxId: string, administeredBy: string, notes?: string): Promise<PrescriptionRecord | undefined> {
  await waitForInit();

  const administeredAt = new Date().toISOString();

  // Update PostgreSQL
  if (dbReady) {
    await pool.query(
      `UPDATE prescriptions SET status = 'ADMINISTERED', administered_by = $1, administered_at = $2 WHERE id = $3`,
      [administeredBy, administeredAt, rxId]
    );
  }

  // Update in-memory
  const rx = inMemoryPrescriptions.find((p) => p.id === rxId);
  if (rx) {
    rx.status = 'ADMINISTERED';
    rx.administeredBy = administeredBy;
    rx.administeredAt = administeredAt;

    recordAuditEvent({
      caseId: rx.caseId,
      actor: { id: 'nurse_actor', role: 'NURSE', displayName: administeredBy },
      action: 'MEDICATION_ADMINISTERED_DB',
      resource: rx.id,
      details: { medication: rx.medication, dosage: rx.dosage, administeredAt, notes: notes || '' },
    });
  } else if (dbReady) {
    // Load from DB if not in memory
    const res = await pool.query('SELECT * FROM prescriptions WHERE id = $1', [rxId]);
    if (res.rows.length > 0) {
      const updated = rowToPrescription(res.rows[0]);
      recordAuditEvent({
        caseId: updated.caseId,
        actor: { id: 'nurse_actor', role: 'NURSE', displayName: administeredBy },
        action: 'MEDICATION_ADMINISTERED_DB',
        resource: updated.id,
        details: { medication: updated.medication, dosage: updated.dosage, administeredAt },
      });
      return updated;
    }
  }

  return rx;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API — Doctor Messages (Doctor → Nurse Communication via DB)
// ═══════════════════════════════════════════════════════════════════════════

export interface DoctorMessage {
  id: number;
  caseId: string;
  patientName: string | null;
  doctorName: string;
  targetNurse: string;
  message: string;
  messageType: string;
  prescriptionId: string | null;
  readByNurse: boolean;
  readAt: string | null;
  createdAt: string;
}

export async function getDoctorMessagesForCase(caseId: string): Promise<DoctorMessage[]> {
  await waitForInit();
  if (!dbReady) return [];
  const res = await pool.query(
    'SELECT * FROM doctor_messages WHERE case_id = $1 ORDER BY created_at DESC',
    [caseId]
  );
  return res.rows.map((row: any) => ({
    id: row.id,
    caseId: row.case_id,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    targetNurse: row.target_nurse || 'Nurse Priya Sharma, RN',
    message: row.message,
    messageType: row.message_type,
    prescriptionId: row.prescription_id,
    readByNurse: row.read_by_nurse,
    readAt: row.read_at ? (row.read_at instanceof Date ? row.read_at.toISOString() : row.read_at) : null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }));
}

export async function getUnreadDoctorMessages(): Promise<DoctorMessage[]> {
  await waitForInit();
  if (!dbReady) return [];
  const res = await pool.query(
    'SELECT * FROM doctor_messages WHERE read_by_nurse = FALSE ORDER BY created_at DESC'
  );
  return res.rows.map((row: any) => ({
    id: row.id,
    caseId: row.case_id,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    targetNurse: row.target_nurse || 'Nurse Priya Sharma, RN',
    message: row.message,
    messageType: row.message_type,
    prescriptionId: row.prescription_id,
    readByNurse: row.read_by_nurse,
    readAt: null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }));
}

export async function markDoctorMessageRead(messageId: number): Promise<void> {
  await waitForInit();
  if (!dbReady) return;
  await pool.query(
    'UPDATE doctor_messages SET read_by_nurse = TRUE, read_at = NOW() WHERE id = $1',
    [messageId]
  );
}

export async function sendDoctorMessage(data: {
  caseId: string;
  patientName?: string;
  doctorName: string;
  targetNurse?: string;
  message: string;
  messageType?: string;
  prescriptionId?: string;
}): Promise<DoctorMessage | null> {
  await waitForInit();
  if (!dbReady) return null;
  const targetNurse = data.targetNurse || 'Nurse Priya Sharma, RN';
  const res = await pool.query(
    `INSERT INTO doctor_messages (case_id, patient_name, doctor_name, target_nurse, message, message_type, prescription_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.caseId,
      data.patientName || null,
      data.doctorName,
      targetNurse,
      data.message,
      data.messageType || 'GENERAL',
      data.prescriptionId || null,
    ]
  );
  const row = res.rows[0];
  return {
    id: row.id,
    caseId: row.case_id,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    targetNurse: row.target_nurse || targetNurse,
    message: row.message,
    messageType: row.message_type,
    prescriptionId: row.prescription_id,
    readByNurse: row.read_by_nurse,
    readAt: null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API — Patient Cases
// ═══════════════════════════════════════════════════════════════════════════

export function getAllCases(): Case[] {
  return [...inMemoryCases];
}

export async function getAllCasesAsync(): Promise<Case[]> {
  await waitForInit();
  if (dbReady) {
    const res = await pool.query('SELECT * FROM cases ORDER BY created_at DESC');
    inMemoryCases = res.rows.map(rowToCase);
    return [...inMemoryCases];
  }
  return [...inMemoryCases];
}

export function getCaseById(id: string): Case | undefined {
  return inMemoryCases.find((c) => c.id === id);
}

export async function getCaseByIdAsync(id: string): Promise<Case | undefined> {
  await waitForInit();
  if (dbReady) {
    const res = await pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      return rowToCase(res.rows[0]);
    }
  }
  return inMemoryCases.find((c) => c.id === id);
}

export async function saveCase(updatedCase: Case): Promise<Case> {
  await waitForInit();

  const index = inMemoryCases.findIndex((c) => c.id === updatedCase.id);
  if (index >= 0) {
    inMemoryCases[index] = updatedCase;
  } else {
    inMemoryCases.push(updatedCase);
  }

  // Persist to PostgreSQL
  if (dbReady) {
    await pool.query(
      `INSERT INTO cases (id, created_at, status, inputs, ai_results, review, final_action, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         inputs = EXCLUDED.inputs,
         ai_results = EXCLUDED.ai_results,
         review = EXCLUDED.review,
         final_action = EXCLUDED.final_action,
         metadata = EXCLUDED.metadata`,
      [
        updatedCase.id,
        updatedCase.createdAt,
        updatedCase.status,
        JSON.stringify(updatedCase.inputs),
        JSON.stringify(updatedCase.aiResults),
        updatedCase.review ? JSON.stringify(updatedCase.review) : null,
        updatedCase.finalAction ? JSON.stringify(updatedCase.finalAction) : null,
        updatedCase.metadata ? JSON.stringify(updatedCase.metadata) : null,
      ]
    );
  }

  return updatedCase;
}

export async function createCase(
  inputs: InputRecord[],
  metadata?: Case['metadata']
): Promise<Case> {
  await waitForInit();

  const id = `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newCase: Case = {
    id,
    createdAt: new Date().toISOString(),
    status: 'SUBMITTED',
    inputs,
    aiResults: [],
    metadata: {
      synthetic: true,
      title: metadata?.title || `Intake Case ${id.slice(-6)}`,
      description: metadata?.description || 'Custom submitted patient intake',
      category: metadata?.category || 'custom',
    },
  };

  inMemoryCases.unshift(newCase);

  if (dbReady) {
    await insertCaseToDB(newCase);
  }

  recordAuditEvent({
    caseId: id,
    actor: { id: 'patient_submitter', role: 'SUBMITTER', displayName: 'Intake Submitter' },
    action: 'CASE_CREATED',
    resource: `case_${id}`,
    dataAccessed: inputs.map((i) => i.fieldKey),
    details: { inputCount: inputs.length, synthetic: true, storage: dbReady ? 'PostgreSQL' : 'in-memory' },
  });

  return newCase;
}

// ═══════════════════════════════════════════════════════════════════════════
// Demo Reset
// ═══════════════════════════════════════════════════════════════════════════

export async function resetDemo(): Promise<{ message: string; reseededCount: number }> {
  await waitForInit();

  clearAuditEvents();

  // Clear PostgreSQL tables
  if (dbReady) {
    await pool.query('DELETE FROM doctor_messages');
    await pool.query('DELETE FROM prescriptions');
    await pool.query('DELETE FROM corpus_documents');
    await pool.query('DELETE FROM cases');
  }

  // Re-seed
  inMemoryCases = getSyntheticFixtures();
  inMemoryCorpus = [...CLINICAL_CORPUS];
  inMemoryPrescriptions = [];

  if (dbReady) {
    for (const doc of inMemoryCorpus) {
      await insertCorpusDocToDB(doc);
    }
    for (const c of inMemoryCases) {
      await insertCaseToDB(c);
    }
  }

  for (const c of inMemoryCases) {
    recordAuditEvent({
      caseId: c.id,
      actor: { id: 'demo_admin', role: 'SYSTEM', displayName: 'Demo Controller' },
      action: 'DEMO_RESET',
      resource: `case_${c.id}`,
      details: { reseededFixture: c.metadata?.title },
    });
  }

  safeLog('DEMO_RESET_TRIGGERED', { casesCount: inMemoryCases.length });

  return {
    message: 'Demo store reset to baseline synthetic fixtures successfully.',
    reseededCount: inMemoryCases.length,
  };
}

/**
 * Check if PostgreSQL is connected and healthy
 */
export function isDBReady(): boolean {
  return dbReady;
}
