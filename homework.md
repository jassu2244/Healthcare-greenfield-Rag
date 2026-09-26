# Historical Checkpoint — Hackathon Prep (Track 04: Healthcare from Zero)

## 1. Project Context
- **Hackathon Track:** Track 04 — Healthcare from zero
- **Objective:** Establish a problem-agnostic, privacy-preserving, auditable, and human-in-the-loop healthcare software foundation capable of absorbing any revealed healthcare problem statement tomorrow.
- **Preparation Status:** Complete baseline foundation implemented, verified with end-to-end demo route, 7-point smoke test suite, and tamper-evident audit logging.
- **Date:** September 25, 2026

---

## 2. Existing Technology Stack
- **Language:** TypeScript 5.x / JavaScript (Node.js v22.12.0)
- **Frontend Framework:** Next.js 16.3.6 (App Router), React 19.2.8
- **Styling System:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Backend Capability:** Next.js App Router API Route Handlers (`src/app/api/...`)
- **Cryptography & Security:** Built-in Node.js `crypto` module (SHA-256 hash chains)
- **AI Connectivity:** Standard native `fetch` client to AI provider APIs (Gemini, OpenAI-compatible)
- **Persistence:** Local in-memory repository backed by git-ignored JSON runtime store (`data/runtime/*.json`)
- **Testing:** Standalone ESM smoke test harness (`scripts/smoke.mjs`), executable via `npm run smoke`

---

## 3. Current Architecture

```
+-------------------------------------------------------------------------------+
|                       Browser / Next.js Client Layer                          |
|  - Role Switcher ("Acting as: Reviewer/Submitter") [Demo-Only UI Tool]       |
|  - Synthetic Test Banner & Status Stepper                                     |
|  - InputForm (Case Fixture Selector & Data Viewer)                            |
|  - AI Data Boundary Panel (Allow-Listed vs Withheld Fields)                   |
|  - ResultCard (AI Output Draft + AIModeBadge)                                 |
|  - EvidencePanel (Source Provenance, Warnings, Missing Info, Uncertainty)     |
|  - HumanReviewPanel (Approve As-Is, Edit Diffs, Reject with Required Reason)   |
|  - FinalAction Banner & AuditTimeline (SHA-256 Chain Verification + Export)   |
+-------------------------------------------------------------------------------+
                                      |
                           HTTP / Next.js API Routes
                                      |
+-------------------------------------------------------------------------------+
|                           Server / API Route Layer                            |
|  - GET/POST /api/foundation/cases        - POST /api/foundation/cases/[id]/run-ai|
|  - POST /api/foundation/cases/[id]/review - POST /api/foundation/cases/[id]/final |
|  - GET /api/foundation/cases/[id]/audit   - GET /api/foundation/cases/[id]/export|
|  - POST /api/foundation/reset                                                 |
+-------------------------------------------------------------------------------+
         |                                    |                          |
         v                                    v                          v
+-----------------------+          +--------------------+      +---------------+
|   Task Registry       |          |  AIService Engine  |      | Audit Ledger  |
| - Allowed Input Fields|          | - Data Minimizer   |      | - Append-only |
| - Delimited Prompts   | <------> | - Pseudonymizer    | ---> | - SHA-256     |
| - Handlers & Schemas  |          | - Auto/Mock/Live   |      |   Hash Chain  |
| - Deterministic Mocks |          | - Schema Validator |      | - Export JSON |
+-----------------------+          | - Safe Redaction   |      +---------------+
                                   +--------------------+              |
                                              |                        v
                                              v                +---------------+
                                   +--------------------+      | Local Runtime |
                                   | AI Provider / Mock |      | JSON Store    |
                                   | (Gemini / Mock)    |      | (data/runtime)|
                                   +--------------------+      +---------------+
```

---

## 4. Existing Features
- **Next.js Default Home Page (`/`):** Working. Scaffolded baseline preserved, updated with a direct pointer banner to the Foundation Demo.
- **Foundation Demo Route (`/foundation`):** Working. Full end-to-end interactive healthcare intake, AI minimization, grounded evidence generation, clinician review, final action recording, and audit timeline verification.
- **Deterministic Mock Execution:** Working. Functions 100% offline with zero network connectivity.
- **Provider Fallback Engine:** Working. Automatically detects missing keys or provider timeouts, degrading gracefully to mock mode with visible fallback badge and audit tracking.
- **Tamper-Evident SHA-256 Audit Trail:** Working. Append-only ledger with continuous hash linkage and real-time cryptographic verification.
- **Data Minimization & AI Data Boundary:** Working. Displays sent vs withheld fields with patient name pseudonymization.

