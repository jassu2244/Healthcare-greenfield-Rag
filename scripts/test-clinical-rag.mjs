/**
 * Test Suite: ClinicalRelay RAG (Track 04 P-02)
 * Tests retrieval-stage RBAC, contradiction surfacing, grounded citations,
 * loud refusal, prompt injection defense, and cryptographic audit chaining.
 */

import { retrieveClinicalPassages } from '../src/foundation/retrieval.ts';
import { getTaskDefinition } from '../src/foundation/task-registry.ts';
import { SYNTHETIC_CASES } from '../src/foundation/fixtures.ts';
import { clearAuditEvents, recordAuditEvent, verifyAuditChain, exportAuditTrail } from '../src/foundation/audit.ts';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ${GREEN}✓ PASS:${RESET} ${message}`);
    passed++;
  }
}

console.log(`\n${BOLD}=== RUNNING CLINICALRELAY RAG ACCEPTANCE TESTS (P-02) ===${RESET}\n`);

// 1. Task Definition Exists
console.log(`${BOLD}Test 1: Task Registry Verification${RESET}`);
const ragTask = getTaskDefinition('clinical_enterprise_rag');
assert(Boolean(ragTask), 'clinical_enterprise_rag task is registered in registry');
assert(ragTask.promptVersion === 'v2.0.0-rag', 'Prompt version is v2.0.0-rag');
assert(ragTask.allowedInputFields.includes('query'), 'Allowed input fields include query');

// 2. Happy Path Retrieval & Grounded Citations
console.log(`\n${BOLD}Test 2: Happy Path Retrieval & Grounded 1-Click Citations${RESET}`);
{
  const case1 = SYNTHETIC_CASES[0];
  const query = case1.inputs.find(i => i.fieldKey === 'query').value;
  const mockOutput = ragTask.mockGenerator({ query, userRole: 'PHYSICIAN' });
  const validation = ragTask.validateOutput(mockOutput);

  assert(validation.valid, 'Happy path output strictly validates against ClinicalRAGOutput schema');
  assert(mockOutput.isRefusal === false, 'Happy path does not trigger refusal');
  assert(mockOutput.citations.length >= 2, 'Happy path produces at least 2 grounded citations');
  assert(mockOutput.citations.some(c => c.clauseOrRow.includes('Guideline-2024')), 'Cites 2024 Sepsis Guideline');
  assert(mockOutput.citations.some(c => c.clauseOrRow.includes('Row 1') || c.documentTitle.includes('Formulary')), 'Cites Antimicrobial Formulary Table');
  assert(mockOutput.uncertainty === 'LOW', 'Happy path yields LOW uncertainty');
}

// 3. Explicit Contradiction Detection (2021 vs 2024 Sepsis Protocol)
console.log(`\n${BOLD}Test 3: Cross-Version Guideline Contradiction Surfacing${RESET}`);
{
  const case2 = SYNTHETIC_CASES[1];
  const query = case2.inputs.find(i => i.fieldKey === 'query').value;
  const mockOutput = ragTask.mockGenerator({ query, userRole: 'PHYSICIAN' });

  assert(mockOutput.contradictions.length > 0, 'Explicitly flags guideline contradiction');
  assert(mockOutput.contradictions[0].sources.length === 2, 'Lists both conflicting guideline sources');
  assert(mockOutput.contradictions[0].guidance.includes('SUPERSEDED') || mockOutput.contradictions[0].guidance.includes('deprecated'), 'Provides supersession resolution guidance');
  assert(mockOutput.citations.some(c => c.clauseOrRow.includes('SUPERSEDED')), 'Includes citation to superseded clause for transparency');
}

// 4. Loud Refusal on Insufficient Evidence
console.log(`\n${BOLD}Test 4: Loud Clinical Refusal on Evidence Gaps${RESET}`);
{
  const case3 = SYNTHETIC_CASES[2];
  const query = case3.inputs.find(i => i.fieldKey === 'query').value;
  const mockOutput = ragTask.mockGenerator({ query, userRole: 'PHYSICIAN' });

  assert(mockOutput.isRefusal === true, 'Refusal is triggered loudly');
  assert(Boolean(mockOutput.refusalReason), 'Refusal reason explains lack of validated evidence');
  assert(mockOutput.missingInformation.length >= 2, 'Enumerates missing clinical trial & formulary data');
  assert(mockOutput.uncertainty === 'HIGH', 'Uncertainty is rated HIGH');
}

// 5. Retrieval-Stage RBAC & Delimiter Defense
console.log(`\n${BOLD}Test 5: Retrieval-Stage RBAC & Prompt Containment${RESET}`);
{
  const case4 = SYNTHETIC_CASES[3];
  const query = case4.inputs.find(i => i.fieldKey === 'query').value;
  const notes = case4.inputs.find(i => i.fieldKey === 'notes').value;
  
  // Test retrieval engine directly
  const retrieval = retrieveClinicalPassages(query, { userRole: 'NURSE' });
  assert(retrieval.blockedPassages.length > 0, 'Retrieval engine blocks restricted document for role NURSE');
  assert(retrieval.blockedPassages.some(p => p.docId === 'doc_restricted_icu_narcotics'), 'ICU SEC-901 policy is withheld from passages');

  // Test mock generator handling
  const mockOutput = ragTask.mockGenerator({ query, userRole: 'NURSE', notes });
  assert(mockOutput.isRefusal === true, 'Access boundary violation triggers refusal');
  assert(mockOutput.warnings.some(w => w.includes('CREDENTIAL BOUNDARY') || w.includes('SECURITY ALERT')), 'Warns about credential boundary and prompt injection');
  assert(Boolean(mockOutput.accessBoundaryNotice), 'Provides access boundary notice');
}

// 6. Cryptographic SHA-256 Audit Trail
console.log(`\n${BOLD}Test 6: Tamper-Evident SHA-256 Audit Chain${RESET}`);
{
  clearAuditEvents();
  const caseId = 'case_test_audit_001';

  recordAuditEvent({
    caseId,
    actor: { id: 'clinician_1', role: 'PHYSICIAN', displayName: 'Dr. Rivera' },
    action: 'QUERY_SUBMITTED',
    resource: 'query_sepsis_001',
    dataAccessed: ['query', 'clinicalContext'],
    details: { query: 'First-line empiric sepsis' }
  });

  recordAuditEvent({
    caseId,
    actor: { id: 'system_rag', role: 'AI_SYSTEM', displayName: 'ClinicalRelay Engine' },
    action: 'RETRIEVAL_FILTERED',
    resource: 'corpus_index',
    dataAccessed: ['doc_guideline_sepsis_2024', 'doc_formulary_table_2024'],
    details: { passagesRetrieved: 3, roleEnforced: 'PHYSICIAN' }
  });

  recordAuditEvent({
    caseId,
    actor: { id: 'system_rag', role: 'AI_SYSTEM', displayName: 'ClinicalRelay Engine' },
    action: 'AI_RESULT_GENERATED',
    resource: 'envelope_001',
    dataAccessed: ['citations', 'contradictions'],
    details: { citationsCount: 3, uncertainty: 'LOW' }
  });

  recordAuditEvent({
    caseId,
    actor: { id: 'clinician_lead', role: 'REVIEWER', displayName: 'Dr. Vance' },
    action: 'HUMAN_APPROVED',
    resource: 'review_001',
    dataAccessed: [],
    details: { decision: 'APPROVED' }
  });

  recordAuditEvent({
    caseId,
    actor: { id: 'clinician_lead', role: 'REVIEWER', displayName: 'Dr. Vance' },
    action: 'FINAL_ACTION_RECORDED',
    resource: 'final_order_001',
    dataAccessed: [],
    details: { actionType: 'CLINICAL_ORDER_APPROVED' }
  });

  const verification = verifyAuditChain(caseId);
  assert(verification.valid === true, 'Audit chain passes cryptographic SHA-256 hash verification');
  assert(verification.eventCount === 5, 'Exact sequence of 5 events verified');

  const bundle = exportAuditTrail(caseId);
  assert(bundle.events.length === 5, 'Export bundle includes all 5 events');
  assert(bundle.verification.valid === true, 'Export bundle includes verified integrity stamp');
}

console.log(`\n=========================================`);
console.log(`  Tests Passed: ${passed} | Tests Failed: ${failed}`);
console.log(`=========================================\n`);
console.log(`ALL CLINICALRELAY RAG TESTS PASSED CLEANLY.\n`);
