# ClinicalRelay Enterprise RAG — System Architecture & Implementation Reference

> **Track 04 (Problem Statement P-02)**: Greenfield Healthcare Enterprise RAG  
> **Tech Stack**: Next.js 16 (App Router) • React 19 • TypeScript • Tailwind CSS • Google Generative AI (Gemini) / Deterministic RAG Fallback

---

## 1. Executive Summary

ClinicalRelay is a high-reliability, evidence-grounded clinical copilot built for inpatient acute care workflows (e.g., adult sepsis resuscitation, antimicrobial stewardship, and monitored ICU infusions). 

Unlike generic LLM wrappers, ClinicalRelay implements an enterprise-grade, defense-in-depth architecture:
- **Zero Hallucination / Grounded Citations**: Every claim is strictly grounded in institutional guidelines with 1-click modal verification.
- **Retrieval-Stage Role-Based Access Control (RBAC)**: Enforces clinical credential boundaries before prompt construction, preventing data leakage.
- **Cross-Version Guideline Contradiction Surfacing**: Automatically detects and flags superseded clinical protocols without silent reconciliation.
- **Tamper-Evident Cryptographic Audit Chaining**: Every query, retrieval filter, AI synthesis, clinician sign-off, and bedside nursing action is sealed in an append-only SHA-256 hash chain.
- **Data Minimization & Boundary Defense**: Strips direct identifiers (MRN, SSN, billing data) prior to AI processing while preserving operational telemetry.

---

## 2. Directory Structure & Layout

The project follows modern enterprise Next.js and Clean Architecture standards:

```
├── context/                             # System documentation, prompts & specifications
│   ├── implementation.md                # This comprehensive architecture & workflow document
│   ├── ANTIGRAVITY_MASTER_PROMPT.md     # Primary agent instruction set & security guidelines
│   └── classwork.md                     # Hackathon problem statement & acceptance criteria
│
├── deliverables/                        # Formally generated hackathon audit & safety deliverables
│   ├── audit-trail-clinical-sepsis-rag.md # Cryptographic audit trail verification bundle
│   └── privacy-threat-sketch.md         # Threat model, data boundary & security analysis
│
├── public/                              # Static public assets
│   └── futures.md                       # Protocol specification & reference guide
│
├── scripts/                             # Test runners and deliverable generators
│   ├── test-clinical-rag.mjs            # 26 automated acceptance tests for Track 04 P-02
│   ├── smoke.mjs                        # 23 foundation smoke tests for core safeguards
│   └── generate-deliverables.mjs        # Automated script to export sealed audit logs
│
├── src/                                 # Application Source Code
│   ├── app/                             # Next.js App Router (Presentation & API)
│   │   ├── layout.tsx                   # Global HTML layout with typography & metadata
│   │   ├── page.tsx                     # Main redirect to clinical copilot
│   │   ├── globals.css                  # Modern Tailwind CSS styling tokens
│   │   ├── foundation/                  # Clinical Copilot UI Views
│   │   │   └── page.tsx                 # Triage Queue & Clinical Copilot Chat interface
│   │   └── api/                         # Backend REST API Routes
│   │       └── foundation/
│   │           ├── cases/               # Case management & AI execution endpoints
│   │           │   ├── route.ts         # GET (list cases), POST (create new patient)
│   │           │   └── [id]/
│   │           │       ├── run-ai/route.ts       # Executes safe 11-step AI RAG pipeline
│   │           │       ├── audit/route.ts        # Case audit event log & verification
│   │           │       ├── audit/export/route.ts # JSON/MD cryptographic export
│   │           │       ├── review/route.ts       # Doctor order sign-off endpoint
│   │           │       └── finalize/route.ts     # Final clinical order execution
│   │           └── reset/route.ts       # State reset for clean demo environments
│   │
│   └── foundation/                      # Core Business Logic & Enterprise RAG Engine
│       ├── types.ts                     # TypeScript schemas (ClinicalRAGOutput, Case, AuditEvent)
│       ├── corpus.ts                    # Heterogeneous hospital knowledge base (Guidelines, Tables, SOPs)
│       ├── retrieval.ts                 # Pre-retrieval RBAC, keyword scoring, MMR diversity & conflict engine
│       ├── task-registry.ts             # Task schemas, prompt construction, validators & deterministic fallback
│       ├── ai-service.ts                # 11-step execution pipeline, Gemini/OpenAI provider & self-repair
│       ├── audit.ts                     # SHA-256 cryptographic hash-chained audit logging
│       ├── data-minimization.ts         # Data boundary enforcement & sensitive field stripping
│       ├── safe-logging.ts              # Redacted operational logging (PHI/PII suppression)
│       ├── fixtures.ts                  # Synthetic clinical patient records for triage simulation
│       ├── store.ts                     # In-memory persistence store for rapid demonstration
│       └── components/                  # Reusable React UI Components
│           ├── Header.tsx               # App navigation, role toggle (Doctor/Nurse), audit modal
│           ├── ClinicalCopilotChat.tsx  # Interactive chat, triage handoff, 1-click citations
│           ├── PatientQueue.tsx         # Inpatient triage list with acuity indicators
│           ├── AuditTrailModal.tsx      # Cryptographic audit inspector modal
│           ├── NewPatientModal.tsx      # Inpatient admission intake modal
│           └── Badges.tsx               # Acuity & simulation status pills
```

