/**
 * Core Domain Types — Antigravity Healthcare Foundation
 * Generic, domain-agnostic foundation types for healthcare workflows.
 */

export type Role = 'SUBMITTER' | 'REVIEWER' | 'AI_SYSTEM' | 'SYSTEM' | string;

export interface Actor {
  id: string;
  role: Role;
  displayName: string;
}

export type CaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AI_PROCESSING'
  | 'AI_COMPLETE'
  | 'AI_FAILED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'FINALIZED';

export type InputSource =
  | 'PATIENT_REPORTED'
  | 'CLINICIAN_ENTERED'
  | 'SYSTEM_RECORD'
  | 'AI_GENERATED';

export type SensitivityLevel = 'LOW' | 'SENSITIVE' | 'HIGHLY_SENSITIVE';

export interface InputRecord {
  id: string;
  fieldKey: string;
  label: string;
  value: string | number | boolean | string[];
  source: InputSource;
  capturedAt: string;
  sensitivity: SensitivityLevel;
}

export interface EvidenceItem {
  id: string;
  label: string;
  sourceType: string;
  sourceRef: string;
  excerpt?: string;
  capturedAt?: string;
  usedFor: string;
}

export type UncertaintyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AIMeta {
  mode: 'LIVE' | 'MOCK' | 'FALLBACK';
  provider: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  generatedAt: string;
  latencyMs: number;
  inputFieldsSent: string[];
  fallbackReason?: string;
}

export interface AIResultEnvelope<T = Record<string, any>> {
  id: string;
  taskName: string;
  output: T;
  evidence: EvidenceItem[];
  warnings: string[];
  missingInformation: string[];
  uncertainty: UncertaintyLevel;
  meta: AIMeta;
}

export interface FieldDiff {
  field: string;
  aiValue: any;
  humanValue: any;
}

export type ReviewDecisionType = 'APPROVED' | 'EDITED_AND_APPROVED' | 'REJECTED';

export interface ReviewDecision {
  reviewerId: string;
  decision: ReviewDecisionType;
  edits: FieldDiff[];
  reason?: string;
  decidedAt: string;
}

export interface FinalAction {
  type: string;
  performedBy: string;
  performedAt: string;
  summary: string;
}

export type AuditAction =
  | 'CASE_CREATED'
  | 'INPUT_SUBMITTED'
  | 'RECORD_VIEWED'
  | 'AI_DATA_ACCESSED'
  | 'AI_REQUESTED'
  | 'AI_RESULT_GENERATED'
  | 'AI_FALLBACK_USED'
  | 'AI_OUTPUT_REJECTED'
  | 'HUMAN_REVIEW_STARTED'
  | 'HUMAN_EDITED'
  | 'HUMAN_APPROVED'
  | 'HUMAN_REJECTED'
  | 'FINAL_ACTION_RECORDED'
  | 'AUDIT_EXPORTED'
  | 'DEMO_RESET'
  | string;

export interface AuditEvent {
  eventId: string;
  sequence: number;
  timestamp: string;
  caseId: string;
  actor: {
    id: string;
    role: Role;
    displayName?: string;
  };
  action: AuditAction;
  resource: string;
  dataAccessed: string[]; // Field keys ONLY — NEVER raw values
  ai?: {
    mode: 'LIVE' | 'MOCK' | 'FALLBACK';
    provider: string;
    model: string;
    promptVersion: string;
  };
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details: Record<string, any>; // Non-sensitive metadata only
  prevHash: string;
  hash: string;
}

export interface Case {
  id: string;
  createdAt: string;
  status: CaseStatus;
  inputs: InputRecord[];
  aiResults: AIResultEnvelope[];
  review?: ReviewDecision;
  finalAction?: FinalAction;
  metadata?: {
    synthetic: boolean;
    title?: string;
    description?: string;
    category?: string;
  };
}

export interface SchemaValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

export interface TaskDefinition<TOutput = any> {
  name: string;
  description: string;
  promptVersion: string;
  schemaVersion: string;
  allowedInputFields: string[]; // Explicit data minimization allow-list
  systemPrompt: string;
  buildUserPrompt: (minimizedInput: Record<string, any>) => string;
  validateOutput: (rawOutput: any) => SchemaValidationResult<TOutput>;
  mockGenerator: (minimizedInput: Record<string, any>) => TOutput;
  evidenceMapper: (minimizedInput: Record<string, any>, output: TOutput) => EvidenceItem[];
}

// ==========================================
// Track 04 P-02: Enterprise Clinical RAG Types
// ==========================================

export type CorpusDocType = 'guideline' | 'sop' | 'formulary_table' | 'restricted_policy';
export type DocumentAccessLevel = 'PUBLIC_CLINICAL' | 'CLINICAL_STAFF' | 'RESTRICTED_ATTENDING';

export interface CorpusSection {
  id: string;
  heading: string;
  text: string;
  clauseNumber?: string;
  tableData?: Record<string, string>[];
}

export interface CorpusDocument {
  id: string;
  title: string;
  docType: CorpusDocType;
  version: string;
  effectiveDate: string;
  isSuperseded?: boolean;
  supersedingDocId?: string;
  accessLevel: DocumentAccessLevel;
  minRequiredRole: string[]; // Allowed roles e.g. ['Physician', 'Pharmacist']
  summary: string;
  sections: CorpusSection[];
}

export interface RetrievedPassage {
  passageId: string;
  docId: string;
  docTitle: string;
  sectionHeading: string;
  clauseOrRow: string;
  text: string;
  score: number;
  accessGranted: boolean;
  denialReason?: string;
  isSuperseded?: boolean;
}

export interface ContradictionItem {
  conflict: string;
  sources: string[];
  guidance: string;
}

export interface CitationItem {
  passageId: string;
  documentTitle: string;
  clauseOrRow: string;
  excerpt: string;
}

export interface ClinicalRAGOutput {
  summary: string;
  keyInformation: string[];
  suggestedNextStep: string;
  contradictions: ContradictionItem[];
  citations: CitationItem[];
  isRefusal: boolean;
  refusalReason?: string;
  warnings: string[];
  missingInformation: string[];
  uncertainty: UncertaintyLevel;
  accessBoundaryNotice?: string;
}

export interface PrescriptionRecord {
  id: string;
  caseId: string;
  patientName: string;
  medication: string;
  dosage: string;
  instructions: string;
  prescribedBy: string;
  prescribedAt: string;
  status: 'PENDING_ADMINISTRATION' | 'ADMINISTERED';
  administeredBy?: string;
  administeredAt?: string;
  sha256Seal: string;
}