---

## 5. Modified Existing Files
- `.gitignore`: Added `!.env.example` to allow committing configuration templates while strictly ignoring real `.env*` files, and added `/data/runtime/` to prevent persisting local test state.
- `package.json`: Renamed project from `temp-app` to `hackathon-healthcare-foundation` and registered `test` and `smoke` scripts.
- `src/app/page.tsx`: Added an accessible visual banner linking directly to `/foundation` without removing existing Next.js template structure.

---

## 6. New Files Created
- `src/foundation/types.ts`: Core domain models (`Case`, `Actor`, `InputRecord`, `EvidenceItem`, `AIResultEnvelope`, `AuditEvent`, `TaskDefinition`, `FieldDiff`, `ReviewDecision`, `FinalAction`).
- `src/foundation/safe-logging.ts`: Redaction utility masking sensitive healthcare keys and safe telemetry logger.
- `src/foundation/data-minimization.ts`: Minimization filter matching task allow-lists and identifier pseudonymizer.
- `src/foundation/audit.ts`: Append-only audit repository, SHA-256 hash chaining, verification, and JSON export.
- `src/foundation/task-registry.ts`: Task registry and `sample_structured_summary` task definition with deterministic mock generator and evidence mapper.
- `src/foundation/ai-service.ts`: Safe 11-step AIService pipeline with prompt injection containment and auto/mock/live fallback.
- `src/foundation/fixtures.ts`: 4 synthetic test cases (Happy Path, Missing Info, Prompt Injection, Red-Flag Escalation).
- `src/foundation/store.ts`: Case repository with runtime JSON backing and `resetDemo()` functionality.
- `src/app/api/foundation/cases/route.ts`: List and create cases.
- `src/app/api/foundation/cases/[id]/route.ts`: Retrieve single case.
- `src/app/api/foundation/cases/[id]/run-ai/route.ts`: Execute AI task on case.
- `src/app/api/foundation/cases/[id]/review/route.ts`: Record human clinical review decision and field diffs.
- `src/app/api/foundation/cases/[id]/final-action/route.ts`: Enforce governance check and record authorized final clinical action.
- `src/app/api/foundation/cases/[id]/audit/route.ts`: Retrieve chronological audit events and chain verification status.
- `src/app/api/foundation/cases/[id]/audit/export/route.ts`: Downloadable audit trail JSON file.
- `src/app/api/foundation/reset/route.ts`: Reset demo store to initial synthetic fixtures.
- `src/foundation/components/Badges.tsx`: Visual badges for AI mode, uncertainty, sources, and synthetic data banner.
- `src/foundation/components/Header.tsx`: Healthcare app header with role switcher and reset button.
- `src/foundation/components/StatusStepper.tsx`: 6-step clinical progress stepper.
- `src/foundation/components/DataAccessPanel.tsx`: AI Data Boundary inspection panel.
- `src/foundation/components/EvidencePanel.tsx`: Grounded evidence, clinical warnings, and missing information display.
- `src/foundation/components/ResultCard.tsx`: Structured AI synthesis card with governance draft notice.
- `src/foundation/components/HumanReviewPanel.tsx`: Reviewer actions (approve as-is, edit with diffs, reject with reason).
- `src/foundation/components/AuditTimeline.tsx`: Interactive audit timeline with expandable cryptographic hashes.
- `src/foundation/components/PrivacyPanel.tsx`: Data touchpoint inventory and privacy-by-design principles overview.
- `src/foundation/components/InputForm.tsx`: Case selector and input field viewer.
- `src/app/foundation/page.tsx`: Complete foundation demo page.
- `scripts/smoke.mjs`: Standalone 7-point smoke test suite.
- `.env.example`: Non-secret environment variable template.

---

