STATUS: COMPLETE
AGENT: Part B Execution Protocol fully executed. ClinicalRelay RAG delivered with passing tests, verified audit trails, and threat model.

# Live Execution Document — Track 04 "Healthcare from zero"

## 1. Clock
- **Start Time:** 2026-09-26 09:35:00 IST
- **Deadline:** 2026-09-26 15:35:00 IST (6 Hours)
- **Current Phase:** COMPLETE (Delivered)

---

## 2. Problem Statements Received
1. **P-01: Document Intelligence — Trusted Extraction from Real-World Documents**
   *Background:* Enterprises run on documents that were never designed to be read by a machine: scanned statements, photographed ID proofs, pay slips, utility bills, invoices, claim forms. Teams still open these one by one, read them, and retype the values into a system. Off-the-shelf OCR has largely solved reading the characters. What it has not solved is the question that actually blocks automation: which extracted value can be trusted without a human looking at it, and which cannot.
   *Challenge:* Build a system that ingests messy, real-world documents and produces structured, verifiable output — with an honest per-field confidence signal and a clear path for human review of everything the system is not sure about.
   *Core Requirements:* Ingest at least two document types (including low-quality sample); extract structured fields into schema (entities, amounts, dates, table); return confidence/reliability per field; flag tampering/inconsistency/duplication; cross-check values where two sources should agree; show source region/passage behind each extracted value; fail loudly.

2. **P-02: Healthcare Greenfield Enterprise RAG — Retrieval a Clinical Team Can Rely On**
   *Background:* A healthcare organisation's working knowledge is spread across clinical guidelines, internal SOPs, formularies, payer policies, device manuals and operational records. A greenfield deployment has no legacy search layer to inherit and no curated index to start from — which is an advantage, because the retrieval design can be built for the failure modes that matter here. In this domain a confident wrong answer is more expensive than no answer at all, and sources routinely contradict each other because they were written in different years by different committees.
   *Challenge:* Build an enterprise retrieval-augmented system for a healthcare organisation starting from zero — ingestion, retrieval, grounding, citation and refusal — that a clinical or operations user could interrogate and audit.
   *Core Requirements:* Ingest heterogeneous corpus (long guidelines, short policies, structured records, table-heavy source); answer natural-language questions with every claim traceable to passage in one click; handle sources that disagree by surfacing conflict rather than silently picking one; refuse or escalate when evidence is insufficient stating what was missing; respect access boundaries (RBAC/document ACLs) in retrieval path; use synthetic/de-identified data only showing no identifier leaks; measure quality on a question set.

3. **P-05: Open Innovation — Build What Matters with AI**
   *Background:* Open Innovation exists because the best problem in the room is often the one nobody thought to put on a list. Freedom to bring your own problem with higher bar on framing: proving it is real is part of submission.
   *Challenge:* Identify a real problem, show why it matters, design AI-enabled solution, demonstrate working prototype. Link between problem and AI capability must be obvious.
   *Core Requirements:* Define target user & pain point; explain current vs shortfalls; demonstrate one complete flow end-to-end; show why AI is needed; define impact metric; state dependencies; describe scaling.

---

## 3. Per-Statement Analysis

