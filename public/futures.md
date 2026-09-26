# Antigravity Healthcare Continuation Contract (Track 04)

## ACTIVE PRODUCT
- **Selected Problem:** P-02: Healthcare Greenfield Enterprise RAG — Retrieval a Clinical Team Can Rely On
- **Product Name:** ClinicalRelay RAG (Trust-Grounded Enterprise Healthcare Knowledge & Audit System)
- **One User Journey:** Clinical Query Intake -> Retrieval-Stage RBAC & ACL Filtering -> Grounded AI Synthesis with 1-Click Passage/Table Citations & Explicit Contradiction Surfacing -> Loud Refusal on Missing Information -> Clinician Review with Tracked Diffs -> Authorized Order/Protocol Commit -> Cryptographic SHA-256 Audit Chain Verification & JSON Export.
- **AI Task Name:** `clinical_enterprise_rag`
- **Schema Summary:** `{ summary, keyInformation[], suggestedNextStep, contradictions: [{ conflict, sources[], guidance }], citations: [{ passageId, documentTitle, clauseOrRow, excerpt }], isRefusal, refusalReason, warnings[], missingInformation[], uncertainty }`
- **Audit Subset:** `CASE_CREATED`, `QUERY_SUBMITTED`, `ACCESS_CONTROL_ENFORCED`, `RETRIEVAL_FILTERED`, `AI_REQUESTED`, `AI_RESULT_GENERATED`, `CONTRADICTION_FLAGGED`, `REFUSAL_ESCALATED`, `HUMAN_REVIEW_STARTED`, `HUMAN_EDITED`, `HUMAN_APPROVED`, `HUMAN_REJECTED`, `FINAL_ACTION_RECORDED`, `AUDIT_EXPORTED`, `DEMO_RESET`
- **Privacy & Safety Controls:** 100% synthetic/de-identified healthcare corpus; retrieval-level RBAC filtering (unauthorized documents blocked before LLM context); delimiter prompt containment; anti-hallucination loud refusal; append-only SHA-256 hash chaining.
- **Run & Demo Commands:**
  - Smoke tests: `npm run smoke`
  - Dev server: `npm run dev` (Runs at `http://localhost:3000`)
  - Direct demo route: `http://localhost:3000` (or `http://localhost:3000/foundation`)

---

## 1. Current Preparation Status
*Superseded by ACTIVE PRODUCT (ClinicalRelay RAG — Track 04 P-02).*
The domain-agnostic foundation has been transitioned into active execution mode to implement ClinicalRelay RAG.

---

## 2. Reusable Architecture
- **AIService (`src/foundation/ai-service.ts`):** Orchestrates safe execution, data minimization, schema parsing with repair retry, and graceful degradation.
- **Task Registry (`src/foundation/task-registry.ts`):** Defines prompt templates, allow-listed fields, validation schemas, and mock generators.
- **Data Minimization (`src/foundation/data-minimization.ts`):** Filters input payloads to explicit allow-lists and pseudonymizes patient identifiers.
- **Audit System (`src/foundation/audit.ts`):** Cryptographic SHA-256 hash-chained event storage with verification.
- **Human Review (`src/foundation/components/HumanReviewPanel.tsx`):** Requires human clinical approval before any final action can be authorized.
- **Evidence Provenance (`src/foundation/components/EvidencePanel.tsx`):** Links outputs directly back to source inputs with uncertainty ratings and missing info alerts.
- **UI Kit (`src/foundation/components/*`):** Clinical workflow components, data boundary inspection, status stepper, and badges.
- **Synthetic Fixtures (`src/foundation/fixtures.ts`):** 4 test scenarios labeled `"synthetic": true`.
- **Demo Store & Reset (`src/foundation/store.ts`):** In-memory and local JSON persistence with instant reset capability.

---

## 3. Supported Healthcare Workflow Patterns
The generic foundation is engineered to absorb any of the following healthcare patterns:
- Patient intake and symptom review
- Clinical triage assistance and priority scoring
- Clinical documentation and encounter note generation
- Structured discharge and consultation summarization
- Care coordination and follow-up tracking
- Medication reconciliation and interaction screening
- Referral routing and specialist matching
- **Any novel clinical workflow revealed in tomorrow's problem statements**

*Explicit Notice: NONE of these patterns is pre-selected as the final product. The revealed problem statement is the ultimate source of truth.*

---

