import fs from 'fs';
import path from 'path';
import { clearAuditEvents, recordAuditEvent, exportAuditTrail } from '../src/foundation/audit.ts';

clearAuditEvents();
const caseId = 'case_rag_001_happy';

// Step 1: Intake
recordAuditEvent({
  caseId,
  actor: { id: 'clinician_chen', role: 'PHYSICIAN', displayName: 'Dr. Robert Chen' },
  action: 'CASE_CREATED',
  resource: 'case_rag_001_happy',
  dataAccessed: ['patientName', 'query', 'clinicalContext'],
  details: { patientRef: 'PATIENT_REF_001', category: 'happy_path' }
});

// Step 2: Query submission
recordAuditEvent({
  caseId,
  actor: { id: 'clinician_chen', role: 'PHYSICIAN', displayName: 'Dr. Robert Chen' },
  action: 'QUERY_SUBMITTED',
  resource: 'query_sepsis_firstline',
  dataAccessed: ['query'],
  details: { topic: 'Sepsis initial empiric antibiotic coverage & fluid bolus' }
});

// Step 3: RBAC Access Control
recordAuditEvent({
  caseId,
  actor: { id: 'system_retrieval_guard', role: 'SYSTEM', displayName: 'Enterprise RBAC Guard' },
  action: 'ACCESS_CONTROL_ENFORCED',
  resource: 'corpus_access_boundary',
  dataAccessed: ['userRole'],
  details: { roleEnforced: 'PHYSICIAN', totalCorpusDocs: 5, authorizedDocs: 5, blockedDocs: 0 }
});

// Step 4: Retrieval & Filtering
recordAuditEvent({
  caseId,
  actor: { id: 'system_retriever', role: 'SYSTEM', displayName: 'ClinicalRelay Retriever' },
  action: 'RETRIEVAL_FILTERED',
  resource: 'corpus_hybrid_index',
  dataAccessed: ['doc_guideline_sepsis_2024', 'doc_formulary_table_2024', 'doc_sop_ed_triage'],
  details: { passagesRetrieved: 4, topClause: 'Guideline-2024-1.1' }
});

// Step 5: AI Data Minimization
recordAuditEvent({
  caseId,
  actor: { id: 'system_minimizer', role: 'SYSTEM', displayName: 'Data Minimizer' },
  action: 'AI_DATA_ACCESSED',
  resource: 'ai_prompt_builder',
  dataAccessed: ['query', 'clinicalContext', 'userRole'],
  details: { allowedFieldsCount: 3, withheldFieldsCount: 3 }
});

// Step 6: AI Generation
recordAuditEvent({
  caseId,
  actor: { id: 'ai_engine', role: 'AI_SYSTEM', displayName: 'ClinicalRelay Engine' },
  action: 'AI_RESULT_GENERATED',
  resource: 'ai_result_envelope_001',
  dataAccessed: ['citations', 'summary', 'keyInformation'],
  ai: { mode: 'MOCK', provider: 'deterministic_mock', model: 'clinical_enterprise_rag', promptVersion: 'v2.0.0-rag' },
  details: { citationsCount: 4, contradictionsFound: 0, isRefusal: false, uncertainty: 'LOW', latencyMs: 280 }
});

// Step 7: Clinician Review Started
recordAuditEvent({
  caseId,
  actor: { id: 'clinician_lead', role: 'REVIEWER', displayName: 'Dr. Sarah Vance (Attending Reviewer)' },
  action: 'HUMAN_REVIEW_STARTED',
  resource: 'review_panel_001',
  dataAccessed: ['summary', 'citations', 'suggestedNextStep'],
  details: { mode: 'interactive_diff' }
});

// Step 8: Clinician Edited
recordAuditEvent({
  caseId,
  actor: { id: 'clinician_lead', role: 'REVIEWER', displayName: 'Dr. Sarah Vance (Attending Reviewer)' },
  action: 'HUMAN_EDITED',
  resource: 'review_edits_001',
  dataAccessed: ['suggestedNextStep'],
  details: { fieldEdited: 'suggestedNextStep', diffApplied: 'Added explicit stat lactate remeasurement at 2h window' }
});

// Step 9: Clinician Approved
recordAuditEvent({
  caseId,
  actor: { id: 'clinician_lead', role: 'REVIEWER', displayName: 'Dr. Sarah Vance (Attending Reviewer)' },
  action: 'HUMAN_APPROVED',
  resource: 'review_decision_001',
  dataAccessed: [],
  details: { decision: 'EDITED_AND_APPROVED', reason: 'Verified against 2024 Sepsis Guideline section 1.1 and Antimicrobial Formulary Table 1.' }
});

// Step 10: Final Clinical Action Recorded
recordAuditEvent({
  caseId,
  actor: { id: 'clinician_lead', role: 'REVIEWER', displayName: 'Dr. Sarah Vance (Attending Reviewer)' },
  action: 'FINAL_ACTION_RECORDED',
  resource: 'order_bundle_sepsis_001',
  dataAccessed: [],
  details: { actionType: 'CLINICAL_ORDER_APPROVED', summary: 'Piperacillin-Tazobactam 4.5g IV q8h + Vancomycin AUC load + 30mL/kg crystalloids authorized.' }
});

// Step 11: Export & Verification
const bundle = exportAuditTrail(caseId);
console.log('Audit Verification Result:', bundle.verification);

const delivDir = path.join(process.cwd(), 'deliverables');
if (!fs.existsSync(delivDir)) fs.mkdirSync(delivDir, { recursive: true });

fs.writeFileSync(path.join(delivDir, 'audit-trail-clinical-sepsis-rag.json'), JSON.stringify(bundle, null, 2), 'utf-8');

let md = '# Verified Audit Trail — ClinicalRelay RAG Journey (Track 04 P-02)\n\n';
md += '- **Case Reference:** ' + caseId + '\n';
md += '- **Exported At:** ' + bundle.exportedAt + '\n';
md += '- **Chain Integrity:** ' + (bundle.verification.valid ? 'VALID (100% Cryptographically Verified)' : 'FAILED') + '\n';
md += '- **Total Chained Events:** ' + bundle.events.length + '\n\n';
md += '| Seq | Timestamp | Action | Actor | Resource | Data Accessed | Prev Hash | Event Hash |\n';
md += '|---|---|---|---|---|---|---|---|\n';

for (const e of bundle.events) {
  const pHash = e.prevHash.substring(0, 10) + '...';
  const eHash = e.hash.substring(0, 10) + '...';
  md += '| ' + e.sequence + ' | ' + e.timestamp + ' | `' + e.action + '` | ' + e.actor.displayName + ' (' + e.actor.role + ') | `' + e.resource + '` | ' + (e.dataAccessed.length > 0 ? e.dataAccessed.join(', ') : 'None') + ' | `' + pHash + '` | `' + eHash + '` |\n';
}

fs.writeFileSync(path.join(delivDir, 'audit-trail-clinical-sepsis-rag.md'), md, 'utf-8');
console.log('Deliverables written successfully!');