| # | Workflow | Target Users | Inputs | Outputs | Healthcare Risks | Sensitive Data | AI Opportunity | Audit Needs | Dependencies | Smallest Viable E2E Workflow |
|---|---|---|---|---|---|---|---|---|---|---|
| PS1 (P-01) | Document extraction & confidence verification | Data operators, billing clerks | Scanned forms, low-quality receipts/invoices | Structured JSON, field-level confidence, bounding boxes | Misextracted clinical dosage/charges | PII, financial identifiers, claims data | OCR post-processing, schema extraction, anomaly detection | Document ingestion, bounding box coordinates, operator edits | Heavy vision/OCR layout libraries, PDF renderers | Upload doc -> OCR extract -> review flagged fields -> export approved record |
| PS2 (P-02) | Clinical Greenfield RAG & Decision Support | Attending physicians, clinical pharmacists, triage nurses | Clinical inquiries, guideline/formulary corpus | Grounded clinical answers, passage citations, conflict warnings, refusal/missing data | Confident wrong advice, conflicting guideline recommendations | Clinician ID, patient case context, internal hospital policies | Semantic retrieval, conflict detection, grounded synthesis, refusal logic | Query logged, retrieved passage IDs, user role ACL checks, clinician verification diffs | Standard Next.js server, local embeddings / AI API, zero external DB dependencies | Clinician submits clinical query -> Access-boundary filtered retrieval -> Grounded synthesis with citations & conflicts -> Clinician reviews & diffs -> Final action signed |
| PS3 (P-05) | Open Innovation custom domain workflow | Unspecified end-users | User-defined forms or prompts | Custom generative outputs | Domain dependent (unbounded) | Varies by proposed problem | Generative AI user experience | Activity logging | Varies widely based on chosen idea | User inputs task -> AI processes -> Output reviewed -> Task completed |

---

## 4. Selection Scorecard

| # | Criterion | Weight | PS1 Score (1-5) | PS1 Wtd | PS2 Score (1-5) | PS2 Wtd | PS3 Score (1-5) | PS3 Wtd |
|---|---|---|---|---|---|---|---|---|
| 1 | Feasibility within remaining time | ×3 | 3 | 9 | 5 | 15 | 3 | 9 |
| 2 | Ability to produce a complete e2e workflow | ×3 | 4 | 12 | 5 | 15 | 3 | 9 |
| 3 | Alignment with existing foundation/architecture | ×2 | 3 | 6 | 5 | 10 | 3 | 6 |
| 4 | Strength/clarity of the healthcare workflow | ×2 | 3 | 6 | 5 | 10 | 3 | 6 |
| 5 | Meaningful AI opportunity | ×2 | 4 | 8 | 5 | 10 | 4 | 8 |
| 6 | Human-in-the-loop opportunity | ×2 | 4 | 8 | 5 | 10 | 4 | 8 |
| 7 | Auditability opportunity | ×2 | 4 | 8 | 5 | 10 | 3 | 6 |
| 8 | Privacy opportunity | ×2 | 4 | 8 | 5 | 10 | 4 | 8 |
| 9 | Demo clarity | ×2 | 4 | 8 | 5 | 10 | 3 | 6 |
| 10 | Technical feasibility | ×2 | 3 | 6 | 5 | 10 | 4 | 8 |
| 11 | Differentiation potential | ×2 | 4 | 8 | 5 | 10 | 4 | 8 |
| 12 | Dependency risk (5 = lowest risk) | ×2 | 3 | 6 | 5 | 10 | 3 | 6 |
| **TOTAL** | | | | **93** | | **130** | | **88** |

---

## 5. Disqualifiers Check
Disqualify a statement IF it requires:
- [x] Real patient data (None of the 3 strictly require real data; all can use synthetic)
- [x] Live un-mockable EHR/hospital integrations (None)
- [x] Physical hardware dependencies (None)
- [x] Proprietary datasets not in hand (PS1 image datasets might require manual gathering; PS2 uses curated healthcare guideline corpus)
- [x] Model training or fine-tuning (None)
- [x] End-to-end journey that cannot be demoed in remaining time (PS1 vision OCR tooling poses time risk)

*Selection is clear: PS2 (P-02) is not disqualified and achieves the highest score (130 / 135).*

---

## 6. Final Selected Problem
**P-02: Healthcare Greenfield Enterprise RAG — Retrieval a Clinical Team Can Rely On**

---