## 4. Generic AI Pipeline (11 Steps)
1. Load case by ID from repository.
2. Minimize inputs against the task's `allowedInputFields`.
3. Record `AI_DATA_ACCESSED` audit event listing field keys (never values).
4. Record `AI_REQUESTED` audit event.
5. Execute model call according to active mode (`mock`, `live`, `auto`).
6. Parse and validate JSON against the task's `outputSchema`.
7. On validation failure: attempt 1 schema repair retry, then fall back.
8. Map input provenance to output via `evidenceMapper`.
9. Wrap into `AIResultEnvelope` with complete `AIMeta`.
10. Record `AI_RESULT_GENERATED` (or `AI_FALLBACK_USED` / `AI_OUTPUT_REJECTED`).
11. Persist result and return envelope with boundary report.

---

## 5. Privacy Principles
- **Data Minimization:** Only fields strictly required for clinical synthesis are transmitted to external models.
- **Least Privilege:** Cloud models receive no tools, no DB access, and only minimized payloads.
- **Controlled Access:** All data touches are catalogued in the tamper-evident audit ledger.
- **Safe Logging:** Server logs and telemetry strictly mask sensitive fields (`name`, `notes`, `medications`, `symptoms`).
- **AI Data Boundary:** The UI explicitly displays sent fields versus withheld fields.

---

## 6. Auditability Principles
- **Who, What, When:** Every action attributes the actor ID, role, timestamp, resource, and data keys.
- **AI Provenance:** Model name, provider, prompt version, schema version, latency, and input keys sent are immutably logged.
- **Tamper-Evident Hash Chain:** SHA-256 hash linkage from genesis prevents covert historical alteration.
- **Verifiable Integrity:** Instant single-click cryptographic audit verification and export.

---

## 7. Human-in-the-Loop Principles
- AI outputs are strictly treated as assistive drafts.
- No autonomous clinical action can be finalized without a formal `ReviewDecision`.
- Reviewers can approve as-is, edit fields with tracked diffs, or reject with a mandatory written reason.

---

## 8. Healthcare Safety Principles
- **Evidence Attribution:** Grounded citations connect outputs to source inputs.
- **Explicit Uncertainty:** Clearly flags `LOW`, `MEDIUM`, or `HIGH` uncertainty.
- **Missing Information Detection:** Explicitly lists missing data points to prevent hallucinations.
- **Escalation Warnings:** Red-flag clinical patterns trigger visible escalation alerts.
- **Separation of Sources:** Visual badges distinguish patient-reported facts, clinician entries, AI drafts, and human edits.

---

## 9. PART B — EXECUTION PROTOCOL (VERBATIM FROM MASTER PROMPT)

### §B0. TRIGGER AND FIRST ACTIONS

WHEN the human pastes problem statement(s), with or without other text:

1. Treat the statements as the new AUTHORITATIVE requirements (§2).
2. Read `homework.md` ("CONTINUE FROM HERE TOMORROW"), `classwork.md`, and the futures file.
3. Run the project in mock mode to confirm the foundation works. IF it is broken, fix only what is needed (max 15 minutes) and log it.
4. In `classwork.md`: set `STATUS: IN_PROGRESS`, record `Start time` (current time) and `Deadline` (start + 6h, or the deadline the human states).
5. Create branch `hackathon-final` from `hackathon-prep` (if git is available).
6. DO NOT ask for further instructions. DO NOT edit `homework.md`.
7. DO NOT continue extending the generic foundation for its own sake once the problem is known.

### §B1. INTAKE

Record EVERY problem statement VERBATIM in `classwork.md` → "Problem statements received". Also record any stated constraints (required tech, data formats, judging criteria, user types).

### §B2. PER-STATEMENT ANALYSIS (≤ 10 minutes total)

For EACH statement fill the analysis table:
1. Requested workflow. 2. Target users. 3. Inputs. 4. Outputs. 5. Healthcare risks. 6. Privacy-sensitive data. 7. Where AI adds real value (not decoration). 8. Audit requirements. 9. External dependencies. 10. Smallest viable end-to-end workflow (≤ 7 steps, ONE primary user plus ONE reviewer role max).

### §B3. SELECTION

Disqualify a statement IF it requires any of: real patient data, a live EHR/hospital integration that cannot be mocked, hardware, a proprietary dataset you do not have, model training, or an end-to-end journey that cannot be demoed in the remaining time. (Mocking an integration is acceptable if the mock is labelled.)

Score each remaining statement 1–5 per criterion, multiply by weight:

| # | Criterion | Weight |
|---|---|---|
| 1 | Feasibility within remaining time | ×3 |
| 2 | Ability to produce a complete e2e workflow | ×3 |
| 3 | Alignment with existing foundation/architecture | ×2 |
| 4 | Strength/clarity of the healthcare workflow | ×2 |
| 5 | Meaningful AI opportunity | ×2 |
| 6 | Human-in-the-loop opportunity | ×2 |
| 7 | Auditability opportunity | ×2 |
| 8 | Privacy opportunity | ×2 |
| 9 | Demo clarity | ×2 |
| 10 | Technical feasibility | ×2 |
| 11 | Differentiation potential | ×2 |
| 12 | Dependency risk (5 = lowest risk) | ×2 |

Tie-breakers, in order: fewer external dependencies → shorter single journey → stronger human-review moment.

Select the highest score. DO NOT select a problem because it sounds impressive. Record scores, the selection, and 3–6 sentences of reasoning in `classwork.md`. IF only one statement is given, still complete the analysis and scope sections, and skip scoring.

IF the statements say participants must pick a specific one, or must address all, obey the statement.

### §B4. SCOPE FREEZE (by 0:20)

In `classwork.md` fill: target user & roles, the ONE user journey (numbered steps), MVP Must / Nice / Out-of-scope, acceptance criteria (testable, ≤ 8), and assumptions. Product name: short, descriptive, not cute.

Must-have MUST include: the core journey end-to-end, meaningful AI step, human review (when a clinical or consequential decision is involved), audit trail for the journey, data-touchpoint map, privacy/threat sketch, stable demo path.

After freeze, NEW features are allowed ONLY if every Must-have is done and tested.

### §B5. ADAPT THE FOUNDATION (layer by layer)

Adapt; DO NOT rebuild. For each layer, record changed files in `classwork.md` → "Modified foundation files".

1. **Roles:** rename generic roles to real ones (e.g. SUBMITTER→Patient, REVIEWER→Clinician) in config/labels.
2. **Data model:** add problem-specific fields to `InputRecord` field config and `Case`; keep generic types intact.
3. **Fixtures:** reshape the 4 synthetic cases to the problem domain (keep: happy path, missing info, injection attempt, red flag). Add at most 2 more if the journey requires.
4. **AI task:** create the real `TaskDefinition` (new name, prompt, `allowedInputFields`, `outputSchema`, `mockGenerator`, `evidenceMapper`). Remove irrelevant generic fields from the schema; DO NOT force `recommendation`/`risk` fields that the problem does not need. Keep `evidence`, `warnings`, `missingInformation`, `uncertainty` unless clearly irrelevant. Write mock outputs that are realistic for each fixture.
5. **Safety prompt:** add problem-specific constraints (e.g. no diagnosis, escalation wording, scope limits).
6. **Backend:** add only the endpoints the journey needs; reuse AIService, audit, minimization.
7. **Audit events:** choose the subset of the catalogue that maps to the journey; add ≤ 3 problem-specific events. Remove none from code; show only relevant ones.
8. **Privacy:** fill the data-touchpoint map; set `allowedInputFields` to the minimum; update PrivacyPanel copy and AI Data Boundary.
9. **UI:** build the real screens by composing the foundation components. Make the real journey the default landing route. Keep `/foundation` reachable but unlinked, or remove its nav link only.
10. **Futures file:** update per §B10.

### §B6. BUILD ORDER, TIME BUDGET, CHECKPOINTS

| Time | Phase | Exit condition |
|---|---|---|
| 0:00–0:20 | Understand, select, freeze scope | `classwork.md` §§1–11 filled |
| 0:20–0:45 | Adapt data model, roles, fixtures, task skeleton | Types compile; fixtures load |
| 0:45–2:30 | Core happy path in MOCK mode | Full journey clickable end-to-end in mock |
| 2:30–3:30 | Live AI + structured output + validation | Live call works; fallback verified |
| 3:30–4:15 | Evidence, privacy panel, data boundary, audit timeline + export | Journey audit exported and chain-verified |
| 4:15–5:00 | UI polish, loading/error/empty states, copy | No dead ends; clear hierarchy |
| 5:00–5:30 | Testing + bug fixing | §B7 all pass |
| 5:30–6:00 | Demo rehearsal, deliverables, final commit | §B8 + §B11 complete |

Rules:
- Build the happy path in MOCK mode FIRST, so the demo exists before the live model is wired.
- At EVERY phase boundary, update `classwork.md` (Current phase, checkboxes) and commit `wip: <phase>`.
- IF a phase overruns by more than 15 minutes, CUT, in this order: nice-to-haves → extra fixtures → secondary screens → visual flourishes → pseudonymization → live-AI polish (keep fallback). Log every cut in "Cut log".
- NEVER cut: the core journey, the meaningful AI step, human review (where applicable), the audit trail, the privacy/threat sketch, demo stability.
- At 5:00, feature freeze. Only fixes after that.