## 7. Reusable Components
- `Header`: Props `{ currentRole, onRoleChange, onResetDemo, isResetting }`. Renders clinical navigation, demo role switcher, and reset action.
- `StatusStepper`: Props `{ status, hasAiResult, hasReview, hasFinalAction }`. Renders 6-phase visual progression.
- `InputForm`: Props `{ cases, selectedCase, onSelectCase, onRunAI, onFinalize, isProcessingAI, isFinalizing, currentRole }`. Renders intake data and triggers.
- `DataAccessPanel`: Props `{ boundaryReport, inputFieldsSent, totalFieldsCount }`. Renders sent vs withheld field breakdown.
- `ResultCard`: Props `{ envelope }`. Displays structured AI output, mode badge, latency, and draft governance warning.
- `EvidencePanel`: Props `{ evidence, warnings, missingInformation, uncertainty }`. Grounded citations, red flags, and missing data points.
- `HumanReviewPanel`: Props `{ initialSummary, initialNextStep, existingReview, onApproveAsIs, onEditAndApprove, onReject, isSubmitting }`. Captures clinician decisions and diffs.
- `AuditTimeline`: Props `{ events, chainVerification, caseId }`. Shows chronological ledger, sequence nodes, hash details, and export button.
- `PrivacyPanel`: Props `{ inputs, caseId }`. Privacy controls and case data touchpoint inventory.
- `AIModeBadge`: Props `{ mode, model, fallbackReason }`. Displays `LIVE`, `MOCK`, or `FALLBACK`.
- `UncertaintyBadge`: Props `{ level: 'LOW' | 'MEDIUM' | 'HIGH' }`. Clinical uncertainty indicator.
- `SourceTag`: Props `{ source }`. Distinguishes Patient-Reported, Clinician-Entered, System-Record, AI-Generated, and Human-Edited.

---

## 8. AI Architecture
- **Pipeline:** Strict 11-step execution order:
  1. Load case by ID.
  2. Minimize inputs against task allow-list.
  3. Record `AI_DATA_ACCESSED` audit event with field keys (no raw values).
  4. Record `AI_REQUESTED` audit event.
  5. Call provider according to mode (`mock`, `live`, `auto`).
  6. Parse and validate JSON against task `outputSchema`.
  7. On validation failure: 1 repair attempt, then fall back.
  8. Build grounded evidence items using `evidenceMapper`.
  9. Wrap into `AIResultEnvelope` with complete `AIMeta`.
  10. Record `AI_RESULT_GENERATED` (or `AI_FALLBACK_USED` / `AI_OUTPUT_REJECTED`).
  11. Persist result to case and return.
- **Task Registry:** Problem-agnostic registration interface. Real tasks tomorrow only require declaring `TaskDefinition`.
- **Injection Defenses:** Untrusted input enclosed in `<untrusted_input>` XML tags, system instructions mandating output-only JSON without external tool access.

---

## 9. Mock AI
- Deterministic mock generator maps inputs to structured results with zero randomness.
- Checks input for urgent clinical terms ('chest pain') to set HIGH uncertainty and escalation warnings.
- Detects instruction overrides ('ignore previous') to generate security warnings without executing instructions.
- Force mock mode via `AI_MODE=mock` or `USE_MOCK_AI=true`.

---

## 10. Audit Architecture
- **Schema:** Every event stores `eventId`, `sequence`, `timestamp`, `caseId`, `actor` (id, role), `action`, `resource`, `dataAccessed` (keys only), `ai` (mode, provider, model, promptVersion), `status`, `details` (sanitized metadata), `prevHash`, and `hash`.
- **Tamper-Evident Hash Chain:** SHA-256 hash computed across event fields including `prevHash`. Sequence 1 begins with `GENESIS_000...`.
- **Verification:** `verifyAuditChain(caseId)` recomputes every hash from genesis to tip. Any mutation or sequence gap breaks validation.
- **Export:** Downloadable signed JSON export bundle via `/api/foundation/cases/[id]/audit/export`.

---

## 11. Privacy Architecture
- **Data Minimization:** AI never receives unlisted fields.
- **Pseudonymization:** Direct identifiers (`patientName`, `fullName`) replaced with `PATIENT_REF_<caseSuffix>`.
- **Safe Logging:** `redact()` automatically replaces sensitive keys (`name`, `notes`, `medications`, `symptoms`) with `[REDACTED_SENSITIVE_CONTENT]`.
- **Role Switcher Notice:** Role switcher is strictly a demonstration UI aid and is documented as NOT being an authentication or authorization boundary.