## 7. Selection Reasoning
Problem Statement P-02 directly aligns with the designated hackathon track ("Healthcare from zero") and perfectly matches our pre-built foundation. Our architecture was specifically engineered with an 11-step safe AI pipeline, grounded evidence provenance, explicit uncertainty levels, red-flag escalation, data boundary enforcement (RBAC access boundaries), and a cryptographic SHA-256 audit ledger. P-02 allows us to build a high-impact, clinical-grade RAG system featuring heterogeneous corpus ingestion (clinical guidelines, formulary tables, payer SOPs), one-click passage and row citations, explicit conflict resolution across contradicting guidelines, loud refusal when evidence is lacking, and retrieval-level access boundaries. This problem maximizes scoring across feasibility, clinical safety, auditability, and demo clarity without adding risky external dependencies.

---

## 8. Assumptions
1. The enterprise corpus consists of realistic, synthetic/de-identified healthcare documents: (a) Hospital Clinical Guideline (2024 vs 2021 versions showing guideline supersession), (b) Medication Formulary & Tier Pricing (table-heavy), (c) Emergency Department Triage SOP, and (d) Restricted ICU Controlled Substance Policy (requiring elevated role access).
2. The retrieval pipeline evaluates access permissions at the retrieval stage (retrieval-level RBAC), preventing unauthorized documents from ever reaching the prompt context.
3. Every claim in the synthesized answer must link directly to a specific source passage, table row, or guideline clause.
4. When documents contradict each other (e.g. 2021 vs 2024 guideline dosages), the system explicitly flags the contradiction and presents both perspectives rather than silently hallucinating or guessing.
5. Queries with insufficient evidence trigger a loud clinical refusal explaining what information was missing.
6. The entire workflow runs deterministically in `AI_MODE=mock` and natively with live LLMs via `AI_MODE=auto` or `AI_MODE=live`.

---

## 9. Target User & Roles
- **Primary Submitter / Inquirer Role:** Clinical User (Attending Physician, Clinical Pharmacist, or Triage Nurse asking complex clinical guidance questions).
- **Reviewer / Decision Maker Role:** Senior Attending / Department Head (Verifying citations, resolving guideline discrepancies, approving clinical draft notes or orders).
- **Auditor / Governance Role:** Hospital Compliance & Clinical Safety Officer (Auditing retrieval queries, passage citations, RBAC boundary enforcement, and cryptographic SHA-256 chain).

---

## 10. The ONE User Journey
**Product Name: ClinicalRelay RAG** (Trust-Grounded Enterprise Healthcare Knowledge & Audit System)
1. **Clinical Query Intake:** Clinician selects role (e.g. "Attending Physician" or "Nurse") and submits clinical inquiry (e.g., conflicting antibiotic dosing protocol or formulary tier).
2. **Access-Boundary Retrieval:** System performs role-aware retrieval, enforcing document-level ACLs before passing passages to the AI context.
3. **Grounded AI Synthesis:** System generates structured synthesis with 1-click citations, flags source contradictions (e.g., 2021 vs 2024 protocol), highlights missing information, and computes uncertainty.
4. **Loud Refusal / Escalation Verification:** For queries exceeding available evidence or restricted documents, system displays explicit clinical refusal and missing evidence breakdown.
5. **Clinician Review & Tracked Diff:** Clinician reviews citations, adjusts clinical synthesis or instructions with tracked diffs, and provides signed review decision.
6. **Authorized Clinical Action:** Clinician commits final authorized action (e.g. "Order Protocol Approved").
7. **Cryptographic Audit Chain & Export:** Verifies SHA-256 hash integrity across intake, retrieval, ACL check, AI synthesis, and human approval, offering instant JSON download.

---

## 11. MVP Scope
- **Must Have:**
  - Heterogeneous clinical corpus: (1) Long clinical guideline (Infectious Disease Sepsis Protocol), (2) Formulary table (Antibiotic tiered coverage & dosing), (3) Institutional SOP, (4) Restricted Controlled Substance ICU Policy.
  - Role-based retrieval filtering (RBAC) enforced at retrieval time (e.g., Nurse cannot retrieve Restricted ICU narcotics protocol without escalation).
  - Explicit contradiction detection surfacing conflicting guideline versions (2021 vs 2024 protocol updates).
  - Grounded passage & table row citations with 1-click inspection in UI.
  - Loud refusal with missing information disclosure when query is unsupported or out-of-scope.
  - Human review panel with tracked text diffs and mandatory rejection reason.
  - Append-only SHA-256 cryptographic audit ledger logging every query, retrieved passage, ACL check, and human decision.
  - Offline deterministic mock mode + auto fallback.