---

## 3. Core Technical Pillars

### 3.1. Dynamic Retrieval Engine (`src/foundation/retrieval.ts`)
The retrieval engine ingests heterogeneous hospital documents (prose guidelines, multi-column formulary tables, operational SOPs, and restricted policies):
- **Pre-Retrieval RBAC**: Evaluates user clinical credentials against `doc.minRequiredRole`. If an unauthorized role (e.g. Bedside Nurse) searches for restricted protocols (e.g. ICU Narcotics SEC-901), the document is withheld **before** prompt assembly.
- **Maximal Marginal Relevance (MMR) Diversity**: Guarantees multi-source coverage by capping single-document matches, ensuring both clinical guidelines and antimicrobial formulary tables appear in response to compound clinical questions.
- **Contradiction & Supersession Surfacing**: Examines metadata tags `isSuperseded` and `supersedingDocId`. When an obsolete guideline (e.g. 2021 Sepsis Trough Target) is retrieved alongside modern standards (2024 AUC-targeted dosing), it surfaces the conflict explicitly under `contradictions`.
- **Evidence Gap Detection**: Calculates query keyword coverage ratio. If a query requests off-label, investigational, or unapproved compounds not present in the hospital database, it triggers a loud **Clinical Refusal**.

### 3.2. 11-Step Safe AI Pipeline (`src/foundation/ai-service.ts`)
Adhering to high-reliability clinical safety requirements:
1. **Case Ingestion**: Load patient record.
2. **Data Minimization**: Whitelist fields to only allowed parameters.
3. **Audit Log Access**: Record field keys accessed (never raw PHI values).
4. **Audit Log AI Request**: Log model configuration and prompt version.
5. **Provider Execution**: Call live provider (Gemini / OpenAI) with 20s timeout, or fallback to deterministic engine.
6. **Schema Validation**: Validate JSON against `ClinicalRAGOutput` schema.
7. **One-Shot Self-Repair**: If JSON is malformed, re-prompt the model with the exact validation errors.
8. **Evidence Mapping**: Trace citations back to retrieved passage IDs.
9. **Result Enveloping**: Seal response with SHA-256 cryptographic signature.
10. **Audit Log Response**: Record telemetry, latency, uncertainty, and citation count.
11. **State Persistence**: Update patient case status.

### 3.3. Cryptographic Tamper-Evident Audit Trail (`src/foundation/audit.ts`)
Every state transition produces a cryptographically sealed `AuditEvent`:
$$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} + \text{EventData}_n)$$
Any out-of-band database modification or deletion invalidates the chain, providing verifiable compliance for clinical audits.

---

## 4. Clinical Workflow Walkthrough

1. **Role Selection**: Toggle between `🩺 Dr. Sarah Rivera (Attending Physician)` and `👩‍⚕️ Nurse Priya Sharma (Bedside RN)` in the header.
2. **Triage Handoff**: Selecting a patient displays the nursing intake condition and suggested next steps without dumping unsolicited advice.
3. **Conversational Synthesis**: Typing *"Hi"* or asking *"Which medicine is best according to guidelines?"* triggers dynamic retrieval, citing exact hospital formulary rows and guideline clauses.
4. **Doctor Prescription Directive**: When Dr. Rivera types a prescription (e.g., *"prescribe dosage of 2ml"*), the copilot verifies formulary tier status, creates a signed medication directive, and enables the **"Prescribe & Send to Nurse"** action.
5. **Bedside Nurse Administration**: Nurse Priya sees the active doctor prescription and can click **"Mark as Administered"**, sealing the time and nurse credentials into the patient's cryptographic MAR audit log.