---

## 12. Threat Model

| Threat | Impact | Mitigation (As Implemented) | Residual Risk |
|---|---|---|---|
| Unauthorized Data Access | Exposure of sensitive intake data | In-memory scoping, UI role switcher, field-level access tracking | Demo lacks real auth/OAuth boundary |
| Sensitive Info Disclosure in AI Calls | Leakage of PII to cloud LLM providers | Strict `minimize()` allow-list and identifier pseudonymization | Free-text notes may contain incidental PII |
| Prompt Injection | Attacker alters risk rating or clinical decision | Untrusted delimiter enclosure, system prompt rules, schema enforcement | Novel semantic evasion techniques |
| Unsafe Model Output / Malformed JSON | Application crash or corrupted clinical state | Hand-written schema validator with repair retry and safe fallback | Complex edge cases in nested arrays |
| Hallucination / Unsupported Claims | Clinician acts on fabricated symptoms | Grounded evidence mapper, explicit `missingInformation` array, uncertainty rating | Clinician cognitive fatigue |
| Excessive AI Permissions | AI executes unauthorized actions | AI has zero tools, zero DB access, and produces draft-only envelopes | None (AI has no write capabilities) |
| Sensitive Info in Logs | PII/PHI stored in operational telemetry | Deep redaction algorithm on all log calls and audit event details | External library logs outside application code |
| Unauthorized Record Modification | Covert alteration of clinical decisions | Append-only audit store with SHA-256 cryptographic hash chaining | Filesystem corruption on local server |
| Untraceable AI Actions | Inability to audit model prompts or versions | Full `AIMeta` recording promptVersion, schemaVersion, model, and field keys | External provider changes model weights |
| External API Failure / Outage | Complete system unavailability during review | Auto mode fallback to deterministic mock engine with visible UI badge | Mock output is synthetic, not real-time clinical |

---

## 13. Synthetic/Mock Data
- Located in `src/foundation/fixtures.ts`:
  1. `case_synth_001_happy`: Routine intake with complete vitals (tests standard happy path).
  2. `case_synth_002_missing`: Sparse intake missing vitals and medications (tests `missingInformation` and medium uncertainty).
  3. `case_synth_003_injection`: Contains adversarial override text in notes (tests prompt delimiter containment).
  4. `case_synth_004_redflag`: Acute cardiopulmonary symptoms (tests HIGH uncertainty, red-flag escalation, and review requirement).

---

## 14. API Contracts
- `GET /api/foundation/cases`: Returns `{ cases: Case[] }`.
- `POST /api/foundation/cases`: Body `{ inputs: InputRecord[], metadata?: any }` -> Returns `{ case: Case }`.
- `GET /api/foundation/cases/[id]`: Returns `{ case: Case }`.
- `POST /api/foundation/cases/[id]/run-ai`: Body `{ taskName, actor, forceMode? }` -> Returns `{ success: true, case: Case, result: AIResultEnvelope, boundaryReport: any }`.
- `POST /api/foundation/cases/[id]/review`: Body `{ decision, edits, reason?, reviewerId, reviewerName }` -> Returns `{ success: true, case: Case }`.
- `POST /api/foundation/cases/[id]/final-action`: Body `{ type, performedBy, summary }` -> Returns `{ success: true, case: Case }`.
- `GET /api/foundation/cases/[id]/audit`: Returns `{ caseId, events: AuditEvent[], verification: ChainVerificationResult }`.
- `GET /api/foundation/cases/[id]/audit/export`: Returns JSON attachment download of full verified audit bundle.
- `POST /api/foundation/reset`: Reseeds synthetic cases, clears audit, records `DEMO_RESET` -> Returns `{ message, reseededCount }`.

---

## 15. Database / Persistence
- Local file persistence at `data/runtime/cases.json` and `data/runtime/audit.json`, backed by in-memory caching.
- Path is ignored in `.gitignore`. No database server or engine required.

---

## 16. Environment Variables
- `AI_MODE`: Mode selection (`auto`, `mock`, `live`).
- `USE_MOCK_AI`: Boolean flag to force mock mode.
- `AI_PROVIDER`: Selected provider (`gemini`, `openai`, `custom`).
- `AI_MODEL`: Model name (e.g. `gemini-1.5-flash`).
- `GEMINI_API_KEY`: API key for Google Gemini (server-side only).
- `OPENAI_API_KEY`: API key for OpenAI (server-side only).