- **Nice to Have:**
  - Quality evaluation benchmark suite reporting groundedness score and citation recall across standard clinical questions.
  - Document freshness / supersession badge showing deprecated guideline warnings.
- **Explicitly Out of Scope:**
  - Live EHR HL7/FHIR server integration.
  - Autonomous clinical decision-making without clinician sign-off.
  - Vector database cloud subscription (runs zero-dependency in-memory/server-side retrieval).

---

## 12. AI Behaviour & RAG Engine
- **Task Identifier:** `clinical_enterprise_rag`
- **Retrieval Pipeline:**
  1. Heterogeneous Corpus indexed in-memory:
     - *Doc A (Guideline):* "Inpatient Sepsis Management Protocol (2024 Revision)" [Public Clinical]
     - *Doc B (Superseded Guideline):* "Inpatient Sepsis Management Protocol (2021 Historical)" [Public Clinical, Deprecated]
     - *Doc C (Table-Heavy Formulary):* "Hospital Antimicrobial Formulary & Tier Restrictions (2024 Q3)" [Clinical Staff]
     - *Doc D (Hospital SOP):* "Emergency Department Triage & Sepsis Alert Activation SOP-ED-402" [Clinical Staff]
     - *Doc E (Restricted Policy):* "ICU Controlled Substance Infusion & Monitored Sedation Policy SEC-901" [Restricted: Attending Physician & Pharmacist only; denied to General Nurse]
  2. Role-Based Access Control (RBAC) enforced at retrieval time before prompt injection.
  3. Hybrid keyword + semantic matching to retrieve relevant passages, table rows, and guideline clauses.
  4. Grounded synthesis: Every factual claim is bound to explicit passage citations.
  5. Contradiction surfacing: Compares retrieved passages (e.g., 2021 vs 2024 antibiotic dosing) and surfaces discrepancies rather than picking one silently.
  6. Refusal & Escalation: If query cannot be backed by retrieved evidence or requests restricted info, triggers explicit refusal detailing missing information.

---

## 13. AI Output Schema
```json
{
  "summary": "string",
  "keyInformation": ["string"],
  "suggestedNextStep": "string",
  "contradictions": [
    {
      "conflict": "string",
      "sources": ["string"],
      "guidance": "string"
    }
  ],
  "citations": [
    {
      "passageId": "string",
      "documentTitle": "string",
      "clauseOrRow": "string",
      "excerpt": "string"
    }
  ],
  "isRefusal": false,
  "refusalReason": "string",
  "warnings": ["string"],
  "missingInformation": ["string"],
  "uncertainty": "LOW | MEDIUM | HIGH"
}
```

---

## 14. Data Model
- `CorpusDocument`: `{ id, title, type: 'guideline' | 'sop' | 'formulary_table' | 'restricted_policy', version, effectiveDate, status: 'active' | 'superseded', minRole: 'Nurse' | 'Physician' | 'Pharmacist' | 'Admin', content, sections: { id, heading, text, rowData? }[] }`
- `Case`: `{ id, title, query, clinicalContext, userRole, status, inputFields, retrievedPassages, aiResult, review, finalAction, createdAt }`
- `RetrievedPassage`: `{ docId, docTitle, sectionId, clause, text, relevanceScore, accessGranted }`
- `EvidenceItem`: Grounded link to passage or table row with excerpt.
- `ReviewDecision`: Clinician approval, tracked diffs, or rejection with mandatory reason.
- `FinalAction`: Authorized clinical order/protocol approval recorded in audit chain.

---