### §B7. TESTING

MUST pass before the demo:
1. Full journey in `AI_MODE=mock` with no network.
2. Full journey in `AI_MODE=auto` with a live key.
3. Provider failure → visible FALLBACK → journey still completes.
4. Missing-info fixture → `missingInformation` shown, no fabricated values.
5. Injection fixture → instruction ignored.
6. Red-flag fixture → warning/escalation visible; human must decide.
7. Reject path → reason required; no final action recorded.
8. Audit export for the journey → chain verifies.
9. No sensitive values in server logs (grep logs for fixture names/free text).
10. Existing pre-hackathon features still work.
11. Existing and foundation tests pass; add tests for the new task schema and mock determinism.

### §B8. DELIVERABLES

Create in `deliverables/` (new folder):
1. **Clickable prototype** — the running app; record the URL/run command in `classwork.md` and README (append a short "Hackathon demo" section; do not rewrite README).
2. **`deliverables/privacy-threat-sketch.md`** — ONE page: product one-liner, data-touchpoint map, AI data boundary, threat table (`Threat | Impact | Mitigation | Residual risk`, 6–10 rows, only mitigations that actually exist), non-compliance disclaimer.
3. **`deliverables/audit-trail-<journey>.json`** — exported audit trail for ONE complete journey (happy path, including human edit + approval), plus `deliverables/audit-trail-<journey>.md` with a human-readable table of the same events.

### §B9. DEMO AND PITCH

Demo script (write into `classwork.md`, ≤ 3 minutes):
1. Reset demo → 2. Show role and starting point → 3. Enter/submit synthetic case → 4. AI processing → 5. Structured result with evidence, uncertainty, missing info, mode badge → 6. Show AI Data Boundary (what the AI did NOT see) → 7. Human edits and approves → 8. Final action → 9. Audit timeline + chain verified + export → 10. (Optional, 20s) flip to injection or red-flag fixture.

Demo MUST need no manual DB edits and have no dead ends. Rehearse once in mock mode and once in auto mode. IF live AI is unstable at demo time, switch to `AI_MODE=mock` and say so honestly on screen (the badge does this).

Pitch outline (write into `classwork.md`):
1. **Problem** — who, what hurts, why the current workflow fails (from the statement; no invented stats).
2. **Solution** — `Input → AI → Human → Outcome` for this product.
3. **Architecture** — the actual diagram.
4. **Privacy + Auditability** — minimization, AI data boundary, evidence, human review, tamper-evident audit trail, access visibility.
5. **Demo / Impact** — the journey; qualitative impact only unless the statement provides numbers.

### §B10. KEEP DOCUMENTS LIVE

- `classwork.md`: update at every phase boundary; it must always reflect current reality.
- Futures file: fill the **ACTIVE PRODUCT** section at the top (selected problem, product name, journey, AI task name, schema summary, audit subset, privacy controls, run/demo commands). Update "Current preparation status" to "Superseded by ACTIVE PRODUCT". DO NOT delete the principles, protocol, or adaptation rules. No secrets (it is public).
- `homework.md`: DO NOT edit.

### §B11. FINAL STOP CONDITION

BEFORE declaring done:
1. Every acceptance criterion in `classwork.md` passes.
2. §B7 tests pass.
3. §B8 deliverables exist and are accurate.
4. Demo rehearsed; reset works.
5. No secrets committed; `.env.example` updated.
6. `classwork.md` STATUS set to `COMPLETE`.
7. Final commit `feat: <product name> hackathon submission`; tag `submission`.
8. Reply to the human with: product name, selected problem and one-sentence reason, run command, demo URL, deliverable paths, and the 10-step demo script.

Then STOP.

---

## 10. Adaptation Rules
- The final product MUST be derived from the revealed problem.
- The problem statement is the ultimate source of truth.
- Preserve existing working code; changes are incremental only.

---

## 11. Fallback Strategy
- `AI_MODE=auto` is the default.
- Deterministic mock is always available and verified offline.
- Demonstration is fully guaranteed to survive external provider outages.

---

## 12. Demo Protocol
- Reset demo using `/api/foundation/reset` or UI button.
- Select synthetic fixture case.
- Walk through the 6-stage single user journey.
- Demonstrate cryptographic audit trail verification.

---

## 13. Known Limitations
- Hackathon prototype built with privacy-by-design principles.
- NOT a certified or production clinical diagnostic system.