---

## 17. How to Run
- **Install:** `npm install`
- **Build:** `npm run build`
- **Dev Server:** `npm run dev` (starts on `http://localhost:3000`)
- **Smoke Tests:** `npm run smoke` (or `npm test`)
- **Foundation Route:** Navigate to `http://localhost:3000/foundation`
- **Mock Mode Run:** Set `AI_MODE=mock npm run dev`
- **Reset Demo:** Click "Reset Demo" button in UI or run `curl -X POST http://localhost:3000/api/foundation/reset`

---

## 18. Dependencies Added
- Zero new runtime dependencies added.
- Existing dependencies utilized: Next.js 16.3.6, React 19.2.8, Tailwind CSS v4, Node.js built-ins (`crypto`, `fs`, `path`).

---

## 19. Assumptions
- Next.js App Router was approved and chosen as the full-stack foundation.
- The 4 synthetic clinical cases provide sufficient variety to model standard, sparse, adversarial, and urgent workflows.
- Plain HTTPS `fetch` is preferred over heavy third-party SDKs to keep dependency footprint minimal.

---

## 20. Known Limitations
- The system is a hackathon prototype designed with privacy-by-design principles; it is NOT a certified or production clinical system.
- Auth is simulated via a client role switcher for demonstration; no real JWT/OAuth session management is implemented.
- Persistence is file-backed JSON; suitable for hackathon demonstrations, not high-concurrency production deployments.

---

## 21. What Must Wait for Tomorrow
- The hackathon problem statements are currently UNKNOWN.
- No specific clinical product (e.g. triage, discharge, transcription, referral) has been pre-selected or hardcoded.
- Final role names, specific AI task prompts, customized schemas, and pitch deliverables must wait for the revealed problem statement.

---

## 22. Documentation Locations
- `classwork.md`: Repo root (`c:/Users/Jasmeet Singh/Desktop/Hackathon/classwork.md`)
- `public/futures.md`: Public web assets directory (`c:/Users/Jasmeet Singh/Desktop/Hackathon/public/futures.md`)
- `AGENTS.md`: Repo root (`c:/Users/Jasmeet Singh/Desktop/Hackathon/AGENTS.md`)

---

# CONTINUE FROM HERE TOMORROW

The reusable, problem-agnostic healthcare foundation is fully implemented, verified, and operational. The full workflow (intake → data minimization → grounded AI synthesis → clinician review with tracked diffs → authorized final action → tamper-evident SHA-256 audit chain) executes cleanly and can be demoed offline in mock mode or online in live mode.

### What MUST Be Preserved:
- The 11-step AIService pipeline (`src/foundation/ai-service.ts`).
- The tamper-evident SHA-256 audit chain and verification logic (`src/foundation/audit.ts`).
- The data minimization and AI data boundary enforcement (`src/foundation/data-minimization.ts`).
- The safe logging and redaction utility (`src/foundation/safe-logging.ts`).
- The core domain component library (`src/foundation/components/*`).
- The smoke test harness (`scripts/smoke.mjs`).

### What MUST Change After the Problem is Revealed:
1. **Task Definition:** Define the real problem-specific `TaskDefinition` in `src/foundation/task-registry.ts`.
2. **Schema & Prompts:** Replace generic summary output schema with problem-specific structured fields.
3. **Fixtures:** Reshape the 4 synthetic test cases in `src/foundation/fixtures.ts` to match the problem domain.
4. **Roles & Labels:** Map `SUBMITTER` and `REVIEWER` to the specific user personas (e.g., Patient, Nurse, Radiologist).
5. **UI Copy & Product Name:** Set the chosen product name and clinical copy.
6. **Deliverables:** Generate the one-page threat sketch and exported audit JSON in `deliverables/`.

### Exact Resume Point:
Follow PART B of `public/futures.md` → Execution Protocol. First action: record problem statements in `classwork.md`.

### What MUST NOT Be Implemented Prematurely:
Do NOT add microservices, real EHR integrations, user databases, authentication systems, or multi-step routing before the problem statement is revealed and scope is frozen.