## 15. Data Touchpoint Map

| Step | Data Touched | Source | Who Sees It | Sent to AI? | Stored Where | Audit Event |
|---|---|---|---|---|---|---|
| 1. Query Intake | Clinical query, patient vitals/age (de-identified) | Clinician | Clinician, System | Minimized query & clinical context only | Runtime JSON / Memory | `CASE_CREATED`, `QUERY_SUBMITTED` |
| 2. RBAC Retrieval | Corpus Documents, User Role, Document ACLs | Knowledge Base | Retrieval Engine | Only Authorized Passages (Restricted passages blocked) | In-memory index | `RETRIEVAL_FILTERED`, `ACCESS_CONTROL_ENFORCED` |
| 3. AI Generation | Minimized query + Authorized passages | AIService | Clinician Reviewer | YES (No patient identifiers, zero tool access) | Case `aiResults` | `AI_REQUESTED`, `AI_RESULT_GENERATED` |
| 4. Clinician Review | AI Draft, Citations, Contradictions, Diffs | Clinician | Clinician Reviewer | NO | Case `review` | `HUMAN_REVIEW_STARTED`, `HUMAN_EDITED`, `HUMAN_APPROVED` |
| 5. Final Action | Order Approval & Action Summary | Reviewer | Clinician, Auditor | NO | Case `finalAction` | `FINAL_ACTION_RECORDED` |
| 6. Audit & Export | Cryptographic Hash Chain & Access Logs | System | Compliance Auditor | NO | Audit Ledger | `AUDIT_EXPORTED` |

---

## 16. Privacy & Safety Controls
- **100% Synthetic / De-identified Corpus:** No real PHI or patient identifiers exist anywhere in the corpus or test queries.
- **Retrieval-Stage RBAC:** Access boundaries are strictly enforced *before* passages enter the LLM context window. Restricted documents never leak into model prompts.
- **Identifier Leakage Prevention:** Input sanitizer rejects any accidental PII before network transmission.
- **Anti-Hallucination Grounding:** Missing evidence triggers refusal rather than ungrounded hallucination.
- **Audit Logging of Data Access:** Audit ledger records document IDs accessed, query metadata, and role permissions.

---

## 17. Audit Events for the Journey
- `CASE_CREATED`
- `QUERY_SUBMITTED`
- `ACCESS_CONTROL_ENFORCED`
- `RETRIEVAL_FILTERED`
- `AI_REQUESTED`
- `AI_RESULT_GENERATED`
- `CONTRADICTION_FLAGGED`
- `REFUSAL_ESCALATED`
- `HUMAN_REVIEW_STARTED`
- `HUMAN_EDITED`
- `HUMAN_APPROVED`
- `HUMAN_REJECTED`
- `FINAL_ACTION_RECORDED`
- `AUDIT_EXPORTED`
- `DEMO_RESET`

---

## 18. Threat Sketch (One Page)

| Threat | Impact | Mitigation (Implemented) | Residual Risk |
|---|---|---|---|
| Unauthorized Retrieval | Clinician accesses restricted narcotic SOP or executive policy | Retrieval-level RBAC filtering matches user role to document ACL before model prompt creation | Client-side role selection is for demo; requires SSO token in production |
| Silent Conflict Propagation | Clinician acts on outdated 2021 guideline dosage over 2024 update | Multi-document cross-referencing surfaces explicit contradiction alert and supersession warnings | Complex non-numerical clinical nuances |
| Confident Hallucination / Missing Info | Clinician trusts ungrounded AI recommendation | Refusal engine fails loudly when passage relevance is below threshold, outputting missing data items | Clinician ignores missing info warning |
| Prompt Injection via Clinical Query | Adversary attempts to override clinical dosing rules | Query enclosed in `<untrusted_clinical_query>` delimiters; system prompt enforces strict citation-only output | Novel adversarial semantic attacks |
| Unaudited Clinical Order | Action taken without verifiable provenance | Continuous SHA-256 hash chaining of queries, retrieved passages, AI envelopes, and human approvals | Local server filesystem tampering |
| PII / Identifier Leakage | Sensitive data sent to LLM | Allow-list minimization and pseudonymization regex filters direct identifiers | Free-text unstructured clinician notes |

---

## 19. Acceptance Criteria
- [x] 1. Heterogeneous corpus ingested (guidelines, supersessions, table-heavy formulary, restricted policies).
- [x] 2. Retrieval-level RBAC strictly blocks restricted documents from unauthorized roles (e.g. Nurse cannot retrieve ICU narcotic policy).
- [x] 3. Grounded citations displayed for claims, linking directly to document title, section, and table row in 1 click.
- [x] 4. Explicit contradiction banner surfaces when sources disagree (e.g., 2021 vs 2024 Sepsis antibiotic protocol).
- [x] 5. Loud refusal is triggered with missing information listed when evidence is insufficient.
- [x] 6. Clinician review panel allows approving, rejecting (with required reason), or editing with tracked text diffs.
- [x] 7. Authorized final action is blocked until human approval is signed.
- [x] 8. Append-only SHA-256 audit ledger verifies 100% integrity across all retrieval and decision events.

---

## 20. Build Checklist
- [x] Phase 1: Understand, select, freeze scope
- [x] Phase 2: Adapt data model, roles, fixtures, task skeleton
- [x] Phase 3: Core happy path in MOCK mode
- [x] Phase 4: Live AI + structured output + validation
- [x] Phase 5: Evidence, privacy panel, data boundary, audit timeline + export
- [x] Phase 6: UI polish, loading/error/empty states, copy
- [x] Phase 7: Testing + bug fixing
- [x] Phase 8: Demo rehearsal, deliverables, final commit

---

## 21. Testing Checklist
- [x] Mock AI determinism passes across all 4 clinical RAG scenarios.
- [x] Auto mode fallback verified on missing key.
- [x] RBAC retrieval boundary blocks restricted documents.
- [x] Contradiction detection flags conflicting guideline versions.
- [x] Loud refusal triggers on unsupported query.
- [x] Audit hash chain detects tampered records.
- [x] Human review diffs tracked accurately.
- [x] Final action locked until human approval.

---

## 22. Demo Script
1. Reset demo (`resetDemo`) to ensure pristine synthetic clinical knowledge base.
2. Select **Case 1 (Standard Clinical Guidance - Sepsis First-Line)**:
   - Query: Empiric antibiotic coverage and fluid resuscitation timing.
   - Show grounded citations linking directly to "2024 Sepsis Protocol" and "Antimicrobial Formulary Table".
3. Select **Case 2 (Guideline Contradiction - 2021 vs 2024 Protocol)**:
   - Query: Vancomycin initial loading dose for severe sepsis.
   - Show explicit CONTRADICTION banner: 2021 protocol (15-20 mg/kg trough-guided) vs 2024 protocol (25-30 mg/kg AUC-targeted), showing supersession status.
4. Select **Case 3 (Loud Refusal / Missing Evidence)**:
   - Query: Pediatric dosing for off-label experimental antiviral in neonatal ICU.
   - Show loud clinical REFUSAL badge stating zero corpus evidence, explicitly listing missing clinical trial data.
5. Select **Case 4 (Role-Based Access Control Boundary Violation)**:
   - Switch role to "Triage Nurse".
   - Query: ICU Monitored Narcotic Infusion titration protocol.
   - Show RBAC enforcement: Retrieval strictly withholds restricted policy; AI explains lack of authorization for role.
6. Make a clinician edit in the review panel, review tracked diff, and click "Approve with Edits".
7. Commit Authorized Final Action ("Order Sepsis Bundle Approved").
8. Verify SHA-256 cryptographic audit chain and download exported JSON.

---

## 23. Pitch Outline
1. **The Problem:** Healthcare enterprises suffer from siloed, contradictory guidelines written by different committees over years. Generic RAG hallucinates or silently picks outdated recommendations with zero traceability. Confident wrong answers are catastrophic.
2. **The Solution (ClinicalRelay RAG):** Greenfield enterprise clinical RAG built for safety: retrieval-level RBAC, 1-click passage & table-row citations, explicit contradiction surfacing, loud refusal when evidence is missing, and human-in-the-loop review.
3. **Architecture:** Next.js App Router, heterogeneous in-memory clinical corpus, role-aware retrieval engine, 11-step AIService pipeline, and cryptographic SHA-256 audit ledger.
4. **Safety & Auditability:** Zero PII leakage, tamper-evident hash chaining from retrieval to human sign-off, verifiable provenance for every claim.
5. **Impact:** Transforms healthcare policy navigation from error-prone guesswork into a verifiable, auditable clinical decision support workflow.

---

## 24. Cut Log
- Cut: External Vector DB cloud connection (Pinecone/Milvus) — replaced with robust zero-dependency in-memory/server-side retrieval engine to eliminate latency, network failure, and external dependency risk.

---

## 25. Modified Foundation Files
- `src/foundation/types.ts` — Added CorpusDocument, RetrievedPassage, and ClinicalRAGOutput types.
- `src/foundation/corpus.ts` — Created heterogeneous clinical corpus (2024 active guideline, 2021 legacy guideline, multi-column formulary table, ED triage SOP, restricted ICU policy).
- `src/foundation/retrieval.ts` — Built retrieval-stage RBAC engine, hybrid section/table-row scoring, contradiction detection, and insufficiency checking.
- `src/foundation/task-registry.ts` — Registered `clinical_enterprise_rag` task with validation, deterministic mock generator, and evidence mapper.
- `src/foundation/fixtures.ts` — Reshaped 4 synthetic clinical cases (Sepsis happy path, Vancomycin contradiction, Neonatal loud refusal, ICU RBAC boundary).
- `src/foundation/components/Header.tsx` — Updated to ClinicalRelay RAG branding and clinical roles.
- `src/foundation/components/ResultCard.tsx` — Enhanced with 1-click citations, contradiction alert banner, loud refusal alert, and RBAC notice.
- `src/app/page.tsx` — Made ClinicalRelay RAG the default landing route at `/`.
- `src/app/foundation/page.tsx` — Updated task binding to `clinical_enterprise_rag`.
- `src/app/api/foundation/cases/[id]/run-ai/route.ts` — Updated default task to `clinical_enterprise_rag`.
- `package.json` — Added `test:rag` script and integrated into `npm test`.
- `README.md` — Appended Hackathon Demo section.
- `deliverables/privacy-threat-sketch.md` — Created one-page threat model & data boundary deliverable.
- `deliverables/audit-trail-clinical-sepsis-rag.json` — Exported verified SHA-256 audit chain.
- `deliverables/audit-trail-clinical-sepsis-rag.md` — Created human-readable audit table.
- `public/futures.md` — Filled ACTIVE PRODUCT section.

---

## 26. Time Budget Execution

| Phase | Time Window | Status | Objective |
|---|---|---|---|
| Phase 1 | 0:00 - 0:20 | Completed | Select problem, analyze, freeze MVP scope |
| Phase 2 | 0:20 - 0:45 | Completed | Adapt data model, roles, fixtures, task skeleton |
| Phase 3 | 0:45 - 2:30 | Completed | Implement core happy path in MOCK mode |
| Phase 4 | 2:30 - 3:30 | Completed | Live AI + schema validation + fallback verification |
| Phase 5 | 3:30 - 4:15 | Completed | Evidence panel, data boundary, audit export |
| Phase 6 | 4:15 - 5:00 | Completed | UI polish, states, accessibility, copy |
| Phase 7 | 5:00 - 5:30 | Completed | End-to-end testing and bug fixes |
| Phase 8 | 5:30 - 6:00 | Completed | Rehearsal, threat sketch deliverable, final commit |

